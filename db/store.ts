/**
 * Simple JSON-file backed store for campaigns, missions, and outputs.
 * Replace with MySQL/Drizzle in production.
 */
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");

/* ─── Campaign ─── */
export interface Campaign {
  id: string;
  title: string;
  objective: string;
  budget: string;
  timeline: string;
  mode: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  outputs: AgentOutput[];
}

export interface AgentOutput {
  agentId: string;
  agentName: string;
  agentEmoji: string;
  status: "pending" | "running" | "completed" | "failed";
  output: string;
  startedAt?: string;
  completedAt?: string;
}

/* ─── Memory ─── */
export interface MemoryEntry {
  id: string;
  title: string;
  type: "win" | "loss" | "pattern";
  ctr: string;
  cpa: string;
  date: string;
  agents: string;
  confidence?: number;
}

/* ─── Brand Voice ─── */
export interface BrandVoice {
  id: string;
  tone: string;
  description: string;
  samples: string[];
  createdAt: string;
  updatedAt: string;
}

/* ─── Social Account ─── */
export interface SocialAccount {
  id: string;
  platform: "instagram" | "facebook" | "youtube";
  accountName: string;
  handle: string;
  connected: boolean;
  accessToken?: string;
  pageId?: string;
  connectedAt?: string;
}

/* ─── Viral Video ─── */
export interface ViralVideo {
  id: string;
  title: string;
  account: string;
  caption: string;
  hashtags: string[];
  videoUrl: string;
  status: "ready" | "posted" | "scheduled";
  createdAt: string;
  postedAt?: string;
  scheduledFor?: string;
}

/* ─── Content Asset ─── */
export interface ContentAsset {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  tags: string[];
  account: string;
  createdAt: string;
}

/* ─── Store Data ─── */
interface StoreData {
  campaigns: Campaign[];
  memories: MemoryEntry[];
  brandVoice: BrandVoice | null;
  socialAccounts: SocialAccount[];
  viralVideos: ViralVideo[];
  contentAssets: ContentAsset[];
}

const defaultData: StoreData = {
  campaigns: [],
  memories: [
    { id: "1", title: "Sustainable fitness gear launch", type: "win", ctr: "4.2%", cpa: "$16.80", date: "2025-07-01", agents: "✍️ 📱 🎨" },
    { id: "2", title: "Premium SaaS onboarding flow", type: "win", ctr: "3.8%", cpa: "$12.40", date: "2025-07-02", agents: "💼 📊 ✍️" },
    { id: "3", title: "Holiday flash sale campaign", type: "loss", ctr: "1.9%", cpa: "$34.20", date: "2025-07-03", agents: "📱 ✍️" },
    { id: "4", title: "B2B lead gen webinar series", type: "win", ctr: "5.1%", cpa: "$22.10", date: "2025-07-04", agents: "🔍 💼 🎨" },
    { id: "5", title: "Gen Z skincare brand awareness", type: "win", ctr: "6.7%", cpa: "$8.90", date: "2025-07-05", agents: "📱 🎨 📊" },
    { id: "6", title: "Enterprise software demo funnel", type: "win", ctr: "4.5%", cpa: "$45.00", date: "2025-07-06", agents: "💼 🔍 ✍️" },
  ],
  brandVoice: null,
  socialAccounts: [],
  viralVideos: [
    {
      id: "viral_1",
      title: "Stage Energy",
      account: "@wildnoff",
      caption: "The live experience is where the magic happens ✨\n\nDrop a 🔥 if you've felt that electricity in the room.\n\n#WildnoffCollective #LiveMusic #PerformanceEnergy #MusicCommunity #AfroFusion #ConcertVibes #IsaacBullockKintu #Wildnoff",
      hashtags: ["#WildnoffCollective", "#LiveMusic", "#PerformanceEnergy", "#MusicCommunity", "#AfroFusion", "#ConcertVibes", "#IsaacBullockKintu", "#Wildnoff"],
      videoUrl: "/viral-studio/viral_reel_1.mp4",
      status: "ready",
      createdAt: new Date().toISOString(),
    },
    {
      id: "viral_2",
      title: "Behind the Scenes",
      account: "@isaacbullockk",
      caption: "Real talk: the best ideas come when nobody's watching 🎶\n\nJust me, the keys, and whatever the moment brings. No filters. No scripts. Just soul.\n\nWhat does your creative space look like? Show me 👇\n\n#BehindTheScenes #StudioLife #MusicCreation #WildnoffCollective #KyakuwaMusic #SoulfulSounds #IsaacBullockKintu #CreativeProcess",
      hashtags: ["#BehindTheScenes", "#StudioLife", "#MusicCreation", "#WildnoffCollective", "#KyakuwaMusic", "#SoulfulSounds", "#IsaacBullockKintu", "#CreativeProcess"],
      videoUrl: "/viral-studio/viral_reel_2.mp4",
      status: "ready",
      createdAt: new Date().toISOString(),
    },
    {
      id: "viral_3",
      title: "Festival Vibes",
      account: "@kyakuwamusic",
      caption: "When the sun sets and the bass drops... that's when we come alive 🌅🎵\n\nNothing connects people like music. Nothing. Tag someone you want to experience this with.\n\n#KyakuwaMusic #FestivalSeason #SunsetVibes #MusicFestival #CommunityFirst #LiveMusic #WildnoffCollective #AfroFusion #MusicConnects",
      hashtags: ["#KyakuwaMusic", "#FestivalSeason", "#SunsetVibes", "#MusicFestival", "#CommunityFirst", "#LiveMusic", "#WildnoffCollective", "#AfroFusion", "#MusicConnects"],
      videoUrl: "/viral-studio/viral_reel_3.mp4",
      status: "ready",
      createdAt: new Date().toISOString(),
    },
  ],
  contentAssets: [],
};

