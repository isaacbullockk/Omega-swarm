/**
 * Unified JSON-file backed store for Omega Swarm.
 * All data persists to data/store.json across server restarts.
 */
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");

/* ─── Types ─── */

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

export interface BrandVoice {
  id: string;
  tone: string;
  description: string;
  samples: string[];
  createdAt: string;
  updatedAt: string;
}

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

export interface ContentAsset {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  tags: string[];
  account: string;
  createdAt: string;
}

/** A posted social post (replaces in-memory postedContent) */
export interface ContentPost {
  id: string;
  title: string;
  caption: string;
  type: "social" | "video" | "ad" | "blog";
  status: "published" | "draft" | "scheduled";
  date: string;
  account: string;
  imageUrl?: string;
  instagramPostId?: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
}

/** A generated AI video (replaces in-memory generatedVideos) */
export interface GeneratedVideo {
  id: string;
  title: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  aspectRatio: string;
  provider: string;
  status: "ready" | "generating" | "failed";
  date: string;
  createdAt: string;
}

/** Analytics event for activity feed */
export interface AnalyticsEvent {
  id: string;
  type: "post_created" | "video_generated" | "campaign_started" | "campaign_completed" | "agent_chat" | "instagram_published";
  title: string;
  description: string;
  agentColor?: string;
  agentName?: string;
  timestamp: string;
}

/** Booking system types */
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  category: string;
}

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
}

/** Client / Project type for managing brand accounts */
export interface Client {
  id: string;
  name: string;
  handle: string;
  tagline: string;
  tier: number;
  status: "active" | "paused" | "archived";
  bioFull: string;
  bioMedium: string;
  bioShort: string;
  location: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  photoHeadshot?: string;
  photoPerformance?: string;
  photoCasual?: string;
  website?: string;
  socialLinks: Record<string, string>;
  brandHierarchy: { tier: number; brand: string; role: string; handle: string; url: string }[];
  namingRules: Record<string, { rule: string; wrong: string; right: string }>;
  toneWords: string[];
  bannedPhrases: string[];
  contentPillars: { name: string; description: string; cta: string; platforms: string[] }[];
  storyBank: { title: string; description: string }[];
  calendarEntries: { week: number; day: string; platform: string; pillar: string; content: string; cta: string }[];
  createdAt: string;
  updatedAt: string;
}

/* ─── User-uploaded asset ─── */
export interface Asset {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "reference";
  dataUrl?: string;
  url?: string;
  description?: string;
  tags: string[];
  usedIn: string[]; // post IDs that reference this asset
  createdAt: string;
}

/* ─── Store Data Shape ─── */
interface StoreData {
  campaigns: Campaign[];
  memories: MemoryEntry[];
  brandVoice: BrandVoice | null;
  socialAccounts: SocialAccount[];
  viralVideos: ViralVideo[];
  contentAssets: ContentAsset[];
  contentPosts: ContentPost[];
  generatedVideos: GeneratedVideo[];
  analyticsEvents: AnalyticsEvent[];
  services: Service[];
  bookings: Booking[];
  clients: Client[];
  assets: Asset[];
}

