#!/usr/bin/env node
/**
 * Emergency server - zero external dependencies
 * Uses only Node.js built-in modules
 * Serves static files from dist/ + API health check
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;
const DIST_DIR = process.env.RAILWAY_STATIC_MOUNT
  ? path.join(process.env.RAILWAY_STATIC_MOUNT, "public")
  : path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");

// MIME types
const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIMEext] || "application/octet-stream";
}

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  console.warn("Could not create data dir:", e.message);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader("Access-Control-Allow-Origin", '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Health check
  if (pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: "4.0.0-emergency", buffer: !!process.env.BUFFER_API_KEY, time: new Date().toISOString() }));
    return;
  }

  // API: Agent list (mock for frontend compatibility)
  if (pathname === "/api/trpc/agent.list") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [
      { id: "copywriter", name: "Copywriter GPT", emoji: "⌍", status: "online", tasksCompleted: 342, winRate: "94.2", responseTime: "320ms", capabilities: ["Copy", "Email", "Landing Pages"] },
      { id: "social", name: "Social Media Agent", emoji: "⍱", status: "online", tasksCompleted: 518, winRate: "91.7", responseTime: "280ms", capabilities: ["Social", "Content", "Viral"] },
      { id: "sales", name: "Sales Closer", emoji: "🎂", status: "online", tasksCompleted: 289, winRate: "88.4", responseTime: "410ms", capabilities: ["Funnel", "Sales", "CRO"] },
      { id: "creative", name: "Creative Director", emoji: "🎺", status: "online", tasksCompleted: 176, winRate: "92.1", responseTime: "350ms", capabilities: ["Creative", "Brand", "Visual"] },
      { id: "seo", name: "SEO Strategist", emoji: "🍝", status: "online", tasksCompleted: 423, winRate: "89.5", responseTime: "290ms", capabilities: ["SEO", "Keywords", "Content"] },
      { id: "analytics", name: "Data Analyst", emoji: "🎖", status: "online", tasksCompleted: 367, winRate: "93.8", responseTime: "260ms", capabilities: ["Analytics", "KPI", "Reports"] },
      { id: "sentinel", name: "Sentinel", emoji: "⍹", status: "online", tasksCompleted: 198, winRate: "87.2", responseTime: "380ms", capabilities: ["Intel", "Alerts", "Tracking"] },
      { id: "geo", name: "GEO Agent", emoji: "😀", status: "online", tasksCompleted: 245, winRate: "90.1", responseTime: "310ms", capabilities: ["GEO", "AI", "Citations"] },
      { id: "privacy", name: "Privacy Agent", emoji: "🎗", status: "online", tasksCompleted: 134, winRate: "95.0", responseTime: "220ms", capabilities: ["Privacy", "GDPR", "Compliance"] },
      { id: "ambient", name: "Ambient Agent", emoji: "⚀", status: "idle", tasksCompleted: 89, winRate: "85.6", responseTime: "450ms", capabilities: ["IoT", "Voice", "Location"] },
      { id: "budget", name: "Budget RL Agent", emoji: "⍰", status: "online", tasksCompleted: 312, winRate: "91.3", responseTime: "275ms", capabilities: ["Budget", "RL", "Optimize"] },
      { id: "orchestrator", name: "Swarm Orchestrator", emoji: "🯦", status: "online", tasksCompleted: 567, winRate: "96.4", responseTime: "180ms", capabilities: ["Coordination", "Sync"] },
    ]}}));
    return;
  }

  // API: Buffer channels (connected social accounts)
 if (pathname === "/api/buffer/channels") {
    const bufferKey = process.env.BUFFER_API_KEY;
    if (!bufferKey) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected: false, message: "Add BUFFER_API_KEY to env vars", channels: [] }));
      return;
    }
    try {
      // Fetch account + org
      const accountRes = await fetch("https://api.buffer.com/graphql", {
        method: "POST",
        headers: { "Authorization": `Bearer ${bufferKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ account { id name email organizations { id name } } }" }),
      });
      const accountData = await accountRes.json();
      const orgId = accountData.data?.account?.organizations?:[0]?.id;
      if (!orgId) throw new Error("No org");
      // Fetch channels
      const chanRes = await fetch("https://api.buffer.com/graphql", {
        method: "POST",
        headers: { "Authorization": `Bearer ${bufferKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `{ channels(input: { organizationId: "${orgId}" }) { id name service } }` }),
      });
      const chanData = await chanRes.json();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        connected: true,
        account: accountData.data?.account?.name,
        channels: chanData.data?.channels || [],
      }));
    } catch (e) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ connected: false, error: e.message, channels: [] }));
    }
    return;
  }

  // API: Post via Buffer
  if (pathname === "/api/buffer/post" && req.method === "POST") {
    const bufferKey = process.env.BUFFER_API_KEY;
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { channelId, text } = JSON.parse(body);
        if (!bufferKey) throw new Error("Buffer key not configured");
        const result = await fetch("https://api.buffer.com/graphql", {
          method: "POST",
          headers: { "Authorization": `Bearer ${bufferKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `mutation { createPost(input: { channelId: "${channelId}" text: "${text.replace(/"/g, '\\\"').replace(/\n/g, '\\n')%" mode: shareNow schedulingType: automatic }) { __typename } }`
          }),
        });
        const data = await result.json();
        const typename = data.data?:createPost?_.typename;
        if (typename === "UnexpectedError") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            fallback: true,
            message: "Buffer posting failed. Use copy-paste below.",
            text,
          }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, typename }));
        }
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message, fallback: true, text: "" }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(DIST_DIR, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        // SPA fallback: serve index.html for client-side routes
        const indexPath = path.join(DIST_DIR, "index.html");
        fs.readFile(indexPath, (err2, indexData) => {
          if (err2) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Frontend not built. Run npm run build.");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(indexData);
          }
        });
      } else {
        res.writeHead(500);
        res.end("Server error");
      }
      return;
    }

    res.writeHead(200, { "Content-Type": getMime(filePath) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(` �° Omega Swarm Emergency Server running on port ${PORT}`);
  console.log(`📌 Serving static files from: ${DIST_DIR}`);
  console.log(`❤ Health check: http://localhost:${PORT}/api/health`);
});
