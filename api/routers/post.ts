/**
 * Omega Swarm v5.0 — Post Router (PostgreSQL + Auth)
 *
 * AI generation endpoints use rateLimitedProcedure (10 req/min).
 * List/delete operations use authedProcedure. Data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { generateCaption, generateImage } from "../openai";
import { getMemoryContext } from "../memoryContext";
import { db, isPostgresAvailable } from "../../db/connection";
import { contentPosts, analyticsEvents, socialAccounts } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { resolveTarget, publishPost } from "../socialPublish";
import { encryptToken, decryptToken } from "../tokenCrypto";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_APP_ID = process.env.META_APP_ID;

/** Mask sensitive token in logs and error messages */
function maskToken(token: string): string {
  if (token.length <= 8) return "***";
  return token.slice(0, 4) + "..." + token.slice(-4);
}

async function getInstagramAccount() {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return { connected: false, error: "Token or Account ID not set" };
  }

  try {
    // Use Authorization header for GET instead of query param
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=username,media_count`,
      {
        headers: {
          Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
        },
      }
    );
    const data = await res.json();

    if (data.error) {
      return { connected: false, error: data.error.message };
    }

    return {
      connected: true,
      username: data.username,
      accountId: INSTAGRAM_ACCOUNT_ID,
      mediaCount: data.media_count,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    // replaceAll: the token can appear more than once in an error payload
    const safeMsg = msg.replaceAll(INSTAGRAM_ACCESS_TOKEN, maskToken(INSTAGRAM_ACCESS_TOKEN));
    return {
      connected: false,
      error: `API error: ${safeMsg}`,
    };
  }
}

/* ─── Zod Schemas ─── */

const referenceAssetSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().optional(),
  dataUrl: z.string().optional(),
  description: z.string().optional(),
});

const createPostSchema = z.object({
  clientId: z.string().uuid().optional(),
  topic: z.string().min(1, "Topic is required"),
  brandVoice: z.string().optional(),
  imageProvider: z.enum(["pollinations", "openai"]).optional().default("pollinations"),
  referenceAssets: z.array(referenceAssetSchema).optional().default([]),
});

export const postRouter = router({
  /* ─── Check Instagram connection status ─── */
  instagramStatus: authedProcedure.query(async ({ ctx }) => {
    // Per-user connected account first (social_accounts), env fallback after
    if (isPostgresAvailable() && db) {
      try {
        const rows = await db
          .select()
          .from(socialAccounts)
          .where(
            and(
              eq(socialAccounts.userId, ctx.user.id),
              eq(socialAccounts.platform, "instagram"),
              eq(socialAccounts.connected, true)
            )
          )
          .limit(1);
        const acc = rows[0];
        if (acc?.accessToken && acc.pageId) {
          const plainToken = decryptToken(acc.accessToken); // AES-256-GCM at rest
          const res = await fetch(
            `https://graph.facebook.com/v18.0/${acc.pageId}?fields=username,media_count`,
            { headers: { Authorization: `Bearer ${plainToken}` } }
          );
          const data = await res.json();
          if (!data.error) {
            return {
              connected: true,
              username: data.username ?? acc.handle,
              accountId: acc.pageId,
              mediaCount: data.media_count,
            };
          }
        }
      } catch (err) {
        console.warn("[Post] instagramStatus social_accounts lookup failed:", (err as Error).message);
      }
    }
    return getInstagramAccount();
  }),

  /* ─── Exchange short-lived token for long-lived token ─── */
  exchangeToken: authedProcedure
    .input(z.object({ shortToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const appId = META_APP_ID;
      if (!appId) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "META_APP_ID not set in environment variables. Add it to exchange tokens." });
      }
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "META_APP_SECRET not set in Railway. Add it to exchange tokens." });
      }
      try {
        // URLSearchParams — token/secret may contain characters that break a
        // template-literal URL (would cause runtime exchange failures)
        const exchangeUrl =
          "https://graph.facebook.com/v18.0/oauth/access_token?" +
          new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: input.shortToken,
          }).toString();
        const res = await fetch(exchangeUrl);
        const data = await res.json();
        if (data.error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Facebook token exchange failed: ${data.error.message}` });
        }

        // Never return the raw long-lived token in a response body (token leak
        // via logs/proxies). Store it ENCRYPTED server-side on the user's own
        // connected social account.
        const longToken: string = data.access_token;
        if (!isPostgresAvailable() || !db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available — token not stored." });
        }

        // Derive the REAL Instagram Business account for THIS token — not an
        // env var, which would bind every user to the same account.
        // Flow: /me/accounts (Facebook Pages) -> page's instagram_business_account.
        let pageId: string | null = null;
        let handle = "instagram";
        try {
          const pagesRes = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username}`,
            { headers: { Authorization: `Bearer ${longToken}` } }
          );
          const pagesData = await pagesRes.json();
          const page = (pagesData.data ?? []).find(
            (p: { instagram_business_account?: { id: string } }) => p.instagram_business_account?.id
          );
          if (page) {
            pageId = page.instagram_business_account.id;
            handle = page.instagram_business_account.username ?? page.name ?? handle;
          }
        } catch {
          // non-fatal — env fallback below
        }
        // Env fallback (single-brand deployments) — only if derivation failed
        if (!pageId && INSTAGRAM_ACCOUNT_ID) {
          pageId = INSTAGRAM_ACCOUNT_ID;
          try {
            const me = await fetch(
              `https://graph.facebook.com/v18.0/${pageId}?fields=username`,
              { headers: { Authorization: `Bearer ${longToken}` } }
            );
            const meData = await me.json();
            if (meData.username) handle = meData.username;
          } catch {
            // keep default handle
          }
        }
        if (!pageId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Could not derive an Instagram Business account from this token. Make sure the token has pages_show_list + instagram_basic permissions and your IG is a Business/Creator account linked to a Facebook Page.",
          });
        }

        const tokenExpiresAt =
          typeof data.expires_in === "number" ? new Date(Date.now() + data.expires_in * 1000) : null;
        const encryptedToken = encryptToken(longToken);

        const existing = await db
          .select()
          .from(socialAccounts)
          .where(and(eq(socialAccounts.userId, ctx.user.id), eq(socialAccounts.platform, "instagram")))
          .limit(1);

        if (existing[0]) {
          await db
            .update(socialAccounts)
            .set({
              accessToken: encryptedToken,
              pageId,
              handle,
              accountName: handle,
              connected: true,
              connectedAt: new Date(),
              tokenExpiresAt,
            })
            .where(and(eq(socialAccounts.id, existing[0].id), eq(socialAccounts.userId, ctx.user.id)));
        } else {
          await db.insert(socialAccounts).values({
            userId: ctx.user.id,
            platform: "instagram",
            accountName: handle,
            handle,
            connected: true,
            accessToken: encryptedToken,
            pageId,
            connectedAt: new Date(),
            tokenExpiresAt,
          });
        }

        return {
          connected: true,
          handle,
          expiresIn: data.expires_in,
          note: "Token exchanged and stored securely on your connected Instagram account — nothing to paste anywhere.",
        };
      } catch (e) {
        if (e instanceof TRPCError) throw e;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Exchange failed: ${e instanceof Error ? e.message : "Unknown"}`,
        });
      }
    }),

  /* ─── Create and publish a post (rate limited) ─── */
  create: rateLimitedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Build reference context from uploaded assets
        const refContext =
          input.referenceAssets.length > 0
            ? "\n\nReference materials to incorporate:\n" +
              input.referenceAssets
                .map(
                  (a, i) =>
                    `  [Ref ${i + 1}] ${a.name}${a.description ? `: ${a.description}` : ""}`
                )
                .join("\n")
            : "";

        // 1. Generate caption with AI — taught by the user's Memory Bank
        let caption: string;
        try {
          const memoryContext = await getMemoryContext(ctx.user.id);
          caption = await generateCaption(input.topic + refContext, input.brandVoice, memoryContext);
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `AI caption failed: ${e instanceof Error ? e.message : "Unknown"}`,
          });
        }

        // 2. Build image URL immediately
        let imageUrl: string | null = null;
        const imagePromptBase =
          input.referenceAssets.length > 0
            ? `Instagram post inspired by references: ${input.topic}. Professional marketing visual. Reference style: ${input.referenceAssets[0]?.description || input.referenceAssets[0]?.name || ""}.`
            : `Instagram post: ${input.topic}. Professional marketing visual.`;

        if (input.imageProvider === "openai") {
          try {
            imageUrl = await generateImage(imagePromptBase, "openai");
          } catch (e) {
            console.log("Premium image failed:", e);
          }
        }
        // Instagram's Graph API fetches media over HTTP — a data: URL is
        // unpublishable. Premium providers (OpenRouter images) return base64
        // data URLs, so for posts we fall back to a public Pollinations URL.
        if (imageUrl && imageUrl.startsWith("data:")) {
          console.log("[post.create] Premium image returned a data URL — using public Pollinations URL for publishability");
          imageUrl = null;
        }
        if (!imageUrl) {
          const encoded = encodeURIComponent(imagePromptBase);
          imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
        }

        // 3. Create and persist post
        const result = await db!
          .insert(contentPosts)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title: input.topic,
            caption,
            type: "social",
            status: "published",
            date: new Date(),
            imageUrl,
            instagramPostId: null,
            likes: 0,
            comments: 0,
            views: 0,
            referenceAssets: input.referenceAssets,
          })
          .returning();

        const post = result[0];

        // 4. Log analytics event
        await db!
          .insert(analyticsEvents)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            type: "post_created",
            title: "New post created",
            description: `Created "${input.topic}" with AI caption`,
            agentColor: "#F59E0B",
            agentName: "Pulse",
          });

        // 5. Publish to social via the publishing layer (safety-gated).
        //    Uses connected account tokens, falls back to env Instagram vars.
        let publish: { success: boolean; platform?: string; postId?: string; error?: string } | null = null;
        if (imageUrl) {
          try {
            const target = await resolveTarget(ctx.user.id, { platform: "instagram" });
            if (target) {
              const result = await publishPost(target, caption, imageUrl);
              publish = result;
              if (result.success && result.postId) {
                await db!
                  .update(contentPosts)
                  .set({ instagramPostId: result.postId })
                  .where(eq(contentPosts.id, post.id));

                await db!
                  .insert(analyticsEvents)
                  .values({
                    userId: ctx.user.id,
                    clientId: input.clientId ?? null,
                    type: "instagram_published",
                    title: "Posted to Instagram",
                    description: `Post "${input.topic}" published to Instagram`,
                    agentColor: "#EC4899",
                    agentName: "Pulse",
                  });
              } else {
                console.log("[Post] Publish failed:", result.error);
              }
            }
          } catch (err) {
            console.log("[Post] Publish error:", (err as Error).message);
          }
        }

        return { ...post, publish };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const msg = (err as Error).message;
        console.error("[Post] Create error:", msg);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create post: ${msg}`,
        });
      }
    }),

  /* ─── Generate a content calendar: many scheduled drafts in one call ───
     Each item becomes a real AI-written post (Memory Bank context included)
     stored as status "scheduled" with `date` = planned publish moment.
     Nothing auto-publishes — the user reviews and publishes each post. */
  generateCalendar: rateLimitedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
              topic: z.string().min(1).max(500),
              brandVoice: z.string().max(255).optional(),
              withImage: z.boolean().default(true),
            })
          )
          .min(1)
          .max(14),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const memoryContext = await getMemoryContext(ctx.user.id);

      const created: Array<{ id: string; date: string; ok: boolean; error?: string }> = [];
      for (const item of input.items) {
        try {
          const caption = await generateCaption(item.topic, item.brandVoice, memoryContext);
          // Public Pollinations URL so a later IG publish can actually fetch it
          const imageUrl = item.withImage
            ? `https://image.pollinations.ai/prompt/${encodeURIComponent(
                `Instagram post: ${item.topic}. Professional marketing visual.`
              )}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`
            : null;
          const [row] = await db!
            .insert(contentPosts)
            .values({
              userId: ctx.user.id,
              clientId: null,
              title: item.topic.slice(0, 255),
              caption,
              type: "social",
              status: "scheduled",
              date: new Date(item.date),
              imageUrl,
              instagramPostId: null,
              likes: 0,
              comments: 0,
              views: 0,
              referenceAssets: [],
            })
            .returning({ id: contentPosts.id });
          created.push({ id: row.id, date: item.date, ok: true });
        } catch (err) {
          // One bad item must not kill the whole calendar
          console.error("[Calendar] Item failed:", item.topic, (err as Error).message);
          created.push({ id: "", date: item.date, ok: false, error: (err as Error).message });
        }
      }

      await db!.insert(analyticsEvents).values({
        userId: ctx.user.id,
        clientId: null,
        type: "ai_generation",
        title: "Content calendar generated",
        description: `${created.filter((c) => c.ok).length}/${input.items.length} scheduled posts created from content plan`,
        agentColor: "#A855F7",
        agentName: "Planner",
      });

      return { created, total: input.items.length, succeeded: created.filter((c) => c.ok).length };
    }),

  /* ─── List all posts for the authenticated user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(contentPosts)
        .where(eq(contentPosts.userId, ctx.user.id))
        .orderBy(contentPosts.date);
    } catch (err) {
      console.error("[Post] List error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Delete a post (user-scoped) ─── */
  delete: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) return { success: false };
      try {
        const result = await db!
          .delete(contentPosts)
          .where(
            and(eq(contentPosts.id, input.id), eq(contentPosts.userId, ctx.user.id))
          )
          .returning();
        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        return { success: true };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Post] Delete error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete post",
        });
      }
    }),
});
