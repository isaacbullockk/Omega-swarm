/**
 * POST NOW — Publish the next scheduled post immediately
 *
 * Bypasses the autopilot scheduler. Finds the oldest scheduled post
 * and publishes it RIGHT NOW to all connected platforms.
 *
 * Usage:
 *   npx tsx scripts/post-now.ts
 */

import { db, isPostgresAvailable } from "../db/connection";
import { contentPosts, automationSettings, socialAccounts, analyticsEvents } from "../db/schema";
import { eq, and, lte } from "drizzle-orm";
import { resolveTarget, publishPost } from "../api/socialPublish";

async function main() {
  console.log("\n=== POST NOW ===\n");

  if (!isPostgresAvailable() || !db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  // Get the oldest scheduled post
  const posts = await db.select()
    .from(contentPosts)
    .where(eq(contentPosts.status, "scheduled"))
    .orderBy(contentPosts.date)
    .limit(1);

  if (posts.length === 0) {
    console.error("❌ No scheduled posts found. Run: npm run mission:load");
    process.exit(1);
  }

  const post = posts[0];
  console.log(`📋 Post: ${post.title}`);
  console.log(`📝 Caption: ${post.caption.slice(0, 80)}...`);
  console.log(`📅 Scheduled for: ${post.date.toLocaleString()}`);
  console.log(`🖼️  Image: ${post.imageUrl || "none"}\n`);

  // Publish to each connected platform
  const platforms = ["instagram", "linkedin"] as const;
  let publishedCount = 0;

  for (const platform of platforms) {
    try {
      console.log(`🚀 Publishing to ${platform}...`);

      const target = await resolveTarget(post.userId, { platform });
      if (!target) {
        console.log(`   ⚠️  No connected ${platform} account`);
        continue;
      }

      // Pollinations URLs are unreliable for Meta — use a stable public image instead
      let imageUrl = post.imageUrl ?? undefined;
      if (imageUrl && imageUrl.includes("pollinations.ai")) {
        console.log("   ⚠️  Pollinations URL unreliable — switching to stable test image");
        imageUrl = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1080&h=1080&fit=crop";
      }

      const result = await publishPost(target, post.caption, imageUrl);

      if (result.success) {
        console.log(`   ✅ Published! ID: ${result.postId || "N/A"}`);
        console.log(`   🔗 ${result.permalink || "N/A"}`);
        publishedCount++;

        if (platform === "instagram" && result.postId) {
          await db.update(contentPosts)
            .set({ instagramPostId: result.postId })
            .where(eq(contentPosts.id, post.id));
        }
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (err) {
      console.log(`   💥 Error: ${(err as Error).message}`);
    }
  }

  // Update post status
  if (publishedCount > 0) {
    await db.update(contentPosts)
      .set({ status: "published" })
      .where(eq(contentPosts.id, post.id));

    await db.insert(analyticsEvents).values({
      userId: post.userId,
      clientId: post.clientId,
      type: "instagram_published",
      title: "Manual post now",
      description: `"${post.title}" published to ${publishedCount} platform(s)`,
      agentColor: "#10B981",
      agentName: "Manual",
    });

    console.log(`\n✅ DONE — Published to ${publishedCount} platform(s)`);
  } else {
    console.log(`\n❌ FAILED — No platforms published`);
    console.log("   Check: npm run verify:meta");
    console.log("   Check: npm run verify:integrity");
  }
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
