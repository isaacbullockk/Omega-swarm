/**
 * Omega Swarm v5.1 — Social Publishing Layer
 *
 * Direct Meta Graph API publishing (Instagram Business + Facebook Pages)
 * using per-account tokens stored in social_accounts, with env-var fallback.
 * Every post passes the Nemotron content-safety gate before publishing.
 */

import { db, isPostgresAvailable } from "../db/connection";
import { socialAccounts } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { checkContentSafety } from "./openrouter";
import { decryptToken } from "./tokenCrypto";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface PublishTarget {
  accessToken: string;
  /** Instagram Business account id OR Facebook Page id */
  accountId: string;
  platform: "instagram" | "facebook";
  handle: string;
}

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  permalink?: string;
  safetyReason?: string;
  error?: string;
}

/** Mask a token for safe logging */
function maskToken(token: string): string {
  return token.length <= 8 ? "***" : token.slice(0, 4) + "..." + token.slice(-4);
}

function sanitizeError(msg: string, token: string): string {
  return msg.split(token).join(maskToken(token));
}

/**
 * Resolve the publish target for a user: a connected account from
 * social_accounts (by id or by platform), falling back to env vars
 * for Instagram.
 */
export async function resolveTarget(
  userId: string,
  opts: { accountId?: string; platform?: "instagram" | "facebook" }
): Promise<PublishTarget | null> {
  if (isPostgresAvailable() && db) {
    const conditions = [eq(socialAccounts.userId, userId), eq(socialAccounts.connected, true)];
    if (opts.accountId) conditions.push(eq(socialAccounts.id, opts.accountId));
    if (opts.platform) conditions.push(eq(socialAccounts.platform, opts.platform));

    const rows = await db!
      .select()
      .from(socialAccounts)
      .where(and(...conditions))
      .limit(1);

    const acc = rows[0];
    if (acc?.accessToken && acc.pageId && (acc.platform === "instagram" || acc.platform === "facebook")) {
      return {
        accessToken: decryptToken(acc.accessToken), // tokens are AES-256-GCM at rest
        accountId: acc.pageId,
        platform: acc.platform as "instagram" | "facebook",
        handle: acc.handle,
      };
    }
  }

  // Env fallback (Instagram only)
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const envAccount = process.env.INSTAGRAM_ACCOUNT_ID;
  if ((!opts.platform || opts.platform === "instagram") && !opts.accountId && envToken && envAccount) {
    return { accessToken: envToken, accountId: envAccount, platform: "instagram", handle: "env" };
  }

  return null;
}

/** Instagram: two-step container → publish. Requires a PUBLIC image URL. */
async function publishInstagram(
  target: PublishTarget,
  caption: string,
  imageUrl: string
): Promise<PublishResult> {
  // The Graph API downloads the image itself — it must be a public http(s) URL.
  // Fail fast with a clear message instead of an opaque Graph error.
  if (!/^https?:\/\//.test(imageUrl)) {
    return { success: false, platform: "instagram", error: "Instagram publishing requires a public image URL (this post's image is not web-hosted). Regenerate the post or use a hosted image." };
  }
  const base = `${GRAPH_BASE}/${target.accountId}`;

  // Step 1: create media container (token in POST body, never in URL)
  const createBody = new URLSearchParams();
  createBody.append("caption", caption);
  createBody.append("image_url", imageUrl);
  createBody.append("access_token", target.accessToken);

  const createRes = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createBody.toString(),
  });
  const createData = await createRes.json();
  if (createData.error) {
    return { success: false, platform: "instagram", error: `IG container: ${sanitizeError(createData.error.message, target.accessToken)}` };
  }
  if (!createData.id) {
    return { success: false, platform: "instagram", error: "IG returned no creation id" };
  }

  // Step 2: publish
  const pubBody = new URLSearchParams();
  pubBody.append("creation_id", createData.id);
  pubBody.append("access_token", target.accessToken);

  const pubRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pubBody.toString(),
  });
  const pubData = await pubRes.json();
  if (pubData.error) {
    return { success: false, platform: "instagram", error: `IG publish: ${sanitizeError(pubData.error.message, target.accessToken)}` };
  }

  return { success: true, platform: "instagram", postId: pubData.id };
}

/** Facebook Page: photo post if imageUrl, text post otherwise. */
async function publishFacebook(
  target: PublishTarget,
  text: string,
  imageUrl?: string
): Promise<PublishResult> {
  if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
    return { success: false, platform: "facebook", error: "Facebook photo publishing requires a public image URL (this post's image is not web-hosted). Regenerate the post or use a hosted image." };
  }
  const endpoint = imageUrl ? `${GRAPH_BASE}/${target.accountId}/photos` : `${GRAPH_BASE}/${target.accountId}/feed`;

  const body = new URLSearchParams();
  if (imageUrl) {
    body.append("url", imageUrl);
    body.append("caption", text);
  } else {
    body.append("message", text);
  }
  body.append("access_token", target.accessToken);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) {
    return { success: false, platform: "facebook", error: `FB publish: ${sanitizeError(data.error.message, target.accessToken)}` };
  }

  const postId = data.post_id || data.id;
  return { success: true, platform: "facebook", postId };
}

/**
 * Full publish flow: safety gate → platform publish.
 * Instagram requires imageUrl (Graph API limitation).
 */
export async function publishPost(
  target: PublishTarget,
  text: string,
  imageUrl?: string
): Promise<PublishResult> {
  // 1. Content safety gate (Nemotron content-safety model)
  const safety = await checkContentSafety(text);
  if (!safety.safe) {
    return {
      success: false,
      platform: target.platform,
      error: `Content blocked by safety gate: ${safety.reason}`,
      safetyReason: safety.reason,
    };
  }

  // 2. Platform publish
  try {
    if (target.platform === "instagram") {
      if (!imageUrl) {
        return { success: false, platform: "instagram", error: "Instagram requires an image URL" };
      }
      if (imageUrl.startsWith("data:")) {
        return { success: false, platform: "instagram", error: "Instagram requires a public image URL (data URLs not supported)" };
      }
      return await publishInstagram(target, text, imageUrl);
    }
    return await publishFacebook(target, text, imageUrl);
  } catch (err) {
    const msg = sanitizeError((err as Error).message, target.accessToken);
    return { success: false, platform: target.platform, error: msg };
  }
}
