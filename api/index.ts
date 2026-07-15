import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.ts";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const app = new Hono();

// CORS
app.use("*", cors({ origin: "*" }));

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

// Serve static files from public/ (production) or dist/ (dev)
const STATIC_DIR = existsSync(join(process.cwd(), "dist", "index.html")) ? "./dist" : "./public";

app.use("/assets/*", serveStatic({ root: STATIC_DIR }));
app.use("/viral-studio/*", serveStatic({ root: STATIC_DIR }));

// Serve favicon and other root files
app.use("/*", serveStatic({ root: STATIC_DIR }));

// SPA fallback: serve index.html for all non-API routes
app.get("/*", (c) => {
  const indexPath = join(process.cwd(), STATIC_DIR, "index.html");
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, "utf-8");
    return c.html(html);
  }
  return c.json({ error: "Frontend not found." }, 500);
});

export default app;
