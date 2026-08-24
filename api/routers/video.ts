/**
 * Omega Swarm v5.0 — Video Router (PostgreSQL + Auth)
 *
 * AI generation endpoints use rateLimitedProcedure (10 req/min).
 * List/delete operations use authedProcedure. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { generatedVideos, analyticsEvents } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;
const KLING_API_KEY = process.env.KLING_API_KEY;

/* ─── Zod Schemas ─── */

const referenceAssetSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  dataUrl: z.string().optional(),
  description: z.string().optional(),
});

const createVideoSchema = z.object({
  clientId: z.string().uuid().optional(),
  prompt: z.string().min(1, "Prompt is required"),
  duration: z.number().min(3).max(60).default(5),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "3:4", "4:3"]).default("9:16"),
  provider: z.enum(["pollinations", "kling"]).default("pollinations"),
  referenceAssets: z.array(referenceAssetSchema).optional().default([]),
});

export const videoRouter = router({
  /* ─── Check provider status ─── */
  status: authedProcedure.query(() => ({
    pollinations: !!POLLINATIONS_API_KEY,
    kling: !!KLING_API_KEY,
  })),

  /* ─── Create a video (rate limited) ─── */
  create: rateLimitedProcedure
    .input(createVideoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Build enriched prompt from reference assets
        let enrichedPrompt = input.prompt;
        if (input.referenceAssets.length > 0) {
          const refDesc = input.referenceAssets
            .map((a) => a.description || a.name)
            .join("; ");
          enrichedPrompt = `${input.prompt}. Style inspired by: ${refDesc}`;
        }

        // Build video URL
        let videoUrl: string;
        let status: "ready" | "generating" | "failed" = "ready";

        const encoded = encodeURIComponent(enrichedPrompt);

        // Pollinations video generation works without an API key (URL-based)
        // Kling requires a key — fall back to Pollinations if Kling key is missing
        if (input.provider === "kling" && !KLING_API_KEY) {
          console.warn("[Video] Kling API key not set, falling back to Pollinations");
        }

        const useKling = input.provider === "kling" && KLING_API_KEY;
        videoUrl = useKling
          ? `https://api.klingai.com/v1/videos?prompt=${encoded}&duration=${input.duration}&aspect_ratio=${input.aspectRatio}`
          : `https://gen.pollinations.ai/video/${encoded}?duration=${input.duration}&aspectRatio=${input.aspectRatio}`;

        const title =
          input.prompt.slice(0, 60) + (input.prompt.length > 60 ? "..." : "");

        // Insert into database
        const result = await db!
          .insert(generatedVideos)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title,
            prompt: input.prompt,
            videoUrl,
            thumbnailUrl: null,
            duration: input.duration,
            aspectRatio: input.aspectRatio,
            provider: input.provider,
            status,
            referenceAssets: input.referenceAssets,
          })
          .returning();

        const video = result[0];

        // Track analytics event
        await db!
          .insert(analyticsEvents)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            type: "video_generated",
            title: "AI Video generated",
            description: `Generated ${input.duration}s video: "${title}"`,
            agentColor: "#A855F7",
            agentName: "Vision",
          });

        return video;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Video] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate video",
        });
      }
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
