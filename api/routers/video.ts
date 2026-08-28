/**
 * Omega Swarm v5.1 — Video Router (PostgreSQL + Auth)
 *
 * REAL video generation via Runway API (async task + polling):
 *   video.create  -> starts Runway task, stores row with status "generating"
 *   video.refresh -> polls Runway for the user's generating rows, updates to
 *                    "ready" with the final mp4 URL (or "failed")
 * Every prompt passes the Nemotron content-safety gate before submission.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { generatedVideos, analyticsEvents } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { runwayConfigured, startVideoTask, getVideoTask, RUNWAY_MODELS } from "../runway";
import { checkContentSafety } from "../openrouter";

/* ─── Zod Schemas ─── */

const referenceAssetSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  dataUrl: z.string().optional(),
  description: z.string().optional(),
});

const createVideoSchema = z.object({
  clientId: z.string().uuid().optional(),
  prompt: z.string().min(1).max(1000, "Prompt too long for the video model"),
  duration: z.number().min(2).max(10).default(5),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "3:4", "4:3"]).default("9:16"),
  model: z.enum(["quality", "audio"]).default("quality"),
  referenceAssets: z.array(referenceAssetSchema).optional().default([]),
});

export const videoRouter = router({
  /* ─── Check provider status ─── */
  status: authedProcedure.query(() => ({
    runway: runwayConfigured(),
    models: { quality: RUNWAY_MODELS.QUALITY, audio: RUNWAY_MODELS.AUDIO },
  })),

  /* ─── Start a video generation task (rate limited) ─── */
  create: rateLimitedProcedure
    .input(createVideoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      if (!runwayConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "RUNWAY_API_KEY not configured. Create a key at dev.runwayml.com and add it to Railway variables.",
        });
      }

      try {
        // 0. Content safety gate — unsafe prompts never reach the paid API
        const safety = await checkContentSafety(input.prompt);
        if (!safety.safe) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Prompt blocked by safety gate: ${safety.reason}`,
          });
        }

        // 1. Build enriched prompt from reference assets
        let enrichedPrompt = input.prompt;
        if (input.referenceAssets.length > 0) {
          const refDesc = input.referenceAssets
            .map((a) => a.description || a.name)
            .join("; ");
          enrichedPrompt = `${input.prompt}. Style inspired by: ${refDesc}`;
        }

        // 2. Optional first-frame image (public URL only — data URLs unsupported)
        const startImage = input.referenceAssets.find((a) => a.url)?.url;

        // 3. Start the Runway task
        const model = input.model === "audio" ? RUNWAY_MODELS.AUDIO : RUNWAY_MODELS.QUALITY;
        const taskId = await startVideoTask({
          prompt: enrichedPrompt,
          aspectRatio: input.aspectRatio,
          duration: input.duration,
          startImageUrl: startImage,
          model,
        });

        const title =
          input.prompt.slice(0, 60) + (input.prompt.length > 60 ? "..." : "");

        // 4. Persist with status "generating" — refresh resolves the final URL
        const result = await db!
          .insert(generatedVideos)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title,
            prompt: input.prompt,
            videoUrl: "", // filled by video.refresh when the task succeeds
            thumbnailUrl: null,
            duration: input.duration,
            aspectRatio: input.aspectRatio,
            provider: "runway",
            taskId,
            status: "generating",
            referenceAssets: input.referenceAssets,
          })
          .returning();

        const video = result[0];

        // 5. Track analytics event
        await db!
          .insert(analyticsEvents)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            type: "video_generated",
            title: "AI Video started",
            description: `Started ${input.duration}s video: "${title}" (Runway ${model})`,
            agentColor: "#A855F7",
            agentName: "Vision",
          });

        return video;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Video] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start video generation: ${(err as Error).message}`,
        });
      }
    }),

  /* ─── Poll Runway for all "generating" videos of this user ─── */
  refresh: authedProcedure.mutation(async ({ ctx }) => {
    if (!isPostgresAvailable() || !db) return { updated: 0, stillGenerating: 0, failed: 0 };
    if (!runwayConfigured()) return { updated: 0, stillGenerating: 0, failed: 0 };

    const generating = await db
      .select()
      .from(generatedVideos)
      .where(
        and(eq(generatedVideos.userId, ctx.user.id), eq(generatedVideos.status, "generating"))
      );

    let updated = 0;
    let stillGenerating = 0;
    let failed = 0;

    // Poll with limited concurrency (4 at a time) — sequential polling is too
    // slow for users with many rendering videos
    async function pollOne(video: (typeof generating)[number]): Promise<void> {
      if (!video.taskId) {
        // Legacy row without a task id — mark failed so it stops polling
        await db!
          .update(generatedVideos)
          .set({ status: "failed" })
          .where(eq(generatedVideos.id, video.id));
        failed++;
        return;
      }
      try {
        const task = await getVideoTask(video.taskId);
        if (task.status === "SUCCEEDED" && task.output?.[0]) {
          await db!
            .update(generatedVideos)
            .set({ status: "ready", videoUrl: task.output[0] })
            .where(eq(generatedVideos.id, video.id));
          updated++;

          await db!.insert(analyticsEvents).values({
            userId: ctx.user.id,
            clientId: video.clientId ?? null,
            type: "video_generated",
            title: "AI Video ready",
            description: `Video "${video.title}" finished rendering`,
            agentColor: "#22C55E",
            agentName: "Vision",
          });
        } else if (task.status === "FAILED" || task.status === "CANCELLED") {
          await db!
            .update(generatedVideos)
            .set({ status: "failed" })
            .where(eq(generatedVideos.id, video.id));
          failed++;
          console.warn(`[Video] Task ${video.taskId} failed:`, task.failure ?? task.failureCode);
        } else {
          // PENDING / RUNNING / THROTTLED — still in the queue
          if (task.status === "THROTTLED") {
            console.warn(`[Video] Task ${video.taskId} throttled by Runway (rate/tier limit)`);
          }
          stillGenerating++;
        }
      } catch (err) {
        console.error(`[Video] Poll error for ${video.taskId}:`, (err as Error).message);
        stillGenerating++;
      }
    }

    const BATCH = 4;
    for (let i = 0; i < generating.length; i += BATCH) {
      await Promise.all(generating.slice(i, i + BATCH).map(pollOne));
    }

    return { updated, stillGenerating, failed };
  }),

  /* ─── List all videos for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(generatedVideos)
        .where(eq(generatedVideos.userId, ctx.user.id))
        .orderBy(generatedVideos.createdAt);
    } catch (err) {
      console.error("[Video] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Delete a video (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(generatedVideos)
          .where(
            and(
              eq(generatedVideos.id, input.id),
              eq(generatedVideos.userId, ctx.user.id)
            )
          )
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Video] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete video",
        });
      }
    }),
});
