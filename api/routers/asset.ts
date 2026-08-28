/**
 * Omega Swarm v5.0 — Asset Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { assets } from "../../db/schema";
import { eq, and, like } from "drizzle-orm";
import { analyzeImage, generateImageOpenRouter } from "../openrouter";

/* ─── Zod Schemas ─── */

const assetUploadSchema = z
  .object({
    clientId: z.string().uuid().optional(),
    name: z.string().min(1, "Name is required"),
    type: z.enum(["image", "video", "audio", "reference"]),
    dataUrl: z.string().optional(),
    url: z.string().url().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
  })
  .refine((a) => a.dataUrl || a.url, {
    message: "Asset requires either a dataUrl or a public url",
  });

const assetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["image", "video", "audio", "reference"]).optional(),
  dataUrl: z.string().optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  usedIn: z.array(z.string()).optional(),
});

export const assetRouter = router({
  /* ─── Analyze an image asset with the vision model (auto description + tags) ─── */
  analyze: rateLimitedProcedure
    .input(z.object({ assetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const rows = await db
        .select()
        .from(assets)
        .where(and(eq(assets.id, input.assetId), eq(assets.userId, ctx.user.id)))
        .limit(1);
      const asset = rows[0];
      if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });

      const imageUrl = asset.url ?? asset.dataUrl;
      if (!imageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Asset has no image URL" });
      }

      let analysis: { description: string; tags: string[] };
      try {
        analysis = await analyzeImage(imageUrl);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Vision analysis failed: ${(err as Error).message}`,
        });
      }

      await db
        .update(assets)
        .set({
          description: analysis.description,
          tags: Array.from(new Set([...(asset.tags ?? []), ...analysis.tags])),
        })
        .where(eq(assets.id, asset.id));

      return analysis;
    }),

  /* ─── Generate an image asset via the key-backed image model ─── */
  generate: rateLimitedProcedure
    .input(
      z.object({
        clientId: z.string().uuid().optional(),
        prompt: z.string().min(5).max(2000),
        name: z.string().min(1).max(255),
        tier: z.enum(["lite", "quality", "bulk"]).default("lite"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      let dataUrl: string;
      try {
        dataUrl = await generateImageOpenRouter(input.prompt, input.tier);
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Image generation failed: ${(err as Error).message}`,
        });
      }
      const result = await db
        .insert(assets)
        .values({
          userId: ctx.user.id,
          clientId: input.clientId ?? null,
          name: input.name,
          type: "image",
          dataUrl,
          description: input.prompt,
          tags: ["ai-generated"],
          usedIn: [],
        })
        .returning();
      return result[0];
    }),

  /* ─── List all assets for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(assets)
        .where(eq(assets.userId, ctx.user.id))
        .orderBy(assets.createdAt);
    } catch (err) {
      console.error("[Asset] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Upload/create a new asset ─── */
  upload: authedProcedure
    .input(assetUploadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(assets)
          .values({
            userId: ctx.user.id,
            ...input,
            usedIn: [],
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Asset] Upload error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload asset",
        });
      }
    }),

  /* ─── Update an asset (user-scoped) ─── */
  update: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: assetUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .update(assets)
          .set(input.updates)
          .where(and(eq(assets.id, input.id), eq(assets.userId, ctx.user.id)))
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Asset] Update error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update asset",
        });
      }
    }),

  /* ─── Delete an asset (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(assets)
          .where(and(eq(assets.id, input.id), eq(assets.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Asset] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete asset",
        });
      }
    }),

  /* ─── Search assets (user-scoped) ─── */
  search: authedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        type: z.enum(["image", "video", "audio", "reference"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return [];
      try {
        let conditions = eq(assets.userId, ctx.user.id);

        if (input.type) {
          conditions = and(conditions, eq(assets.type, input.type)) as any;
        }

        if (input.query) {
          conditions = and(
            conditions,
            like(assets.name, `%${input.query}%`)
          ) as any;
        }

        return await db!
          .select()
          .from(assets)
          .where(conditions)
          .orderBy(assets.createdAt);
      } catch (err) {
        console.error("[Asset] Search error:", (err as Error).message);
        return [];
      }
    }),
});
