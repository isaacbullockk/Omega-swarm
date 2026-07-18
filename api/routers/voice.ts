import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const voiceRouter = router({
  listVoices: publicProcedure.query(() => {
    return [
      { id: "v1", name: "Isaac's Voice", quality: 98, samples: 3, duration: "2:30", createdAt: "2025-07-01", isCloned: true },
      { id: "v2", name: "Brand Narrator", quality: 95, samples: 2, duration: "1:45", createdAt: "2025-07-05", isCloned: true },
      { id: "v3", name: "Kyakuwa Vocal", quality: 92, samples: 4, duration: "3:15", createdAt: "2025-07-10", isCloned: true },
    ];
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
    return [
      { id: "g1", name: "Summer Campaign Voiceover", voice: "Brand Narrator", duration: "0:45", date: "2025-07-15" },
      { id: "g2", name: "Product Launch Script", voice: "Isaac's Voice", duration: "1:20", date: "2025-07-14" },
      { id: "g3", name: "Social Media Hook", voice: "Kyakuwa Vocal", duration: "0:15", date: "2025-07-13" },
      { id: "g4", name: "Brand Manifesto Read", voice: "Brand Narrator", duration: "2:10", date: "2025-07-12" },
    ];
  }),
});
