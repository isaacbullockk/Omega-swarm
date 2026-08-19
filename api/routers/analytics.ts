/**
 * Omega Swarm v5.0 — Analytics Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { analyticsEvents, contentPosts, generatedVideos, campaigns } from "../../db/schema";
import { eq, sql, desc } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const eventTypeSchema = z.enum([
  "post_created",
  "video_generated",
  "campaign_started",
  "campaign_completed",
  "agent_chat",
  "instagram_published",
  "user_login",
  "user_registered",
  "content_downloaded",
  "ai_generation",
]);

const trackEventSchema = z.object({
  clientId: z.string().uuid().optional(),
  type: eventTypeSchema,
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  agentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  agentName: z.string().optional(),
  metadata: z.object({
    source: z.string().optional(),
    platform: z.string().optional(),
    extra: z.string().optional(),
  }).optional(),
});

export const analyticsRouter = router({
  /* ─── Get platform stats for the authenticated user ─── */
  stats: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) {
      return {
        totalPosts: 0,
        totalVideos: 0,
        totalCampaigns: 0,
        totalEvents: 0,
        instagramPosts: 0,
        recentActivity: 0,
      };
    }
    try {
      const [postsCount] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(contentPosts)
        .where(eq(contentPosts.userId, ctx.user.id));

      const [videosCount] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(generatedVideos)
        .where(eq(generatedVideos.userId, ctx.user.id));

      const [campaignsCount] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id));

      const [eventsCount] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.userId, ctx.user.id));

      const [instagramCount] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(contentPosts)
        .where(
          eq(contentPosts.userId, ctx.user.id)
        );

      return {
        totalPosts: postsCount?.count ?? 0,
        totalVideos: videosCount?.count ?? 0,
        totalCampaigns: campaignsCount?.count ?? 0,
        totalEvents: eventsCount?.count ?? 0,
        instagramPosts: instagramCount?.count ?? 0,
        recentActivity: eventsCount?.count ?? 0,
      };
    } catch (err) {
      console.error("[Analytics] Stats error:", (err as Error).message);
      return {
        totalPosts: 0,
        totalVideos: 0,
        totalCampaigns: 0,
        totalEvents: 0,
        instagramPosts: 0,
        recentActivity: 0,
      };
    }
  }),

  /* ─── Get recent analytics events for the authenticated user ─── */
  events: authedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return [];
      try {
        return await db!
          .select()
          .from(analyticsEvents)
          .where(eq(analyticsEvents.userId, ctx.user.id))
          .orderBy(desc(analyticsEvents.createdAt))
          .limit(input?.limit ?? 20);
      } catch (err) {
        console.error("[Analytics] Events error:", (err as Error).message);
        return [];
      }
    }),

  /* ─── Track a custom analytics event ─── */
  track: authedProcedure
    .input(trackEventSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(analyticsEvents)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            type: input.type,
            title: input.title,
            description: input.description,
            agentColor: input.agentColor ?? null,
            agentName: input.agentName ?? null,
            metadata: input.metadata ?? null,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Analytics] Track error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track event",
        });
      }
    }),
});
