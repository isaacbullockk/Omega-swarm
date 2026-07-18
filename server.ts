import { serve } from "@hono/node-server";
import app from "./api";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Omega Swarm API server running on port ${port}`);
});
