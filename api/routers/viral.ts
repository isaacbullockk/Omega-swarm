import { z } from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { getViralVideos, updateViralVideoStatus } from "../../db/store.ts";

export const viralRouter = router({
  list: publicProcedure.query(async () => {
    return await getViralVideos();
  }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      await updateViralVideoStatus(input.id, input.status);
      return { success: true };
    }),
});
