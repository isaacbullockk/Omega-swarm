import { Hono } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";

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

export default app;
