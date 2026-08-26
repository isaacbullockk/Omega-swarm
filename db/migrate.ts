/**
 * Omega Swarm v5.0 — Auto Migration
 * Runs on startup to add missing columns to Railway PostgreSQL.
 * Uses IF NOT EXISTS so it's safe to run multiple times.
 */
import { pool } from "./connection";

const MIGRATIONS = [
  // Add client_id columns where missing
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE viral_videos ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,

  // Add missing columns to sessions table (user_agent, ip_address, expires_at)
  `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;`,
  `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);`,
  `ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`,

  // Add missing indexes
  `CREATE INDEX IF NOT EXISTS content_posts_client_id_idx ON content_posts(client_id);`,
  `CREATE INDEX IF NOT EXISTS generated_videos_client_id_idx ON generated_videos(client_id);`,
  `CREATE INDEX IF NOT EXISTS campaigns_client_id_idx ON campaigns(client_id);`,
  `CREATE INDEX IF NOT EXISTS analytics_events_client_id_idx ON analytics_events(client_id);`,
  `CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);`,
  `CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings(client_email);`,
  `CREATE INDEX IF NOT EXISTS social_accounts_platform_idx ON social_accounts(platform);`,
  `CREATE INDEX IF NOT EXISTS content_assets_type_idx ON content_assets(type);`,

  // Ensure guest_expires_at exists
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS guest_expires_at TIMESTAMPTZ;`,

  // Add enum types if missing
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
      CREATE TYPE campaign_status AS ENUM ('queued', 'running', 'completed', 'failed');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
      CREATE TYPE content_type AS ENUM ('social', 'video', 'ad', 'blog');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
      CREATE TYPE content_status AS ENUM ('published', 'draft', 'scheduled');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_status') THEN
      CREATE TYPE video_status AS ENUM ('ready', 'generating', 'failed');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
      CREATE TYPE social_platform AS ENUM ('instagram', 'facebook', 'youtube', 'tiktok', 'twitter', 'linkedin');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
      CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
      CREATE TYPE asset_type AS ENUM ('image', 'video', 'audio', 'reference');
    END IF;
  END $$;`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'memory_type') THEN
      CREATE TYPE memory_type AS ENUM ('win', 'loss', 'pattern');
    END IF;
  END $$;`,

  // Add analytics_events type enum
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
      CREATE TYPE analytics_event_type AS ENUM ('post_created', 'video_generated', 'campaign_started', 'campaign_completed', 'agent_chat', 'instagram_published', 'user_login', 'user_registered', 'content_downloaded', 'ai_generation');
    END IF;
  END $$;`,
  // Add leads table for Nemotron + Kimi symbiosis
  `CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(100),
    source VARCHAR(100),
    behavior TEXT,
    tags JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    score INTEGER NOT NULL DEFAULT 50,
    last_email_subject TEXT,
    last_email_body TEXT,
    last_email_validated BOOLEAN,
    validation_issues JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);`,
  `CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);`,
  `CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);`,
  `CREATE INDEX IF NOT EXISTS leads_score_idx ON leads(score);`,
];

export async function runMigrations() {
  if (!pool) {
    console.log("[MIGRATE] No database pool available, skipping migrations");
    return;
  }

  console.log("[MIGRATE] Running auto-migrations...");
  const client = await pool.connect();
  let success = 0;
  let failed = 0;

  try {
    for (const sql of MIGRATIONS) {
      try {
        await client.query(sql);
        success++;
      } catch (err) {
        const msg = (err as Error).message;
        // Ignore "already exists" errors
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          success++;
        } else {
          failed++;
          console.error(`[MIGRATE] Failed: ${msg.slice(0, 120)}`);
        }
      }
    }
    console.log(`[MIGRATE] Complete: ${success} OK, ${failed} failed`);
  } finally {
    client.release();
  }
}
