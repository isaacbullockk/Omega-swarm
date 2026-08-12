import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getContentPosts, getGeneratedVideos, getContentAssets, getAnalyticsEvents, getStats } from "../../db/store";

export const contentRouter = router({
  // Unified list of all content (posts + videos + assets)
  list: publicProcedure.query(() => {
    const posts = getContentPosts().map(p => ({
      id: p.id,
      title: p.title,
      caption: p.caption,
      type: p.type as "social" | "video" | "ad" | "blog" | "asset",
      status: p.status,
      date: p.date,
      account: p.account,
      imageUrl: p.imageUrl || "",
      tags: [] as string[],
      likes: p.likes,
      comments: p.comments,
      views: p.views,
      instagramPostId: p.instagramPostId,
    }));

    const videos = getGeneratedVideos().map(v => ({
      id: v.id,
      title: v.title,
      caption: v.prompt,
      type: "video" as const,
      status: v.status === "ready" ? "published" : v.status,
      date: v.date,
      account: "Omega Swarm",
      imageUrl: v.thumbnailUrl || "",
      tags: [] as string[],
      videoUrl: v.videoUrl,
      duration: v.duration,
      likes: 0,
      comments: 0,
      views: 0,
    }));

    const assets = getContentAssets().map(a => ({
      id: a.id,
      title: a.name,
      caption: "",
      type: "asset" as const,
      status: "published" as const,
      date: a.createdAt.split("T")[0],
      account: a.account,
      imageUrl: a.url,
      tags: a.tags,
      likes: 0,
      comments: 0,
      views: 0,
    }));

    return [...posts, ...videos, ...assets];
  }),

  // Delete any content by ID (routes to correct store)
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      // Try all stores
      const { deleteContentPost, deleteGeneratedVideo, deleteContentAsset } = require("../../db/store");
      deleteContentPost(input.id);
      deleteGeneratedVideo(input.id);
      deleteContentAsset(input.id);
      return { success: true };
    }),
});

export const analyticsRouter = router({
  // Get platform stats for dashboard
  stats: publicProcedure.query(() => {
    return getStats();
  }),

  // Get recent activity events
  events: publicProcedure
    .input(z.object({ limit: z.number().default(20) }).optional())
    .query(({ input }) => {
      return getAnalyticsEvents(input?.limit || 20);
    }),

  // Add a custom event
  track: publicProcedure
    .input(z.object({
      type: z.enum(["post_created", "video_generated", "campaign_started", "campaign_completed", "agent_chat", "instagram_published"]),
      title: z.string(),
      description: z.string(),
      agentColor: z.string().optional(),
      agentName: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const { addAnalyticsEvent } = require("../../db/store");
      return addAnalyticsEvent({
        id: `evt_${Date.now()}`,
        ...input,
        timestamp: new Date().toISOString(),
      });
    }),
});
