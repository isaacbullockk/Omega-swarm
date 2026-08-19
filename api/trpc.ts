/**
 * Omega Swarm v5.0 — tRPC Setup with Authentication
 *
 * Replaces public-only API with authenticated middleware.
 * - publicProcedure: no auth required (login, register, health)
 * - authedProcedure: requires valid session (all data routes)
 * - rateLimitedProcedure: authed + rate limiting (AI generation)
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware: validate session from cookie/token
 * Injects `user` and `session` into context
 */
export const authedMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

export const authedProcedure = t.procedure.use(authedMiddleware);

/**
 * Middleware: rate limiting for AI generation endpoints
 * 10 requests per minute per user
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimitMiddleware = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  const key = `${ctx.user.id}:${path}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)}s`,
      });
    }
    entry.count++;
  }

  return next({ ctx });
});

export const rateLimitedProcedure = authedProcedure.use(rateLimitMiddleware);

/**
 * Middleware: admin-only access
 */
export const adminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminProcedure = authedProcedure.use(adminMiddleware);

/* ─── Merge Routers ─── */
export const createRouter = router;
export const mergeRouters = t.mergeRouters;
