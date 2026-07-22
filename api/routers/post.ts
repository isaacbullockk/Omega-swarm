import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateCaption, generateImage } from "../openai";

const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

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
    .input(z.object({ topic: z.string().min(1), brandVoice: z.string().optional() }))
    .mutation(async ({ input }) => {
      if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set.");
      if (!BUFFER_API_KEY) throw new Error("BUFFER_API_KEY not set.");

      // 1. Generate caption with AI
      const caption = await generateCaption(input.topic, input.brandVoice);

      // 2. Generate image with AI
      const imageUrl = await generateImage(`Instagram post: ${input.topic}. Professional marketing visual.`);

      // 3. Get Buffer profiles
      const profiles = await bufferProfiles();
      if (!profiles || profiles.length === 0) {
        throw new Error("No Buffer profiles connected. Connect Instagram in Buffer first.");
      }
      const profileIds = profiles.map((p: { id: string }) => p.id);

      // 4. Post to Buffer (will publish to all connected profiles)
      const result = await bufferCreateUpdate(caption, profileIds);

      return {
        caption,
        imageUrl,
        bufferPostId: result.id || null,
        status: result.id ? "posted" : "failed",
        bufferResponse: result,
      };
    }),
});
