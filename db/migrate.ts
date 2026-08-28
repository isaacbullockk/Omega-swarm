/**
 * Omega Swarm v5.0 — Auto Migration
 * Runs on startup to add missing columns to Railway PostgreSQL.
 * Uses IF NOT EXISTS so it's safe to run multiple times.
 */
import { pool } from "./connection";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type asset_type NOT NULL,
    data_url TEXT,
    url TEXT,
    description TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    used_in JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);`,
  `CREATE TABLE IF NOT EXISTS brand_voices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    tone VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    samples JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS generated_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
    provider VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference_assets JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS generated_videos_user_id_idx ON generated_videos(user_id);`,
  `CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type memory_type NOT NULL DEFAULT 'pattern',
    ctr VARCHAR(20),
    cpa VARCHAR(20),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    agents TEXT,
    confidence INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    handle VARCHAR(50) NOT NULL,
    connected BOOLEAN NOT NULL DEFAULT FALSE,
    access_token TEXT,
    page_id VARCHAR(100),
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,

  // Create missing tables (GDPR export + credit system)
  `CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_budget DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    spent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id);`,

  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;`,
  // Full campaigns column coverage (GDPR export reads full rows)
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS outputs JSONB;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS objective TEXT;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget VARCHAR(50);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS timeline VARCHAR(50);`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mode VARCHAR(50) NOT NULL DEFAULT 'sequential';`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  // Defensive: bookings full coverage too
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;`,
  `CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);`,

  // Add client_id columns where missing
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS instagram_post_id VARCHAR(100);`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS comments INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS reference_assets JSONB DEFAULT '[]'::jsonb;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS image_url TEXT;`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE content_posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type analytics_event_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    agent_color VARCHAR(7),
    agent_name VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );`,
  `CREATE INDEX IF NOT EXISTS analytics_events_user_id_idx ON analytics_events(user_id);`,
  `CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);`,
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
