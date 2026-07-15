import { z } from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { getSocialAccounts, createSocialAccount, deleteSocialAccount } from "../../db/store.ts";

export const socialRouter = router({
  list: publicProcedure.query(async () => {
    return await getSocialAccounts();
  }),

  create: publicProcedure
    .input(z.object({
      platform: z.string(),
      handle: z.string(),
      accountName: z.string(),
      accessToken: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createSocialAccount(input);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSocialAccount(input.id);
      return { success: true };
    }),

  disconnect: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSocialAccount(input.id);
      return { success: true };
    }),
});
