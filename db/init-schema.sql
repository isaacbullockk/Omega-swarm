-- Omega Swarm v5.0 -- Initial Schema Migration
-- Run this in Railway Postgres Console

-- Enums
CREATE TYPE campaign_status AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE content_type AS ENUM ('social', 'video', 'ad', 'blog');
CREATE TYPE content_status AS ENUM ('published', 'draft', 'scheduled');
CREATE TYPE video_status AS ENUM ('ready', 'generating', 'failed');
CREATE TYPE social_platform AS ENUM ('instagram', 'facebook', 'youtube', 'tiktok', 'twitter', 'linkedin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE asset_type AS ENUM ('image', 'video', 'audio', 'reference');
CREATE TYPE memory_type AS ENUM ('win', 'loss', 'pattern');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_guest BOOLEAN NOT NULL DEFAULT false,
  guest_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX users_email_idx ON users(email);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX sessions_token_idx ON sessions(token);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

-- Credits
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_budget DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  spent DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) NOT NULL,
  tagline TEXT,
  tier INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  bio_full TEXT,
  bio_medium TEXT,
  bio_short TEXT,
  location VARCHAR(100),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  photo_headshot TEXT,
  photo_performance TEXT,
  photo_casual TEXT,
  website TEXT,
  social_links JSONB,
  brand_hierarchy JSONB,
  naming_rules JSONB,
  tone_words JSONB,
  banned_phrases JSONB,
  content_pillars JSONB,
  story_bank JSONB,
  calendar_entries JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX clients_user_id_idx ON clients(user_id);

-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type asset_type NOT NULL,
  data_url TEXT,
  url TEXT,
  description TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  used_in JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  objective TEXT,
  budget VARCHAR(50),
  timeline VARCHAR(50),
  mode VARCHAR(50) NOT NULL DEFAULT 'sequential',
  status campaign_status NOT NULL DEFAULT 'queued',
  completed_at TIMESTAMPTZ,
  outputs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Posts
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  caption TEXT NOT NULL,
  type content_type NOT NULL DEFAULT 'social',
  status content_status NOT NULL DEFAULT 'draft',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_url TEXT,
  instagram_post_id VARCHAR(100),
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  reference_assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Videos
CREATE TABLE generated_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  aspect_ratio VARCHAR(10) NOT NULL DEFAULT '16:9',
  provider VARCHAR(50) NOT NULL DEFAULT 'pollinations',
  status video_status NOT NULL DEFAULT 'ready',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Voices
CREATE TABLE brand_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  tone VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  samples JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social Accounts
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  handle VARCHAR(50) NOT NULL,
  connected BOOLEAN NOT NULL DEFAULT false,
  access_token TEXT,
  page_id VARCHAR(100),
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_company VARCHAR(100),
  service_id VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  date VARCHAR(20) NOT NULL,
  time VARCHAR(10) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  agent_color VARCHAR(7),
  agent_name VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memories
CREATE TABLE memories (
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
);

-- Viral Videos
CREATE TABLE viral_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  account VARCHAR(100) NOT NULL,
  caption TEXT NOT NULL,
  hashtags JSONB NOT NULL DEFAULT '[]',
  video_url TEXT NOT NULL,
  status content_status NOT NULL DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content Assets
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type asset_type NOT NULL,
  url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]',
  account VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
