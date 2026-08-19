import { serve } from "@hono/node-server";
import app from "./api";

// ─── Configuration ───
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || "10000");

// ─── Startup Validation ───
const requiredEnvVars: string[] = ["OPENAI_API_KEY"];
const optionalEnvVars = [
  "GROQ_API_KEY",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_ACCOUNT_ID",
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
