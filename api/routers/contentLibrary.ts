import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { getContentAssets, createContentAsset } from "../../db/store";

export const contentLibraryRouter = router({
  list: publicProcedure.query(async () => {
    return await getContentAssets();
  }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      type: z.string(),
      url: z.string(),
      tags: z.array(z.string()).optional(),
      account: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createContentAsset(input);
    }),
});
