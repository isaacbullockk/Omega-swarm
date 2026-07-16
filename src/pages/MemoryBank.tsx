import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Target,
  Trophy,
  TrendingDown,
  Pencil,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  Award,
  AlertTriangle,
  BarChart3,
  Zap,
  Users,
  MessageSquare,
  Hash,
  Clock,
  Megaphone,
} from "lucide-react";

/* ───────── Types ───────── */
interface MemoryEntry {
  id: number;
  title: string;
  type: "win" | "loss" | "pattern";
  date: string;
  confidence: number;
  description: string;
  recommendation: string;
  category: string;
  categoryColor: string;
  applied: number;
}

interface Cluster {
  id: string;
  name: string;
  emoji: string;
  color: string;
  x: number;
  y: number;
  count: number;
  description: string;
}

interface TimelineItem {
  id: number;
  campaign: string;
  metric: string;
  metricValue: string;
  date: string;
  lesson: string;
  type: "win" | "loss";
}

interface BrandVoiceMetric {
  agent: string;
  color: string;
  consistency: number;
}

/* ───────── Constants ───────── */
const CLUSTERS: Cluster[] = [
  { id: "wins", name: "Wins", emoji: "🏆", color: "#22C55E", x: 100, y: 60, count: 86, description: "Successful campaign strategies" },
  { id: "losses", name: "Losses", emoji: "📉", color: "#EF4444", x: 300, y: 60, count: 12, description: "Learned from failures" },
  { id: "patterns", name: "Patterns", emoji: "🧩", color: "#F59E0B", x: 500, y: 60, count: 247, description: "Reusable marketing patterns" },
  { id: "brandvoice", name: "Brand Voice", emoji: "🎙️", color: "#A855F7", x: 200, y: 280, count: 34, description: "Tone & messaging profiles" },
  { id: "competitors", name: "Competitors", emoji: "🔎", color: "#06B6D4", x: 400, y: 280, count: 58, description: "Competitor intelligence" },
];

const MEMORY_ENTRIES: MemoryEntry[] = [
  {
    id: 1,
    title: "Gen Z Prefers Short-Form Video",
    type: "pattern",
    date: "2025-06-15",
    confidence: 96,
    description: "Campaigns targeting Gen Z with vertical video under 15s see 3.2x higher engagement than static image ads.",
    recommendation: "Prioritize Reels/TikTok format for Gen Z segments. Keep hooks in first 1.5s.",
    category: "Audience",
    categoryColor: "#06B6D4",
    applied: 23,
  },
  {
    id: 2,
    title: "Tuesday 10 AM — Peak Email Opens",
    type: "pattern",
    date: "2025-06-10",
    confidence: 91,
    description: "Email campaigns sent Tuesday at 10 AM EST consistently outperform other time slots by 28%.",
    recommendation: "Schedule newsletters for Tuesday 10 AM. A/B test subject lines with numbers.",
    category: "Timing",
    categoryColor: "#F59E0B",
    applied: 41,
  },
  {
    id: 3,
    title: "Conversational Tone Boosts Conversions",
    type: "pattern",
    date: "2025-06-08",
    confidence: 88,
    description: "Product descriptions written in a friendly, conversational style convert 19% better than formal copy.",
    recommendation: "Use second-person ('you') and casual contractions. Avoid corporate jargon.",
    category: "Tone",
    categoryColor: "#A855F7",
    applied: 67,
  },
  {
    id: 4,
    title: "Instagram Stories Drive Discovery",
    type: "pattern",
    date: "2025-06-05",
    confidence: 93,
    description: "New audiences discovered through Instagram Stories are 2.1x more likely to convert within 7 days.",
    recommendation: "Increase Stories posting frequency to 3-5x daily. Use interactive stickers.",
    category: "Channel",
    categoryColor: "#84CC16",
    applied: 34,
  },
  {
    id: 5,
    title: "Summer Sale Urgency Campaign",
    type: "win",
    date: "2025-05-28",
    confidence: 94,
    description: "Limited-time 48-hour flash sale with countdown timers drove record revenue.",
    recommendation: "Replicate urgency mechanics. Countdown timers + scarcity messaging perform best.",
    category: "Campaign",
    categoryColor: "#22C55E",
    applied: 8,
  },
  {
    id: 6,
    title: "Broad Audience Test Underperformed",
    type: "loss",
    date: "2025-05-20",
    confidence: 82,
    description: "Generic targeting to broad demographics resulted in 4x higher CPA than niche segments.",
    recommendation: "Always start with 2-3 niche audiences. Broad targeting only after establishing winners.",
    category: "Audience",
    categoryColor: "#EF4444",
    applied: 15,
  },
];

