import { useState, useMemo, useCallback } from "react";
import {
  Shield,
  Plus,
  X,
  Lightbulb,
  FileText,
  Music,
  Palette,
  Image,
  Video,
  CheckCircle2,
  Clock,
  Archive,
  Sparkles,
  PenTool,
  Filter,
  TrendingUp,
  Lock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OriginalContent {
  id: string;
  title: string;
  type: "idea" | "script" | "lyrics" | "brand" | "photo" | "video";
  content: string;
  date: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  isAiAssisted: boolean;
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_CONTENT: OriginalContent[] = [
  {
    id: "1",
    title: "Kyakuwa Love Story",
    type: "lyrics",
    content: "Lost in the rhythm of your heartbeat...",
    date: "2025-01-15",
    status: "draft",
    tags: ["music", "afrobeats", "love"],
    isAiAssisted: false,
  },
  {
    id: "2",
    title: "Wildnoff Brand Manifesto",
    type: "brand",
    content: "We don't follow trends, we set them. Every creation is a statement, every drop is an event...",
    date: "2025-01-10",
    status: "published",
    tags: ["branding", "manifesto"],
    isAiAssisted: false,
  },
  {
    id: "3",
    title: "Summer Collection Script",
    type: "script",
    content: "Camera pans across golden savannah. Sunlight filters through acacia trees...",
    date: "2025-01-08",
    status: "draft",
    tags: ["film", "summer"],
    isAiAssisted: true,
  },
  {
    id: "4",
    title: "Sunday Release Strategy",
    type: "idea",
    content: "Weekly drops at sunset, always. The consistency builds anticipation...",
    date: "2025-01-05",
    status: "published",
    tags: ["strategy", "content"],
    isAiAssisted: false,
  },
  {
    id: "5",
    title: "Ndeku Domain Vision",
    type: "brand",
    content: "A digital home for creators who dare. Where ideas become movements...",
    date: "2024-12-28",
    status: "published",
    tags: ["vision", "domain"],
    isAiAssisted: false,
  },
  {
    id: "6",
    title: "Agent Swarm Concept",
    type: "idea",
    content: "12 minds, one mission, infinite output. Each agent specializes, the swarm collaborates...",
    date: "2024-12-20",
    status: "draft",
    tags: ["ai", "automation"],
    isAiAssisted: true,
  },
  {
    id: "7",
    title: "Savannah Logo Reveal",
    type: "video",
    content: "Gold dust particles forming the W mark against a sunset gradient...",
    date: "2024-12-15",
    status: "published",
    tags: ["motion", "logo"],
    isAiAssisted: true,
  },
  {
    id: "8",
    title: "Studio Launch Photos",
    type: "photo",
    content: "Behind-the-scenes shots from the Wildnoff studio launch event...",
    date: "2024-12-10",
    status: "published",
    tags: ["event", "photography"],
    isAiAssisted: false,
  },
];

const MY_VOICE_SAMPLES = [
  {
    id: "v1",
    title: "Brand Voice Sample",
    excerpt: "We don't follow trends, we set them. Every creation is a statement, every drop is an event. Wildnoff isn't just a label — it's a movement for those who refuse to be ordinary.",
    tone: "Bold & Visionary",
  },
  {
    id: "v2",
    title: "Creative Direction",
    excerpt: "Let the light guide the shot. Natural golden hour, no filters. The savannah teaches us that beauty needs no enhancement — only the courage to capture it as it is.",
    tone: "Poetic & Visual",
  },
  {
    id: "v3",
    title: "Strategic Thinking",
    excerpt: "Consistency beats intensity. A drop every Sunday at sunset isn't just scheduling — it's building a ritual. Our audience doesn't just consume content, they anticipate it.",
    tone: "Analytical & Clear",
  },
];

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "idea", label: "Ideas" },
  { key: "script", label: "Scripts" },
  { key: "lyrics", label: "Lyrics" },
  { key: "brand", label: "Brand Assets" },
];

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Lightbulb }
> = {
  idea: { label: "Idea", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", icon: Lightbulb },
  script: { label: "Script", color: "#3B82F6", bg: "rgba(59,130,246,0.15)", icon: FileText },
  lyrics: { label: "Lyrics", color: "#EC4899", bg: "rgba(236,72,153,0.15)", icon: Music },
  brand: { label: "Brand", color: "#A855F7", bg: "rgba(168,85,247,0.15)", icon: Palette },
  photo: { label: "Photo", color: "#84CC16", bg: "rgba(132,204,22,0.15)", icon: Image },
  video: { label: "Video", color: "#F97316", bg: "rgba(249,115,22,0.15)", icon: Video },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  published: { label: "Published", color: "#84CC16", icon: CheckCircle2 },
  draft: { label: "Draft", color: "#F59E0B", icon: Clock },
  archived: { label: "Archived", color: "#7A6E5F", icon: Archive },
};

/* ------------------------------------------------------------------ */
/*  Styles (CSS Keyframe Animations)                                   */
/* ------------------------------------------------------------------ */

const ORIGINALS_STYLES = `
@keyframes gaugeFill {
  from { stroke-dashoffset: 283; }
  to { stroke-dashoffset: var(--gauge-offset, 79); }
}

@keyframes modalSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes modalBackdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes tagPop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes voiceSlide {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-gauge {
  animation: gaugeFill 1.5s ease-out forwards;
}

.animate-modal-slide {
  animation: modalSlideIn 0.35s ease-out forwards;
}

.animate-modal-backdrop {
  animation: modalBackdrop 0.25s ease-out forwards;
}

.animate-tag-pop {
  animation: tagPop 0.3s ease-out forwards;
}

.animate-count-up {
  animation: countUp 0.5s ease-out forwards;
}

.animate-voice-slide {
  animation: voiceSlide 0.5s ease-out forwards;
  opacity: 0;
}

.card-hover-amber {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.card-hover-amber:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(245,158,11,0.12), 0 0 0 1px rgba(245,158,11,0.25);
  border-color: rgba(245,158,11,0.3);
}

.voice-card-hover {
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.voice-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(245,158,11,0.08);
  border-color: rgba(245,158,11,0.2);
}

.filter-tab-active {
  background: linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.15));
  border-color: rgba(245,158,11,0.4);
  color: #F59E0B;
}

.filter-tab-inactive {
  background: transparent;
  border-color: rgba(41,34,29,0.8);
  color: #7A6E5F;
}

.filter-tab-inactive:hover {
  border-color: rgba(245,158,11,0.25);
  color: #C4B5A0;
}
`;

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function AuthenticityGauge({ percentage }: { percentage: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 120, height: 120 }}>
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Background ring */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(245,158,11,0.1)"
          strokeWidth="8"
        />
        {/* Animated fill */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          className="animate-gauge"
          style={
            {
              "--gauge-offset": offset,
              strokeDashoffset: circumference,
            } as React.CSSProperties
          }
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#F59E0B",
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
          }}
        >
          {percentage}%
        </span>
        <span style={{ fontSize: 10, color: "#7A6E5F", marginTop: 2 }}>
          Authentic
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Originals() {
  const [content, setContent] = useState<OriginalContent[]>(INITIAL_CONTENT);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    type: OriginalContent["type"];
    content: string;
    tags: string;
    isAiAssisted: boolean;
  }>({
    title: "",
    type: "idea",
    content: "",
    tags: "",
    isAiAssisted: false,
  });

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const total = content.length;
    const published = content.filter((c) => c.status === "published").length;
    const drafts = content.filter((c) => c.status === "draft").length;
    const ideas = content.filter((c) => c.type === "idea").length;
    const aiAssisted = content.filter((c) => c.isAiAssisted).length;
    const authenticity = total > 0
      ? Math.round(((total - aiAssisted) / total) * 100)
      : 100;
    return { total, published, drafts, ideas, aiAssisted, authenticity };
  }, [content]);

  /* ---- Filtered content ---- */
  const filteredContent = useMemo(() => {
    if (activeFilter === "all") return content;
    return content.filter((c) => c.type === activeFilter);
  }, [content, activeFilter]);

  /* ---- Add content handler ---- */
  const handleAddContent = useCallback(() => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    const newItem: OriginalContent = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      type: formData.type,
      content: formData.content.trim(),
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isAiAssisted: formData.isAiAssisted,
    };
    setContent((prev) => [newItem, ...prev]);
    setFormData({
      title: "",
      type: "idea",
      content: "",
      tags: "",
      isAiAssisted: false,
    });
    setShowModal(false);
  }, [formData]);

  /* ---- Close modal on ESC ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    },
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0C0A09",
        color: "#FAF5EF",
        fontFamily: "var(--font-primary)",
        padding: "32px 24px 48px",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Inject styles */}
      <style>{ORIGINALS_STYLES}</style>

      {/* ======================== HEADER ======================== */}
      <div
        className="animate-fade-up"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={24} color="#F59E0B" />
          </div>
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                background: "linear-gradient(135deg, #FBBF24, #F59E0B, #F97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Originals Vault
            </h1>
            <p style={{ margin: "4px 0 0", color: "#7A6E5F", fontSize: 14 }}>
              Store, manage, and track your authentic content
            </p>
          </div>
        </div>

        {/* Authenticity Gauge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(28,25,23,0.75)",
            border: "1px solid rgba(245,158,11,0.12)",
          }}
        >
          <AuthenticityGauge percentage={stats.authenticity} />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#C4B5A0",
                fontWeight: 500,
              }}
            >
              Authenticity Score
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7A6E5F" }}>
              {stats.total - stats.aiAssisted} of {stats.total} pieces are
              fully original
            </p>
          </div>
        </div>
      </div>

      {/* ======================== STATS ROW ======================== */}
      <div
        className="animate-fade-up stagger-1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "Originals",
            value: stats.total,
            icon: Shield,
            color: "#F59E0B",
          },
          {
            label: "Published",
            value: stats.published,
            icon: CheckCircle2,
            color: "#84CC16",
          },
          {
            label: "Drafts",
            value: stats.drafts,
            icon: Clock,
            color: "#F97316",
          },
          {
            label: "Ideas",
            value: stats.ideas,
            icon: Lightbulb,
            color: "#A855F7",
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="animate-count-up"
            style={{
              animationDelay: `${0.1 * (i + 1)}s`,
              opacity: 0,
              padding: "20px 24px",
              borderRadius: 16,
              background: "rgba(28,25,23,0.75)",
              border: "1px solid rgba(245,158,11,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${stat.color}15`,
                border: `1px solid ${stat.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <stat.icon size={22} color={stat.color} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#FAF5EF",
                  lineHeight: 1,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "#7A6E5F",
                }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ======================== FILTER TABS + ADD BUTTON ======================== */}
      <div
        className="animate-fade-up stagger-2"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter
            size={16}
            color="#7A6E5F"
            style={{ marginRight: 4 }}
          />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={
                activeFilter === tab.key
                  ? "filter-tab-active"
                  : "filter-tab-inactive"
              }
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "1px solid",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-primary)",
                background:
                  activeFilter === tab.key
                    ? "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.15))"
                    : "transparent",
                borderColor:
                  activeFilter === tab.key
                    ? "rgba(245,158,11,0.4)"
                    : "rgba(41,34,29,0.8)",
                color:
                  activeFilter === tab.key ? "#F59E0B" : "#7A6E5F",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 22px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #F59E0B, #F97316)",
            color: "#0C0A09",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "var(--font-primary)",
            boxShadow: "0 4px 16px rgba(245,158,11,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 8px 24px rgba(245,158,11,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 16px rgba(245,158,11,0.3)";
          }}
        >
          <Plus size={18} />
          Add Original
        </button>
      </div>

      {/* ======================== CONTENT GRID ======================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 48,
        }}
      >
        {filteredContent.map((item, index) => {
          const typeCfg = TYPE_CONFIG[item.type];
          const statusCfg = STATUS_CONFIG[item.status];
          const StatusIcon = statusCfg.icon;
          const TypeIcon = typeCfg.icon;

          return (
            <div
              key={item.id}
              className="animate-stagger-in card-hover-amber"
              style={{
                padding: "24px",
                borderRadius: 16,
                background: "rgba(28,25,23,0.75)",
                border: "1px solid rgba(245,158,11,0.12)",
                animationDelay: `${index * 0.08}s`,
                opacity: 0,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Card header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: typeCfg.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TypeIcon size={18} color={typeCfg.color} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: typeCfg.color,
                    }}
                  >
                    {typeCfg.label}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: `${statusCfg.color}15`,
                    border: `1px solid ${statusCfg.color}30`,
                  }}
                >
                  <StatusIcon size={12} color={statusCfg.color} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: statusCfg.color,
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#FAF5EF",
                  lineHeight: 1.3,
                }}
              >
                {item.title}
              </h3>

              {/* Content preview */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#C4B5A0",
                  lineHeight: 1.5,
                  flex: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.content}
              </p>

              {/* Tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {item.tags.map((tag, ti) => (
                  <span
                    key={tag}
                    className="animate-tag-pop"
                    style={{
                      animationDelay: `${0.2 + ti * 0.05}s`,
                      opacity: 0,
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.15)",
                      fontSize: 11,
                      color: "#C4B5A0",
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
                {item.isAiAssisted && (
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 6,
                      background: "rgba(6,182,212,0.08)",
                      border: "1px solid rgba(6,182,212,0.2)",
                      fontSize: 11,
                      color: "#06B6D4",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Sparkles size={10} />
                    AI-assisted
                  </span>
                )}
              </div>

              {/* Date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTop: "1px solid rgba(41,34,29,0.6)",
                }}
              >
                <span style={{ fontSize: 12, color: "#7A6E5F" }}>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PenTool size={12} color="#7A6E5F" />
                  <span style={{ fontSize: 11, color: "#7A6E5F" }}>
                    {item.isAiAssisted ? "AI + Human" : "100% Original"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================== MY VOICE SECTION ======================== */}
      <div className="animate-fade-up stagger-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={20} color="#F59E0B" />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#FAF5EF",
              }}
            >
              My Voice
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#7A6E5F" }}>
              Writing samples that define your authentic style
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {MY_VOICE_SAMPLES.map((sample, index) => (
            <div
              key={sample.id}
              className="animate-voice-slide voice-card-hover"
              style={{
                animationDelay: `${0.15 * (index + 1)}s`,
                padding: "24px",
                borderRadius: 16,
                background: "rgba(28,25,23,0.75)",
                border: "1px solid rgba(245,158,11,0.12)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#F59E0B",
                  }}
                >
                  {sample.title}
                </h4>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    fontSize: 11,
                    color: "#C4B5A0",
                    fontWeight: 500,
                  }}
                >
                  {sample.tone}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#C4B5A0",
                  lineHeight: 1.65,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{sample.excerpt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ======================== ADD CONTENT MODAL ======================== */}
      {showModal && (
        <div
          className="animate-modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowModal(false)}
          />

          {/* Modal panel */}
          <div
            className="animate-modal-slide"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
              height: "100vh",
              background: "#0C0A09",
              borderLeft: "1px solid rgba(245,158,11,0.2)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid rgba(41,34,29,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "#0C0A09",
                zIndex: 2,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#FAF5EF",
                  }}
                >
                  Add Original Content
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "#7A6E5F",
                  }}
                >
                  Store a new piece in your vault
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(41,34,29,0.8)",
                  background: "transparent",
                  color: "#7A6E5F",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal form */}
            <div
              style={{
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                flex: 1,
              }}
            >
              {/* Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C4B5A0",
                  }}
                >
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Give your content a name..."
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(41,34,29,0.8)",
                    background: "rgba(28,25,23,0.8)",
                    color: "#FAF5EF",
                    fontSize: 14,
                    fontFamily: "var(--font-primary)",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(41,34,29,0.8)";
                  }}
                />
              </div>

              {/* Type */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C4B5A0",
                  }}
                >
                  Content Type
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {(
                    [
                      "idea",
                      "script",
                      "lyrics",
                      "brand",
                      "photo",
                      "video",
                    ] as OriginalContent["type"][]
                  ).map((type) => {
                    const cfg = TYPE_CONFIG[type];
                    const Icon = cfg.icon;
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, type }))
                        }
                        style={{
                          padding: "10px",
                          borderRadius: 10,
                          border: "1px solid",
                          borderColor: isSelected
                            ? `${cfg.color}60`
                            : "rgba(41,34,29,0.8)",
                          background: isSelected ? cfg.bg : "rgba(28,25,23,0.5)",
                          color: isSelected ? cfg.color : "#7A6E5F",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontFamily: "var(--font-primary)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icon size={18} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C4B5A0",
                  }}
                >
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write or paste your content here..."
                  rows={5}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(41,34,29,0.8)",
                    background: "rgba(28,25,23,0.8)",
                    color: "#FAF5EF",
                    fontSize: 14,
                    fontFamily: "var(--font-primary)",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(41,34,29,0.8)";
                  }}
                />
              </div>

              {/* Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#C4B5A0",
                  }}
                >
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="music, branding, strategy..."
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(41,34,29,0.8)",
                    background: "rgba(28,25,23,0.8)",
                    color: "#FAF5EF",
                    fontSize: 14,
                    fontFamily: "var(--font-primary)",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(41,34,29,0.8)";
                  }}
                />
                <span style={{ fontSize: 11, color: "#7A6E5F" }}>
                  Separate tags with commas
                </span>
              </div>

              {/* AI Assisted toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "rgba(28,25,23,0.8)",
                  border: "1px solid rgba(41,34,29,0.8)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Sparkles size={18} color="#06B6D4" />
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#FAF5EF",
                      }}
                    >
                      AI-Assisted
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 12,
                        color: "#7A6E5F",
                      }}
                    >
                      Was this content created with AI help?
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      isAiAssisted: !prev.isAiAssisted,
                    }))
                  }
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    border: "none",
                    background: formData.isAiAssisted
                      ? "#06B6D4"
                      : "rgba(41,34,29,0.8)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#FAF5EF",
                      position: "absolute",
                      top: 3,
                      left: formData.isAiAssisted ? 25 : 3,
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Submit button */}
              <button
                onClick={handleAddContent}
                disabled={!formData.title.trim() || !formData.content.trim()}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    formData.title.trim() && formData.content.trim()
                      ? "linear-gradient(135deg, #F59E0B, #F97316)"
                      : "rgba(41,34,29,0.8)",
                  color:
                    formData.title.trim() && formData.content.trim()
                      ? "#0C0A09"
                      : "#7A6E5F",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor:
                    formData.title.trim() && formData.content.trim()
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-primary)",
                  marginTop: 8,
                  boxShadow:
                    formData.title.trim() && formData.content.trim()
                      ? "0 4px 16px rgba(245,158,11,0.3)"
                      : "none",
                }}
              >
                Save to Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
