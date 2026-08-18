import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { addAsset, getAssets, deleteAsset, updateAsset, searchAssets } from "../../db/store";

export const assetRouter = router({
  list: publicProcedure.query(() => getAssets()),

  upload: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["image", "video", "audio", "reference"]),
        dataUrl: z.string().optional(),
        url: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(({ input }) => {
      const asset = addAsset({
        id: `asset_${Date.now()}`,
        ...input,
        usedIn: [],
        createdAt: new Date().toISOString(),
      });
      return asset;
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), updates: z.record(z.any()) }))
    .mutation(({ input }) => updateAsset(input.id, input.updates)),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      deleteAsset(input.id);
      return { success: true };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().optional(), type: z.enum(["image", "video", "audio", "reference"]).optional() }))
    .query(({ input }) => searchAssets(input.query, input.type)),
});
