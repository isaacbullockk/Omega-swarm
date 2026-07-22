import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateCaption, generateImage } from "../openai";

const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

// Store real posted content
const postedContent: {
  id: string;
  title: string;
  caption: string;
  type: "social" | "video" | "ad" | "blog";
  status: "published" | "scheduled";
  date: string;
  account: string;
  imageUrl?: string;
  bufferPostId?: string;
}[] = [];

async function bufferCreateUpdate(text: string, profileIds: string[]) {
  const res = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${BUFFER_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      text,
      profile_ids: profileIds.join(","),
      now: "true",
    }),
  });
  return res.json();
}

async function bufferProfiles() {
  const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${BUFFER_API_KEY}`);
  return res.json();
}

export const postRouter = router({
  profiles: publicProcedure.query(async () => {
    if (!BUFFER_API_KEY) throw new Error("BUFFER_API_KEY not set.");
    return bufferProfiles();
  }),

  create: publicProcedure
    .input(z.object({
      topic: z.string().min(1),
      brandVoice: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. Generate caption with AI
      let caption: string;
      try {
        caption = await generateCaption(input.topic, input.brandVoice);
      } catch (e) {
        throw new Error(`AI caption failed: ${e instanceof Error ? e.message : "Unknown"}`);
      }

      // 2. Generate image with AI
      let imageUrl = "";
      try {
        imageUrl = await generateImage(`Instagram post: ${input.topic}. Professional marketing visual.`);
      } catch (e) {
        console.log("Image generation skipped:", e);
      }

      // 3. Post to Buffer (Instagram)
      let bufferResult: Record<string, unknown> = {};
      if (BUFFER_API_KEY) {
        const profiles = await bufferProfiles();
        if (profiles && profiles.length > 0) {
          const profileIds = profiles.map((p: { id: string }) => p.id);
          bufferResult = await bufferCreateUpdate(caption, profileIds);
        } else {
          bufferResult = { skipped: "No Buffer profiles connected" };
        }
      } else {
        bufferResult = { skipped: "BUFFER_API_KEY not set" };
      }

      // 4. Save to real content store
      const item = {
        id: `post_${Date.now()}`,
        title: input.topic,
        caption,
        type: "social" as const,
        status: "published" as const,
        date: new Date().toISOString().split("T")[0],
        account: "@wildnoff", // Default, could be dynamic
        imageUrl: imageUrl || undefined,
        bufferPostId: (bufferResult.id as string) || undefined,
      };
      postedContent.unshift(item);

      return {
        ...item,
        caption,
        imageUrl,
        bufferResponse: bufferResult,
      };
    }),
});

// Export for content router to access
export { postedContent };
