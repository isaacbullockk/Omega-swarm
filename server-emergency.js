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
const DIST_DIR = path.join(__dirname, "public");
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
  return MIME[ext] || "application/octet-stream";
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
  res.setHeader("Access-Control-Allow-Origin", "*");
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
    res.end(JSON.stringify({ status: "ok", version: "4.0.0-emergency", time: new Date().toISOString() }));
    return;
  }

  // API: Agent list (mock for frontend compatibility)
  if (pathname === "/api/trpc/agent.list") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [
      { id: "copywriter", name: "Copywriter GPT", emoji: "✍️", status: "online", tasksCompleted: 342, winRate: "94.2", responseTime: "320ms", capabilities: ["Copy", "Email", "Landing Pages"] },
      { id: "social", name: "Social Media Agent", emoji: "📱", status: "online", tasksCompleted: 518, winRate: "91.7", responseTime: "280ms", capabilities: ["Social", "Content", "Viral"] },
      { id: "sales", name: "Sales Closer", emoji: "💼", status: "online", tasksCompleted: 289, winRate: "88.4", responseTime: "410ms", capabilities: ["Funnel", "Sales", "CRO"] },
      { id: "creative", name: "Creative Director", emoji: "🎨", status: "online", tasksCompleted: 176, winRate: "92.1", responseTime: "350ms", capabilities: ["Creative", "Brand", "Visual"] },
      { id: "seo", name: "SEO Strategist", emoji: "🔍", status: "online", tasksCompleted: 423, winRate: "89.5", responseTime: "290ms", capabilities: ["SEO", "Keywords", "Content"] },
      { id: "analytics", name: "Data Analyst", emoji: "📊", status: "online", tasksCompleted: 367, winRate: "93.8", responseTime: "260ms", capabilities: ["Analytics", "KPI", "Reports"] },
      { id: "sentinel", name: "Sentinel", emoji: "👁️", status: "online", tasksCompleted: 198, winRate: "87.2", responseTime: "380ms", capabilities: ["Intel", "Alerts", "Tracking"] },
      { id: "geo", name: "GEO Agent", emoji: "🤖", status: "online", tasksCompleted: 245, winRate: "90.1", responseTime: "310ms", capabilities: ["GEO", "AI", "Citations"] },
      { id: "privacy", name: "Privacy Agent", emoji: "🔒", status: "online", tasksCompleted: 134, winRate: "95.0", responseTime: "220ms", capabilities: ["Privacy", "GDPR", "Compliance"] },
      { id: "ambient", name: "Ambient Agent", emoji: "🌐", status: "idle", tasksCompleted: 89, winRate: "85.6", responseTime: "450ms", capabilities: ["IoT", "Voice", "Location"] },
      { id: "budget", name: "Budget RL Agent", emoji: "💰", status: "online", tasksCompleted: 312, winRate: "91.3", responseTime: "275ms", capabilities: ["Budget", "RL", "Optimize"] },
      { id: "orchestrator", name: "Swarm Orchestrator", emoji: "🧠", status: "online", tasksCompleted: 567, winRate: "96.4", responseTime: "180ms", capabilities: ["Coordination", "Sync"] },
    ]}}));
    return;
  }

  // API: Brand voice (mock)
  if (pathname === "/api/trpc/brandVoice.get") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: {
      tone: "Soulful, confident, community-driven",
      description: "Isaac's voice blends reflective wisdom with infectious energy. He speaks like a mentor who's also your biggest fan — the friend who pushes you to dream bigger while keeping you grounded. His content feels intimate but universal, mixing personal storytelling with collective ambition. The tone shifts seamlessly between late-night introspection ('The best ideas come when nobody's watching') and festival-ready hype ('That's when we come alive!'). He's unapologetically passionate about music, community, and creating moments that connect people. No corporate speak — just real talk, soulful vibes, and genuine belief in the power of collective creativity.",
      samples: ["Wildnoff Collective mission statement", "Instagram captions", "YouTube video descriptions"],
    }}}));
    return;
  }

  // API: Campaigns list (mock)
  if (pathname === "/api/trpc/agent.getCampaigns") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [] }}));
    return;
  }

  // API: Social accounts (mock)
  if (pathname === "/api/trpc/social.list") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [] }}));
    return;
  }

  // API: Viral videos (mock)
  if (pathname === "/api/trpc/viral.list") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [
      { id: "viral_1", title: "Stage Energy", account: "@wildnoff", caption: "The live experience is where the magic happens ✨", hashtags: ["#WildnoffCollective","#LiveMusic"], videoUrl: "/viral-studio/viral_reel_1.mp4", status: "ready", createdAt: new Date().toISOString() },
      { id: "viral_2", title: "Behind the Scenes", account: "@isaacbullockk", caption: "Real talk: the best ideas come when nobody's watching 🎶", hashtags: ["#BehindTheScenes","#StudioLife"], videoUrl: "/viral-studio/viral_reel_2.mp4", status: "ready", createdAt: new Date().toISOString() },
      { id: "viral_3", title: "Festival Vibes", account: "@kyakuwamusic", caption: "When the sun sets and the bass drops... that's when we come alive 🌅🎵", hashtags: ["#KyakuwaMusic","#FestivalSeason"], videoUrl: "/viral-studio/viral_reel_3.mp4", status: "ready", createdAt: new Date().toISOString() },
    ]}}));
    return;
  }

  // API: Content assets (mock)
  if (pathname === "/api/trpc/contentLibrary.list") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { data: [
      { id: "asset_1", name: "Forest Adventure Reel", type: "video", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&h=640&fit=crop", tags: ["nature","outdoors","adventure"], account: "@wildnoff", createdAt: new Date(Date.now()-86400000*2).toISOString() },
      { id: "asset_2", name: "Mountain Sunrise", type: "image", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=640&fit=crop", tags: ["landscape","sunrise","mountains"], account: "@wildnoff", createdAt: new Date(Date.now()-86400000*5).toISOString() },
      { id: "asset_3", name: "Studio Session BTS", type: "video", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=640&fit=crop", tags: ["music","studio","behind-the-scenes"], account: "@kyakuwamusic", createdAt: new Date(Date.now()-86400000*1).toISOString() },
      { id: "asset_4", name: "Album Cover Concept", type: "image", url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop", tags: ["music","cover-art","dark"], account: "@kyakuwamusic", createdAt: new Date(Date.now()-86400000*3).toISOString() },
      { id: "asset_5", name: "Product Showcase", type: "image", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=640&fit=crop", tags: ["product","lifestyle","minimal"], account: "@isaacbullockk", createdAt: new Date(Date.now()-86400000*4).toISOString() },
      { id: "asset_6", name: "City Lights Vlog", type: "video", url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=640&h=640&fit=crop", tags: ["city","night","vlog"], account: "@isaacbullockk", createdAt: new Date(Date.now()-86400000*6).toISOString() },
    ]}}));
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
  console.log(`🚀 Omega Swarm Emergency Server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${DIST_DIR}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});
