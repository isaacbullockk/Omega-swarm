/**
 * Simple JSON-file backed store for campaigns, missions, and outputs.
 * Replace with MySQL/Drizzle in production.
 */
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "store.json");

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

interface StoreData {
  campaigns: Campaign[];
  memories: MemoryEntry[];
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
};

function load(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
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

export function getMemories(): MemoryEntry[] {
  return store.memories;
}

export function addMemory(entry: MemoryEntry) {
  store.memories.unshift(entry);
  save(store);
  return entry;
}
