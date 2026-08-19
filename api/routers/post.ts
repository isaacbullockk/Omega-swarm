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
import { db, isPostgresAvailable } from "../../db/connection";
import { contentPosts, analyticsEvents } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const META_APP_ID = process.env.META_APP_ID;

/** Mask sensitive token in logs and error messages */
function maskToken(token: string): string {
  if (token.length <= 8) return "***";
  return token.slice(0, 4) + "..." + token.slice(-4);
}

async function postToInstagram(
  caption: string,
  imageUrl: string
): Promise<{
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return {
      success: false,
      error: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID not set",
    };
  }

  const apiBase = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}`;

  try {
    // Create media container — token sent in POST body (not URL query)
    const createBody = new URLSearchParams();
    createBody.append("caption", caption);
    createBody.append("image_url", imageUrl);
    createBody.append("access_token", INSTAGRAM_ACCESS_TOKEN);

    const createRes = await fetch(`${apiBase}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createBody.toString(),
    });
    const createData = await createRes.json();

    if (createData.error) {
      return {
        success: false,
        error: `Instagram create failed: ${createData.error.message}`,
      };
    }

    const creationId = createData.id;
    if (!creationId) {
      return {
        success: false,
        error: "No creation ID returned from Instagram",
      };
    }

    // Publish media — token sent in POST body
    const publishBody = new URLSearchParams();
    publishBody.append("creation_id", creationId);
    publishBody.append("access_token", INSTAGRAM_ACCESS_TOKEN);

    const publishRes = await fetch(`${apiBase}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: publishBody.toString(),
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      return {
        success: false,
        error: `Instagram publish failed: ${publishData.error.message}`,
      };
    }

    return {
      success: true,
      postId: publishData.id,
      permalink: `https://instagram.com/p/${publishData.id}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    // Ensure token is not leaked in error messages
    const safeMsg = msg.replace(INSTAGRAM_ACCESS_TOKEN, maskToken(INSTAGRAM_ACCESS_TOKEN));
    return {
      success: false,
      error: `Instagram API error: ${safeMsg}`,
    };
  }
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
    const safeMsg = msg.replace(INSTAGRAM_ACCESS_TOKEN, maskToken(INSTAGRAM_ACCESS_TOKEN));
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
  instagramStatus: authedProcedure.query(async () => {
    return getInstagramAccount();
  }),

  /* ─── Exchange short-lived token for long-lived token ─── */
  exchangeToken: authedProcedure
    .input(z.object({ shortToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const appId = META_APP_ID;
      if (!appId) {
        return {
          error: "META_APP_ID not set in environment variables. Add it to exchange tokens.",
        };
      }
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        return {
          error: "META_APP_SECRET not set in Railway. Add it to exchange tokens.",
        };
      }
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${input.shortToken}`
        );
        const data = await res.json();
        if (data.error) {
          return { error: data.error.message };
        }
        return {
          longToken: data.access_token,
          expiresIn: data.expires_in,
          note: "Paste this longToken into Railway INSTAGRAM_ACCESS_TOKEN variable",
        };
      } catch (e) {
        return {
          error: `Exchange failed: ${e instanceof Error ? e.message : "Unknown"}`,
        };
      }
    }),

  /* ─── Create and publish a post (rate limited) ─── */
  create: rateLimitedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
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

        // 1. Generate caption with AI
        let caption: string;
        try {
          caption = await generateCaption(input.topic + refContext, input.brandVoice);
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
            console.log("DALL-E image failed:", e);
          }
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

        // 5. Post to Instagram in background
        if (INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID && imageUrl) {
          postToInstagram(caption, imageUrl)
            .then(async (result) => {
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
              }
            })
            .catch((err) => console.log("Instagram post failed:", err));
        }

        return post;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Post] Create error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
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
