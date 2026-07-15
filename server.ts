import { serve } from "@hono/node-server";
import app from "./api/index.ts";
import { db } from "./db/connection.ts";
import { sql } from "drizzle-orm";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Auto-create tables and seed on startup
async function initDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Create tables if they don't exist (raw SQL for auto-migration)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        objective TEXT NOT NULL,
        budget VARCHAR(50),
        timeline VARCHAR(50),
        status VARCHAR(50) DEFAULT 'queued',
        mode VARCHAR(50),
        progress INTEGER DEFAULT 0,
        agents_deployed INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        tasks_total INTEGER DEFAULT 0,
        roi VARCHAR(50),
        start_date VARCHAR(50),
        end_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS campaign_outputs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        agent_id VARCHAR(100),
        agent_name VARCHAR(255),
        agent_emoji VARCHAR(10),
        status VARCHAR(50) DEFAULT 'pending',
        output TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS brand_voices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER DEFAULT 1,
        name VARCHAR(255),
        tone TEXT,
        description TEXT,
        samples JSON,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS content_assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(50),
        url TEXT,
        tags JSON,
        account VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS viral_videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        account VARCHAR(100),
        caption TEXT,
        hashtags JSON,
        video_url TEXT,
        status VARCHAR(50) DEFAULT 'ready',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50),
        handle VARCHAR(100),
        account_name VARCHAR(255),
        access_token TEXT,
        connected INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✅ Database tables created");

    // Run seed
    const { seed } = await import("./db/seed");
    await seed();

  } catch (err) {
    console.error("❌ Database init error:", err);
  }
}

// Start server
initDatabase().then(() => {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`🚀 Omega Swarm API server running on port ${port}`);
    console.log(`❤️  Health: http://localhost:${port}/api/health`);
  });
});
