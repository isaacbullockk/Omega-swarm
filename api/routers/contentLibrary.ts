import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  getContentAssets,
  addContentAsset,
  deleteContentAsset,
  searchContentAssets,
} from "../../db/store";
import type { ContentAsset } from "../../db/store";

const ACCOUNTS = ["@wildnoff", "@kyakuwamusic", "@isaacbullockk", "general"] as const;

const sampleAssets: ContentAsset[] = [
  {
    id: "asset_1",
    name: "Forest Adventure Reel",
    type: "video",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&h=640&fit=crop",
    tags: ["nature", "outdoors", "adventure"],
    account: "@wildnoff",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "asset_2",
    name: "Mountain Sunrise",
    type: "image",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=640&fit=crop",
    tags: ["landscape", "sunrise", "mountains"],
    account: "@wildnoff",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "asset_3",
    name: "Studio Session BTS",
    type: "video",
    url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=640&fit=crop",
    tags: ["music", "studio", "behind-the-scenes"],
    account: "@kyakuwamusic",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "asset_4",
    name: "Album Cover Concept",
    type: "image",
    url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop",
    tags: ["music", "cover-art", "dark"],
    account: "@kyakuwamusic",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "asset_5",
    name: "Product Showcase",
    type: "image",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=640&fit=crop",
    tags: ["product", "lifestyle", "minimal"],
    account: "@isaacbullockk",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "asset_6",
    name: "City Lights Vlog",
    type: "video",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=640&h=640&fit=crop",
    tags: ["city", "night", "vlog"],
    account: "@isaacbullockk",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

let seeded = false;

function ensureSamples() {
  if (!seeded && getContentAssets().length === 0) {
    for (const a of sampleAssets) {
      addContentAsset(a);
    }
    seeded = true;
  }
}

export const contentLibraryRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          account: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .optional()
    )
    .query(({ input }) => {
      ensureSamples();
      const all = getContentAssets();
      if (!input) return all;
      return all.filter((asset: ContentAsset) => {
        if (input.account && asset.account !== input.account) return false;
        if (input.tags && input.tags.length > 0) {
          if (!input.tags.some((t: string) => asset.tags.includes(t))) return false;
        }
        return true;
      });
    }),

  add: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["image", "video"]),
        url: z.string().url(),
        tags: z.array(z.string()).default([]),
        account: z.enum(ACCOUNTS).default("general"),
      })
    )
    .mutation(({ input }) => {
      const asset: ContentAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: input.name,
        type: input.type,
        url: input.url,
        tags: input.tags,
        account: input.account,
        createdAt: new Date().toISOString(),
      };
      return addContentAsset(asset);
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
      ensureSamples();
      return searchContentAssets(input.query, input.tags, input.account);
    }),
});
