-- Seed Isaac Bullock as default client

-- Create admin user
INSERT INTO users (email, password_hash, name, role, is_guest)
VALUES (
  'admin@omega-swarm.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/IhK',
  'Admin',
  'admin',
  false
);

-- Create credits for admin
INSERT INTO credits (user_id, total_budget, spent, currency)
SELECT id, 50.00, 0.00, 'EUR' FROM users WHERE email = 'admin@omega-swarm.com';

-- Create Isaac Bullock client
INSERT INTO clients (
  user_id, name, handle, tagline, tier, status,
  bio_full, bio_medium, bio_short, location,
  primary_color, secondary_color, accent_color,
  photo_headshot, photo_performance, photo_casual,
  website, social_links, brand_hierarchy, naming_rules,
  tone_words, banned_phrases, content_pillars, story_bank, calendar_entries
)
SELECT
  id,
  'Isaac Bullock',
  'isaacbullock',
  'Ex-Refugee Strategist. ISC Award-winning musician. TEDx speaker. Founder of Wildnoff.',
  1,
  'active',
  'Isaac Bullock is an ex-refugee strategist, ISC Award-winning musician, TEDx speaker, and founder of Wildnoff.',
  'Strategist, musician, TEDx speaker. Founder of Wildnoff.',
  'Strategist & musician.',
  'Global',
  '#FFD700',
  '#000000',
  '#FFFFFF',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  'https://wildnoff.com',
  '{"instagram": "@isaacbullock", "twitter": "@isaacbullock", "linkedin": "in/isaacbullock", "youtube": "@isaacbullock", "tiktok": "@isaacbullock", "spotify": "artist/isaacbullock"}'::jsonb,
  '[{"tier": "Tier 1", "role": "Founder", "name": "Isaac Bullock", "description": "Strategist and visionary"}, {"tier": "Tier 2", "role": "Musician", "name": "Isaac Bullock Music", "description": "ISC Award-winning artist"}, {"tier": "Tier 3", "role": "Speaker", "name": "TEDx Speaker", "description": "Keynote and motivational speaker"}]'::jsonb,
  '{"alwaysUse": ["Isaac Bullock", "Wildnoff"], "neverUse": ["refugee", "displaced"], "capitalization": "Title Case for all brand names"}'::jsonb,
  '["Bold", "Authentic", "Empowering", "Visionary", "Resilient"]'::jsonb,
  '["struggling refugee", "displaced artist", "victim narrative"]'::jsonb,
  '[{"name": "Strategy", "description": "Strategic thinking and business insights", "examples": ["Market analysis", "Brand positioning", "Growth strategies"]}, {"name": "Music", "description": "Musical journey and creative process", "examples": ["Behind the scenes", "New releases", "Performance highlights"]}, {"name": "Speaking", "description": "Keynote and motivational content", "examples": ["TEDx talks", "Conference highlights", "Inspirational messages"]}, {"name": "Wildnoff", "description": "Founder journey and brand story", "examples": ["Brand milestones", "Team highlights", "Impact stories"]}]'::jsonb,
  '[{"title": "From Refugee to Strategist", "hook": "What does it take to turn displacement into drive?", "body": "Isaac journey from refugee camps to boardrooms.", "cta": "Follow the journey"}, {"title": "The ISC Award", "hook": "Recognition that transcends borders", "body": "How Isaac music earned global recognition.", "cta": "Listen now"}]'::jsonb,
  '[{"date": "2026-01-15", "event": "TEDx Talk - Resilience", "type": "speaking"}, {"date": "2026-01-20", "event": "New Single Release", "type": "music"}, {"date": "2026-02-01", "event": "Wildnoff Brand Launch", "type": "brand"}]'::jsonb
FROM users WHERE email = 'admin@omega-swarm.com';
