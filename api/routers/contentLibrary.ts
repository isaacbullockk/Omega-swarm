import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  getContentAssets,
  addContentAsset,
  deleteContentAsset,
  searchContentAssets,
} from "../../db/store";

const ACCOUNTS = ["@wildnoff", "@kyakuwamusic", "@isaacbullockk", "general"] as const;

export const contentLibraryRouter = router({
  list: publicProcedure.query(() => {
    return getContentAssets();
  }),

  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["image", "video", "document", "audio"]),
        url: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
        account: z.enum(ACCOUNTS).optional(),
      })
    )
    .mutation(({ input }) => {
      return addContentAsset({
        id: `asset_${Date.now()}`,
        ...input,
        account: input.account || "general",
        createdAt: new Date().toISOString(),
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return deleteContentAsset(input.id);
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        tags: z.array(z.string()).optional(),
        account: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return searchContentAssets(input.query, input.tags, input.account);
    }),
});
