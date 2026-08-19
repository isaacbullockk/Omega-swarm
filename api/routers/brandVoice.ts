/**
 * Omega Swarm v5.0 — Brand Voice Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { brandVoices } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const brandVoiceSaveSchema = z.object({
  clientId: z.string().uuid().optional(),
  tone: z.string().min(1, "Tone is required"),
  description: z.string().min(1, "Description is required"),
  samples: z.array(z.string().min(1)).max(3, "Maximum 3 samples allowed").default([]),
});

export const brandVoiceRouter = router({
  /* ─── Get brand voice for the authenticated user ─── */
  get: authedProcedure
    .input(z.object({ clientId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return null;
      try {
        let result;
        if (input?.clientId) {
          result = await db!
            .select()
            .from(brandVoices)
            .where(
              and(
                eq(brandVoices.userId, ctx.user.id),
                eq(brandVoices.clientId, input.clientId)
              )
            )
            .limit(1);
        } else {
          result = await db!
            .select()
            .from(brandVoices)
            .where(eq(brandVoices.userId, ctx.user.id))
            .limit(1);
        }
        return result[0] ?? null;
      } catch (err) {
        console.error("[BrandVoice] Get error:", (err as Error).message);
        return null;
      }
    }),

  /* ─── Save brand voice (upsert per user+client) ─── */
  save: authedProcedure
    .input(brandVoiceSaveSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        // Check if a brand voice already exists for this user (+ optional client)
        const existingQuery = input.clientId
          ? and(
              eq(brandVoices.userId, ctx.user.id),
              eq(brandVoices.clientId, input.clientId)
            )
          : eq(brandVoices.userId, ctx.user.id);

        const existing = await db!
          .select()
          .from(brandVoices)
          .where(existingQuery)
          .limit(1);

        if (existing[0]) {
          // Update existing
          const result = await db!
            .update(brandVoices)
            .set({
              tone: input.tone,
              description: input.description,
              samples: input.samples,
              updatedAt: new Date(),
            })
            .where(eq(brandVoices.id, existing[0].id))
            .returning();
          return result[0];
        }

        // Insert new
        const result = await db!
          .insert(brandVoices)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId,
            tone: input.tone,
            description: input.description,
            samples: input.samples,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[BrandVoice] Save error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save brand voice",
        });
      }
    }),

  /* ─── Delete brand voice ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(brandVoices)
          .where(and(eq(brandVoices.id, input.id), eq(brandVoices.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Brand voice not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[BrandVoice] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete brand voice",
        });
      }
    }),
});
