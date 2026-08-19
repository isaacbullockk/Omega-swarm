import { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  ChevronRight,
  Database,
  FileText,
  Filter,
  FolderOpen,
  Lightbulb,
  MessageCircle,
  Plus,
  Search,
  SortAsc,
  Sparkles,
  Tag,
  Trash2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

/* ─────────────────────────── Types ─────────────────────────── */

interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  date: string;
  confidence: number;
  source: string;
  type: "insight" | "fact" | "strategy" | "feedback";
}

interface Category {
  id: string;
  label: string;
  icon: typeof BookOpen;
  description: string;
}

/* ─────────────────────────── Mock Data ─────────────────────────── */

const CATEGORIES: Category[] = [
  { id: "all", label: "All Memories", icon: Database, description: "Complete memory archive" },
  { id: "insight", label: "Insights", icon: Lightbulb, description: "AI-generated insights" },
  { id: "fact", label: "Facts", icon: CheckCircle, description: "Verified facts and data" },
  { id: "strategy", label: "Strategies", icon: Sparkles, description: "Strategic learnings" },
  { id: "feedback", label: "Feedback", icon: MessageCircle, description: "User and agent feedback" },
];

const MOCK_MEMORIES: MemoryEntry[] = [
  {
    id: "1",
    title: "Omega Verse — Narrative Arc",
    content: "Every marketing story should start with a deep emotional core (butterfly identity → origins → function). The narrative arc follows the hero's journey: trigger → refusal → turning point → commitment. All visuals must be photorealistic and metaphorical. Key emotional anchors: culture-rich origin, emotional resonance, and connection. The narrative follows personal adversity → high stakes → purpose discovery → meaningful choice → grand finale.",
    category: "insight",
    tags: ["narrative", "brand", "strategy"],
    date: "2024-03-15",
    confidence: 0.95,
    source: "Omega Verse Swarm",
    type: "insight",
  },
  {
    id: "2",
    title: "Visual Brand System — The Omega Visual Way",
    content: "Photorealistic, metaphorical, and immersive. All visuals must embody natural beauty (never mechanical or cold). Color-coded palettes create hierarchy: dark science = cool tones, personal warmth = warm tones. Black icons are mandatory for visual hierarchy. 3D aspect ratio must be 2:3. The Omega particle aesthetic should drive all motion — building blocks of wisdom, light, and curiosity. Golden accents, blueprint references, and organic fluidity are hallmarks.",
    category: "fact",
    tags: ["visual", "brand", "design"],
    date: "2024-03-14",
    confidence: 0.98,
    source: "Brand Strategist Agent",
    type: "fact",
  },
  {
    id: "3",
    title: "Content Calendar — Platform Optimization",
    content: "Instagram: high-res lifestyle photography, 3:4/9:16 aspect ratios, Carousel (3-5 slides), Reels (15-60s). LinkedIn: long-form thought leadership, 1:1/3:2 aspect ratios, native video (3-15 min). Twitter/X: punchy text + native short video, 1:1/2:1/3:2. Cross-platform: each post should have platform-optimized content — NOT just cross-posting.",
    category: "strategy",
    tags: ["content", "platform", "optimization"],
    date: "2024-03-13",
    confidence: 0.92,
    source: "Content Strategy Agent",
    type: "strategy",
  },
  {
    id: "4",
    title: "Omega Chat — Conversational Logic",
    content: "Agent mode: blend persuasion and inquiry. Functions: research assistant, content strategist, brand voice consultant, digital twin. Authority principle: 'Your mindset isn't the only one of the butterfly' — value is limited if only your mind is there. Always explore, adapt, optimize. Full stack solution includes authority and powerbuilding capabilities.",
    category: "insight",
    tags: ["chat", "agent", "logic"],
    date: "2024-03-12",
    confidence: 0.88,
    source: "Omega Chat Agent",
    type: "insight",
  },
  {
    id: "5",
    title: "Client Feedback — Content Quality",
    content: "The content generated has excellent visual quality but needs stronger emotional hooks in the first 3 seconds of video. The brand voice is consistent but slightly repetitive — introduce more tonal variety. The calendar pacing is good but could be more aggressive for product launch phases. Suggest adding more 'expertise-level' content for LinkedIn.",
    category: "feedback",
    tags: ["feedback", "quality", "improvement"],
    date: "2024-03-11",
    confidence: 0.85,
    source: "Client Review",
    type: "feedback",
  },
  {
    id: "6",
    title: "Omega Brain — Knowledge Architecture",
    content: "The system uses a 4-level knowledge hierarchy: Core Facts (immutable), Insights (learned patterns), Strategies (actionable plans), and Feedback (user-driven learning). Each memory entry has confidence scoring (0.0-1.0) and automatic tagging. The memory bank is structured as: brand identity, product knowledge, customer profiles, and campaign data. All memories are interconnected through semantic relationships.",
    category: "fact",
    tags: ["architecture", "knowledge", "system"],
    date: "2024-03-10",
    confidence: 0.96,
    source: "System Architecture",
    type: "fact",
  },
];

