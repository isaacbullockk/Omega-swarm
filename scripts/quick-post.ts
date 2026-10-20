/**
 * QUICK POST — Publish immediately to Instagram + LinkedIn
 *
 * Usage:
 *   npx tsx scripts/quick-post.ts "Your caption here"
 *   npx tsx scripts/quick-post.ts --mission ib-001
 *   npx tsx scripts/quick-post.ts --photo /tmp/fb-assets/photos/xxx.jpg
 *
 * Posts directly without waiting for the scheduler.
 */

import { readFileSync, existsSync } from "fs";
import { resolveTarget, publishPost } from "../api/socialPublish";

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";

async function main() {
  const args = process.argv.slice(2);
  let caption = "";
  let imagePath: string | undefined;
  let missionId: string | undefined;

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--mission" && args[i + 1]) {
      missionId = args[i + 1];
      i++;
    } else if (args[i] === "--photo" && args[i + 1]) {
      imagePath = args[i + 1];
      i++;
    } else if (!caption && !args[i].startsWith("--")) {
      caption = args[i];
    }
  }

  console.log("\n=== OMEGA SWARM — QUICK POST ===\n");

  // If mission ID provided, load from mission JSON
  if (missionId) {
    const missionFile = "/tmp/mission-isaac-bullock.json";
    if (!existsSync(missionFile)) {
      console.error("❌ Mission file not found. Run: npm run mission:isaac");
      process.exit(1);
    }
    const mission = JSON.parse(readFileSync(missionFile, "utf-8"));
    const post = mission.schedule?.find((p: any) => p.id === missionId);
    if (!post) {
      console.error(`❌ Mission post ${missionId} not found`);
      process.exit(1);
    }
    caption = post.captionPrompt;
    imagePath = post.imagePath;
    console.log(`📋 Loaded mission post: ${missionId}`);
    console.log(`📝 Topic: ${post.topic}`);
  }

  if (!caption) {
    console.error("❌ No caption provided. Usage:");
    console.error("   npx tsx scripts/quick-post.ts \"Your caption\"");
    console.error("   npx tsx scripts/quick-post.ts --mission ib-001");
    process.exit(1);
  }

  // Extract real caption from prompt (remove instructions)
  const cleanCaption = caption
    .split("Tag @isaacbullockk")[0]
    .replace(/First person\. Isaac Bullock's voice\. English by default.*?\n\n/s, "")
    .replace(/Hard Rock Rising 2026: runner-up.*?Raised 1M euros for Solarus Sunpower\./s, "")
    .replace(/Book WILDNOFF.*?isaacbullockk for the receipts\./s, "")
    .trim();

  const finalCaption = cleanCaption || caption;

  console.log(`📝 Caption (${finalCaption.length} chars):`);
  console.log(`   ${finalCaption.slice(0, 100)}...\n`);

  // Determine image URL
  let imageUrl: string | undefined;
  if (imagePath && existsSync(imagePath)) {
    console.log(`🖼️  Using real photo: ${imagePath.split("/").pop()}`);
    // For Instagram, we need a public URL. Upload to a temporary hosting or use data URL approach
    // For now, we'll try to use the file path (may not work for Instagram without public URL)
    imageUrl = imagePath;
  } else {
    console.log("⚠️  No image provided — text-only posts for LinkedIn, Instagram needs image");
  }

  const platforms: Array<{ name: string; platform: "instagram" | "linkedin" | "facebook" }> = [
    { name: "Instagram", platform: "instagram" },
    { name: "LinkedIn", platform: "linkedin" },
  ];

  const results: Array<{ platform: string; success: boolean; error?: string; postId?: string }> = [];

  for (const { name, platform } of platforms) {
    try {
      console.log(`\n🚀 Publishing to ${name}...`);

      if (platform === "instagram" && !imageUrl) {
        console.log(`   ⚠️  Skipped — Instagram requires an image`);
        results.push({ platform: name, success: false, error: "No image for Instagram" });
        continue;
      }

      const target = await resolveTarget("system", { platform });
      if (!target) {
        console.log(`   ⚠️  No connected ${name} account found`);
        results.push({ platform: name, success: false, error: "No connected account" });
        continue;
      }

      const pub = await publishPost(target, finalCaption, imageUrl);
      if (pub.success) {
        console.log(`   ✅ Published! Post ID: ${pub.postId || "N/A"}`);
        console.log(`   🔗 Permalink: ${pub.permalink || "N/A"}`);
        results.push({ platform: name, success: true, postId: pub.postId, error: pub.error });
      } else {
        console.log(`   ❌ Failed: ${pub.error}`);
        results.push({ platform: name, success: false, error: pub.error });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.log(`   💥 Crash: ${msg}`);
      results.push({ platform: name, success: false, error: msg });
    }
  }

  // Summary
  console.log("\n=== RESULTS ===");
  const ok = results.filter((r) => r.success).length;
  const fail = results.filter((r) => !r.success).length;
  console.log(`✅ ${ok} published | ❌ ${fail} failed`);

  for (const r of results) {
    const icon = r.success ? "✅" : "❌";
    console.log(`   ${icon} ${r.platform}${r.postId ? ` → ${r.postId}` : ""}${r.error ? ` (${r.error})` : ""}`);
  }

  if (ok === 0) {
    console.log("\n💡 Tips:");
    console.log("   • Check INSTAGRAM_ACCESS_TOKEN env var");
    console.log("   • Run: npm run verify:meta");
    console.log("   • Check: npm run verify:integrity");
  }
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
