import { useMemo, useState } from "react";
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
import { trpc } from "@/lib/trpc";

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
  type: "insight" | "fact" | "strategy" | "feedback" | "win" | "loss" | "pattern";
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
  { id: "win", label: "Wins", icon: CheckCircle, description: "Campaign wins" },
  { id: "loss", label: "Losses", icon: AlertTriangle, description: "Campaign losses" },
  { id: "pattern", label: "Patterns", icon: Database, description: "Learned patterns" },
];

/* Mock data removed — Memory Bank is now backed by PostgreSQL via trpc.memory.* */


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
    win: { icon: CheckCircle, color: "#84CC16", bg: "rgba(132,204,34,0.1)" },
    loss: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    pattern: { icon: Database, color: "#F97316", bg: "rgba(249,115,22,0.1)" },
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

  // ── Real data: PostgreSQL via trpc.memory.* (replaces the old mock array) ──
  const utils = trpc.useUtils();
  const { data: rows, isLoading } = trpc.memory.list.useQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<MemoryEntry["type"]>("insight");
  const [newTags, setNewTags] = useState("");

  const createMemory = trpc.memory.create.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      setShowAdd(false);
      setNewTitle(""); setNewContent(""); setNewTags(""); setNewType("insight");
    },
  });
  const deleteMemory = trpc.memory.delete.useMutation({
    onSuccess: () => utils.memory.list.invalidate(),
    onSettled: () => setIsDeleting(null),
  });

  const KNOWLEDGE_TYPES: MemoryEntry["type"][] = ["insight", "fact", "strategy", "feedback"];
  const ALL_TYPES: MemoryEntry["type"][] = [...KNOWLEDGE_TYPES, "win", "loss", "pattern"];
  const memories: MemoryEntry[] = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content ?? "",
        category: ALL_TYPES.includes(r.type as MemoryEntry["type"]) ? r.type : "pattern",
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        date: new Date(r.date).toISOString().slice(0, 10),
        confidence: Math.min(Math.max((r.confidence ?? 90) / 100, 0), 1),
        source: r.source ?? "user",
        // No coercion: every database enum value maps to itself so the UI
        // always represents the stored type truthfully
        type: ALL_TYPES.includes(r.type as MemoryEntry["type"]) ? (r.type as MemoryEntry["type"]) : "pattern",
      })),
    [rows]
  );

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
    deleteMemory.mutate({ id });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMemory.mutate({
      title: newTitle.trim(),
      content: newContent.trim(),
      type: newType,
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10),
      source: "user",
    });
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
              onClick={() => setShowAdd(true)}
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
          {isLoading ? (
            <MemoryBankSkeleton />
          ) : filteredMemories.length === 0 ? (
            <EmptyState
              icon={searchQuery ? Search : Inbox}
              title={searchQuery ? "No matches found" : "No memories yet"}
              description={
                searchQuery
                  ? `No memories match "${searchQuery}". Try a different search term.`
                  : "Teach your agents: add brand facts, strategies and feedback here — they're injected into every caption and agent chat."
              }
              actionLabel={searchQuery ? "Clear Search" : "Add your first memory"}
              onAction={() => {
                if (searchQuery) setSearchQuery("");
                else setShowAdd(true);
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

      {/* ═══ Add Memory Modal ═══ */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAdd(false)}
        >
          <form
            onSubmit={handleAdd}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Teach the Swarm
              </h2>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Close">
                <XCircle className="size-5" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              This memory is injected into every caption and agent chat — what you write here shapes future output.
            </p>
            <input
              type="text"
              required
              maxLength={255}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title — e.g. 'Our tone is warm, never corporate'"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
            />
            <textarea
              required
              maxLength={8000}
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="The actual knowledge — what should the agents always remember?"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
            />
            <div className="flex gap-2">
              {KNOWLEDGE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className="flex-1 px-2 py-2 rounded-xl text-xs font-bold capitalize transition-all"
                  style={{
                    background: newType === t ? "var(--accent-primary)" : "var(--bg-elevated)",
                    color: newType === t ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${newType === t ? "transparent" : "var(--border-subtle)"}`,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma-separated, optional) — e.g. brand, tone, instagram"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
            />
            {createMemory.error && (
              <p className="text-xs font-medium" style={{ color: "#EF4444" }}>
                {createMemory.error.message}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMemory.isPending || !newTitle.trim() || !newContent.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#0C0A09" }}
              >
                {createMemory.isPending ? "Saving…" : "Save Memory"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
