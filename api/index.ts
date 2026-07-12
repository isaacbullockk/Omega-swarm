import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
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
