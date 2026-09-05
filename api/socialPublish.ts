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
import { META_GRAPH_VERSION } from "./tokenRefresh";

// Shared Graph API version (v18/v19 deprecated; v20 expires Sept 2026).
// Env-overridable via META_GRAPH_VERSION so bumps need no redeploy.
const GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface PublishTarget {
  accessToken: string;
  /** Instagram Business account id, Facebook Page id, OR LinkedIn person URN (urn:li:person:…) */
  accountId: string;
  platform: "instagram" | "facebook" | "linkedin";
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
  opts: { accountId?: string; platform?: "instagram" | "facebook" | "linkedin" }
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
    if (
      acc?.accessToken &&
      acc.pageId &&
      (acc.platform === "instagram" || acc.platform === "facebook" || acc.platform === "linkedin")
    ) {
      const plainToken = decryptToken(acc.accessToken); // tokens are AES-256-GCM at rest
      if (!plainToken) {
        // Decryption failure (key rotation, corrupted row) — never hand a
        // garbage token to the Meta API. Fall through to env fallback / null.
        console.warn(
          `[resolveTarget] ${acc.platform}/${acc.handle}: decryptToken returned empty — treating account as unavailable`
        );
      } else {
        return {
          accessToken: plainToken,
          accountId: acc.pageId,
          platform: acc.platform as "instagram" | "facebook" | "linkedin",
          handle: acc.handle,
        };
      }
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
  try {
    await assertPublicImageUrl(imageUrl);
  } catch (err) {
    return { success: false, platform: "instagram", error: `Image URL rejected: ${(err as Error).message}` };
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
  if (imageUrl) {
    try {
      await assertPublicImageUrl(imageUrl);
    } catch (err) {
      return { success: false, platform: "facebook", error: `Image URL rejected: ${(err as Error).message}` };
    }
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
 * SSRF guard for server-side image downloads (LinkedIn binary upload).
 * Only plain public https URLs — no localhost, private ranges, link-local,
 * cloud metadata endpoints, or non-http schemes.
 */
function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" || ip.startsWith("127.") ||
    ip === "0.0.0.0" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("169.254.") || // link-local + cloud metadata
    ip === "::1" || ip === "::" ||
    ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd") || // IPv6 ULA
    ip.toLowerCase().startsWith("fe80") // IPv6 link-local
  );
}

interface ResolvedPublicUrl {
  url: URL;
  ip: string;
  family: 4 | 6;
}

/**
 * Validate a public https URL AND resolve its hostname once, returning a
 * pinned IP. Callers that download server-side MUST connect through the
 * pinned IP (downloadPinned) — a bare check followed by a fresh fetch()
 * re-resolves DNS and is bypassable by DNS rebinding (TOCTOU).
 */
async function resolvePublicHttpsUrl(imageUrl: string): Promise<ResolvedPublicUrl> {
  let u: URL;
  try {
    u = new URL(imageUrl);
  } catch {
    throw new Error("Image URL is not a valid URL");
  }
  if (u.protocol !== "https:") {
    throw new Error("Image URL must be https");
  }
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || isPrivateIp(h)) {
    throw new Error("Image URL points at a private/internal address — refused");
  }
  const { lookup } = await import("node:dns/promises");
  const addrs = await lookup(h, { all: true }).catch(() => {
    throw new Error("Image URL hostname does not resolve");
  });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error("Image URL resolves to a private/internal address — refused");
  }
  return { url: u, ip: addrs[0].address, family: addrs[0].family as 4 | 6 };
}

/** Check-only validation (Instagram/Facebook: Meta fetches the URL, we don't). */
async function assertPublicImageUrl(imageUrl: string): Promise<void> {
  await resolvePublicHttpsUrl(imageUrl);
}

/**
 * Download over a connection PINNED to the pre-validated IP (custom DNS
 * lookup) — closes the check/use DNS-rebinding window. No redirects (a
 * redirect target would be unvalidated), hard byte cap, hard timeout.
 */
