/**
 * RESET AND POST — Nuclear option. Wipes old scheduled posts, reloads mission with real photos, publishes immediately.
 *
 * Usage:
 *   npx tsx scripts/reset-and-post.ts
 */

import { readFileSync, existsSync } from "fs";
import { db, isPostgresAvailable } from "../db/connection";
import { contentPosts, automationSettings, analyticsEvents } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { resolveTarget, publishPost } from "../api/socialPublish";

async function main() {
  console.log("\n=== RESET → RELOAD → POST ===\n");

  if (!isPostgresAvailable() || !db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  const userRows = await db.select({ id: contentPosts.userId }).from(contentPosts).limit(1);
  if (userRows.length === 0) {
    console.error("❌ No posts in database");
    process.exit(1);
  }
  const userId = userRows[0].id;

  // STEP 1: Delete all scheduled posts
  console.log("Step 1: Deleting old scheduled posts...");
  const deleted = await db.delete(contentPosts)
    .where(eq(contentPosts.status, "scheduled"))
    .returning();
  console.log(`   ✅ Deleted ${deleted.length} old posts\n`);

  // STEP 2: Load mission with real photos
  const missionFile = "/tmp/mission-isaac-bullock.json";
  if (!existsSync(missionFile)) {
    console.error("❌ Mission file not found");
    process.exit(1);
  }
  const mission = JSON.parse(readFileSync(missionFile, "utf-8"));
  const posts = mission.schedule || [];

  console.log(`Step 2: Loading ${posts.length} posts with real photos...`);
  let inserted = 0;
  for (const post of posts) {
    const cleanCaption = post.captionPrompt
      ? post.captionPrompt
          .replace(/First person\. Isaac Bullock's voice.*?\n\n/s, "")
          .replace(/Hard Rock Rising 2026: runner-up.*?Solarus Sunpower\./s, "")
          .replace(/Book WILDNOFF.*?for the receipts\./s, "")
          .replace(/Tag @isaacbullockk and @wildnoff\./g, "")
          .trim()
      : post.topic;

    await db.insert(contentPosts).values({
      userId,
      title: post.topic,
      caption: cleanCaption || post.topic,
      type: "social",
      status: "scheduled",
      date: new Date(post.date),
      imageUrl: post.imagePath || post.imageUrl || null,
    });
    inserted++;
  }
  console.log(`   ✅ Inserted ${inserted} posts\n`);

  // STEP 3: Get oldest post and publish NOW
  const upcoming = await db.select()
    .from(contentPosts)
    .where(and(eq(contentPosts.userId, userId), eq(contentPosts.status, "scheduled")))
    .orderBy(contentPosts.date)
    .limit(1);

  if (upcoming.length === 0) {
    console.error("❌ No posts to publish");
    process.exit(1);
  }

  const post = upcoming[0];
  console.log(`Step 3: Publishing NOW`);
  console.log(`   📋 ${post.title}`);
  console.log(`   🖼️  ${post.imageUrl || "no image"}\n`);

  const platforms = ["instagram", "linkedin"] as const;
  let publishedCount = 0;

  for (const platform of platforms) {
    try {
      console.log(`🚀 ${platform}...`);
      const target = await resolveTarget(userId, { platform });
      if (!target) {
        console.log(`   ⚠️  No ${platform} account connected`);
        continue;
      }

      let imageUrl = post.imageUrl ?? undefined;
      if (imageUrl && imageUrl.includes("pollinations.ai")) {
        console.log("   ⚠️  Skipping Pollinations URL — Instagram needs real photos");
        imageUrl = undefined;
      }
      if (imageUrl && imageUrl.startsWith("/")) {
        console.log(`   📸 Real photo: ${imageUrl.split("/").pop()}`);
      }

      const result = await publishPost(target, post.caption, imageUrl);

      if (result.success) {
        console.log(`   ✅ Published! ID: ${result.postId || "N/A"}`);
        publishedCount++;
      } else {
        console.log(`   ❌ ${result.error}`);
      }
    } catch (err) {
      console.log(`   💥 ${(err as Error).message}`);
    }
  }

  if (publishedCount > 0) {
    await db.update(contentPosts).set({ status: "published" }).where(eq(contentPosts.id, post.id));
    await db.insert(analyticsEvents).values({
      userId,
      type: "instagram_published",
      title: "Reset and post",
      description: `"${post.title}" published to ${publishedCount} platform(s)`,
      agentColor: "#10B981",
      agentName: "Manual",
    });
    console.log(`\n🎉 SUCCESS — Published to ${publishedCount} platform(s)`);
  } else {
    console.log(`\n❌ FAILED — No platforms published`);
  }
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
