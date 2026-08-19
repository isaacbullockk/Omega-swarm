/**
 * Omega Swarm v5.0 — Content Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 * Provides a unified view of all content: posts, videos, and assets.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { contentPosts, generatedVideos, contentAssets } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";

export const contentRouter = router({
  /* ─── Unified list of all content (posts + videos + assets) for the user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      const posts = await db!
        .select()
        .from(contentPosts)
        .where(eq(contentPosts.userId, ctx.user.id))
        .orderBy(desc(contentPosts.date));

      const videos = await db!
        .select()
        .from(generatedVideos)
        .where(eq(generatedVideos.userId, ctx.user.id))
        .orderBy(desc(generatedVideos.date));

      const assets = await db!
        .select()
        .from(contentAssets)
        .where(eq(contentAssets.userId, ctx.user.id))
        .orderBy(desc(contentAssets.createdAt));

      const formattedPosts = posts.map((p) => ({
        id: p.id,
        title: p.title,
        caption: p.caption,
        type: p.type as "social" | "ad" | "blog" | "asset",
        status: p.status,
        date: p.date?.toISOString() ?? p.createdAt.toISOString(),
        account: p.clientId ? p.clientId : "general",
        imageUrl: p.imageUrl || "",
        tags: p.referenceAssets
          ? p.referenceAssets.map((ra) => ra.name)
          : ([] as string[]),
        likes: p.likes,
        comments: p.comments,
        views: p.views,
        instagramPostId: p.instagramPostId,
      }));

      const formattedVideos = videos.map((v) => ({
        id: v.id,
        title: v.title,
        caption: v.prompt,
        type: "video" as const,
        status: v.status === "ready" ? "published" : v.status,
        date: v.date?.toISOString() ?? v.createdAt.toISOString(),
        account: "Omega Swarm",
        imageUrl: v.thumbnailUrl || "",
        tags: [] as string[],
        videoUrl: v.videoUrl,
        duration: v.duration,
        likes: 0,
        comments: 0,
        views: 0,
      }));

      const formattedAssets = assets.map((a) => ({
        id: a.id,
        title: a.name,
        caption: "",
        type: "asset" as const,
        status: "published" as const,
        date: a.createdAt.toISOString(),
        account: a.account || "general",
        imageUrl: a.url,
        tags: a.tags || ([] as string[]),
        likes: 0,
        comments: 0,
        views: 0,
      }));

      return [...formattedPosts, ...formattedVideos, ...formattedAssets];
    } catch (err) {
      console.error("[Content] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Delete any content by ID (routes to correct table, user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        // Try deleting from content_posts first
        const deletedPosts = await db!
          .delete(contentPosts)
          .where(
            and(eq(contentPosts.id, input.id), eq(contentPosts.userId, ctx.user.id))
          )
          .returning();
        if (deletedPosts.length > 0) return { success: true };

        // Try deleting from generated_videos
        const deletedVideos = await db!
          .delete(generatedVideos)
          .where(
            and(eq(generatedVideos.id, input.id), eq(generatedVideos.userId, ctx.user.id))
          )
          .returning();
        if (deletedVideos.length > 0) return { success: true };

        // Try deleting from content_assets
        const deletedAssets = await db!
          .delete(contentAssets)
          .where(
            and(eq(contentAssets.id, input.id), eq(contentAssets.userId, ctx.user.id))
          )
          .returning();
        if (deletedAssets.length > 0) return { success: true };

        throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Content] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete content",
        });
      }
    }),
});