const TIMELINE_WINS: TimelineItem[] = [
  { id: 1, campaign: "Summer Sale Campaign", metric: "Revenue", metricValue: "+156%", date: "2025-06-01", lesson: "Limited-time urgency drove exceptional results", type: "win" },
  { id: 2, campaign: "Influencer Partnership", metric: "Reach", metricValue: "+89%", date: "2025-05-18", lesson: "Micro-influencers outperformed macro by 3x", type: "win" },
  { id: 3, campaign: "Retargeting Sequence", metric: "Conversions", metricValue: "+42%", date: "2025-05-05", lesson: "3-email sequence was the sweet spot", type: "win" },
];

const TIMELINE_LOSSES: TimelineItem[] = [
  { id: 4, campaign: "Broad Audience Test", metric: "ROI", metricValue: "-12%", date: "2025-04-22", lesson: "Narrow targeting outperforms broad by 4x", type: "loss" },
  { id: 5, campaign: "Long-Form Video Ads", metric: "Engagement", metricValue: "-8%", date: "2025-04-10", lesson: "Audience dropped off after 45 seconds", type: "loss" },
];

const BRAND_VOICE_METRICS: BrandVoiceMetric[] = [
  { agent: "Maya (Copy)", color: "#F59E0B", consistency: 94 },
  { agent: "Pulse (Social)", color: "#EC4899", consistency: 91 },
  { agent: "Vision (Creative)", color: "#A855F7", consistency: 88 },
  { agent: "Ace (Sales)", color: "#EF4444", consistency: 96 },
  { agent: "Scout (SEO)", color: "#84CC16", consistency: 85 },
];

const BRAIN_CENTER = { x: 300, y: 170 };

/* ───────── AnimatedCounter component ───────── */
function AnimatedCounter({ target, duration = 1500, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{value.toLocaleString()}{suffix}</span>;
}

/* ───────── ClusterDetailPanel component ───────── */
function ClusterDetailPanel({ cluster, onClose }: { cluster: Cluster; onClose: () => void }) {
  const entries = MEMORY_ENTRIES.filter((e) =>
    cluster.id === "wins" ? e.type === "win"
      : cluster.id === "losses" ? e.type === "loss"
      : cluster.id === "patterns" ? e.type === "pattern"
      : true
  ).slice(0, 3);

  return (
    <div
      className="rounded-xl p-5 animate-fade-up"
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${cluster.color}40`,
        boxShadow: `0 0 20px ${cluster.color}15`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cluster.emoji}</span>
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{cluster.name}</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{cluster.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
          Close
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg p-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${entry.categoryColor}20`, color: entry.categoryColor }}>
                {entry.category}
              </span>
              <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{entry.confidence}% confidence</span>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm py-2" style={{ color: "var(--text-muted)" }}>No entries in this cluster yet.</p>
        )}
      </div>
    </div>
  );
}

