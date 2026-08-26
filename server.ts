import { serve } from "@hono/node-server";
import app from "./api";

// ─── Version marker ───
console.log("[SERVER] Omega Swarm v5.0 — Build: 2026-08-26-008");

// ─── Configuration ───
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || "10000");

// ─── Startup Validation ───
const requiredEnvVars: string[] = [];
const optionalEnvVars = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "GROQ_API_KEY",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_ACCOUNT_ID",
  "META_APP_ID",
  "META_APP_SECRET",
  "BUFFER_API_KEY",
  "POLLINATIONS_API_KEY",
  "KLING_API_KEY",
];

function validateEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      console.warn(`[WARN] Optional environment variable ${key} is not set. Related features will be disabled.`);
    }
  }
}

// ─── Graceful Shutdown Handling ───
let isShuttingDown = false;

function gracefulShutdown(server: ReturnType<typeof serve>, signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[${signal}] Initiating graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log("[SHUTDOWN] Server closed, exiting...");
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error(`[SHUTDOWN] Forced exit after ${SHUTDOWN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
}

// ─── Main ───
validateEnv();

const server = serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🚀 Omega Swarm API server running on port ${PORT}`);
    console.log(`[${timestamp}] Environment: ${NODE_ENV}`);
    console.log(`[${timestamp}] Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`[${timestamp}] PID: ${process.pid}`);
  }
);

// Handle termination signals
process.on("SIGTERM", () => gracefulShutdown(server, "SIGTERM"));
process.on("SIGINT", () => gracefulShutdown(server, "SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled rejection:", reason);
  process.exit(1);
});

// ─── GDPR: Auto-purge expired guest accounts ───
// Runs every hour to delete guest accounts where guest_expires_at < NOW()
import { pool } from "./db/connection";

async function purgeExpiredGuests() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      // Delete in correct order to respect FK constraints
      await client.query(`
        DELETE FROM credit_transactions WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM credits WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM sessions WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM analytics_events WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM memories WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM bookings WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM social_accounts WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM brand_voices WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM generated_videos WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM content_posts WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM campaigns WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM assets WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      await client.query(`
        DELETE FROM clients WHERE user_id IN (
          SELECT id FROM users WHERE is_guest = true AND guest_expires_at < NOW()
        )
      `);
      const result = await client.query(`
        DELETE FROM users WHERE is_guest = true AND guest_expires_at < NOW()
      `);
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[GDPR] Purged ${result.rowCount} expired guest account(s)`);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[GDPR] Guest purge error:", (err as Error).message);
  }
}

// Run immediately on startup, then every hour
setTimeout(() => purgeExpiredGuests(), 5000);
setInterval(() => purgeExpiredGuests(), 60 * 60 * 1000);
