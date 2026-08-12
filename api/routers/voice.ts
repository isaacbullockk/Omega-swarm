import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const voiceRouter = router({
  listVoices: publicProcedure.query(() => {
    return [];
  }),

  generateSpeech: publicProcedure
    .input(z.object({ text: z.string(), voiceId: z.string(), stability: z.number().optional() }))
    .mutation(({ input }) => {
      return {
        id: `audio_${Date.now()}`,
        text: input.text,
        voiceId: input.voiceId,
        status: "completed",
        url: null,
        duration: "0:12",
        createdAt: new Date().toISOString(),
      };
    }),

  listGenerations: publicProcedure.query(() => {
    return [];
  }),
});
