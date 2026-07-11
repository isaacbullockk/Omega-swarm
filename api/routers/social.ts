import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  getSocialAccounts,
  addSocialAccount,
  updateSocialAccount,
  disconnectSocialAccount,
} from "../../db/store";

export const socialRouter = router({
  list: publicProcedure.query(async () => {
    return getSocialAccounts();
  }),

  connect: publicProcedure
    .input(
      z.object({
        platform: z.enum(["instagram", "facebook", "youtube"]),
        accountName: z.string().min(1),
        handle: z.string().min(1),
        accessToken: z.string().min(1),
        pageId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = getSocialAccounts().find(
        (a) => a.handle === input.handle && a.platform === input.platform
      );

      if (existing) {
        return updateSocialAccount(existing.id, {
          connected: true,
          accessToken: input.accessToken,
          pageId: input.pageId,
          connectedAt: new Date().toISOString(),
        });
      }

      return addSocialAccount({
        id: `${input.platform}_${Date.now()}`,
        platform: input.platform,
        accountName: input.accountName,
        handle: input.handle,
        connected: true,
        accessToken: input.accessToken,
        pageId: input.pageId,
        connectedAt: new Date().toISOString(),
      });
    }),

  disconnect: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return disconnectSocialAccount(input.id);
    }),

  status: publicProcedure
    .input(z.object({ platform: z.enum(["instagram", "facebook", "youtube"]) }))
    .query(async ({ input }) => {
      const accounts = getSocialAccounts().filter(
        (a) => a.platform === input.platform
      );
      return {
        platform: input.platform,
        total: accounts.length,
        connected: accounts.filter((a) => a.connected).length,
        accounts,
      };
    }),
});