/* ───────── Main Component ───────── */
export default function MemoryBank() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [historyTab, setHistoryTab] = useState<"wins" | "losses">("wins");
  const [brandVoiceExpanded, setBrandVoiceExpanded] = useState<number | null>(null);

  const toggleEntry = useCallback((id: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const typeConfig = {
    win: { icon: <Trophy className="w-3.5 h-3.5" />, label: "Win", bg: "#22C55E", bgLight: "rgba(34,197,94,0.12)" },
    loss: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Loss", bg: "#EF4444", bgLight: "rgba(239,68,68,0.12)" },
    pattern: { icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Pattern", bg: "#F59E0B", bgLight: "rgba(245,158,11,0.12)" },
  };

  return (
    <div className="min-h-[100dvh] p-6 lg:p-8" style={{ fontFamily: "var(--font-primary)" }}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ═══ Page Header ═══ */}
        <div className="animate-fade-up" style={{ animationDelay: "0s", opacity: 0 }}>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.25)" }}
            >
              <Brain className="w-6 h-6" style={{ color: "#A855F7" }} />
            </div>
            <div>
              <h1 className="text-[2.25rem] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Brain AI
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Memory Bank — Swarm intelligence & learned patterns
              </p>
            </div>
          </div>
          <div className="mt-4 h-px w-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        {/* ═══════════════════════════════════════════
            TOP SECTION: Neural Network + Stats
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Neural Network SVG */}
          <div
            className="animate-fade-up relative"
            style={{
              animationDelay: "0.08s",
              opacity: 0,
              background: "var(--bg-base)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "20px",
              overflow: "hidden",
            }}
          >
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(168,85,247,0.06) 0%, transparent 70%)",
              }}
            />

            <svg viewBox="0 0 600 340" className="w-full relative z-10" style={{ maxHeight: "360px" }}>
              <defs>
                {/* Glow filters for each cluster color */}
                {CLUSTERS.map((cluster) => (
                  <filter key={`glow-${cluster.id}`} id={`glow-${cluster.id}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
                <filter id="glow-brain">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Gradient for connection lines */}
                <linearGradient id="neuralLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0.5} />
                </linearGradient>
              </defs>

              {/* Connection lines from Brain to each cluster */}
              {CLUSTERS.map((cluster) => (
                <g key={`conn-${cluster.id}`}>
                  <line
                    x1={BRAIN_CENTER.x}
                    y1={BRAIN_CENTER.y}
                    x2={cluster.x}
                    y2={cluster.y}
                    stroke="rgba(245,158,11,0.12)"
                    strokeWidth={1.5}
                  />
                  {/* Glowing active line overlay */}
                  <line
                    x1={BRAIN_CENTER.x}
                    y1={BRAIN_CENTER.y}
                    x2={cluster.x}
                    y2={cluster.y}
                    stroke={cluster.color}
                    strokeWidth={2}
                    strokeDasharray="6 8"
                    opacity={0.4}
                    style={{ animation: `neuralPulse ${2 + Math.random() * 2}s ease-in-out infinite` }}
                  />
                  {/* Traveling dot */}
                  <circle r={3} fill="#F59E0B" filter="url(#glow-brain)">
                    <animateMotion
                      dur={`${2.5 + Math.random() * 1.5}s`}
                      repeatCount="indefinite"
                      path={`M${BRAIN_CENTER.x},${BRAIN_CENTER.y} L${cluster.x},${cluster.y}`}
                    />
                  </circle>
                </g>
              ))}

              {/* Cluster Nodes */}
              {CLUSTERS.map((cluster) => (
                <g
                  key={cluster.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                  style={{ filter: `drop-shadow(0 0 8px ${cluster.color}40)` }}
                >
                  {/* Pulse ring */}
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={32}
                    fill="none"
                    stroke={cluster.color}
                    strokeWidth={1}
                    opacity={0.3}
                  >
                    <animate attributeName="r" values="28;40;28" dur={`${2 + Math.random()}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur={`${2 + Math.random()}s`} repeatCount="indefinite" />
                  </circle>
                  {/* Node circle */}
                  <circle
                    cx={cluster.x}
                    cy={cluster.y}
                    r={28}
                    fill={`${cluster.color}12`}
                    stroke={cluster.color}
                    strokeWidth={2}
                  />
                  {/* Count badge */}
                  <text
                    x={cluster.x}
                    y={cluster.y - 4}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={cluster.color}
                    fontSize={14}
                    fontWeight={700}
                    fontFamily="var(--font-primary)"
                  >
                    {cluster.count}
                  </text>
                  <text
                    x={cluster.x}
                    y={cluster.y + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={cluster.color}
                    fontSize={9}
                    fontWeight={500}
                    opacity={0.8}
                    fontFamily="var(--font-primary)"
                  >
                    {cluster.id === "brandvoice" ? "Voice" : cluster.id === "competitors" ? "Rivals" : cluster.name}
                  </text>
                </g>
              ))}

              {/* Center Brain Node */}
              <g style={{ filter: "drop-shadow(0 0 12px rgba(168,85,247,0.4))" }}>
                {/* Outer pulse */}
                <circle
                  cx={BRAIN_CENTER.x}
                  cy={BRAIN_CENTER.y}
                  r={44}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth={1.5}
                  opacity={0.2}
                >
                  <animate attributeName="r" values="40;54;40" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle
                  cx={BRAIN_CENTER.x}
                  cy={BRAIN_CENTER.y}
                  r={40}
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth={1}
                  opacity={0.15}
                >
                  <animate attributeName="r" values="36;52;36" dur="3s" begin="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" begin="1s" repeatCount="indefinite" />
                </circle>
                {/* Main brain circle */}
                <circle
                  cx={BRAIN_CENTER.x}
                  cy={BRAIN_CENTER.y}
                  r={36}
                  fill="rgba(168,85,247,0.1)"
                  stroke="#A855F7"
                  strokeWidth={2.5}
                  filter="url(#glow-brain)"
                />
                {/* Brain icon */}
                <foreignObject x={BRAIN_CENTER.x - 14} y={BRAIN_CENTER.y - 14} width={28} height={28}>
                  <div className="flex items-center justify-center w-full h-full">
                    <Brain className="w-6 h-6" style={{ color: "#A855F7" }} />
                  </div>
                </foreignObject>
                <text
                  x={BRAIN_CENTER.x}
                  y={BRAIN_CENTER.y + 52}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#A855F7"
                  fontSize={11}
                  fontWeight={600}
                  fontFamily="var(--font-primary)"
                >
                  Brain AI
                </text>
              </g>
            </svg>

            {/* Cluster Detail Panel */}
            {selectedCluster && (
              <div className="mt-4">
                <ClusterDetailPanel
                  cluster={CLUSTERS.find((c) => c.id === selectedCluster)!}
                  onClose={() => setSelectedCluster(null)}
                />
              </div>
            )}
          </div>

          {/* Memory Stats Panel */}
          <div
            className="animate-fade-up space-y-4"
            style={{ animationDelay: "0.16s", opacity: 0 }}
          >
            {/* Stats Grid */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Stat: Patterns */}
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                  <Brain className="w-5 h-5 mx-auto mb-2" style={{ color: "#A855F7" }} />
                  <div className="text-[1.75rem] font-bold" style={{ color: "var(--accent-primary)" }}>
                    <AnimatedCounter target={1247} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Patterns learned</div>
                </div>

                {/* Stat: Accuracy */}
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                  <Target className="w-5 h-5 mx-auto mb-2" style={{ color: "#84CC16" }} />
                  <div className="text-[1.75rem] font-bold" style={{ color: "#84CC16" }}>
                    <AnimatedCounter target={94} suffix="%" />
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Recall accuracy</div>
                </div>

                {/* Stat: Wins */}
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--bg-input)" }}>
                  <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--accent-primary)" }} />
                  <div className="text-[1.75rem] font-bold" style={{ color: "var(--accent-primary)" }}>
                    <AnimatedCounter target={86} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Successful campaigns</div>
                </div>

                {/* Stat: Losses */}
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--var(--bg-input))" }}>
                  <TrendingDown className="w-5 h-5 mx-auto mb-2" style={{ color: "#EF4444" }} />
                  <div className="text-[1.75rem] font-bold" style={{ color: "#EF4444" }}>
                    <AnimatedCounter target={12} />
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Learned from failures</div>
                </div>
              </div>
            </div>

            {/* Brand Voice Health */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Brand Voice Alignment</span>
                <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>92%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                <div
                  className="h-full rounded-full animate-fade-left"
                  style={{
                    width: "92%",
                    background: "linear-gradient(90deg, #F59E0B, #F97316, #FBBF24)",
                    animationDelay: "0.5s",
                    opacity: 0,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            BOTTOM SECTION: Memory Entries + Timeline + Brand Voice
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learned Patterns */}
          <div
            className="lg:col-span-2 animate-fade-up"
            style={{
              animationDelay: "0.24s",
              opacity: 0,
              background: "var(--gradient-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "24px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Learned Patterns</h2>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "var(--accent-primary)" }}>
                {MEMORY_ENTRIES.length} entries
              </span>
            </div>

            <div className="space-y-3">
              {MEMORY_ENTRIES.map((entry, index) => {
                const tc = typeConfig[entry.type];
                const isExpanded = expandedEntries.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className="animate-fade-up rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      animationDelay: `${0.32 + index * 0.08}s`,
                      opacity: 0,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderLeft: `3px solid ${entry.categoryColor}`,
                    }}
                  >
                    <button
                      onClick={() => toggleEntry(entry.id)}
                      className="w-full flex items-start gap-3 p-4 text-left"
                    >
                      {/* Type badge */}
                      <div
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: tc.bgLight }}
                      >
                        <span style={{ color: tc.bg }}>{tc.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `${entry.categoryColor}18`, color: entry.categoryColor }}
                          >
                            {entry.category}
                          </span>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: tc.bgLight, color: tc.bg }}
                          >
                            {tc.icon}
                            {tc.label}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                            {entry.date}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold mt-1.5" style={{ color: "var(--text-primary)" }}>
                          {entry.title}
                        </h3>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {entry.description}
                        </p>

                        {/* Confidence bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${entry.confidence}%`,
                                background: `linear-gradient(90deg, ${entry.categoryColor}, ${entry.categoryColor}88)`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium" style={{ color: entry.categoryColor }}>
                            {entry.confidence}%
                          </span>
                        </div>
                      </div>

                      {/* Expand chevron */}
                      <div className="shrink-0 self-center" style={{ color: "var(--text-muted)" }}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div
                        className="px-4 pb-4 ml-11"
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                      >
                        <div className="pt-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--accent-primary)" }} />
                            <div>
                              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Agent Recommendation</p>
                              <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{entry.recommendation}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Applied <strong style={{ color: "var(--text-secondary)" }}>{entry.applied}</strong> times
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Timeline + Brand Voice */}
          <div className="space-y-6">
            {/* Campaign History Timeline */}
            <div
              className="animate-fade-up"
              style={{
                animationDelay: "0.32s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Campaign History</h2>

              {/* Tab toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "var(--bg-input)" }}>
                <button
                  onClick={() => setHistoryTab("wins")}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: historyTab === "wins" ? "rgba(34,197,94,0.15)" : "transparent",
                    color: historyTab === "wins" ? "#22C55E" : "var(--text-muted)",
                  }}
                >
                  Wins
                </button>
                <button
                  onClick={() => setHistoryTab("losses")}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: historyTab === "losses" ? "rgba(239,68,68,0.15)" : "transparent",
                    color: historyTab === "losses" ? "#EF4444" : "var(--text-muted)",
                  }}
                >
                  Losses
                </button>
              </div>

              {/* Timeline */}
              <div className="relative pl-4">
                {/* Vertical line */}
                <div
                  className="absolute left-[17px] top-0 bottom-0 w-px"
                  style={{ background: "var(--border-subtle)" }}
                />

                <div className="space-y-4">
                  {(historyTab === "wins" ? TIMELINE_WINS : TIMELINE_LOSSES).map((item, index) => (
                    <div
                      key={item.id}
                      className="relative animate-fade-up"
                      style={{ animationDelay: `${0.4 + index * 0.1}s`, opacity: 0 }}
                    >
                      {/* Dot */}
                      <div
                        className="absolute -left-[1px] top-1 w-3 h-3 rounded-full border-2"
                        style={{
                          background: item.type === "win" ? "#22C55E" : "#EF4444",
                          borderColor: "var(--bg-card-solid)",
                          boxShadow: item.type === "win" ? "0 0 8px rgba(34,197,94,0.4)" : "0 0 8px rgba(239,68,68,0.4)",
                        }}
                      />
                      <div className="ml-6">
                        <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {item.campaign}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs font-bold"
                            style={{ color: item.type === "win" ? "#22C55E" : "#EF4444" }}
                          >
                            {item.metricValue} {item.metric}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.date}</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                          {item.lesson}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand Voice Panel */}
            <div
              className="animate-fade-up"
              style={{
                animationDelay: "0.4s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Brand Voice</h2>
                <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Current voice */}
              <div
                className="rounded-xl p-4 mb-4"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#A855F7", boxShadow: "0 0 6px rgba(168,85,247,0.5)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Current Tone</span>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Conversational
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  Friendly, approachable, community-driven. Uses "you" and contractions. Avoids jargon.
                </p>
              </div>

              {/* Voice Samples */}
              <div className="space-y-2">
                {[
                  { title: "Product Launch", icon: <Megaphone className="w-3.5 h-3.5" />, text: "We're thrilled to unveil something we've been working on for months. This isn't just another update — it's a game-changer for how you work. Ready to see what we've built?" },
                  { title: "Social Post", icon: <MessageSquare className="w-3.5 h-3.5" />, text: "POV: Your to-do list just got a whole lot shorter. Our new automation features are live and they're about to change everything. Swipe to see what's new!" },
                  { title: "Email Newsletter", icon: <Hash className="w-3.5 h-3.5" />, text: "Hey there! This month's roundup is packed with insights we think you'll love. From our latest campaign wins to new features, here's everything you missed." },
                ].map((sample, index) => {
                  const isExpanded = brandVoiceExpanded === index;
                  return (
                    <div
                      key={index}
                      className="rounded-lg overflow-hidden transition-all"
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <button
                        onClick={() => setBrandVoiceExpanded(isExpanded ? null : index)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--accent-primary)" }}>{sample.icon}</span>
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sample.title}</span>
                        </div>
                        <span style={{ color: "var(--text-muted)" }}>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3">
                          <p className="text-xs italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            "{sample.text}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Consistency Metrics */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Voice Consistency by Agent</p>
                <div className="space-y-2">
                  {BRAND_VOICE_METRICS.map((metric, index) => (
                    <div key={metric.agent} className="flex items-center gap-3">
                      <span className="text-xs w-[100px] truncate" style={{ color: "var(--text-secondary)" }}>{metric.agent}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
                        <div
                          className="h-full rounded-full animate-fade-left"
                          style={{
                            width: `${metric.consistency}%`,
                            backgroundColor: metric.color,
                            animationDelay: `${0.6 + index * 0.08}s`,
                            opacity: 0,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8 text-right" style={{ color: metric.color }}>{metric.consistency}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
