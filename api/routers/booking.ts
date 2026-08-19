/**
 * Omega Swarm v5.0 — Booking Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { bookings } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/* ─── Zod Schemas ─── */

const bookingCreateSchema = z.object({
  clientId: z.string().uuid().optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  clientCompany: z.string().optional(),
  serviceId: z.string().min(1, "Service ID is required"),
  serviceName: z.string().min(1, "Service name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  notes: z.string().optional(),
});

const bookingStatusSchema = z.enum(["pending", "confirmed", "completed", "cancelled"]);

export const bookingRouter = router({
  /* ─── List all bookings for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(bookings)
        .where(eq(bookings.userId, ctx.user.id))
        .orderBy(bookings.createdAt);
    } catch (err) {
      console.error("[Booking] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Get bookings by email (user-scoped) ─── */
  myBookings: authedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return [];
      try {
        return await db!
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.userId, ctx.user.id),
              eq(bookings.clientEmail, input.email)
            )
          )
          .orderBy(bookings.createdAt);
      } catch (err) {
        console.error("[Booking] MyBookings error:", (err as Error).message);
        return [];
      }
    }),

  /* ─── Get a single booking by ID (user-scoped) ─── */
  get: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }
      try {
        const result = await db!
          .select()
          .from(bookings)
          .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)))
          .limit(1);
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Booking] Get error:", (err as Error).message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch booking" });
      }
    }),

  /* ─── Create a new booking ─── */
  create: authedProcedure
    .input(bookingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        const result = await db!
          .insert(bookings)
          .values({
            userId: ctx.user.id,
            ...input,
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Booking] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create booking",
        });
      }
    }),

  /* ─── Update booking status ─── */
  updateStatus: authedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: bookingStatusSchema,
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
          .update(bookings)
          .set({ status: input.status })
          .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)))
          .returning();
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Booking] UpdateStatus error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update booking status",
        });
      }
    }),

  /* ─── Delete a booking (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(bookings)
          .where(and(eq(bookings.id, input.id), eq(bookings.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Booking] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete booking",
        });
      }
    }),
});