function downloadPinned(target: ResolvedPublicUrl, timeoutMs: number, maxBytes: number): Promise<Buffer> {
  return new Promise((resolvePromise, rejectPromise) => {
    import("node:https").then((https) => {
      const req = https.request(
        {
          hostname: target.url.hostname, // SNI/Host stay the real hostname
          path: target.url.pathname + target.url.search,
          port: 443,
          method: "GET",
          // TOCTOU defense: dial only the IP we already validated
          lookup: (_hostname, _opts, cb) => cb(null, target.ip, target.family),
          timeout: timeoutMs,
          headers: { "User-Agent": "OmegaSwarm/5.1 (+https://ndeku.com)" },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status >= 300 && status < 400) {
            res.resume();
            rejectPromise(new Error(`redirect refused (HTTP ${status})`));
            return;
          }
          if (status !== 200) {
            res.resume();
            rejectPromise(new Error(`HTTP ${status}`));
            return;
          }
          const declared = Number(res.headers["content-length"] ?? 0);
          if (declared > maxBytes) {
            req.destroy();
            rejectPromise(new Error("image exceeds size limit"));
            return;
          }
          const chunks: Buffer[] = [];
          let total = 0;
          res.on("data", (chunk: Buffer) => {
            total += chunk.length;
            if (total > maxBytes) {
              req.destroy();
              rejectPromise(new Error("image exceeds size limit"));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () => resolvePromise(Buffer.concat(chunks, total)));
          res.on("error", rejectPromise);
        }
      );
      req.on("timeout", () => req.destroy(new Error(`download timed out (${timeoutMs / 1000}s)`)));
      req.on("error", rejectPromise);
      req.end();
    }).catch(rejectPromise);
  });
}

/* ─── LinkedIn ─── */

// LinkedIn monthly API versions are supported for ~1-2 years then sunset.
// 202608 = August 2026 (current). Override via LINKEDIN_API_VERSION in Railway.
const LINKEDIN_VERSION = process.env.LINKEDIN_API_VERSION ?? "202608";

function linkedinHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": LINKEDIN_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
}

/**
 * Resolve the author person URN. Stored in social_accounts.page_id at connect
 * time (derived from OpenID userinfo `sub`). Falls back to a live lookup for
 * rows connected before the derivation existed.
 */
async function linkedinAuthorUrn(target: PublishTarget): Promise<string> {
  if (target.accountId.startsWith("urn:li:person:")) return target.accountId;
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${target.accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.sub) {
    throw new Error(`LinkedIn userinfo failed ${res.status} — reconnect the account with openid + profile + w_member_social scopes`);
  }
  return `urn:li:person:${data.sub}`;
}

/**
 * LinkedIn Posts API. Text-only or single-image post.
 * Image flow: download the public image → initializeUpload → PUT binary →
 * attach the image URN to the post. LinkedIn cannot fetch remote URLs itself.
 */
async function publishLinkedIn(
  target: PublishTarget,
  text: string,
  imageUrl?: string
): Promise<PublishResult> {
  const author = await linkedinAuthorUrn(target);

  let imageUrn: string | undefined;
  if (imageUrl) {
    if (!/^https?:\/\//.test(imageUrl)) {
      return { success: false, platform: "linkedin", error: "LinkedIn image posts need a public image URL (this post's image is not web-hosted)." };
    }
    // 1. Download the image (LinkedIn requires binary upload, not a URL).
    //    DNS resolved once, connection PINNED to the validated IP (no TOCTOU
    //    rebinding window), no redirects, 15s timeout, 10MB cap.
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // LinkedIn image upload limit
    let imgBytes: Buffer;
    try {
      const resolved = await resolvePublicHttpsUrl(imageUrl);
      imgBytes = await downloadPinned(resolved, 15000, MAX_IMAGE_BYTES);
    } catch (err) {
      return { success: false, platform: "linkedin", error: `Could not download image for LinkedIn upload: ${(err as Error).message}` };
    }

    // 2. Register the upload
    const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers: linkedinHeaders(target.accessToken),
      body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
    });
    const initData = await initRes.json().catch(() => ({}));
    const uploadUrl = initData?.value?.uploadUrl;
    imageUrn = initData?.value?.image;
    if (!initRes.ok || !uploadUrl || !imageUrn) {
      return { success: false, platform: "linkedin", error: `LinkedIn image upload init failed ${initRes.status}: ${JSON.stringify(initData).slice(0, 200)}` };
    }

    // 3. PUT the binary to the signed upload URL
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${target.accessToken}`, "Content-Type": "application/octet-stream" },
      body: imgBytes,
    });
    if (!putRes.ok) {
      return { success: false, platform: "linkedin", error: `LinkedIn image binary upload failed ${putRes.status}` };
    }
  }

  const body: Record<string, unknown> = {
    author,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (imageUrn) {
    body.content = { media: { id: imageUrn } };
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: linkedinHeaders(target.accessToken),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { success: false, platform: "linkedin", error: `LinkedIn publish failed ${res.status}: ${sanitizeError(errText.slice(0, 300), target.accessToken)}` };
  }
  // The post URN comes back in the x-restli-id header
  const postId = res.headers.get("x-restli-id") ?? undefined;
  return { success: true, platform: "linkedin", postId };
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
    if (target.platform === "linkedin") {
      return await publishLinkedIn(target, text, imageUrl);
    }
    return await publishFacebook(target, text, imageUrl);
  } catch (err) {
    const msg = sanitizeError((err as Error).message, target.accessToken);
    return { success: false, platform: target.platform, error: msg };
  }
}
