import { serve } from "@hono/node-server";
import app from "./api";

const PORT = 3000; // Domain target port — do not use env here

console.log("[SERVER] Starting Omega Swarm v5.1.0...");
console.log("[SERVER] PORT:", PORT);
console.log("[SERVER] NODE_ENV:", process.env.NODE_ENV || "development");

// Start server IMMEDIATELY so healthcheck passes
const server = serve(
  { fetch: app.fetch, port: PORT },
  () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[SERVER] Health: http://localhost:${PORT}/api/health`);
  }
);

// Run DB migrations in background (non-blocking)
(async () => {
  try {
    const { runMigrations } = await import("./db/migrate");
    await runMigrations();
  } catch (err) {
    console.error("[MIGRATE] Failed:", (err as Error).message);
  }

  // GDPR guest purge
  try {
    const { pool } = await import("./db/connection");
    if (pool) {
      const purge = async () => {
        try {
          const client = await pool.connect();
          try {
            const tables = [
              "credit_transactions", "credits", "sessions", "analytics_events",
              "memories", "bookings", "social_accounts", "brand_voices",
              "generated_videos", "content_posts", "campaigns", "assets", "clients"
            ];
            for (const t of tables) {
              // Per-table isolation: one failing DELETE (e.g. schema drift)
              // must not abort the purge for the remaining tables.
              try {
                await client.query(`DELETE FROM ${t} WHERE user_id IN (SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW())`);
              } catch (e) {
                console.error(`[GDPR] Purge error on ${t}:`, (e as Error).message);
              }
            }
            const r = await client.query("DELETE FROM users WHERE is_guest = true AND guest_expires_at < NOW()");
            if (r.rowCount) console.log(`[GDPR] Purged ${r.rowCount} guest(s)`);
          } finally { client.release(); }
        } catch (e) { console.error("[GDPR] Purge error:", (e as Error).message); }
      };
      setTimeout(purge, 10000);
      setInterval(purge, 60 * 60 * 1000);
    }
  } catch (e) {
    console.error("[GDPR] Setup failed:", (e as Error).message);
  }

  // Meta long-lived token auto-refresh (daily; no-ops without META_APP_ID/SECRET)
  try {
    const { startTokenRefreshLoop } = await import("./api/tokenRefresh");
    startTokenRefreshLoop();
    console.log("[TOKEN-REFRESH] Daily Meta token refresh loop started");
  } catch (e) {
    console.error("[TOKEN-REFRESH] Setup failed:", (e as Error).message);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => { console.log("[SIGTERM] Shutting down..."); server.close(() => process.exit(0)); });
process.on("SIGINT", () => { console.log("[SIGINT] Shutting down..."); server.close(() => process.exit(0)); });
