/**
 * Omega Swarm v5.0 — Auth Router
 *
 * Authentication endpoints:
 * - login (email + password)
 * - register (name + email + password)
 * - logout (destroy session)
 * - me (current user)
 * - guest (create guest session — limited functionality)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { users, sessions, credits } from "../../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateSessionToken } from "./utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GUEST_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

export const authRouter = router({
  /**
   * Register a new user account
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if email exists
      const existing = await db!
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const newUser = await db!
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          name: input.name,
          role: "user",
          isGuest: false,
        })
        .returning();

      const user = newUser[0];

      // Create default credits (€50 budget)
      await db!
        .insert(credits)
        .values({
          userId: user.id,
          totalBudget: "50.00",
          spent: "0.00",
          currency: "EUR",
        });

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

      await db!
        .insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt,
        });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    }),

  /**
   * Login with email + password
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find user by email
      const userResult = await db!
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      const user = userResult[0];

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const valid = await verifyPassword(input.password, user.passwordHash);

      if (!valid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid email or password",
        });
      }

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

      await db!
        .insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt,
        });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isGuest: user.isGuest,
        },
        token,
      };
    }),

  /**
   * Create a guest session (limited access, no password required)
   */
  guest: publicProcedure
    .mutation(async () => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const guestId = crypto.randomUUID();
      const guestEmail = `guest_${guestId.slice(0, 8)}@omega-swarm.local`;
      const token = generateSessionToken();
      const guestExpiresAt = new Date(Date.now() + GUEST_DURATION_MS);

      // Create guest user
      const newUser = await db!
        .insert(users)
        .values({
          email: guestEmail,
          passwordHash: "guest_no_password",
          name: "Guest User",
          role: "user",
          isGuest: true,
          guestExpiresAt,
        })
        .returning();

      const user = newUser[0];

      // Create default credits for guest
      await db!
        .insert(credits)
        .values({
          userId: user.id,
          totalBudget: "50.00",
          spent: "0.00",
          currency: "EUR",
        });

      // Create session
      const sessionExpiresAt = new Date(Date.now() + GUEST_DURATION_MS);

      await db!
        .insert(sessions)
        .values({
          userId: user.id,
          token,
          expiresAt: sessionExpiresAt,
        });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isGuest: true,
        },
        token,
      };
    }),

  /**
   * Get current user (requires auth)
   */
  me: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return null;
      }
      return {
        id: ctx.user.id,
        email: ctx.user.email,
        name: ctx.user.name,
        role: ctx.user.role,
        isGuest: ctx.user.isGuest,
      };
    }),

  /**
   * Logout (destroy session)
   */
  logout: authedProcedure
    .mutation(async ({ ctx }) => {
      if (!isPostgresAvailable() || !ctx.session) {
        return { success: true };
      }

      await db!.delete(sessions).where(eq(sessions.id, ctx.session.id));

      return { success: true };
    }),
});
