/**
 * Omega Swarm v5.0 — Data Migration Script
 *
 * Reads data from JSON store (data/store.json) and migrates to PostgreSQL.
 * Run once: `npx tsx db/migrate-data.ts`
 *
 * This script:
 * 1. Creates a default user account (for Isaac Bullock data)
 * 2. Migrates the seeded client (Isaac Bullock)
 * 3. Migrates all content, campaigns, assets, etc.
 */

import { db, isPostgresAvailable } from "./connection";
import { users, clients, credits, contentPosts, generatedVideos, campaigns, assets, brandVoices, bookings, analyticsEvents, socialAccounts, memories, viralVideos, contentAssets } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../api/auth/utils";
import * as fs from "fs";
import * as path from "path";

const STORE_FILE = path.join(process.cwd(), "data", "store.json");

async function migrate() {
  console.log("=== Omega Swarm Data Migration ===");

  if (!isPostgresAvailable()) {
    console.error("❌ PostgreSQL not available. Set DATABASE_URL or POSTGRES_URL.");
    process.exit(1);
  }

  // Check if store.json exists
  if (!fs.existsSync(STORE_FILE)) {
    console.log("⚠️ No store.json found. Creating default user with Isaac Bullock client.");
    await seedDefaultData();
    return;
  }

  // Read JSON store
  const storeData = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
  console.log(`📦 Loaded store.json with keys: ${Object.keys(storeData).join(", ")}`);

  // Create or find default user
  let userId = await getOrCreateDefaultUser();
  console.log(`👤 Default user ID: ${userId}`);

  // Migrate clients
  if (storeData.clients?.length > 0) {
    console.log(`🔄 Migrating ${storeData.clients.length} clients...`);
    for (const client of storeData.clients) {
      await migrateClient(userId, client);
    }
  }

  // Migrate content posts
  if (storeData.content?.length > 0) {
    console.log(`🔄 Migrating ${storeData.content.length} content posts...`);
    for (const post of storeData.content) {
      await migrateContentPost(userId, post);
    }
  }

  // Migrate videos
  if (storeData.videos?.length > 0) {
    console.log(`🔄 Migrating ${storeData.videos.length} videos...`);
    for (const video of storeData.videos) {
      await migrateVideo(userId, video);
    }
  }

  // Migrate campaigns
  if (storeData.campaigns?.length > 0) {
    console.log(`🔄 Migrating ${storeData.campaigns.length} campaigns...`);
    for (const campaign of storeData.campaigns) {
      await migrateCampaign(userId, campaign);
    }
  }

  // Migrate assets
  if (storeData.assets?.length > 0) {
    console.log(`🔄 Migrating ${storeData.assets.length} assets...`);
    for (const asset of storeData.assets) {
      await migrateAsset(userId, asset);
    }
  }

  // Migrate bookings
  if (storeData.bookings?.length > 0) {
    console.log(`🔄 Migrating ${storeData.bookings.length} bookings...`);
    for (const booking of storeData.bookings) {
      await migrateBooking(userId, booking);
    }
  }

  // Migrate analytics events
  if (storeData.analyticsEvents?.length > 0) {
    console.log(`🔄 Migrating ${storeData.analyticsEvents.length} analytics events...`);
    for (const event of storeData.analyticsEvents) {
      await migrateAnalyticsEvent(userId, event);
    }
  }

  console.log("✅ Migration complete!");
}

async function getOrCreateDefaultUser(): Promise<string> {
  const email = "admin@omega-swarm.com";
  const existing = await db!.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    console.log(`👤 Found existing user: ${existing[0].id}`);
    return existing[0].id;
  }

  const passwordHash = await hashPassword("admin123"); // Change after first login!

  const newUser = await db!
    .insert(users)
    .values({
      email,
      passwordHash,
      name: "Admin",
      role: "admin",
      isGuest: false,
    })
    .returning();

  const userId = newUser[0].id;

  // Create default credits
  await db!
    .insert(credits)
    .values({
      userId,
      totalBudget: "50.00",
      spent: "0.00",
      currency: "EUR",
    });

  console.log(`👤 Created default user: ${userId}`);
  return userId;
}

