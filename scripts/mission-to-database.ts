/**
 * MISSION TO DATABASE — Load mission posts into PostgreSQL as scheduled posts
 *
 * This is the MISSING LINK. The autopilot scheduler looks in the database
 * for posts with status="scheduled". The mission script writes JSON to disk.
 * This script bridges them.
 *
 * Usage:
 *   npx tsx scripts/mission-to-database.ts
 *
 * What it does:
 *   1. Reads /tmp/mission-isaac-bullock.json
 *   2. Inserts each post into content_posts table with status="scheduled"
 *   3. Uses the user's actual user_id from the database
 *   4. Skips posts that already exist (idempotent)
 */

import { readFileSync, existsSync } from "fs";
import { db, isPostgresAvailable } from "../db/connection";
import { contentPosts, users, clients } from "../db/schema";
import { eq, and } from "drizzle-orm";

const MISSION_FILE = "/tmp/mission-isaac-bullock.json";

async function main() {
  console.log("\n=== MISSION → DATABASE ===\n");

  if (!isPostgresAvailable() || !db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  if (!existsSync(MISSION_FILE)) {
    console.error(`❌ Mission file not found: ${MISSION_FILE}`);
    console.error("   Run first: npm run mission:isaac");
    process.exit(1);
  }

  const mission = JSON.parse(readFileSync(MISSION_FILE, "utf-8"));
  const posts = mission.schedule || [];

  if (posts.length === 0) {
    console.error("❌ No posts in mission file");
    process.exit(1);
  }

  console.log(`📋 Mission: ${mission.mission}`);
  console.log(`📊 Posts to schedule: ${posts.length}\n`);

  // Find the user — we need a real user_id
  const userRows = await db.select({ id: users.id, email: users.email })
    .from(users)
    .limit(1);

  if (userRows.length === 0) {
    console.error("❌ No users in database. Cannot schedule posts without a user.");
    process.exit(1);
  }

  const userId = userRows[0].id;
  console.log(`👤 Target user: ${userRows[0].email} (${userId})\n`);

  // Find or create a client for Isaac Bullock
  let clientId: string | null = null;
  const clientRows = await db.select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.userId, userId))
    .limit(1);

  if (clientRows.length > 0) {
    clientId = clientRows[0].id;
    console.log(`🏢 Client: ${clientRows[0].name}`);
  } else {
    console.log("⚠️  No client found — posts will have no client_id");
  }

  // Insert posts
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      // Check if post already exists
      const existing = await db.select({ id: contentPosts.id })
        .from(contentPosts)
        .where(and(
          eq(contentPosts.userId, userId),
          eq(contentPosts.title, post.topic)
        ))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Extract clean caption from prompt
      const cleanCaption = post.captionPrompt
        ? post.captionPrompt
            .replace(/First person\. Isaac Bullock's voice.*?\n\n/s, "")
            .replace(/Hard Rock Rising 2026: runner-up.*?Solarus Sunpower\./s, "")
            .replace(/Book WILDNOFF.*?for the receipts\./s, "")
            .replace(/Tag @isaacbullockk and @wildnoff\./g, "")
            .trim()
        : post.topic;

      // Build image URL — prefer real photo, then imagePrompt for AI generation
      let imageUrl = post.imageUrl || null;
      if (!imageUrl && post.imagePath) {
        imageUrl = post.imagePath;
      }

      await db.insert(contentPosts).values({
        userId,
        clientId,
        title: post.topic,
        caption: cleanCaption || post.topic,
        type: "social",
        status: "scheduled",
        date: new Date(post.date),
        imageUrl: imageUrl,
      });

      inserted++;
      process.stdout.write(`\r   Inserted: ${inserted} | Skipped: ${skipped} | Failed: ${failed}`);
    } catch (err) {
      failed++;
      console.error(`\n   ❌ Post ${post.id} failed:`, (err as Error).message);
    }
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Failed: ${failed}`);

  // Show next posts that will be published
  const upcoming = await db.select()
    .from(contentPosts)
    .where(and(
      eq(contentPosts.userId, userId),
      eq(contentPosts.status, "scheduled")
    ))
    .orderBy(contentPosts.date)
    .limit(3);

  console.log(`\n📅 Next 3 scheduled posts:`);
  for (const p of upcoming) {
    const d = new Date(p.date);
    console.log(`   ${d.toLocaleDateString()} ${d.toLocaleTimeString()} — ${p.title.slice(0, 50)}...`);
  }

  // Check autopilot settings
  const { automationSettings } = await import("../db/schema");
  const settingsRows = await db.select()
    .from(automationSettings)
    .where(eq(automationSettings.userId, userId))
    .limit(1);

  console.log(`\n⚙️  Autopilot settings:`);
  if (settingsRows.length > 0) {
    const s = settingsRows[0];
    console.log(`   Enabled: ${s.enabled}`);
    console.log(`   Auto-publish: ${s.autoPublish}`);
    console.log(`   Preferred days: ${(s.preferredDays as string[]).join(", ")}`);
    console.log(`   Time window: ${s.timeWindowStart}:00 - ${s.timeWindowEnd}:00`);
    console.log(`   Timezone: ${s.timezone}`);
    console.log(`   Platforms: ${(s.platforms as string[]).join(", ")}`);

    if (!s.enabled) {
      console.log(`\n⚠️  WARNING: Autopilot is DISABLED. Posts won't publish automatically.`);
      console.log(`   Fix: Enable in Settings > Automation or update DB.`);
    }
    if (!s.autoPublish) {
      console.log(`\n⚠️  WARNING: Auto-publish is OFF. Posts will become drafts instead of published.`);
    }
  } else {
    console.log(`   ⚠️  No settings found! Creating default settings...`);
    await db.insert(automationSettings).values({
      userId,
      enabled: true,
      autoPublish: true,
      preferredDays: ["tuesday", "wednesday", "thursday"],
      timeWindowStart: 9,
      timeWindowEnd: 11,
      timezone: "Europe/Amsterdam",
      platforms: ["instagram", "linkedin"],
    });
    console.log(`   ✅ Default settings created: enabled=true, autoPublish=true`);
  }

  console.log(`\n🚀 The autopilot will check every 15 minutes.`);
  console.log(`   When a post's date arrives + autoPublish is ON + it's a preferred day + within time window → it publishes.`);
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
