import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateWithAgent } from "../openai";
import {
  getViralVideos,
  getViralVideosByAccount,
  addViralVideo,
  updateViralVideoStatus,
} from "../../db/store";

const ACCOUNTS = ["@wildnoff", "@kyakuwamusic", "@isaacbullockk"] as const;

/**
 * tRPC router for viral video studio operations.
 * Handles listing, adding, updating status, and AI caption generation.
 */
export const viralRouter = router({
  /**
   * List all viral videos with optional account filter.
   */
  list: publicProcedure
    .input(
      z
        .object({
          account: z.string().optional(),
        })
        .optional()
    )
    .query(({ input }) => {
      if (input?.account && ACCOUNTS.includes(input.account as (typeof ACCOUNTS)[number])) {
        return getViralVideosByAccount(input.account);
      }
      return getViralVideos();
    }),

  /**
   * Add a new viral video.
   */
  add: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        account: z.string().refine((a) => ACCOUNTS.includes(a as (typeof ACCOUNTS)[number]), {
          message: "Invalid account handle",
        }),
        caption: z.string().min(1),
        hashtags: z.array(z.string()).default([]),
        videoUrl: z.string().min(1),
        status: z.enum(["ready", "posted", "scheduled"]).default("ready"),
      })
    )
    .mutation(({ input }) => {
      const video = addViralVideo({
        id: `viral_${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
      });
      return video;
    }),

  /**
   * Update video status (ready / posted / scheduled).
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["ready", "posted", "scheduled"]),
        postedAt: z.string().optional(),
        scheduledFor: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { id, status, postedAt, scheduledFor } = input;
      const video = updateViralVideoStatus(
        id,
        status,
        postedAt,
        scheduledFor
      );
      return video;
    }),

  /**
   * Generate a fresh caption using OpenAI in Isaac's brand voice.
   */
  generateCaption: publicProcedure
    .input(
      z.object({
        videoId: z.string(),
        videoTitle: z.string(),
        account: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Rewrite the following caption for the video "${input.videoTitle}" posted to ${input.account}.

Context: ${input.context || "Music artist sharing content with their community."}

Requirements:
- Write in Isaac Bullock Kintu's authentic brand voice: soulful, genuine, community-driven, passionate about music and live performance
- Use a mix of reflective wisdom and high energy
- Include 1-2 rhetorical questions or call-to-actions to boost engagement
- Add 8-12 relevant music/festival/performance hashtags
- Include emojis naturally (2-4 total)
- Keep it under 300 words
- The tone should feel intimate but universal — like speaking to a close friend about something you both love
- Reference the account identity naturally

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
    }),
});
