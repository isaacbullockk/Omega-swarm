import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const app = new Hono();

// ─── Security Headers (CSP) ───
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.groq.com https://image.pollinations.ai;"
  );
});

// ─── CORS: Restrict to trusted origins ───
app.use(
  "*",
  cors({
    origin: [
      "https://ndeku.com",
      "https://www.ndeku.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "x-session-token"],
    maxAge: 86400,
  })
);

// ─── IP-based Rate Limiting (before tRPC) ───
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX_REQUESTS = 100;

app.use("*", async (c, next) => {
  const ip =
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "unknown";
  const now = Date.now();

  const entry = ipRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimit.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    if (entry.count >= RATE_MAX_REQUESTS) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429
      );
    }
    entry.count++;
  }

  await next();
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", version: "4.0.0" }));

// tRPC API endpoint
app.all("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
  });
});

// Serve static files from dist directory
app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("/viral-studio/*", serveStatic({ root: "./dist" }));

// Serve favicon and other root files
app.use("/*", serveStatic({ root: "./dist" }));

// SPA fallback: serve index.html for all non-API routes
app.get("/*", (c) => {
  const indexPath = join(process.cwd(), "dist", "index.html");
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, "utf-8");
    return c.html(html);
  }
  return c.json({ error: "Frontend not built. Run npm run build first." }, 500);
});

export default app;
