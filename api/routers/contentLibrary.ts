/**
 * Omega Swarm v5.0 — Content Library Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { contentAssets } from "../../db/schema";
import { eq, and, like } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const assetTypeSchema = z.enum(["image", "video", "audio"]);

const addAssetSchema = z.object({
  clientId: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  type: assetTypeSchema,
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional().default([]),
  account: z.string().optional().default("general"),
});

const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  account: z.string().optional(),
  type: assetTypeSchema.optional(),
});

export const contentLibraryRouter = router({
  /* ─── List all content assets for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(contentAssets)
        .where(eq(contentAssets.userId, ctx.user.id))
        .orderBy(contentAssets.createdAt);
    } catch (err) {
      console.error("[ContentLibrary] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Add a content asset ─── */
  add: authedProcedure
    .input(addAssetSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(contentAssets)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            name: input.name,
            type: input.type,
            url: input.url ?? "",
            tags: input.tags,
            account: input.account,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[ContentLibrary] Add error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add content asset",
        });
      }
    }),

  /* ─── Delete a content asset (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(contentAssets)
          .where(and(eq(contentAssets.id, input.id), eq(contentAssets.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Content asset not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[ContentLibrary] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete content asset",
        });
      }
    }),

  /* ─── Search content assets (user-scoped) ─── */
  search: authedProcedure
    .input(searchSchema)
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return [];
      try {
        let conditions = eq(contentAssets.userId, ctx.user.id);

        if (input.type) {
          conditions = and(conditions, eq(contentAssets.type, input.type)) as any;
        }

        if (input.account) {
          conditions = and(conditions, eq(contentAssets.account, input.account)) as any;
        }

        if (input.query) {
          conditions = and(conditions, like(contentAssets.name, `%${input.query}%`)) as any;
        }

        const results = await db!
          .select()
          .from(contentAssets)
          .where(conditions)
          .orderBy(contentAssets.createdAt);

        // Filter by tags if specified (JSONB tag filtering is post-query)
        if (input.tags && input.tags.length > 0) {
          return results.filter(
            (r) => r.tags && input.tags!.some((t) => r.tags.includes(t))
          );
        }

        return results;
      } catch (err) {
        console.error("[ContentLibrary] Search error:", (err as Error).message);
        return [];
      }
    }),
});
