import { db } from "./connection.ts";
import { campaigns, campaignOutputs, brandVoices, contentAssets, viralVideos, socialAccounts } from "./schema.ts";
import { eq } from "drizzle-orm";

/* ─── Campaigns ─── */
export async function createCampaign(data: any) {
  const result = await db.insert(campaigns).values({
    title: data.objective?.slice(0, 80) || "Untitled Campaign",
    objective: data.objective || "",
    budget: data.budget || "",
    timeline: data.timeline || "",
    status: "running",
    mode: data.mode || "standard",
    progress: Math.floor(Math.random() * 30) + 10,
    agentsDeployed: 12,
    tasksCompleted: Math.floor(Math.random() * 20),
    tasksTotal: 34,
    roi: "+" + (Math.floor(Math.random() * 40) + 10) + "%",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  }).returning();
  return result[0];
}

export async function getCampaigns() {
  return await db.select().from(campaigns).orderBy(campaigns.createdAt);
}

export async function getCampaignById(id: number) {
  const results = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return results[0] || null;
}

export async function updateCampaignStatus(id: number, status: string) {
  await db.update(campaigns).set({ status, updatedAt: new Date() }).where(eq(campaigns.id, id));
}

/* ─── Campaign Outputs ─── */
export async function createCampaignOutput(data: any) {
  await db.insert(campaignOutputs).values(data);
}

export async function getCampaignOutputs(campaignId: number) {
  return await db.select().from(campaignOutputs).where(eq(campaignOutputs.campaignId, campaignId));
}

/* ─── Brand Voice ─── */
export async function getBrandVoice(userId = 1) {
  const results = await db.select().from(brandVoices).limit(1);
  if (results.length === 0) {
    // Seed default brand voice
    return seedDefaultBrandVoice();
  }
  return results[0];
}

async function seedDefaultBrandVoice() {
  const result = await db.insert(brandVoices).values({
    name: "Isaac's Brand Voice",
    tone: "Soulful, confident, community-driven",
    description: "Isaac's voice blends reflective wisdom with infectious energy. He speaks like a mentor who's also your biggest fan — the friend who pushes you to dream bigger while keeping you grounded.",
    samples: ["Wildnoff Collective mission statement", "Instagram captions", "YouTube video descriptions"],
  }).returning();
  return result[0];
}

export async function saveBrandVoice(data: any) {
  const existing = await db.select().from(brandVoices).limit(1);
  if (existing.length > 0) {
    await db.update(brandVoices)
      .set({ tone: data.tone, description: data.description, samples: data.samples, updatedAt: new Date() })
      .where(eq(brandVoices.id, existing[0].id));
    return { ...existing[0], ...data };
  }
  const result = await db.insert(brandVoices).values(data).returning();
  return result[0];
}

/* ─── Content Assets ─── */
export async function getContentAssets() {
  const assets = await db.select().from(contentAssets);
  if (assets.length === 0) {
    return seedDefaultAssets();
  }
  return assets;
}

async function seedDefaultAssets() {
  const defaults = [
    { name: "Forest Adventure Reel", type: "video", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=640&h=640&fit=crop", tags: ["nature","outdoors","adventure"], account: "@wildnoff" },
    { name: "Mountain Sunrise", type: "image", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=640&fit=crop", tags: ["landscape","sunrise","mountains"], account: "@wildnoff" },
    { name: "Studio Session BTS", type: "video", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=640&h=640&fit=crop", tags: ["music","studio","behind-the-scenes"], account: "@kyakuwamusic" },
    { name: "Album Cover Concept", type: "image", url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop", tags: ["music","cover-art","dark"], account: "@kyakuwamusic" },
    { name: "Product Showcase", type: "image", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=640&fit=crop", tags: ["product","lifestyle","minimal"], account: "@isaacbullockk" },
    { name: "City Lights Vlog", type: "video", url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=640&h=640&fit=crop", tags: ["city","night","vlog"], account: "@isaacbullockk" },
  ];
  await db.insert(contentAssets).values(defaults);
  return await db.select().from(contentAssets);
}

export async function createContentAsset(data: any) {
  const result = await db.insert(contentAssets).values(data).returning();
  return result[0];
}

/* ─── Viral Videos ─── */
export async function getViralVideos() {
  const videos = await db.select().from(viralVideos);
  if (videos.length === 0) {
    return seedDefaultVideos();
  }
  return videos;
}

async function seedDefaultVideos() {
  const defaults = [
    { title: "Stage Energy", account: "@wildnoff", caption: "The live experience is where the magic happens ✨", hashtags: ["#WildnoffCollective","#LiveMusic"], videoUrl: "/viral-studio/viral_reel_1.mp4", status: "ready" },
    { title: "Behind the Scenes", account: "@isaacbullockk", caption: "Real talk: the best ideas come when nobody's watching 🎶", hashtags: ["#BehindTheScenes","#StudioLife"], videoUrl: "/viral-studio/viral_reel_2.mp4", status: "ready" },
    { title: "Festival Vibes", account: "@kyakuwamusic", caption: "When the sun sets and the bass drops... that's when we come alive 🌅🎵", hashtags: ["#KyakuwaMusic","#FestivalSeason"], videoUrl: "/viral-studio/viral_reel_3.mp4", status: "ready" },
  ];
  await db.insert(viralVideos).values(defaults);
  return await db.select().from(viralVideos);
}

export async function updateViralVideoStatus(id: number, status: string) {
  await db.update(viralVideos).set({ status }).where(eq(viralVideos.id, id));
}

/* ─── Social Accounts ─── */
export async function getSocialAccounts() {
  return await db.select().from(socialAccounts);
}

export async function createSocialAccount(data: any) {
  const result = await db.insert(socialAccounts).values(data).returning();
  return result[0];
}

export async function deleteSocialAccount(id: number) {
  await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
}
