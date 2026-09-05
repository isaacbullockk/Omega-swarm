/**
 * Omega Swarm v5.1 — Automatic Meta Token Refresh
 *
 * Long-lived Meta tokens live exactly 60 days. Meta lets you exchange a
 * still-valid long-lived token for a fresh 60-day one at any time — so we
 * renew proactively, before expiry, and the user never touches the Meta
 * console again after the first connect.
 *
 * Runs on a daily interval from server.ts. Candidates:
 *   - social_accounts rows for instagram/facebook, connected, with a token
 *   - tokenExpiresAt within REFRESH_WINDOW_DAYS, or NULL (legacy rows get a
 *     real expiry stamped on their first successful refresh)
 *
 * Requirements: META_APP_ID + META_APP_SECRET in the environment. If either
 * is missing the job no-ops (env-var token path can't be refreshed — only
 * Meta can rotate those, or the user re-pastes in Railway).
 *
 * Failure policy: NEVER disconnect or blank a token on a failed refresh —
 * a network blip must not break publishing. We log and retry tomorrow.
 * Only Meta's own "token invalid/expired" errors (code 190) mark the
 * account disconnected so the UI tells the user to reconnect.
 */

import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, isPostgresAvailable } from "../db/connection";
import { socialAccounts } from "../db/schema";
import { decryptToken, encryptToken } from "./tokenCrypto";

const REFRESH_WINDOW_DAYS = 14; // renew when <14 days remain
const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily
const INITIAL_DELAY_MS = 15 * 1000; // after migrations on boot
const META_GRAPH = "https://graph.facebook.com/v18.0";

let running = false; // in-process reentrancy guard (daily tick vs slow run)

type RefreshResult = { checked: number; refreshed: number; failed: number; disconnected: number };

async function refreshOne(row: {
  id: string;
  userId: string;
  platform: string;
  handle: string;
  accessToken: string | null;
  tokenExpiresAt: Date | null;
}): Promise<"refreshed" | "failed" | "disconnected"> {
  if (!row.accessToken) {
    console.error(`[TokenRefresh] ${row.platform}/${row.handle}: accessToken null despite query filter — treating as failed`);
    return "failed";
  }

  const plain = decryptToken(row.accessToken);
  if (!plain) {
    console.error(`[TokenRefresh] ${row.platform}/${row.handle}: decrypt failed — treating as failed`);
    return "failed";
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.error(`[TokenRefresh] ${row.platform}/${row.handle}: META_APP_ID/SECRET missing mid-run — treating as failed`);
    return "failed";
  }

  // Snapshot db once: connection could drop between the caller's availability
  // check and the writes below — never crash the daily loop on that race.
  const database = db;
  if (!database) {
    console.error(`[TokenRefresh] ${row.platform}/${row.handle}: db connection lost — treating as failed`);
    return "failed";
  }

  try {
    // URLSearchParams — token/secret may contain URL-breaking characters
    const url =
      `${META_GRAPH}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: plain,
      }).toString();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();

    if (data.error) {
      const code = data.error.code;
      if (code === 190) {
        // Token already invalid/expired — refresh impossible. Flag for re-auth.
        await database
          .update(socialAccounts)
          .set({ connected: false })
          .where(and(eq(socialAccounts.id, row.id), eq(socialAccounts.userId, row.userId)));
        console.warn(`[TokenRefresh] ${row.platform}/${row.handle}: token invalid (190) — marked disconnected, user must reconnect`);
        return "disconnected";
      }
      console.warn(`[TokenRefresh] ${row.platform}/${row.handle}: Meta error ${code}: ${data.error.message} — retry tomorrow`);
      return "failed";
    }

    if (!data.access_token) {
      console.warn(`[TokenRefresh] ${row.platform}/${row.handle}: exchange returned no token — retry tomorrow`);
      return "failed";
    }

    const expiresAt =
      typeof data.expires_in === "number" ? new Date(Date.now() + data.expires_in * 1000) : null;

    await database
      .update(socialAccounts)
      .set({
        accessToken: encryptToken(data.access_token),
        tokenExpiresAt: expiresAt,
        connected: true,
      })
      .where(and(eq(socialAccounts.id, row.id), eq(socialAccounts.userId, row.userId)));

    console.log(
      `[TokenRefresh] ${row.platform}/${row.handle}: refreshed, expires ${expiresAt?.toISOString() ?? "unknown"}`
    );
    return "refreshed";
  } catch (err) {
    console.warn(
      `[TokenRefresh] ${row.platform}/${row.handle}: ${err instanceof Error ? err.message : "error"} — retry tomorrow`
    );
    return "failed";
  }
}

export async function refreshExpiringTokens(): Promise<RefreshResult> {
  const result: RefreshResult = { checked: 0, refreshed: 0, failed: 0, disconnected: 0 };
  if (!isPostgresAvailable() || !db) return result;
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) return result; // no-op without app creds

  const windowEnd = new Date(Date.now() + REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: socialAccounts.id,
      userId: socialAccounts.userId,
      platform: socialAccounts.platform,
      handle: socialAccounts.handle,
      accessToken: socialAccounts.accessToken,
      tokenExpiresAt: socialAccounts.tokenExpiresAt,
    })
    .from(socialAccounts)
    .where(
      and(
        inArray(socialAccounts.platform, ["instagram", "facebook"]),
        eq(socialAccounts.connected, true),
        isNotNull(socialAccounts.accessToken)
      )
    );

  // Filter in JS: refresh window OR unknown expiry (legacy rows)
  const candidates = rows.filter(
    (r) => !r.tokenExpiresAt || r.tokenExpiresAt.getTime() <= windowEnd.getTime()
  );
  result.checked = candidates.length;

  for (const row of candidates) {
    const r = await refreshOne(row);
    if (r === "refreshed") result.refreshed++;
    else if (r === "failed") result.failed++;
    else if (r === "disconnected") result.disconnected++;
  }
  return result;
}

/** Wire the daily refresh loop. Call once from server bootstrap. */
export function startTokenRefreshLoop(): void {
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await refreshExpiringTokens();
      if (r.checked > 0) {
        console.log(
          `[TokenRefresh] checked=${r.checked} refreshed=${r.refreshed} failed=${r.failed} disconnected=${r.disconnected}`
        );
      }
    } catch (err) {
      console.error("[TokenRefresh] Tick failed:", (err as Error).message);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, INITIAL_DELAY_MS);
  setInterval(tick, RUN_INTERVAL_MS);
}
