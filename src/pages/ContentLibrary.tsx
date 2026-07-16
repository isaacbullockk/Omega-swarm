import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PenTool,
  Video,
  FolderOpen,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Copy,
  Calendar,
  Edit3,
  Play,
  ImageIcon,
  FileText,
  Mail,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ContentItem {
  id: string;
  title: string;
  type: "social" | "video" | "ad" | "blog";
  status: "draft" | "published" | "scheduled";
  date: string;
  thumbnail: string;
  account?: string;
  caption?: string;
  views?: string;
  engagement?: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "all", label: "All Content", icon: FolderOpen },
  { key: "social", label: "Social Posts", icon: Share2 },
  { key: "video", label: "Videos", icon: Video },
  { key: "asset", label: "Assets", icon: ImageIcon },
];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  social: { label: "Social Post", color: "#EC4899", bg: "rgba(236,72,153,0.15)" },
  video: { label: "Video", color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  ad: { label: "Ad Copy", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  blog: { label: "Blog", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  published: { label: "Published", color: "#84CC16", icon: CheckCircle2 },
  draft: { label: "Draft", color: "#7A6E5F", icon: AlertCircle },
  scheduled: { label: "Scheduled", color: "#F59E0B", icon: Clock },
};

const CONTENT_ITEMS: ContentItem[] = [
  { id: "1", title: "Summer Collection Launch", type: "social", status: "published", date: "2026-01-18", thumbnail: "from-[#EC4899] to-[#F59E0B]", account: "@wildnoff", views: "45K", engagement: "8.2%" },
  { id: "2", title: "Product Demo Reel", type: "video", status: "published", date: "2026-01-17", thumbnail: "from-[#A855F7] to-[#3B82F6]", account: "@isaacbullockk", views: "67K", engagement: "11.4%" },
  { id: "3", title: "Holiday Sale Ad Copy", type: "ad", status: "scheduled", date: "2026-01-20", thumbnail: "from-[#F59E0B] to-[#F97316]" },
  { id: "4", title: "Behind the Scenes", type: "blog", status: "draft", date: "2026-01-16", thumbnail: "from-[#3B82F6] to-[#06B6D4]" },
  { id: "5", title: "New Arrivals Post", type: "social", status: "published", date: "2026-01-15", thumbnail: "from-[#EC4899] to-[#F97316]", account: "@kyakuwamusic", views: "23K", engagement: "6.1%" },
  { id: "6", title: "Brand Story Video", type: "video", status: "draft", date: "2026-01-14", thumbnail: "from-[#A855F7] to-[#EC4899]" },
  { id: "7", title: "Spring Campaign Ad", type: "ad", status: "scheduled", date: "2026-01-22", thumbnail: "from-[#F59E0B] to-[#84CC16]" },
  { id: "8", title: "Style Guide Blog", type: "blog", status: "published", date: "2026-01-12", thumbnail: "from-[#3B82F6] to-[#A855F7]" },
];

const VIRAL_VIDEOS: ContentItem[] = [
  {
    id: "v1",
    title: "Summer Vibes Collection",
    type: "video",
    status: "published",
    date: "2026-01-18",
    thumbnail: "from-[#F59E0B] to-[#EC4899]",
    account: "@wildnoff",
    caption: "This summer just got a whole lot brighter. Our new collection drops tomorrow and trust us, you do NOT want to miss this.",
    views: "45K",
    engagement: "8.2%",
  },
  {
    id: "v2",
    title: "Behind the Craft",
    type: "video",
    status: "scheduled",
    date: "2026-01-20",
    thumbnail: "from-[#A855F7] to-[#3B82F6]",
    account: "@isaacbullockk",
    caption: "Ever wondered how we make our products? Here is a sneak peek behind the scenes of our latest creation process.",
    views: "23K",
    engagement: "6.1%",
  },
  {
    id: "v3",
    title: "Midnight Sessions",
    type: "video",
    status: "draft",
    date: "2026-01-19",
    thumbnail: "from-[#06B6D4] to-[#A855F7]",
    account: "@kyakuwamusic",
    caption: "Late night studio sessions hit different. New music coming soon, stay tuned for the drop.",
    views: "67K",
    engagement: "11.4%",
  },
];

const CONTENT_TYPES = [
  { key: "social", label: "Social Post", icon: Share2 },
  { key: "ad", label: "Ad Copy", icon: FileText },
  { key: "blog", label: "Blog", icon: PenTool },
  { key: "email", label: "Email", icon: Mail },
];

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

function useStaggerDelay(index: number) {
  return { animationDelay: `${index * 0.08}s` } as React.CSSProperties;
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.social;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: cfg.color }}>
      <Icon className="size-3" />
      {cfg.label}
    </span>
  );
}

