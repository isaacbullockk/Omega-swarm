import React, { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  CheckCircle2,
  MinusCircle,
  Loader2,
  TrendingUp,
  Clock,
  Target,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */
type AgentStatus = "Online" | "Idle" | "Working";
type AgentCategory = "Creative" | "Intelligence" | "Optimization" | null;

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  role: string;
  fullDescription: string;
  status: AgentStatus;
  category: AgentCategory;
  tags: { label: string; color: string }[];
  tasksCompleted: number;
  winRate: number;
  responseTime: string;
  active: boolean;
  recentActivity: string[];
  sparkline: number[];
}

type FilterTab = "All" | "Creative" | "Intelligence" | "Optimization" | "Active" | "Idle";

/* ───────── Agent Data ───────── */
const AGENTS: Agent[] = [
  {
    id: "copywriter",
    name: "Copywriter GPT",
    emoji: "✍️",
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/20",
    role: "Writes ads, emails, landing pages",
    fullDescription:
      "Generates high-converting ad copy, email sequences, and landing page content. Trained on top-performing marketing campaigns across industries. Adapts tone and style to match brand voice and audience segment.",
    status: "Online",
    category: "Creative",
    tags: [
      { label: "Copy", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
      { label: "Email", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
      { label: "LP", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    ],
    tasksCompleted: 1847,
    winRate: 94.2,
    responseTime: "1.2s",
    active: true,
    recentActivity: [
      "Generated 12 ad variants for Q2 campaign",
      "A/B tested email subject lines — 23% lift",
      "Rewrote landing page hero — CTA up 18%",
    ],
    sparkline: [42, 48, 45, 52, 58, 55, 62, 68, 72, 70, 78, 82],
  },
  {
    id: "social",
    name: "Social Media",
    emoji: "📱",
    color: "text-pink-400",
    bgColor: "bg-pink-500/15",
    borderColor: "border-pink-500/30",
    glowColor: "shadow-pink-500/20",
    role: "Creates viral content, calendars",
    fullDescription:
      "Manages social media presence across all major platforms. Creates viral content, schedules posts, monitors engagement, and adapts strategy based on real-time trends and audience behavior patterns.",
    status: "Online",
    category: "Creative",
    tags: [
      { label: "Social", color: "bg-pink-500/15 text-pink-400 border-pink-500/25" },
      { label: "Content", color: "bg-pink-500/15 text-pink-400 border-pink-500/25" },
      { label: "Viral", color: "bg-pink-500/15 text-pink-400 border-pink-500/25" },
    ],
    tasksCompleted: 2315,
    winRate: 91.8,
    responseTime: "0.8s",
    active: true,
    recentActivity: [
      "Viral TikTok script generated 2.1M views",
      "Content calendar scheduled through Q2",
      "Trending hashtag analysis complete",
    ],
    sparkline: [38, 42, 55, 48, 62, 70, 65, 72, 80, 85, 78, 88],
  },
  {
    id: "sales",
    name: "Sales Closer",
    emoji: "💼",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    role: "Builds funnels, handles objections",
    fullDescription:
      "Constructs high-converting sales funnels from awareness to conversion. Handles objection frameworks, creates urgency triggers, and optimizes checkout flows to maximize revenue per visitor.",
    status: "Online",
    category: "Optimization",
    tags: [
      { label: "Funnel", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
      { label: "Sales", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
      { label: "CRO", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    ],
    tasksCompleted: 1562,
    winRate: 96.5,
    responseTime: "1.5s",
    active: true,
    recentActivity: [
      "Funnel V3 deployed — 34% conversion lift",
      "Objection handler trained on 500+ calls",
      "Upsell sequence A/B test launched",
    ],
    sparkline: [50, 52, 55, 53, 60, 58, 65, 70, 68, 75, 72, 80],
  },
  {
    id: "creative",
    name: "Creative Director",
    emoji: "🎨",
    color: "text-purple-400",
    bgColor: "bg-purple-500/15",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    role: "Campaign themes, visual direction",
    fullDescription:
      "Defines campaign creative direction, brand aesthetics, and visual identity. Orchestrates multi-channel creative strategy ensuring brand consistency while pushing creative boundaries.",
    status: "Online",
    category: "Creative",
    tags: [
      { label: "Creative", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
      { label: "Brand", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
      { label: "Visual", color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
    ],
    tasksCompleted: 982,
    winRate: 93.1,
    responseTime: "2.1s",
    active: true,
    recentActivity: [
      "Q2 campaign theme 'Elevate' approved",
      "Brand refresh guidelines published",
      "Visual asset library updated — 340 new items",
    ],
    sparkline: [45, 50, 48, 55, 52, 60, 65, 62, 70, 75, 73, 80],
  },
  {
    id: "seo",
    name: "SEO Strategist",
    emoji: "🔍",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/15",
    borderColor: "border-cyan-500/30",
    glowColor: "shadow-cyan-500/20",
    role: "Keywords, content optimization",
    fullDescription:
      "Drives organic search visibility through keyword research, technical SEO audits, and content optimization. Monitors algorithm updates and adjusts strategy to maintain top rankings.",
    status: "Working",
    category: "Optimization",
    tags: [
      { label: "SEO", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
      { label: "Keywords", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
      { label: "Content", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
    ],
    tasksCompleted: 2156,
    winRate: 89.7,
    responseTime: "3.4s",
    active: true,
    recentActivity: [
      "Keyword cluster analysis — 450 new terms",
      "Technical SEO audit — 12 issues resolved",
      "Content gap analysis vs competitors complete",
    ],
    sparkline: [40, 42, 45, 48, 50, 55, 52, 58, 62, 60, 65, 68],
  },
  {
    id: "analyst",
    name: "Data Analyst",
    emoji: "📊",
    color: "text-slate-400",
    bgColor: "bg-slate-500/15",
    borderColor: "border-slate-500/30",
    glowColor: "shadow-slate-500/20",
    role: "KPIs, funnel analysis, reports",
    fullDescription:
      "Analyzes marketing performance data, builds attribution models, and generates actionable insights. Creates dashboards and automated reports that drive data-informed decision making.",
    status: "Online",
    category: "Intelligence",
    tags: [
      { label: "Analytics", color: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
      { label: "KPI", color: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
      { label: "Reports", color: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
    ],
    tasksCompleted: 3102,
    winRate: 97.3,
    responseTime: "1.8s",
    active: true,
    recentActivity: [
      "Q1 attribution report generated",
      "Funnel drop-off analysis — 3 bottlenecks found",
      "Real-time dashboard updated",
    ],
    sparkline: [55, 58, 60, 62, 65, 63, 70, 72, 75, 78, 80, 85],
  },
  {
    id: "sentinel",
    name: "Sentinel",
    emoji: "👁️",
    color: "text-red-400",
    bgColor: "bg-red-500/15",
    borderColor: "border-red-500/30",
    glowColor: "shadow-red-500/20",
    role: "Competitor intel, sentiment tracking",
    fullDescription:
      "Monitors competitor activities, brand sentiment, and market trends in real-time. Alerts on competitive threats, emerging opportunities, and reputation risks across digital channels.",
    status: "Online",
    category: "Intelligence",
    tags: [
      { label: "Intel", color: "bg-red-500/15 text-red-400 border-red-500/25" },
      { label: "Alerts", color: "bg-red-500/15 text-red-400 border-red-500/25" },
      { label: "Tracking", color: "bg-red-500/15 text-red-400 border-red-500/25" },
    ],
    tasksCompleted: 4521,
    winRate: 98.1,
    responseTime: "0.4s",
    active: true,
    recentActivity: [
      "Competitor price drop alert — 3 rivals",
      "Sentiment shift detected on Product X",
      "14 new competitor ads cataloged",
    ],
    sparkline: [60, 62, 65, 68, 70, 75, 72, 78, 80, 82, 85, 88],
  },
  {
    id: "geo",
    name: "GEO Agent",
    emoji: "🤖",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/15",
    borderColor: "border-indigo-500/30",
    glowColor: "shadow-indigo-500/20",
    role: "AI engine citation optimization",
    fullDescription:
      "Optimizes content for AI search engines and LLM citations. Ensures brand visibility in ChatGPT, Perplexity, Gemini, and Claude responses through structured content strategies.",
    status: "Working",
    category: "Optimization",
    tags: [
      { label: "GEO", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
      { label: "AI", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
      { label: "Citations", color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
    ],
    tasksCompleted: 876,
    winRate: 88.4,
    responseTime: "4.2s",
    active: true,
    recentActivity: [
      "ChatGPT citation score: 78% (+12%)",
      "Perplexity visibility audit complete",
      "Structured data schema deployed",
    ],
    sparkline: [30, 35, 38, 42, 40, 48, 52, 55, 58, 62, 65, 70],
  },
  {
    id: "privacy",
    name: "Privacy Agent",
    emoji: "🔒",
    color: "text-green-400",
    bgColor: "bg-green-500/15",
    borderColor: "border-green-500/30",
    glowColor: "shadow-green-500/20",
    role: "Compliance, zero-party data",
    fullDescription:
      "Ensures all marketing activities comply with GDPR, CCPA, and emerging privacy regulations. Manages zero-party data collection frameworks and consent management platforms.",
    status: "Online",
    category: "Intelligence",
    tags: [
      { label: "Privacy", color: "bg-green-500/15 text-green-400 border-green-500/25" },
      { label: "GDPR", color: "bg-green-500/15 text-green-400 border-green-500/25" },
      { label: "Compliance", color: "bg-green-500/15 text-green-400 border-green-500/25" },
    ],
    tasksCompleted: 1234,
    winRate: 99.2,
    responseTime: "0.6s",
    active: true,
    recentActivity: [
      "GDPR compliance scan — all clear",
      "Zero-party data framework v2 deployed",
      "Cookie consent updated for 3 new regions",
    ],
    sparkline: [70, 72, 75, 78, 80, 82, 85, 84, 88, 90, 92, 95],
  },
  {
    id: "ambient",
    name: "Ambient Agent",
    emoji: "🌐",
    color: "text-teal-400",
    bgColor: "bg-teal-500/15",
    borderColor: "border-teal-500/30",
    glowColor: "shadow-teal-500/20",
    role: "Cross-device campaigns",
    fullDescription:
      "Orchestrates marketing campaigns across IoT, voice assistants, and location-based platforms. Ensures seamless brand experiences as users move between devices and contexts.",
    status: "Idle",
    category: "Creative",
    tags: [
      { label: "IoT", color: "bg-teal-500/15 text-teal-400 border-teal-500/25" },
      { label: "Voice", color: "bg-teal-500/15 text-teal-400 border-teal-500/25" },
      { label: "Location", color: "bg-teal-500/15 text-teal-400 border-teal-500/25" },
    ],
    tasksCompleted: 543,
    winRate: 85.6,
    responseTime: "5.1s",
    active: false,
    recentActivity: [
      "Cross-device attribution model ready",
      "Voice search optimization paused",
      "Beacon campaign framework staged",
    ],
    sparkline: [25, 28, 30, 32, 35, 33, 38, 40, 42, 45, 43, 48],
  },
  {
    id: "budget",
    name: "Budget RL",
    emoji: "💰",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/15",
    borderColor: "border-yellow-500/30",
    glowColor: "shadow-yellow-500/20",
    role: "Auto budget allocation",
    fullDescription:
      "Uses reinforcement learning to dynamically allocate marketing budget across channels. Optimizes spend in real-time based on performance data to maximize ROI and minimize waste.",
    status: "Online",
    category: "Optimization",
    tags: [
      { label: "Budget", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
      { label: "RL", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
      { label: "Optimize", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
    ],
    tasksCompleted: 1890,
    winRate: 95.8,
    responseTime: "0.9s",
    active: true,
    recentActivity: [
      "Budget reallocation saved $12.4K this month",
      "ROAS model updated — predicting 4.2x",
      "Cross-channel spend balanced",
    ],
    sparkline: [48, 52, 55, 58, 60, 65, 68, 72, 70, 78, 82, 85],
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    emoji: "🧠",
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
    borderColor: "border-violet-500/30",
    glowColor: "shadow-violet-500/20",
    role: "Coordinates all agents",
    fullDescription:
      "The central brain of Omega Swarm. Coordinates all 11 specialized agents, resolves conflicts, optimizes task sequencing, and ensures seamless collaboration across the entire agent ecosystem.",
    status: "Online",
    category: null,
    tags: [
      { label: "Coordination", color: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
      { label: "Sync", color: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
    ],
    tasksCompleted: 5678,
    winRate: 99.8,
    responseTime: "0.1s",
    active: true,
    recentActivity: [
      "Swarm topology optimized — latency -18%",
      "Agent conflict resolution: 0 pending",
      "Mission queue: 3 campaigns queued",
    ],
    sparkline: [80, 82, 85, 84, 88, 90, 92, 91, 95, 96, 98, 99],
  },
];

const FILTER_TABS: { label: FilterTab; icon: React.ReactNode }[] = [
  { label: "All", icon: <Bot className="w-3.5 h-3.5" /> },
  { label: "Creative", icon: <Zap className="w-3.5 h-3.5" /> },
  { label: "Intelligence", icon: <Target className="w-3.5 h-3.5" /> },
  { label: "Optimization", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { label: "Active", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { label: "Idle", icon: <MinusCircle className="w-3.5 h-3.5" /> },
];

/* ───────── Sparkline Component ───────── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 28;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.5} fill={color} />
    </svg>
  );
}

/* ───────── Status Badge ───────── */
function StatusBadge({ status }: { status: AgentStatus }) {
  const config = {
    Online: { icon: <CheckCircle2 className="w-3 h-3" />, className: "bg-green-500/15 text-green-400 border-green-500/25" },
    Idle: { icon: <MinusCircle className="w-3 h-3" />, className: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
    Working: { icon: <Loader2 className="w-3 h-3 animate-spin" />, className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold", c.className)}>
      {c.icon}
      {status}
    </span>
  );
}

/* ───────── Main Component ───────── */
export default function Agents() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);

  const filteredAgents = useMemo(() => {
    switch (activeFilter) {
      case "Creative":
        return agents.filter((a) => a.category === "Creative");
      case "Intelligence":
        return agents.filter((a) => a.category === "Intelligence");
      case "Optimization":
        return agents.filter((a) => a.category === "Optimization");
      case "Active":
        return agents.filter((a) => a.active);
      case "Idle":
        return agents.filter((a) => !a.active);
      default:
        return agents;
    }
  }, [activeFilter, agents]);

  const toggleAgentActive = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active, status: !a.active ? ("Online" as AgentStatus) : ("Idle" as AgentStatus) } : a))
    );
  };

  const colorMap: Record<string, string> = {
    "text-amber-400": "#FBBF24",
    "text-pink-400": "#F472B6",
    "text-emerald-400": "#34D399",
    "text-purple-400": "#A78BFA",
    "text-cyan-400": "#22D3EE",
    "text-slate-400": "#94A3B8",
    "text-red-400": "#F87171",
    "text-indigo-400": "#818CF8",
    "text-green-400": "#4ADE80",
    "text-teal-400": "#2DD4BF",
    "text-yellow-400": "#FACC15",
    "text-violet-400": "#A78BFA",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ═══ Section 1: Page Header ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#9333EA]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Swarm</h1>
              <p className="text-[#8B949E] text-sm mt-0.5">12 specialized AI marketing agents</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#8B949E]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              {agents.filter((a) => a.status === "Online").length} Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              {agents.filter((a) => a.status === "Working").length} Working
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#484F58]" />
              {agents.filter((a) => a.status === "Idle").length} Idle
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveFilter(tab.label)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                activeFilter === tab.label
                  ? "bg-purple-500/15 border-[#9333EA] text-[#F0F6FC] shadow-[0_0_12px_rgba(147,51,234,0.12)]"
                  : "bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D] hover:text-[#F0F6FC]"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Section 2: Agent Grid ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <React.Fragment key={agent.id}>
              <div
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                className={cn(
                  "rounded-2xl border bg-[#0D1117] p-5 cursor-pointer transition-all duration-300 group",
                  "hover:-translate-y-1 hover:border-opacity-100",
                  expandedAgent === agent.id
                    ? `border-[#9333EA] shadow-[0_0_20px_rgba(147,51,234,0.15)]`
                    : `border-[#21262D] hover:${agent.borderColor} hover:shadow-lg`
                )}
                style={{
                  boxShadow: expandedAgent === agent.id ? `0 0 20px rgba(147,51,234,0.15)` : undefined,
                }}
              >
                {/* Card Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 border",
                      agent.bgColor,
                      agent.borderColor
                    )}
                  >
                    {agent.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                      <StatusBadge status={agent.status} />
                    </div>
                    <p className="text-[#8B949E] text-xs mt-0.5 line-clamp-1">{agent.role}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {agent.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium", tag.color)}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#21262D]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="w-3 h-3 text-[#484F58]" />
                      <span className="text-[10px] text-[#484F58]">Tasks</span>
                    </div>
                    <span className="text-sm font-semibold">{agent.tasksCompleted.toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {agent.winRate >= 90 ? (
                        <ArrowUpRight className="w-3 h-3 text-[#22C55E]" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-[#F59E0B]" />
                      )}
                      <span className="text-[10px] text-[#484F58]">Win Rate</span>
                    </div>
                    <span className={cn("text-sm font-semibold", agent.winRate >= 90 ? "text-[#22C55E]" : "text-[#F59E0B]")}>
                      {agent.winRate}%
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-[#484F58]" />
                      <span className="text-[10px] text-[#484F58]">Response</span>
                    </div>
                    <span className="text-sm font-semibold">{agent.responseTime}</span>
                  </div>
                </div>
              </div>

              {/* ═══ Section 3: Agent Detail Panel ═══ */}
              {expandedAgent === agent.id && (
                <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-[#21262D] bg-[#0D1117] p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Info */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center text-2xl border",
                            agent.bgColor,
                            agent.borderColor
                          )}
                        >
                          {agent.emoji}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{agent.name}</h3>
                          <p className="text-[#8B949E] text-sm">{agent.role}</p>
                        </div>
                      </div>

                      <p className="text-[#8B949E] text-sm leading-relaxed">{agent.fullDescription}</p>

                      {/* Recent Activity */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#9333EA]" />
                          Recent Activity
                        </h4>
                        <div className="space-y-2">
                          {agent.recentActivity.map((activity, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 py-2 px-3 rounded-lg bg-[#161B22] border border-[#21262D]"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9333EA] mt-1.5 shrink-0" />
                              <span className="text-sm text-[#F0F6FC]">{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats & Controls */}
                    <div className="space-y-4">
                      {/* Performance Sparkline */}
                      <div className="rounded-xl border border-[#21262D] bg-[#161B22] p-4">
                        <h4 className="text-xs font-semibold text-[#8B949E] mb-3">Performance (12 periods)</h4>
                        <MiniSparkline data={agent.sparkline} color={colorMap[agent.color] || "#9333EA"} />
                        <div className="flex items-center justify-between mt-3 text-xs">
                          <span className="text-[#484F58]">Min: {Math.min(...agent.sparkline)}</span>
                          <span className="text-[#22C55E] font-semibold">
                            +{((agent.sparkline[agent.sparkline.length - 1] - agent.sparkline[0]) / agent.sparkline[0] * 100).toFixed(0)}%
                          </span>
                          <span className="text-[#484F58]">Max: {Math.max(...agent.sparkline)}</span>
                        </div>
                      </div>

                      {/* Toggle */}
                      <div className="rounded-xl border border-[#21262D] bg-[#161B22] p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Agent Status</div>
                            <div className="text-xs text-[#8B949E] mt-0.5">
                              {agent.active ? "Agent is active and processing tasks" : "Agent is idle"}
                            </div>
                          </div>
                          <Switch
                            checked={agent.active}
                            onCheckedChange={() => toggleAgentActive(agent.id)}
                            className="data-[state=checked]:bg-[#9333EA]"
                          />
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="rounded-xl border border-[#21262D] bg-[#161B22] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8B949E]">Tasks Completed</span>
                          <span className="text-sm font-semibold">{agent.tasksCompleted.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8B949E]">Win Rate</span>
                          <span className={cn("text-sm font-semibold", agent.winRate >= 90 ? "text-[#22C55E]" : "text-[#F59E0B]")}>
                            {agent.winRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8B949E]">Avg Response</span>
                          <span className="text-sm font-semibold">{agent.responseTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8B949E]">Category</span>
                          <span className="text-sm font-medium">{agent.category || "Core"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-16 text-[#484F58]">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No agents found</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