const defaultData: StoreData = {
  campaigns: [],
  memories: [],
  brandVoice: null,
  socialAccounts: [],
  viralVideos: [],
  contentAssets: [],
  contentPosts: [],
  generatedVideos: [],
  analyticsEvents: [],
  services: [],
  bookings: [],
  clients: [
    {
      id: "client_isaac_bullock",
      name: "Isaac Bullock",
      handle: "@isaacbullockk",
      tagline: "The people who build bridges between worlds are the ones who change them.",
      tier: 1,
      status: "active",
      bioFull: "Isaac Bullock fled Uganda as a child and built a life in the Netherlands that most people only imagine. He spent years as a strategist at Accenture before the music he'd been making in secret won him an ISC Award with a jury that included Dua Lipa, Coldplay, and Tom Waits. Today he's an award-winning singer-songwriter, a TEDx speaker, and the founder of six ventures — from the 800+ musician collective Wildnoff to the recording project Kyakuwa. His work sits at the intersection of music, migration, and social innovation. He lives in the Netherlands and performs wherever stories need to be told.",
      bioMedium: "Ex-refugee. Ex-Accenture strategist. ISC award-winning singer-songwriter (jury: Dua Lipa, Coldplay, Tom Waits). TEDx speaker. Founder of Wildnoff (800+ musicians) and five more ventures. I build bridges between worlds — and turn the crossing into art.",
      bioShort: "Ex-refugee → Accenture → ISC Award → TEDx → 6 ventures. Building bridges between worlds. @isaacbullockk",
      location: "The Netherlands",
      primaryColor: "#D97706",
      secondaryColor: "#1E3A5F",
      accentColor: "#F5F5F0",
      website: "https://isaacbullock.org",
      socialLinks: {
        instagram: "https://instagram.com/isaacbullockk",
        twitter: "https://twitter.com/isaacbullockk",
        linkedin: "https://linkedin.com/in/isaacbullockk",
        youtube: "https://youtube.com/@isaacbullockk",
        tiktok: "https://tiktok.com/@isaacbullockk",
        spotify: "https://open.spotify.com/artist/kyakuwa",
      },
      brandHierarchy: [
        { tier: 1, brand: "Isaac Bullock", role: "The story, the person, the speaking funnel", handle: "@isaacbullockk", url: "isaacbullock.org" },
        { tier: 2, brand: "Kyakuwa", role: "Recording project — releases out now", handle: "@kyakuwamusic", url: "kyakuwa.com" },
        { tier: 3, brand: "Wildnoff", role: "Live collective — 800+ musicians", handle: "@wildnoff", url: "wildnoff.nl" },
        { tier: 4, brand: "Sessiecat", role: "Session musician brand — LIVE at sessiecat.com", handle: "@sessiecat", url: "sessiecat.com" },
      ],
      namingRules: {
        handle: { rule: "@isaacbullockk everywhere", wrong: "@isaacbullock", right: "@isaacbullockk" },
        name: { rule: "Isaac Bullock — first + last", wrong: "I. Bullock, Isaac B.", right: "Isaac Bullock" },
        location: { rule: "Based in the Netherlands", wrong: "Amsterdam, NL, Holland", right: "The Netherlands" },
        accenture: { rule: "Former strategist at Accenture", wrong: "Ex-Accenture consultant", right: "Former strategist at Accenture" },
        isc: { rule: "ISC Award-winning singer-songwriter (2020)", wrong: "Won a music award", right: "ISC Award-winning singer-songwriter (2020)" },
        tedx: { rule: "TEDx speaker", wrong: "Gave a TED talk", right: "TEDx speaker" },
        wildnoff: { rule: "800+ musician collective", wrong: "Big music group", right: "800+ musician collective" },
      },
      toneWords: ["Bridge-builder", "Warm", "Sharp", "Generous"],
      bannedPhrases: ["So grateful to be...", "Believe in yourself", "Link in bio", "DM for bookings", "Humbled and honored..."],
      contentPillars: [
        { name: "The Music", description: "What Isaac makes. Releases, sessions, collaborations.", cta: "Listen / Watch", platforms: ["Instagram", "TikTok", "YouTube", "Spotify"] },
        { name: "The Story", description: "Refugee-to-strategist-to-musician arc. Migration, identity, belonging.", cta: "Follow / Share", platforms: ["LinkedIn", "Instagram", "Medium", "press"] },
        { name: "The Craft", description: "How Isaac does it. Songwriting, studio, performance, running a collective.", cta: "Watch / Save", platforms: ["YouTube", "Instagram", "TikTok", "LinkedIn"] },
        { name: "The Ideas", description: "Music x social innovation. Speaking. Art + impact.", cta: "Book / Share", platforms: ["LinkedIn", "TEDx", "Medium", "press"] },
      ],
      storyBank: [
        { title: "The border crossing", description: "The night Isaac left Uganda, what he carried, what he left behind." },
        { title: "The Accenture desk", description: "The spreadsheet that made him quit. The song he wrote in the bathroom." },
        { title: "The ISC Award call", description: "Who called, what they said, the jury room story." },
        { title: "The first Wildnoff session", description: "12 musicians in a basement, no plan, magic." },
        { title: "The TEDx rehearsal", description: "The line he forgot on stage, the recovery." },
        { title: "The Kyakuwa recording", description: "The take that happened at 3am, the mistake that became the hook." },
        { title: "Home", description: "The moment the Netherlands stopped being 'where I live' and started being 'home.'" },
        { title: "The strategist mind", description: "How Accenture taught systems thinking — and why music broke the system." },
      ],
      calendarEntries: [
        { week: 1, day: "Mon", platform: "Instagram", pillar: "The Music", content: "The song I wrote in an Accenture bathroom — 30s clip", cta: "Listen on Spotify" },
        { week: 1, day: "Tue", platform: "LinkedIn", pillar: "The Story", content: "I was a strategist who made music in secret. Here's why I stopped hiding.", cta: "Follow" },
        { week: 1, day: "Wed", platform: "TikTok", pillar: "The Craft", content: "How I write a chorus in 10 minutes — process video", cta: "Watch full on YouTube" },
        { week: 1, day: "Thu", platform: "Instagram", pillar: "The Ideas", content: "800 musicians. One basement. No plan. This is Wildnoff.", cta: "Follow @wildnoff" },
        { week: 1, day: "Fri", platform: "LinkedIn", pillar: "The Music", content: "The song that made Dua Lipa's jury notice me — ISC story", cta: "Listen on Spotify" },
      ],
      createdAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
    },
  ],
  assets: [],
};