/* ─────────────────────────── Sub-components ─────────────────────────── */

function MemoryCard({
  memory,
  onDelete,
  isDeleting,
}: {
  memory: MemoryEntry;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const typeColors: Record<string, { icon: typeof Lightbulb; color: string; bg: string }> = {
    insight: { icon: Lightbulb, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    fact: { icon: CheckCircle, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    strategy: { icon: Sparkles, color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
    feedback: { icon: MessageCircle, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  };

  const cfg = typeColors[memory.type] || typeColors.insight;
  const Icon = cfg.icon;

  return (
    <div
      className="group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon className="size-4" style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {memory.title}
            </h3>
            <button
              onClick={() => onDelete(memory.id)}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 hover:bg-red-500/10 disabled:opacity-30"
              aria-label={`Delete memory: ${memory.title}`}
            >
              {isDeleting ? (
                <Spinner className="size-3.5" />
              ) : (
                <Trash2 className="size-3.5" style={{ color: "#EF4444" }} />
              )}
            </button>
          </div>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {memory.content}
          </p>
          <div className="flex items-center gap-3 mt-3">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                <Tag className="size-2.5" />
                {tag}
              </span>
            ))}
            <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {memory.confidence >= 0.9 ? "High" : memory.confidence >= 0.7 ? "Medium" : "Low"} confidence
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
              <Clock className="size-3" />
              {memory.date}
              <span className="mx-1">·</span>
              <Database className="size-3" />
              {memory.source}
            </div>
            <button
              className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--accent-primary)" }}
            >
              View details
              <ArrowRight className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Skeletons ─────────────────────────── */

function MemoryBankSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-lg mb-2" style={{ background: "var(--bg-elevated)" }} />
          <div className="h-4 w-72 rounded" style={{ background: "var(--bg-elevated)" }} />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */

export default function MemoryBank() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "confidence" | "title">("date");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>(MOCK_MEMORIES);

  /* ── Filter & Sort ── */
  const filteredMemories = useMemo(() => {
    let result = memories;
    if (activeCategory !== "all") {
      result = result.filter((m) => m.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "confidence") return b.confidence - a.confidence;
      return a.title.localeCompare(b.title);
    });
    return result;
  }, [memories, activeCategory, searchQuery, sortBy]);

  const activeCategoryInfo = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const handleDelete = (id: string) => {
    setIsDeleting(id);
    setTimeout(() => {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      setIsDeleting(null);
    }, 600);
  };

  const stats = useMemo(() => {
    const total = memories.length;
    const byType = CATEGORIES.slice(1).map((cat) => ({
      ...cat,
      count: memories.filter((m) => m.category === cat.id).length,
    }));
    return { total, byType };
  }, [memories]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ═══ Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Memory Bank
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Swarm knowledge base — insights, facts, and strategies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
            >
              <Database className="size-3.5 inline mr-1" />
              {stats.total} entries
            </span>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                color: "#0C0A09",
              }}
            >
              <Plus className="size-4" />
              Add Memory
            </button>
          </div>
        </div>

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.byType.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="p-3 rounded-xl flex items-center gap-3"
                style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
              >
                <Icon className="size-5" style={{ color: "var(--text-muted)" }} />
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {cat.count}
                  </p>
                  <p className="text-[10px] font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                    {cat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ Filters & Search ═══ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isActive ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: isActive ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
                  }}
                  aria-pressed={isActive}
                >
                  <Icon className="size-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm w-full sm:w-64 transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              />
            </div>
            <button
              onClick={() => setSortBy((prev) => (prev === "date" ? "confidence" : prev === "confidence" ? "title" : "date"))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
              title={`Sort by: ${sortBy}`}
            >
              <SortAsc className="size-4" />
              <span className="hidden sm:inline">{sortBy}</span>
            </button>
          </div>
        </div>

        {/* ═══ Memory List ═══ */}
        <div className="space-y-4">
          {filteredMemories.length === 0 ? (
            <EmptyState
              icon={searchQuery ? Search : Inbox}
              title={searchQuery ? "No matches found" : "No memories yet"}
              description={
                searchQuery
                  ? `No memories match "${searchQuery}". Try a different search term.`
                  : "The memory bank is empty. Start a campaign or chat with an agent to generate memories."
              }
              actionLabel={searchQuery ? "Clear Search" : "Start a Campaign"}
              onAction={() => {
                if (searchQuery) setSearchQuery("");
                else window.location.href = "/mission-control";
              }}
            />
          ) : (
            <>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {filteredMemories.length} of {stats.total} memories
              </p>
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onDelete={handleDelete}
                  isDeleting={isDeleting === memory.id}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
