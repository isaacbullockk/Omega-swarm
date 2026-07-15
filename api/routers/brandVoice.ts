import { z } from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { getBrandVoice, saveBrandVoice } from "../../db/store.ts";

export const brandVoiceRouter = router({
  get: publicProcedure.query(async () => {
    return await getBrandVoice();
  }),

  save: publicProcedure
    .input(z.object({
      tone: z.string(),
      description: z.string(),
      samples: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await saveBrandVoice(input);
    }),
});
