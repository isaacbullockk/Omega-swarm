/**
 * Omega Swarm v5.0 — Client Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { clients } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const socialLinkSchema = z.object({
  url: z.string().optional(),
  handle: z.string().optional(),
});

const brandHierarchyItemSchema = z.object({
  tier: z.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const namingRuleSchema = z.object({
  pattern: z.string().optional(),
  description: z.string().optional(),
});

const contentPillarSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  frequency: z.string().optional(),
});

const storySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
});

const calendarEntrySchema = z.object({
  date: z.string().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
});

const clientCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().min(1, "Handle is required"),
  tagline: z.string().optional(),
  tier: z.number().min(1).max(5).default(1),
  status: z.enum(["active", "paused", "archived"]).default("active"),
  bioFull: z.string().optional(),
  bioMedium: z.string().optional(),
  bioShort: z.string().optional(),
  location: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#D97706"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#1E3A5F"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#F5F5F0"),
  website: z.string().url().optional(),
  photoHeadshot: z.string().optional(),
  photoPerformance: z.string().optional(),
  photoCasual: z.string().optional(),
  socialLinks: z.object({
    instagram: socialLinkSchema.optional(),
    twitter: socialLinkSchema.optional(),
    linkedin: socialLinkSchema.optional(),
    youtube: socialLinkSchema.optional(),
    tiktok: socialLinkSchema.optional(),
    spotify: socialLinkSchema.optional(),
  }).optional().default({}),
  brandHierarchy: z.array(brandHierarchyItemSchema).optional().default([]),
  namingRules: z.record(namingRuleSchema).optional().default({}),
  toneWords: z.array(z.string()).optional().default([]),
  bannedPhrases: z.array(z.string()).optional().default([]),
  contentPillars: z.array(contentPillarSchema).optional().default([]),
  storyBank: z.array(storySchema).optional().default([]),
  calendarEntries: z.array(calendarEntrySchema).optional().default([]),
});

const clientUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  handle: z.string().min(1).optional(),
  tagline: z.string().optional(),
  tier: z.number().min(1).max(5).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  bioFull: z.string().optional(),
  bioMedium: z.string().optional(),
  bioShort: z.string().optional(),
  location: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  website: z.string().url().optional(),
  photoHeadshot: z.string().optional(),
  photoPerformance: z.string().optional(),
  photoCasual: z.string().optional(),
  socialLinks: z.object({
    instagram: socialLinkSchema.optional(),
    twitter: socialLinkSchema.optional(),
    linkedin: socialLinkSchema.optional(),
    youtube: socialLinkSchema.optional(),
    tiktok: socialLinkSchema.optional(),
    spotify: socialLinkSchema.optional(),
  }).optional(),
  brandHierarchy: z.array(brandHierarchyItemSchema).optional(),
  namingRules: z.record(namingRuleSchema).optional(),
  toneWords: z.array(z.string()).optional(),
  bannedPhrases: z.array(z.string()).optional(),
  contentPillars: z.array(contentPillarSchema).optional(),
  storyBank: z.array(storySchema).optional(),
  calendarEntries: z.array(calendarEntrySchema).optional(),
});

export const clientRouter = router({
  /* ─── List all clients for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!.select().from(clients).where(eq(clients.userId, ctx.user.id));
    } catch (err) {
      console.error("[Client] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Get a single client by ID (user-scoped) ─── */
  get: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
      }
      try {
        const result = await db!
          .select()
          .from(clients)
          .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
          .limit(1);
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Client] Get error:", (err as Error).message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client" });
      }
    }),

  /* ─── Create a new client ─── */
  create: authedProcedure
    .input(clientCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(clients)
          .values({
            userId: ctx.user.id,
            ...input,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Client] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create client",
        });
      }
    }),

  /* ─── Update a client (user-scoped) ─── */
  update: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: clientUpdateSchema,
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
          .update(clients)
          .set({ ...input.updates, updatedAt: new Date() })
          .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Client] Update error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update client",
        });
      }
    }),

  /* ─── Delete a client (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(clients)
          .where(and(eq(clients.id, input.id), eq(clients.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Client] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete client",
        });
      }
    }),
});
