/**
 * Omega Swarm v5.0 — Auto Migration
 * Runs on startup to add missing columns to Railway PostgreSQL.
 * Uses IF NOT EXISTS so it's safe to run multiple times.
 */
import { pool } from "./connection";

const MIGRATIONS = [
  // === ENUM TYPES FIRST (tables below reference them) ===
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
  // Memory Bank knowledge types — idempotent enum extension.
  // NOTE: ADD VALUE runs in the migration transaction; new values are only
  // used at runtime after commit, which is the supported pattern (PG12+).
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'memory_type' AND e.enumlabel = 'insight') THEN
      ALTER TYPE memory_type ADD VALUE 'insight';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'memory_type' AND e.enumlabel = 'fact') THEN
      ALTER TYPE memory_type ADD VALUE 'fact';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'memory_type' AND e.enumlabel = 'strategy') THEN
      ALTER TYPE memory_type ADD VALUE 'strategy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'memory_type' AND e.enumlabel = 'feedback') THEN
      ALTER TYPE memory_type ADD VALUE 'feedback';
    END IF;
  END $$;`,
  // Memory Bank knowledge columns (teach-the-agents feature)
  // (Memory Bank knowledge columns are added AFTER the memories table is
  // created below — ALTER requires the table to exist on fresh databases.)

  // Add analytics_events type enum
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
      CREATE TYPE analytics_event_type AS ENUM ('post_created', 'video_generated', 'campaign_started', 'campaign_completed', 'agent_chat', 'instagram_published', 'user_login', 'user_registered', 'content_downloaded', 'ai_generation');
    END IF;
  END $$;`,
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
    video_url TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
    provider VARCHAR(50),
    status video_status NOT NULL DEFAULT 'ready',
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
  // Memory Bank knowledge columns (teach-the-agents feature) — must run AFTER
  // the memories CREATE above so fresh databases work too
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';`,
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS source VARCHAR(255) NOT NULL DEFAULT 'user';`,
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

  `ALTER TABLE brand_voices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;`,

  // generated_videos may pre-exist with old shape — add all newer columns
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS reference_assets JSONB DEFAULT '[]'::jsonb;`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9';`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS provider VARCHAR(50);`,
  `ALTER TABLE generated_videos ALTER COLUMN video_url DROP NOT NULL;`,
  `ALTER TABLE generated_videos ALTER COLUMN video_url SET DEFAULT '';`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ready';`,
  `ALTER TABLE generated_videos ALTER COLUMN status SET DEFAULT 'ready';`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT NOW();`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE generated_videos ADD COLUMN IF NOT EXISTS task_id TEXT;`,
  // Defensive coverage for other pre-existing tables
  `ALTER TABLE brand_voices ADD COLUMN IF NOT EXISTS samples JSONB NOT NULL DEFAULT '[]'::jsonb;`,
  `ALTER TABLE brand_voices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE brand_voices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;`,
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS page_id VARCHAR(100);`,
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;`,
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS details JSONB;`,
  `ALTER TABLE memories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`,
  `ALTER TABLE assets ADD COLUMN IF NOT EXISTS used_in JSONB NOT NULL DEFAULT '[]'::jsonb;`,

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

  // social_accounts pre-exists without user_id
  `ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;`,
  // bookings full column coverage (old shape missing client_company etc.)
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_company VARCHAR(100);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id VARCHAR(50);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_name VARCHAR(100);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS date VARCHAR(20);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time VARCHAR(10);`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;`,
  // brand_voices legacy: only safe samples json->jsonb conversion (user_id/id handled by FK-safe blocks below)
  `DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_voices' AND column_name = 'samples' AND data_type = 'json'
  ) THEN
    ALTER TABLE brand_voices ALTER COLUMN samples TYPE JSONB USING samples::text::jsonb;
  END IF;
END $$;`,

  // FK-safe UUID conversion for any pre-existing integer user_id columns
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'credits' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'credits'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'credits', fk.conname);
      END LOOP;
      ALTER TABLE credits ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE credits ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'credits'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE credits ADD CONSTRAINT fk_credits_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'credit_transactions' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'credit_transactions'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'credit_transactions', fk.conname);
      END LOOP;
      ALTER TABLE credit_transactions ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE credit_transactions ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'credit_transactions'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE credit_transactions ADD CONSTRAINT fk_credit_transactions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clients' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'clients'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'clients', fk.conname);
      END LOOP;
      ALTER TABLE clients ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE clients ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'clients'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE clients ADD CONSTRAINT fk_clients_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'assets' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'assets'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'assets', fk.conname);
      END LOOP;
      ALTER TABLE assets ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE assets ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'assets'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE assets ADD CONSTRAINT fk_assets_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'campaigns' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'campaigns'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'campaigns', fk.conname);
      END LOOP;
      ALTER TABLE campaigns ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE campaigns ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'campaigns'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'content_posts' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'content_posts'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'content_posts', fk.conname);
      END LOOP;
      ALTER TABLE content_posts ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE content_posts ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'content_posts'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE content_posts ADD CONSTRAINT fk_content_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'generated_videos' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'generated_videos'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'generated_videos', fk.conname);
      END LOOP;
      ALTER TABLE generated_videos ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE generated_videos ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'generated_videos'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE generated_videos ADD CONSTRAINT fk_generated_videos_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'brand_voices' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'brand_voices'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'brand_voices', fk.conname);
      END LOOP;
      ALTER TABLE brand_voices ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE brand_voices ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'brand_voices'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE brand_voices ADD CONSTRAINT fk_brand_voices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'social_accounts' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'social_accounts'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'social_accounts', fk.conname);
      END LOOP;
      ALTER TABLE social_accounts ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE social_accounts ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'social_accounts'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE social_accounts ADD CONSTRAINT fk_social_accounts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'bookings'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'bookings', fk.conname);
      END LOOP;
      ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE bookings ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'bookings'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'analytics_events' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'analytics_events'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'analytics_events', fk.conname);
      END LOOP;
      ALTER TABLE analytics_events ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE analytics_events ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'analytics_events'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sessions' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'sessions'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'sessions', fk.conname);
      END LOOP;
      ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE sessions ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'sessions'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
  `DO $$
  DECLARE fk RECORD;
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'memories' AND column_name = 'user_id' AND data_type <> 'uuid'
    ) THEN
      FOR fk IN
        SELECT con.conname FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'memories'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 'memories', fk.conname);
      END LOOP;
      ALTER TABLE memories ALTER COLUMN user_id DROP NOT NULL;
      ALTER TABLE memories ALTER COLUMN user_id TYPE UUID USING NULL;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        WHERE con.conrelid = 'memories'::regclass AND con.contype = 'f' AND att.attname = 'user_id'
      ) THEN
        ALTER TABLE memories ADD CONSTRAINT fk_memories_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END $$;`,
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