function load(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return {
        ...defaultData,
        ...parsed,
        brandVoice: parsed.brandVoice ?? null,
        socialAccounts: parsed.socialAccounts ?? [],
        viralVideos: parsed.viralVideos ?? [],
        contentAssets: parsed.contentAssets ?? [],
      };
    }
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(defaultData));
}

function save(data: StoreData) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const store = load();

/* ─── Campaign helpers ─── */
export function getCampaigns(): Campaign[] {
  return store.campaigns;
}

export function getCampaign(id: string): Campaign | undefined {
  return store.campaigns.find((c) => c.id === id);
}

export function addCampaign(campaign: Campaign) {
  store.campaigns.unshift(campaign);
  save(store);
  return campaign;
}

export function updateCampaign(id: string, updates: Partial<Campaign>) {
  const idx = store.campaigns.findIndex((c) => c.id === id);
  if (idx >= 0) {
    store.campaigns[idx] = { ...store.campaigns[idx], ...updates };
    save(store);
  }
  return store.campaigns[idx];
}

/* ─── Memory helpers ─── */
export function getMemories(): MemoryEntry[] {
  return store.memories;
}

export function addMemory(entry: MemoryEntry) {
  store.memories.unshift(entry);
  save(store);
  return entry;
}

/* ─── Brand Voice helpers ─── */
export function getBrandVoice(): BrandVoice | null {
  return store.brandVoice;
}

export function saveBrandVoice(data: Omit<BrandVoice, "id" | "createdAt" | "updatedAt">): BrandVoice {
  const now = new Date().toISOString();
  if (store.brandVoice) {
    store.brandVoice = {
      ...store.brandVoice,
      ...data,
      updatedAt: now,
    };
  } else {
    store.brandVoice = {
      id: `bv_${Date.now()}`,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }
  save(store);
  return store.brandVoice;
}

/* ─── Social Account helpers ─── */
export function getSocialAccounts(): SocialAccount[] {
  return store.socialAccounts;
}

export function addSocialAccount(account: SocialAccount) {
  store.socialAccounts.push(account);
  save(store);
  return account;
}

export function updateSocialAccount(id: string, updates: Partial<SocialAccount>) {
  const idx = store.socialAccounts.findIndex((a) => a.id === id);
  if (idx >= 0) {
    store.socialAccounts[idx] = { ...store.socialAccounts[idx], ...updates };
    save(store);
  }
  return store.socialAccounts[idx];
}

export function disconnectSocialAccount(id: string) {
  const idx = store.socialAccounts.findIndex((a) => a.id === id);
  if (idx >= 0) {
    store.socialAccounts[idx].connected = false;
    store.socialAccounts[idx].accessToken = undefined;
    save(store);
  }
  return store.socialAccounts[idx];
}

/* ─── Viral Video helpers ─── */
export function getViralVideos(): ViralVideo[] {
  return store.viralVideos;
}

export function getViralVideosByAccount(account: string): ViralVideo[] {
  return store.viralVideos.filter((v) => v.account === account);
}

export function addViralVideo(video: ViralVideo) {
  store.viralVideos.unshift(video);
  save(store);
  return video;
}

export function updateViralVideoStatus(
  id: string,
  status: "ready" | "posted" | "scheduled",
  postedAt?: string,
  scheduledFor?: string
) {
  const idx = store.viralVideos.findIndex((v) => v.id === id);
  if (idx >= 0) {
    store.viralVideos[idx].status = status;
    if (postedAt) store.viralVideos[idx].postedAt = postedAt;
    if (scheduledFor) store.viralVideos[idx].scheduledFor = scheduledFor;
    save(store);
  }
  return store.viralVideos[idx];
}

export function updateViralVideoCaption(id: string, caption: string) {
  const idx = store.viralVideos.findIndex((v) => v.id === id);
  if (idx >= 0) {
    store.viralVideos[idx].caption = caption;
    save(store);
  }
  return store.viralVideos[idx];
}

/* ─── Content Asset helpers ─── */
export function getContentAssets(): ContentAsset[] {
  return store.contentAssets;
}

export function addContentAsset(asset: ContentAsset) {
  store.contentAssets.unshift(asset);
  save(store);
  return asset;
}

export function deleteContentAsset(id: string) {
  const idx = store.contentAssets.findIndex((a) => a.id === id);
  if (idx >= 0) {
    const removed = store.contentAssets.splice(idx, 1)[0];
    save(store);
    return removed;
  }
  return undefined;
}

export function searchContentAssets(
  query?: string,
  tags?: string[],
  account?: string
): ContentAsset[] {
  return store.contentAssets.filter((asset) => {
    if (account && asset.account !== account) return false;
    if (tags && tags.length > 0 && !tags.some((t) => asset.tags.includes(t))) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });
}
