import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { getBrandVoice, saveBrandVoice } from "../../db/store";

export const brandVoiceRouter = router({
  /* ─── Get saved brand voice ─── */
  get: publicProcedure.query(async () => {
    return getBrandVoice();
  }),

  /* ─── Save brand voice ─── */
  save: publicProcedure
    .input(
      z.object({
        tone: z.string().min(1, "Tone is required"),
        description: z.string().min(1, "Description is required"),
        samples: z.array(z.string()).max(3, "Maximum 3 samples allowed").default([]),
      })
    )
    .mutation(async ({ input }) => {
      const brandVoice = saveBrandVoice({
        tone: input.tone,
        description: input.description,
        samples: input.samples,
      });
      return brandVoice;
    }),
});