async function migrateClient(userId: string, client: any) {
  try {
    const existing = await db!
      .select()
      .from(clients)
      .where(eq(clients.handle, client.handle))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭️ Client ${client.handle} already exists`);
      return;
    }

    await db!.insert(clients).values({
      userId,
      name: client.name || "Unknown",
      handle: client.handle || "unknown",
      tagline: client.tagline || null,
      tier: client.tier || 1,
      status: client.status || "active",
      bioFull: client.bio?.full || null,
      bioMedium: client.bio?.medium || null,
      bioShort: client.bio?.short || null,
      location: client.location || null,
      primaryColor: client.colors?.primary || null,
      secondaryColor: client.colors?.secondary || null,
      accentColor: client.colors?.accent || null,
      photoHeadshot: client.photos?.headshot || null,
      photoPerformance: client.photos?.performance || null,
      photoCasual: client.photos?.casual || null,
      website: client.website || null,
      socialLinks: client.social || null,
      brandHierarchy: client.brandHierarchy || null,
      namingRules: client.namingRules || null,
      toneWords: client.toneWords || null,
      bannedPhrases: client.bannedPhrases || null,
      contentPillars: client.contentPillars || null,
      storyBank: client.storyBank || null,
      calendarEntries: client.calendarEntries || null,
    });

    console.log(`  ✅ Migrated client: ${client.name}`);
  } catch (err) {
    console.error(`  ❌ Failed to migrate client ${client.name}:`, (err as Error).message);
  }
}

async function migrateContentPost(userId: string, post: any) {
  try {
    await db!.insert(contentPosts).values({
      userId,
      title: post.title || "Untitled",
      caption: post.caption || "",
      type: post.type || "social",
      status: post.status || "draft",
      date: new Date(post.date || Date.now()),
      imageUrl: post.imageUrl || null,
      instagramPostId: post.instagramPostId || null,
      likes: post.likes || 0,
      comments: post.comments || 0,
      views: post.views || 0,
      referenceAssets: post.referenceAssets || null,
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate post:`, (err as Error).message);
  }
}