function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  const style = useStaggerDelay(index);

  return (
    <div
      className="animate-stagger-in stagger-dynamic group cursor-pointer rounded-2xl border p-4 card-lift"
      style={{
        ...style,
        background: "var(--gradient-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "mb-3 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br",
          item.thumbnail
        )}
      >
        <div className="rounded-full bg-black/30 p-3 backdrop-blur-sm">
          {item.type === "video" ? (
            <Play className="size-6 text-white/80" />
          ) : (
            <ImageIcon className="size-6 text-white/80" />
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mb-2">
        <TypeBadge type={item.type} />
        <StatusBadge status={item.status} />
      </div>

      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {item.title}
      </h3>

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {item.date}
        </span>
        {item.account && (
          <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
            {item.account}
          </span>
        )}
      </div>

      {item.views && (
        <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{item.views} views</span>
          <span>{item.engagement} engagement</span>
        </div>
      )}
    </div>
  );
}

function ViralVideoCard({
  item,
  index,
  onEditCaption,
  onSchedule,
  onCopyText,
}: {
  item: ContentItem;
  index: number;
  onEditCaption: (id: string) => void;
  onSchedule: (id: string) => void;
  onCopyText: (text: string) => void;
}) {
  const style = useStaggerDelay(index);

  return (
    <div
      className="animate-stagger-in stagger-dynamic rounded-2xl border p-4 card-lift"
      style={{
        ...style,
        background: "var(--gradient-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "mb-3 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br relative",
          item.thumbnail
        )}
      >
        <div className="rounded-full bg-black/40 p-3 backdrop-blur-sm transition-transform duration-200 hover:scale-110 cursor-pointer">
          <Play className="size-6 text-white" />
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur-sm">
          0:23
        </div>
      </div>

      {/* Title & Account */}
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
        {item.title}
      </h3>
      <p className="text-xs mb-2 font-medium" style={{ color: "var(--accent-primary)" }}>
        {item.account}
      </p>

      {/* Caption preview */}
      <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
        {item.caption}
      </p>

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{item.views} views</span>
        <span>{item.engagement} engagement</span>
        <StatusBadge status={item.status} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEditCaption(item.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-[rgba(245,158,11,0.08)]"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <Edit3 className="size-3" />
          Edit Caption
        </button>
        <button
          onClick={() => onSchedule(item.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 hover:bg-[rgba(245,158,11,0.08)]"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <Calendar className="size-3" />
          Schedule
        </button>
        <button
          onClick={() => onCopyText(item.caption || "")}
          className="inline-flex items-center justify-center rounded-lg p-2 transition-all duration-200 hover:bg-[rgba(245,158,11,0.08)]"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          title="Copy text"
        >
          <Copy className="size-3" />
        </button>
      </div>
    </div>
  );
}

function CreateContentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selectedType, setSelectedType] = useState("social");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenerated("");
    setTimeout(() => {
      setGenerating(false);
      const samples: Record<string, string> = {
        social: `Summer is here and so are we! Our new collection just dropped and it is everything you have been waiting for. Tap the link in bio to shop now. Your summer wardrobe upgrade starts here. #SummerVibes #NewCollection`,
        ad: `Unlock exclusive savings this summer. Premium quality, unbeatable prices. Shop the new collection now and get 20% off your first order. Limited time only!`,
        blog: `The Art of Summer Style: As temperatures rise, so does the opportunity to refresh your wardrobe. In this guide, we explore the essential pieces that define a perfect summer collection.`,
        email: `Your summer wardrobe is missing this one thing. Our new collection is here and trust us, you are going to want to see this. Premium pieces crafted for those who do not settle.`,
      };
      setGenerated(samples[selectedType] || samples.social);
    }, 2000);
  }, [topic, selectedType]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-lg flex-col overflow-y-auto border-l"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-subtle)",
          animation: "fadeSlideLeft 0.4s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Create Content
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
          >
            <X className="size-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 p-6">
          {/* Content Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Content Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CONTENT_TYPES.map((ct) => {
                const Icon = ct.icon;
                const active = selectedType === ct.key;
                return (
                  <button
                    key={ct.key}
                    onClick={() => setSelectedType(ct.key)}
                    className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200"
                    style={{
                      borderColor: active ? "var(--accent-primary)" : "var(--border-subtle)",
                      background: active ? "rgba(245,158,11,0.1)" : "transparent",
                      color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <Icon className="size-4" />
                    {ct.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Topic / Title
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Announce our summer sale with a fun, energetic tone..."
              rows={4}
              className="w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* AI Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
            style={{
              background: "var(--gradient-gold)",
              color: "#0C0A09",
              transform: generating ? "scale(0.98)" : undefined,
            }}
          >
            <span
              className="absolute inset-0 animate-shimmer"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
            {generating ? (
              <>
                <span className="animate-slow-rotate inline-block">
                  <Sparkles className="size-4" />
                </span>
                Creating magic...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate Content
              </>
            )}
          </button>

          {/* Generated Preview */}
          {generated && (
            <div
              className="animate-fade-up space-y-3 rounded-xl border p-4"
              style={{
                background: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                  Generated Content
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(generated)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {generated}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const filteredContent = useMemo(() => {
    let items = CONTENT_ITEMS;
    if (activeTab !== "all") {
      items = items.filter((i) => {
        if (activeTab === "asset") return i.type === "ad" || i.type === "blog";
        return i.type === activeTab;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }
    return items;
  }, [activeTab, searchQuery]);

  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  }, []);

  const handleEditCaption = useCallback((id: string) => {
    console.log("Edit caption:", id);
  }, []);

  const handleSchedule = useCallback((id: string) => {
    console.log("Schedule:", id);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div
        className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Content Studio
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Create, manage, and schedule your content
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          style={{
            background: "var(--gradient-gold)",
            color: "#0C0A09",
          }}
        >
          <Plus className="size-4" />
          Create New
        </button>
      </div>

      {/* ── Search ── */}
      <div
        className="animate-fade-up stagger-1 flex items-center gap-3 rounded-xl border px-4 py-2.5"
        style={{
          background: "var(--bg-input)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <Search className="size-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search content..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X className="size-3.5" style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="animate-fade-up stagger-2 flex gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border-subtle)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                color: active ? "var(--text-primary)" : "var(--text-muted)",
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
              }}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {active && (
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content Grid ── */}
      <div>
        <h2
          className="animate-fade-up stagger-3 mb-4 text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Recent Content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredContent.map((item, i) => (
            <ContentCard key={item.id} item={item} index={i} />
          ))}
        </div>
        {filteredContent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="mb-3 size-10" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No content found
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Try adjusting your filters or create new content
            </p>
          </div>
        )}
      </div>

      {/* ── Viral Videos Section ── */}
      <div className="space-y-4">
        <div className="animate-fade-up flex items-center gap-2">
          <Video className="size-5" style={{ color: "var(--accent-primary)" }} />
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Viral Videos
          </h2>
          <ChevronRight className="size-4" style={{ color: "var(--text-muted)" }} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIRAL_VIDEOS.map((v, i) => (
            <ViralVideoCard
              key={v.id}
              item={v}
              index={i}
              onEditCaption={handleEditCaption}
              onSchedule={handleSchedule}
              onCopyText={handleCopyText}
            />
          ))}
        </div>
      </div>

      {/* ── Create Content Modal ── */}
      <CreateContentModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── Copy Toast ── */}
      {copiedToast && (
        <div
          className="animate-fade-up fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-xl border px-4 py-3 shadow-lg"
          style={{
            background: "var(--bg-card-solid)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <CheckCircle2 className="size-4" style={{ color: "var(--accent-success)" }} />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            Copied to clipboard
          </span>
        </div>
      )}
    </div>
  );
}
