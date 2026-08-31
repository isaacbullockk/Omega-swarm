/**
 * Omega Swarm v5.0 — Social Router (PostgreSQL + Auth)
 *
 * All operations require authentication. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 * Buffer API integration remains unchanged.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, publicProcedure, rateLimitedProcedure } from "../trpc";
import { encryptToken } from "../tokenCrypto";
import { db, isPostgresAvailable } from "../../db/connection";
import { socialAccounts, contentPosts, analyticsEvents } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { resolveTarget, publishPost } from "../socialPublish";

const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

async function bufferApi(
  path: string,
  method = "GET",
  body?: Record<string, unknown>
) {
  const res = await fetch(
    `https://api.bufferapp.com/1/${path}.json`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BUFFER_API_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  return res.json();
}

/* ─── Zod Schemas ─── */

const platformSchema = z.enum(["instagram", "facebook", "youtube", "tiktok", "twitter", "linkedin"]);

const connectSchema = z.object({
  clientId: z.string().uuid().optional(),
  platform: platformSchema,
  accountName: z.string().min(1, "Account name is required"),
  handle: z.string().min(1, "Handle is required"),
  accessToken: z.string().min(1, "Access token is required"),
  pageId: z.string().optional(),
});

export const socialRouter = router({
  /* ─── List social accounts for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.userId, ctx.user.id))
        .orderBy(socialAccounts.createdAt);
    } catch (err) {
      console.error("[Social] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Connect/link a social account ─── */
  connect: authedProcedure
    .input(connectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }
      try {
        // Check if account already exists for this user
        const existing = await db!
          .select()
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.userId, ctx.user.id),
              eq(socialAccounts.handle, input.handle),
              eq(socialAccounts.platform, input.platform)
            )
          )
          .limit(1);

        if (existing[0]) {
          // Update existing account
          const result = await db!
            .update(socialAccounts)
            .set({
              connected: true,
              accessToken: encryptToken(input.accessToken), // AES-256-GCM at rest
              pageId: input.pageId ?? null,
              connectedAt: new Date(),
            })
            .where(eq(socialAccounts.id, existing[0].id))
            .returning();
          return result[0];
        }

        // Create new account
        const result = await db!
          .insert(socialAccounts)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            platform: input.platform,
            accountName: input.accountName,
            handle: input.handle,
            connected: true,
            accessToken: encryptToken(input.accessToken), // AES-256-GCM at rest
            pageId: input.pageId ?? null,
            connectedAt: new Date(),
          })
          .returning();
        return result[0];
      } catch (err) {
        console.error("[Social] Connect error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect social account",
        });
      }
    }),

  /* ─── Disconnect a social account (user-scoped) ─── */
  disconnect: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .update(socialAccounts)
          .set({ connected: false, accessToken: null, pageId: null })
          .where(and(eq(socialAccounts.id, input.id), eq(socialAccounts.userId, ctx.user.id)))
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Social account not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Social] Disconnect error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disconnect social account",
        });
      }
    }),

  /* ─── Get connection status for a platform (user-scoped) ─── */
  status: authedProcedure
    .input(z.object({ platform: platformSchema }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        return {
          platform: input.platform,
          total: 0,
          connected: 0,
          accounts: [],
          envConnected: { instagram: false, buffer: false },
        };
      }
      try {
        const accounts = await db!
          .select()
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.userId, ctx.user.id),
              eq(socialAccounts.platform, input.platform)
            )
          );

        const hasInstagramEnv = !!(
          process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_ACCOUNT_ID
        );
        const hasBufferEnv = !!BUFFER_API_KEY;

        return {
          platform: input.platform,
          total: accounts.length,
          connected: accounts.filter((a) => a.connected).length,
          accounts,
          envConnected: {
            instagram: hasInstagramEnv,
            buffer: hasBufferEnv,
          },
        };
      } catch (err) {
        console.error("[Social] Status error:", (err as Error).message);
        return {
          platform: input.platform,
          total: 0,
          connected: 0,
          accounts: [],
          envConnected: { instagram: false, buffer: false },
        };
      }
    }),

  /* ─── Publish directly via Meta Graph API (connected account or env) ─── */
  publish: rateLimitedProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        platform: z.enum(["instagram", "facebook"]).optional(),
        clientId: z.string().uuid().optional(),
        text: z.string().min(1).max(2200),
        imageUrl: z.string().url().optional(),
        title: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const target = await resolveTarget(ctx.user.id, {
        accountId: input.accountId,
        platform: input.platform,
      });
      if (!target) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "No connected Instagram/Facebook account found. Connect one first (social.connect) or set INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_ACCOUNT_ID in Railway.",
        });
      }

      const result = await publishPost(target, input.text, input.imageUrl);

      // Persist the post row regardless of outcome (audit trail)
      let postId: string | null = null;
      if (isPostgresAvailable() && db) {
        try {
          const inserted = await db
            .insert(contentPosts)
            .values({
              userId: ctx.user.id,
              clientId: input.clientId ?? null,
              title: input.title ?? input.text.slice(0, 80),
              caption: input.text,
              type: "social",
              status: result.success ? "published" : "draft",
              date: new Date(),
              imageUrl: input.imageUrl ?? null,
              instagramPostId: result.platform === "instagram" ? result.postId ?? null : null,
              likes: 0,
              comments: 0,
              views: 0,
              referenceAssets: [],
            })
            .returning();
          postId = inserted[0]?.id ?? null;

          await db.insert(analyticsEvents).values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            type: result.success ? "instagram_published" : "post_created",
            title: result.success ? `Published to ${result.platform}` : `Publish failed on ${result.platform}`,
            description: result.success
              ? `Post published to ${target.handle} (${result.postId})`
              : result.error ?? "unknown error",
            agentColor: result.success ? "#EC4899" : "#EF4444",
            agentName: "Pulse",
          });
        } catch (err) {
          console.error("[Social] Publish persist error:", (err as Error).message);
        }
      }

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error ?? "Publish failed",
        });
      }

      return {
        success: true,
        platform: result.platform,
        postId: result.postId,
        contentPostId: postId,
        handle: target.handle,
      };
    }),

  /* ─── Buffer: Get connected profiles (public, no user data) ─── */
  bufferProfiles: publicProcedure.query(async () => {
    if (!BUFFER_API_KEY) return { error: "No Buffer API key", profiles: [] };
    try {
      const data = await bufferApi("profiles/profiles");
      return { profiles: data || [] };
    } catch (e) {
      return { error: "Buffer API failed", profiles: [] };
    }
  }),

  /* ─── Buffer: Create and publish a post (authed) ─── */
  post: authedProcedure
    .input(
      z.object({
        text: z.string().min(1, "Post text is required"),
        profileIds: z.array(z.string().min(1)).min(1, "At least one profile is required"),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!BUFFER_API_KEY) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "BUFFER_API_KEY not configured. Add it to Railway environment variables.",
        });
      }

      const body: Record<string, unknown> = {
        text: input.text,
        profile_ids: input.profileIds,
      };

      if (input.scheduledAt) {
        body.scheduled_at = input.scheduledAt;
      }

      try {
        const data = await bufferApi("updates/updates/create", "POST", body);

        if (data && data.success) {
          return {
            success: true,
            postId: data.id,
            text: input.text,
            status: input.scheduledAt ? "scheduled" : "sent",
            url: `https://buffer.com/app/${data.id}`,
          };
        }

        return {
          success: data && (data.id || data.success),
          postId: data?.id,
          text: input.text,
          status: input.scheduledAt ? "scheduled" : data?.id ? "sent" : "failed",
          bufferResponse: data,
        };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Buffer post failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        });
      }
    }),
});
