import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { addGeneratedVideo, getGeneratedVideos, deleteGeneratedVideo, updateGeneratedVideo, addAnalyticsEvent } from "../../db/store";

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;
const KLING_API_KEY = process.env.KLING_API_KEY;

export const videoRouter = router({
  // Check provider status
  status: publicProcedure.query(() => ({
    pollinations: !!POLLINATIONS_API_KEY,
    kling: !!KLING_API_KEY,
  })),

  // Create a video
  create: publicProcedure
    .input(z.object({
      prompt: z.string().min(1),
      duration: z.number().min(3).max(60).default(5),
      aspectRatio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
      provider: z.enum(["pollinations", "kling"]).default("pollinations"),
      referenceAssets: z.array(z.object({
        name: z.string(),
        url: z.string().optional(),
        dataUrl: z.string().optional(),
        description: z.string().optional(),
      })).optional().default([]),
    }))
    .mutation(async ({ input }) => {
      const id = `video_${Date.now()}`;

      // Build enriched prompt from reference assets
      let enrichedPrompt = input.prompt;
      if (input.referenceAssets.length > 0) {
        const refDesc = input.referenceAssets.map((a) => a.description || a.name).join("; ");
        enrichedPrompt = `${input.prompt}. Style inspired by: ${refDesc}`;
      }

      // For Pollinations: URL is ready immediately, video generates on first load
      let videoUrl: string;
      let status: "ready" | "generating" | "failed" = "ready";

      if (input.provider === "kling") {
        if (!KLING_API_KEY) {
          throw new Error("KLING_API_KEY not configured. Add it to Railway environment variables.");
        }
        const encoded = encodeURIComponent(enrichedPrompt);
        videoUrl = `https://gen.pollinations.ai/video/${encoded}?duration=${input.duration}&aspectRatio=${input.aspectRatio}&key=${KLING_API_KEY}`;
      } else {
        if (!POLLINATIONS_API_KEY) {
          throw new Error("POLLINATIONS_API_KEY not configured. Add it to Railway environment variables.");
        }
        const encoded = encodeURIComponent(enrichedPrompt);
        videoUrl = `https://gen.pollinations.ai/video/${encoded}?duration=${input.duration}&aspectRatio=${input.aspectRatio}&key=${POLLINATIONS_API_KEY}`;
      }

      const video = addGeneratedVideo({
        id,
        title: input.prompt.slice(0, 60) + (input.prompt.length > 60 ? "..." : ""),
        prompt: input.prompt,
        videoUrl,
        thumbnailUrl: undefined,
        duration: input.duration,
        aspectRatio: input.aspectRatio,
        provider: input.provider,
        status,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      });

      addAnalyticsEvent({
        id: `evt_${Date.now()}`,
        type: "video_generated",
        title: "AI Video generated",
        description: `Generated ${input.duration}s video: "${input.prompt.slice(0, 40)}..."`,
        agentColor: "#A855F7",
        agentName: "Vision",
        timestamp: new Date().toISOString(),
      });

      return video;
    }),

  // List all videos
  list: publicProcedure.query(() => {
    return getGeneratedVideos();
  }),

  // Delete a video
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      deleteGeneratedVideo(input.id);
      return { success: true };
    }),
});
