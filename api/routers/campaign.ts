/**
 * Omega Swarm v5.0 — Campaign Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 * Campaign creation is rate-limited (AI generation).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { campaigns } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const campaignCreateSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  objective: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  mode: z.enum(["sequential", "parallel", "adaptive", "battle"]).default("sequential"),
});

const campaignUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  objective: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  mode: z.enum(["sequential", "parallel", "adaptive", "battle"]).optional(),
  status: z.enum(["queued", "running", "completed", "failed"]).optional(),
  completedAt: z.string().datetime().optional(),
});

const outputItemSchema = z.object({
  agentId: z.string().min(1),
  agentName: z.string().min(1),
  agentEmoji: z.string().min(1),
  status: z.enum(["pending", "running", "completed", "failed"]),
  output: z.string().default(""),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

export const campaignRouter = router({
  /* ─── List all campaigns for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id))
        .orderBy(campaigns.createdAt);
    } catch (err) {
      console.error("[Campaign] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Get a single campaign by ID (user-scoped) ─── */
  get: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      try {
        const result = await db!
          .select()
          .from(campaigns)
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .limit(1);
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Campaign] Get error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch campaign",
        });
      }
    }),

  /* ─── Create a new campaign (rate limited) ─── */
  create: rateLimitedProcedure
    .input(campaignCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(campaigns)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title: input.title,
            objective: input.objective ?? null,
            budget: input.budget ?? null,
            timeline: input.timeline ?? null,
            mode: input.mode,
            status: "queued",
            outputs: [],
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Campaign] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create campaign",
        });
      }
    }),

  /* ─── Update a campaign (user-scoped) ─── */
  update: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: campaignUpdateSchema,
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
        const updateData: Record<string, unknown> = {};
        if (input.updates.title !== undefined) updateData.title = input.updates.title;
        if (input.updates.objective !== undefined) updateData.objective = input.updates.objective;
        if (input.updates.budget !== undefined) updateData.budget = input.updates.budget;
        if (input.updates.timeline !== undefined) updateData.timeline = input.updates.timeline;
        if (input.updates.mode !== undefined) updateData.mode = input.updates.mode;
        if (input.updates.status !== undefined) updateData.status = input.updates.status;
        if (input.updates.completedAt !== undefined) updateData.completedAt = new Date(input.updates.completedAt);

        const result = await db!
          .update(campaigns)
          .set(updateData)
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Campaign] Update error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update campaign",
        });
      }
    }),

  /* ─── Update campaign outputs (user-scoped) ─── */
  updateOutputs: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        outputs: z.array(outputItemSchema),
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
          .update(campaigns)
          .set({ outputs: input.outputs })
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Campaign] UpdateOutputs error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update campaign outputs",
        });
      }
    }),

  /* ─── Delete a campaign (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(campaigns)
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Campaign] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete campaign",
        });
      }
    }),
});
