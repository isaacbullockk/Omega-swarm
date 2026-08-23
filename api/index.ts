import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const app = new Hono();

// Security Headers
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// CORS
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

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", version: "5.0.0" }));

// tRPC API with REAL auth context
app.all("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext, // ← REAL auth context (was: () => ({}))
  });
});

// Explicit static file serving
const mimeTypes: Record<string, string> = {
  js: "application/javascript",
  css: "text/css",
  html: "text/html",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
};

app.get("/assets/*", (c) => {
  const filePath = join(process.cwd(), "dist", c.req.path);
  if (existsSync(filePath)) {
    const ext = filePath.split(".").pop() || "";
    const contentType = mimeTypes[ext] || "application/octet-stream";
    return c.body(readFileSync(filePath), 200, { "Content-Type": contentType });
  }
  return c.notFound();
});

// SPA fallback
app.get("*", (c) => {
  const path = c.req.path;
  if (path.startsWith("/api/") || path.startsWith("/assets/")) {
    return c.notFound();
  }
  const indexPath = join(process.cwd(), "dist", "index.html");
  if (existsSync(indexPath)) {
    return c.html(readFileSync(indexPath, "utf-8"));
  }
  return c.json({ error: "Frontend not built" }, 500);
});

export default app;
