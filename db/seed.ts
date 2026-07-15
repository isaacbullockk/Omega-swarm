import { db } from "./connection.ts";
import { brandVoices, viralVideos, contentAssets, socialAccounts } from "./schema.ts";

export async function seed() {
  console.log("🌱 Seeding database...");

  // Seed brand voice
  const existingVoice = await db.select().from(brandVoices).limit(1);
  if (existingVoice.length === 0) {
    await db.insert(brandVoices).values({
      name: "Isaac's Brand Voice",
      tone: "Soulful, confident, community-driven",
      description: "Isaac's voice blends reflective wisdom with infectious energy. He speaks like a mentor who's also your biggest fan — the friend who pushes you to dream bigger while keeping you grounded. His content feels intimate but universal, mixing personal storytelling with collective ambition. The tone shifts seamlessly between late-night introspection and festival-ready hype. He's unapologetically passionate about music, community, and creating moments that connect people. No corporate speak — just real talk, soulful vibes, and genuine belief in the power of collective creativity.",
      samples: ["Wildnoff Collective mission statement", "Instagram captions", "YouTube video descriptions"],
    });
    console.log("✅ Brand voice seeded");
  }

  // Seed viral videos
  const existingVideos = await db.select().from(viralVideos).limit(1);
  if (existingVideos.length === 0) {
    await db.insert(viralVideos).values([
      { title: "Stage Energy", account: "@wildnoff", caption: "The live experience is where the magic happens ✨", hashtags: ["#WildnoffCollective","#LiveMusic"], videoUrl: "/viral-studio/viral_reel_1.mp4", status: "ready" },
      { title: "Behind the Scenes", account: "@isaacbullockk", caption: "Real talk: the best ideas come when nobody's watching 🎶", hashtags: ["#BehindTheScenes","#StudioLife"], videoUrl: "/viral-studio/viral_reel_2.mp4", status: "ready" },
      { title: "Festival Vibes", account: "@kyakuwamusic", caption: "When the sun sets and the bass drops... that's when we come alive 🌅🎵", hashtags: ["#KyakuwaMusic","#FestivalSeason"], videoUrl: "/viral-studio/viral_reel_3.mp4", status: "ready" },
    ]);
    console.log("✅ Viral videos seeded");
  }

  // Seed content assets
  const existingAssets = await db.select().from(contentAssets).limit(1);
  if (existingAssets.length === 0) {
    await db.insert(contentAssets).values([
      { name: "Forest Adventure Reel", type: "video", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&h=640&fit=crop", tags: ["nature","outdoors","adventure"], account: "@wildnoff" },
      { name: "Mountain Sunrise", type: "image", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=640&fit=crop", tags: ["landscape","sunrise","mountains"], account: "@wildnoff" },
      { name: "Studio Session BTS", type: "video", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=640&fit=crop", tags: ["music","studio","behind-the-scenes"], account: "@kyakuwamusic" },
      { name: "Album Cover Concept", type: "image", url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop", tags: ["music","cover-art","dark"], account: "@kyakuwamusic" },
      { name: "Product Showcase", type: "image", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=640&fit=crop", tags: ["product","lifestyle","minimal"], account: "@isaacbullockk" },
      { name: "City Lights Vlog", type: "video", url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=640&h=640&fit=crop", tags: ["city","night","vlog"], account: "@isaacbullockk" },
    ]);
    console.log("✅ Content assets seeded");
  }

  // Seed social accounts
  const existingSocial = await db.select().from(socialAccounts).limit(1);
  if (existingSocial.length === 0) {
    await db.insert(socialAccounts).values([
      { platform: "instagram", handle: "@wildnoff", accountName: "Wildnoff Collective" },
      { platform: "instagram", handle: "@kyakuwamusic", accountName: "Kyakuwa Music" },
      { platform: "instagram", handle: "@isaacbullockk", accountName: "Isaac Bullock Kintu" },
    ]);
    console.log("✅ Social accounts seeded");
  }

  console.log("🎉 Database seeded successfully!");
}

// Allow running standalone: npx tsx db/seed.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(console.error);
}
