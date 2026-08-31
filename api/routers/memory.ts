/**
 * Omega Swarm v5.1 — Memory Bank Router (PostgreSQL + Auth)
 *
 * The Memory Bank is how the user TEACHES the agents: knowledge entries
 * (insight / fact / strategy / feedback) stored per user and injected into
 * planner + copywriter prompts via api/memoryContext.ts.
 *
 *   memory.list   -> all entries for the authenticated user (newest first)
 *   memory.create -> add an entry
 *   memory.delete -> remove an entry (ownership-checked)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { memories } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

const KNOWLEDGE_TYPES = ["insight", "fact", "strategy", "feedback", "win", "loss", "pattern"] as const;

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required").max(8000),
  type: z.enum(KNOWLEDGE_TYPES).default("insight"),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
  source: z.string().max(255).default("user"),
  clientId: z.string().uuid().optional(),
});

export const memoryRouter = router({
  /* ─── List memories for the authenticated user ─── */
  list: authedProcedure
    .input(z.object({ type: z.enum(KNOWLEDGE_TYPES).optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) return [];
      try {
        const where = input?.type
          ? and(eq(memories.userId, ctx.user.id), eq(memories.type, input.type))
          : eq(memories.userId, ctx.user.id);
        return await db
          .select()
          .from(memories)
          .where(where)
          .orderBy(desc(memories.date))
          .limit(200);
      } catch (err) {
        console.error("[Memory] List error:", (err as Error).message);
        return [];
      }
    }),

  /* ─── Create a memory (teach the agents) ─── */
  create: authedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const [row] = await db
        .insert(memories)
        .values({
          userId: ctx.user.id,
          clientId: input.clientId ?? null,
          title: input.title,
          content: input.content,
          type: input.type,
          tags: input.tags,
          source: input.source,
          confidence: 90,
        })
        .returning();
      return row;
    }),

  /* ─── Delete a memory (ownership-checked) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const deleted = await db
        .delete(memories)
        .where(and(eq(memories.id, input.id), eq(memories.userId, ctx.user.id)))
        .returning({ id: memories.id });
      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Memory not found" });
      }
      return { success: true };
    }),
});