/* ─── Persistence ─── */

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
        contentPosts: parsed.contentPosts ?? [],
        generatedVideos: parsed.generatedVideos ?? [],
        analyticsEvents: parsed.analyticsEvents ?? [],
        services: parsed.services ?? [],
        bookings: parsed.bookings ?? [],
        clients: parsed.clients ?? defaultData.clients,
        assets: parsed.assets ?? [],
      };
    }
  } catch {
    // ignore — corrupted or missing file
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
export function getCampaigns(): Campaign[] { return store.campaigns; }
export function getCampaign(id: string): Campaign | undefined { return store.campaigns.find((c) => c.id === id); }
export function addCampaign(campaign: Campaign) { store.campaigns.unshift(campaign); save(store); return campaign; }
export function updateCampaign(id: string, updates: Partial<Campaign>) {
  const idx = store.campaigns.findIndex((c) => c.id === id);
  if (idx >= 0) { store.campaigns[idx] = { ...store.campaigns[idx], ...updates }; save(store); }
  return store.campaigns[idx];
}

/* ─── Memory helpers ─── */
export function getMemories(): MemoryEntry[] { return store.memories; }
export function addMemory(entry: MemoryEntry) { store.memories.unshift(entry); save(store); return entry; }

/* ─── Brand Voice helpers ─── */
export function getBrandVoice(): BrandVoice | null { return store.brandVoice; }
export function saveBrandVoice(data: Omit<BrandVoice, "id" | "createdAt" | "updatedAt">): BrandVoice {
  const now = new Date().toISOString();
  if (store.brandVoice) {
    store.brandVoice = { ...store.brandVoice, ...data, updatedAt: now };
  } else {
    store.brandVoice = { id: `bv_${Date.now()}`, ...data, createdAt: now, updatedAt: now };
  }
  save(store);
  return store.brandVoice;
}

/* ─── Social Account helpers ─── */
export function getSocialAccounts(): SocialAccount[] { return store.socialAccounts; }
export function addSocialAccount(account: SocialAccount) { store.socialAccounts.push(account); save(store); return account; }
export function updateSocialAccount(id: string, updates: Partial<SocialAccount>) {
  const idx = store.socialAccounts.findIndex((a) => a.id === id);
  if (idx >= 0) { store.socialAccounts[idx] = { ...store.socialAccounts[idx], ...updates }; save(store); }
  return store.socialAccounts[idx];
}
export function disconnectSocialAccount(id: string) {
  const idx = store.socialAccounts.findIndex((a) => a.id === id);
  if (idx >= 0) { store.socialAccounts[idx].connected = false; store.socialAccounts[idx].accessToken = undefined; save(store); }
  return store.socialAccounts[idx];
}

/* ─── Viral Video helpers ─── */
export function getViralVideos(): ViralVideo[] { return store.viralVideos; }
export function getViralVideosByAccount(account: string): ViralVideo[] { return store.viralVideos.filter((v) => v.account === account); }
export function addViralVideo(video: ViralVideo) { store.viralVideos.unshift(video); save(store); return video; }
export function updateViralVideoStatus(id: string, status: "ready" | "posted" | "scheduled", postedAt?: string, scheduledFor?: string) {
  const idx = store.viralVideos.findIndex((v) => v.id === id);
  if (idx >= 0) { store.viralVideos[idx].status = status; if (postedAt) store.viralVideos[idx].postedAt = postedAt; if (scheduledFor) store.viralVideos[idx].scheduledFor = scheduledFor; save(store); }
  return store.viralVideos[idx];
}
export function updateViralVideoCaption(id: string, caption: string) {
  const idx = store.viralVideos.findIndex((v) => v.id === id);
  if (idx >= 0) { store.viralVideos[idx].caption = caption; save(store); }
  return store.viralVideos[idx];
}

/* ─── Content Asset helpers ─── */
export function getContentAssets(): ContentAsset[] { return store.contentAssets; }
export function addContentAsset(asset: ContentAsset) { store.contentAssets.unshift(asset); save(store); return asset; }
export function deleteContentAsset(id: string) {
  const idx = store.contentAssets.findIndex((a) => a.id === id);
  if (idx >= 0) { const removed = store.contentAssets.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}
export function searchContentAssets(query?: string, tags?: string[], account?: string): ContentAsset[] {
  return store.contentAssets.filter((asset) => {
    if (account && asset.account !== account) return false;
    if (tags && tags.length > 0 && !tags.some((t) => asset.tags.includes(t))) return false;
    if (query) { const q = query.toLowerCase(); return asset.name.toLowerCase().includes(q) || asset.tags.some((t) => t.toLowerCase().includes(q)); }
    return true;
  });
}

/* ─── Content Post helpers (unified, persistent) ─── */
export function getContentPosts(): ContentPost[] { return store.contentPosts; }
export function addContentPost(post: ContentPost) { store.contentPosts.unshift(post); save(store); return post; }
export function updateContentPost(id: string, updates: Partial<ContentPost>) {
  const idx = store.contentPosts.findIndex((p) => p.id === id);
  if (idx >= 0) { store.contentPosts[idx] = { ...store.contentPosts[idx], ...updates }; save(store); }
  return store.contentPosts[idx];
}
export function deleteContentPost(id: string) {
  const idx = store.contentPosts.findIndex((p) => p.id === id);
  if (idx >= 0) { const removed = store.contentPosts.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}

/* ─── Generated Video helpers (unified, persistent) ─── */
export function getGeneratedVideos(): GeneratedVideo[] { return store.generatedVideos; }
export function addGeneratedVideo(video: GeneratedVideo) { store.generatedVideos.unshift(video); save(store); return video; }
export function updateGeneratedVideo(id: string, updates: Partial<GeneratedVideo>) {
  const idx = store.generatedVideos.findIndex((v) => v.id === id);
  if (idx >= 0) { store.generatedVideos[idx] = { ...store.generatedVideos[idx], ...updates }; save(store); }
  return store.generatedVideos[idx];
}
export function deleteGeneratedVideo(id: string) {
  const idx = store.generatedVideos.findIndex((v) => v.id === id);
  if (idx >= 0) { const removed = store.generatedVideos.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}

/* ─── Analytics Event helpers ─── */
export function getAnalyticsEvents(limit?: number): AnalyticsEvent[] {
  const events = store.analyticsEvents;
  return limit ? events.slice(0, limit) : events;
}
export function addAnalyticsEvent(event: AnalyticsEvent) {
  store.analyticsEvents.unshift(event);
  // Keep only last 500 events to prevent file bloat
  if (store.analyticsEvents.length > 500) store.analyticsEvents = store.analyticsEvents.slice(0, 500);
  save(store);
  return event;
}

/* ─── Service helpers ─── */
export function getServices(): Service[] { return store.services; }
export function getService(id: string): Service | undefined { return store.services.find((s) => s.id === id); }

/* ─── Booking helpers ─── */
export function getBookings(): Booking[] { return store.bookings; }
export function getBookingsByEmail(email: string): Booking[] { return store.bookings.filter((b) => b.clientEmail === email); }
export function getBooking(id: string): Booking | undefined { return store.bookings.find((b) => b.id === id); }
export function addBooking(booking: Booking) { store.bookings.unshift(booking); save(store); return booking; }
export function updateBookingStatus(id: string, status: Booking["status"]) {
  const idx = store.bookings.findIndex((b) => b.id === id);
  if (idx >= 0) { store.bookings[idx].status = status; save(store); }
  return store.bookings[idx];
}
export function deleteBooking(id: string) {
  const idx = store.bookings.findIndex((b) => b.id === id);
  if (idx >= 0) { const removed = store.bookings.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}

/* ─── Client helpers ─── */
export function getClients(): Client[] { return store.clients; }
export function getClient(id: string): Client | undefined { return store.clients.find((c) => c.id === id); }
export function addClient(client: Client) { store.clients.unshift(client); save(store); return client; }
export function updateClient(id: string, updates: Partial<Client>) {
  const idx = store.clients.findIndex((c) => c.id === id);
  if (idx >= 0) { store.clients[idx] = { ...store.clients[idx], ...updates, updatedAt: new Date().toISOString() }; save(store); }
  return store.clients[idx];
}
export function deleteClient(id: string) {
  const idx = store.clients.findIndex((c) => c.id === id);
  if (idx >= 0) { const removed = store.clients.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}

/* ─── Asset helpers (user-uploaded reference content) ─── */
export function getAssets(): Asset[] { return store.assets; }
export function getAsset(id: string): Asset | undefined { return store.assets.find((a) => a.id === id); }
export function addAsset(asset: Asset) { store.assets.unshift(asset); save(store); return asset; }
export function updateAsset(id: string, updates: Partial<Asset>) {
  const idx = store.assets.findIndex((a) => a.id === id);
  if (idx >= 0) { store.assets[idx] = { ...store.assets[idx], ...updates }; save(store); }
  return store.assets[idx];
}
export function deleteAsset(id: string) {
  const idx = store.assets.findIndex((a) => a.id === id);
  if (idx >= 0) { const removed = store.assets.splice(idx, 1)[0]; save(store); return removed; }
  return undefined;
}
export function searchAssets(query?: string, type?: Asset["type"]): Asset[] {
  return store.assets.filter((asset) => {
    if (type && asset.type !== type) return false;
    if (query) { const q = query.toLowerCase(); return asset.name.toLowerCase().includes(q) || asset.tags.some((t) => t.toLowerCase().includes(q)); }
    return true;
  });
}

/* ─── Stats helpers ─── */
export function getStats() {
  return {
    totalPosts: store.contentPosts.length,
    totalVideos: store.generatedVideos.length,
    totalCampaigns: store.campaigns.length,
    totalEvents: store.analyticsEvents.length,
    totalContentPieces: store.contentPosts.length + store.generatedVideos.length + store.contentAssets.length,
    totalEngagement: store.contentPosts.reduce((sum, p) => sum + p.likes + p.comments, 0),
    totalViews: store.contentPosts.reduce((sum, p) => sum + p.views, 0),
    agentsOnline: 0, // Real count — no fake data
  };
}
