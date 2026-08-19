/**
 * Omega Swarm v5.0 — Viral Video Router (PostgreSQL + Auth)
 *
 * AI generation endpoints use rateLimitedProcedure (10 req/min).
 * List operations use authedProcedure. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { generateWithAgent } from "../openai";
import { db, isPostgresAvailable } from "../../db/connection";
import { viralVideos } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const statusSchema = z.enum(["ready", "posted", "scheduled"]);

const addViralVideoSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  account: z.string().min(1, "Account is required"),
  caption: z.string().min(1, "Caption is required"),
  hashtags: z.array(z.string()).default([]),
  videoUrl: z.string().url().min(1, "Video URL is required"),
  status: statusSchema.default("ready"),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: statusSchema,
  postedAt: z.string().datetime().optional(),
  scheduledFor: z.string().datetime().optional(),
});

const generateCaptionSchema = z.object({
  videoId: z.string().uuid(),
  videoTitle: z.string().min(1),
  account: z.string().min(1),
  context: z.string().optional(),
});

export const viralRouter = router({
  /* ─── List all viral videos for the authenticated user ─── */
  list: authedProcedure
    .input(
      z
        .object({
          account: z.string().optional(),
          status: statusSchema.optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return [];
      try {
        let conditions = eq(viralVideos.userId, ctx.user.id);

        if (input?.account) {
          conditions = and(conditions, eq(viralVideos.account, input.account)) as any;
        }
        if (input?.status) {
          conditions = and(conditions, eq(viralVideos.status, input.status)) as any;
        }

        return await db!
          .select()
          .from(viralVideos)
          .where(conditions)
          .orderBy(viralVideos.createdAt);
      } catch (err) {
        console.error("[Viral] List error:", (err as Error).message);
        return [];
      }
    }),

  /* ─── Add a new viral video ─── */
  add: authedProcedure
    .input(addViralVideoSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(viralVideos)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title: input.title,
            account: input.account,
            caption: input.caption,
            hashtags: input.hashtags,
            videoUrl: input.videoUrl,
            status: input.status,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Viral] Add error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add viral video",
        });
      }
    }),

  /* ─── Update video status (user-scoped) ─── */
  updateStatus: authedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const updateData: Record<string, unknown> = { status: input.status };
        if (input.postedAt) updateData.postedAt = new Date(input.postedAt);
        if (input.scheduledFor) updateData.scheduledFor = new Date(input.scheduledFor);

        const result = await db!
          .update(viralVideos)
          .set(updateData)
          .where(and(eq(viralVideos.id, input.id), eq(viralVideos.userId, ctx.user.id)))
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Viral video not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Viral] UpdateStatus error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update viral video status",
        });
      }
    }),

  /* ─── Generate a fresh caption using AI (rate limited) ─── */
  generateCaption: rateLimitedProcedure
    .input(generateCaptionSchema)
    .mutation(async ({ input }) => {
      try {
        const prompt = `Rewrite the following caption for the video "${input.videoTitle}" posted to ${input.account}.

Context: ${input.context || "Music artist sharing content with their community."}

Requirements:
- Write in an authentic brand voice: soulful, genuine, community-driven
- Use a mix of reflective wisdom and high energy
- Include 1-2 rhetorical questions or call-to-actions to boost engagement
- Add 8-12 relevant music/festival/performance hashtags
- Include emojis naturally (2-4 total)
- Keep it under 300 words
- The tone should feel intimate but universal

Format the response as ONLY the caption text with hashtags at the end. Do not wrap in quotes or add markdown formatting.`;

        const result = await generateWithAgent(
          "Social Media Caption Agent",
          "You are a world-class social media strategist specializing in viral Instagram Reels and TikTok captions for musicians. You write captions that feel authentic, drive engagement, and build community.",
          prompt,
          "Organic reach",
          "Immediate"
        );

        // Extract hashtags from the generated caption
        const hashtagRegex = /#[A-Za-z0-9_]+/g;
        const hashtags = result.match(hashtagRegex) || [];
        const cleanHashtags = hashtags.map((h) => h.trim());

        return {
          caption: result,
          hashtags: cleanHashtags,
        };
      } catch (err) {
        console.error("[Viral] GenerateCaption error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate caption",
        });
      }
    }),
});
