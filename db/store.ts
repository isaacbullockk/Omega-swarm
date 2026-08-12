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
  services: [
    {
      id: "svc_social_audit",
      name: "Social Media Audit",
      description: "Comprehensive review of your social presence with actionable recommendations",
      duration: "3-5 business days",
      price: "$499",
      category: "Audit",
    },
    {
      id: "svc_content_strategy",
      name: "Content Strategy",
      description: "30-day content calendar with AI-generated posts and hashtag research",
      duration: "1 week",
      price: "$799",
      category: "Strategy",
    },
    {
      id: "svc_brand_voice",
      name: "Brand Voice Development",
      description: "Define your unique brand voice with AI-powered tone analysis and guidelines",
      duration: "5-7 business days",
      price: "$599",
      category: "Branding",
    },
  ],
  bookings: [],
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
        services: parsed.services ?? defaultData.services,
        bookings: parsed.bookings ?? [],
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
    agentsOnline: 14, // All agents are always available
  };
}