async function migrateVideo(userId: string, video: any) {
  try {
    await db!.insert(generatedVideos).values({
      userId,
      title: video.title || "Untitled",
      prompt: video.prompt || "",
      videoUrl: video.videoUrl || video.url || "",
      thumbnailUrl: video.thumbnailUrl || null,
      duration: video.duration || 0,
      aspectRatio: video.aspectRatio || "16:9",
      provider: video.provider || "pollinations",
      status: video.status || "ready",
      date: new Date(video.date || Date.now()),
      referenceAssets: video.referenceAssets || null,
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate video:`, (err as Error).message);
  }
}

async function migrateCampaign(userId: string, campaign: any) {
  try {
    await db!.insert(campaigns).values({
      userId,
      title: campaign.title || "Untitled",
      objective: campaign.objective || null,
      budget: campaign.budget || null,
      timeline: campaign.timeline || null,
      mode: campaign.mode || "sequential",
      status: campaign.status || "queued",
      completedAt: campaign.completedAt ? new Date(campaign.completedAt) : null,
      outputs: campaign.outputs || null,
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate campaign:`, (err as Error).message);
  }
}

async function migrateAsset(userId: string, asset: any) {
  try {
    await db!.insert(assets).values({
      userId,
      name: asset.name || "Untitled",
      type: asset.type || "image",
      dataUrl: asset.dataUrl || null,
      url: asset.url || null,
      description: asset.description || null,
      tags: asset.tags || [],
      usedIn: asset.usedIn || [],
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate asset:`, (err as Error).message);
  }
}

async function migrateBooking(userId: string, booking: any) {
  try {
    await db!.insert(bookings).values({
      userId,
      clientName: booking.clientName || "Unknown",
      clientEmail: booking.clientEmail || "unknown@example.com",
      clientCompany: booking.clientCompany || null,
      serviceId: booking.serviceId || "unknown",
      serviceName: booking.serviceName || "Unknown",
      date: booking.date || "2026-01-01",
      time: booking.time || "12:00",
      status: booking.status || "pending",
      notes: booking.notes || null,
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate booking:`, (err as Error).message);
  }
}

async function migrateAnalyticsEvent(userId: string, event: any) {
  try {
    await db!.insert(analyticsEvents).values({
      userId,
      type: event.type || "post_created",
      title: event.title || "Unknown",
      description: event.description || "",
      agentColor: event.agentColor || null,
      agentName: event.agentName || null,
      metadata: event.metadata || null,
      createdAt: new Date(event.date || Date.now()),
    });
  } catch (err) {
    console.error(`  ❌ Failed to migrate analytics event:`, (err as Error).message);
  }
}

async function seedDefaultData() {
  console.log("🌱 Seeding default data...");
  const userId = await getOrCreateDefaultUser();

  // Seed Isaac Bullock client
  const isaacData = {
    userId,
    name: "Isaac Bullock",
    handle: "isaacbullock",
    tagline: "Ex-Refugee Strategist. ISC Award-winning musician. TEDx speaker. Founder of Wildnoff.",
    tier: 1,
    status: "active",
    bioFull: "Isaac Bullock is an ex-refugee strategist, ISC Award-winning musician, TEDx speaker, and founder of Wildnoff.",
    bioMedium: "Strategist, musician, TEDx speaker. Founder of Wildnoff.",
    bioShort: "Strategist & musician.",
    location: "Global",
    primaryColor: "#FFD700",
    secondaryColor: "#000000",
    accentColor: "#FFFFFF",
    photoHeadshot: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    photoPerformance: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
    photoCasual: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    website: "https://wildnoff.com",
    socialLinks: {
      instagram: "@isaacbullock",
      twitter: "@isaacbullock",
      linkedin: "in/isaacbullock",
      youtube: "@isaacbullock",
      tiktok: "@isaacbullock",
      spotify: "artist/isaacbullock",
    },
    brandHierarchy: [
      { tier: "Tier 1", role: "Founder", name: "Isaac Bullock", description: "Strategist and visionary" },
      { tier: "Tier 2", role: "Musician", name: "Isaac Bullock Music", description: "ISC Award-winning artist" },
      { tier: "Tier 3", role: "Speaker", name: "TEDx Speaker", description: "Keynote and motivational speaker" },
    ],
    namingRules: {
      alwaysUse: ["Isaac Bullock", "Wildnoff"],
      neverUse: ["refugee", "displaced"],
      capitalization: "Title Case for all brand names",
    },
    toneWords: ["Bold", "Authentic", "Empowering", "Visionary", "Resilient"],
    bannedPhrases: ["struggling refugee", "displaced artist", "victim narrative"],
    contentPillars: [
      { name: "Strategy", description: "Strategic thinking and business insights", examples: ["Market analysis", "Brand positioning", "Growth strategies"] },
      { name: "Music", description: "Musical journey and creative process", examples: ["Behind the scenes", "New releases", "Performance highlights"] },
      { name: "Speaking", description: "Keynote and motivational content", examples: ["TEDx talks", "Conference highlights", "Inspirational messages"] },
      { name: "Wildnoff", description: "Founder journey and brand story", examples: ["Brand milestones", "Team highlights", "Impact stories"] },
    ],
    storyBank: [
      { title: "From Refugee to Strategist", hook: "What does it take to turn displacement into drive?", body: "Isaac's journey from refugee camps to boardrooms.", cta: "Follow the journey" },
      { title: "The ISC Award", hook: "Recognition that transcends borders", body: "How Isaac's music earned global recognition.", cta: "Listen now" },
    ],
    calendarEntries: [
      { date: "2026-01-15", event: "TEDx Talk - Resilience", type: "speaking" },
      { date: "2026-01-20", event: "New Single Release", type: "music" },
      { date: "2026-02-01", event: "Wildnoff Brand Launch", type: "brand" },
    ],
  };

  try {
    await db!.insert(clients).values(isaacData);
    console.log("✅ Seeded Isaac Bullock client");
  } catch (err) {
    console.error("❌ Failed to seed Isaac Bullock:", (err as Error).message);
  }
}

migrate().catch(console.error);
