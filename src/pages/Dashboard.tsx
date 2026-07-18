import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Rocket,
  Bot,
  FileText,
  TrendingUp,
  Plus,
  MessageSquare,
  Brain,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AgentData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glowColor: string;
  status: "online" | "busy" | "offline";
}

interface ActivityItem {
  id: string;
  agentColor: string;
  agentName: string;
  description: string;
  timestamp: string;
}

/* ------------------------------------------------------------------ */
/*  Agent Data                                                         */
/* ------------------------------------------------------------------ */

const AGENTS: AgentData[] = [
  { id: "a1", name: "Copywriter", emoji: "✍️", color: "#F59E0B", glowColor: "rgba(245,158,11,0.3)", status: "online" },
  { id: "a2", name: "Social Media", emoji: "📱", color: "#EC4899", glowColor: "rgba(236,72,153,0.3)", status: "online" },
  { id: "a3", name: "Sales", emoji: "💰", color: "#EF4444", glowColor: "rgba(239,68,68,0.3)", status: "busy" },
  { id: "a4", name: "Creative Dir.", emoji: "🎨", color: "#A855F7", glowColor: "rgba(168,85,247,0.3)", status: "online" },
  { id: "a5", name: "SEO", emoji: "🔍", color: "#84CC16", glowColor: "rgba(132,204,22,0.3)", status: "online" },
  { id: "a6", name: "Analytics", emoji: "📊", color: "#06B6D4", glowColor: "rgba(6,182,212,0.3)", status: "offline" },
  { id: "a7", name: "Sentinel", emoji: "🛡️", color: "#3B82F6", glowColor: "rgba(59,130,246,0.3)", status: "online" },
  { id: "a8", name: "GEO", emoji: "🌍", color: "#14B8A6", glowColor: "rgba(20,184,166,0.3)", status: "online" },
  { id: "a9", name: "Privacy", emoji: "🔒", color: "#6366F1", glowColor: "rgba(99,102,241,0.3)", status: "online" },
  { id: "a10", name: "Ambient", emoji: "🌸", color: "#D946EF", glowColor: "rgba(217,70,239,0.3)", status: "offline" },
  { id: "a11", name: "Budget RL", emoji: "💹", color: "#22C55E", glowColor: "rgba(34,197,94,0.3)", status: "online" },
  { id: "a12", name: "Orchestrator", emoji: "🧠", color: "#F59E0B", glowColor: "rgba(245,158,11,0.4)", status: "online" },
];

const ACTIVITIES: ActivityItem[] = [
  { id: "act1", agentColor: "#F59E0B", agentName: "Copywriter Maya", description: "completed blog post 'Summer Trends 2025'", timestamp: "2 min ago" },
  { id: "act2", agentColor: "#EC4899", agentName: "Social Agent", description: "posted to Instagram: 3 posts scheduled", timestamp: "15 min ago" },
  { id: "act3", agentColor: "#EF4444", agentName: "Sales Agent", description: "closed deal: $4,200", timestamp: "1 hr ago" },
  { id: "act4", agentColor: "#84CC16", agentName: "SEO Agent", description: "updated keyword rankings: +5 positions", timestamp: "3 hr ago" },
  { id: "act5", agentColor: "#F59E0B", agentName: "Orchestrator", description: "deployed new campaign 'Savannah Summer Sale'", timestamp: "5 hr ago" },
];

/* ------------------------------------------------------------------ */
/*  Chart Data                                                         */
/* ------------------------------------------------------------------ */

function generateRevenueData() {
  const data: { date: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 800 + Math.sin(i * 0.3) * 300 + Math.random() * 400;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.round(base),
    });
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Animated count-up hook */
function useCountUp(target: number, duration: number, delay: number = 0) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      function animate(ts: number) {
        if (startRef.current === null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Stat Card */
function StatCard({
  icon,
  iconBg,
  label,
  value,
  trend,
  trendColor,
  delay,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendColor: string;
  delay: number;
}) {
  return (
    <div
      className="glass-card card-lift p-5 animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
          >
            {value}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: trendColor }}>
            <TrendingUp className="size-3" />
            {trend}
          </p>
        </div>
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/** Agent Orb */
function AgentOrb({
  agent,
  index,
  onClick,
}: {
  agent: AgentData;
  index: number;
  onClick: () => void;
}) {
  const statusColor =
    agent.status === "online"
      ? "#22C55E"
      : agent.status === "busy"
        ? "#F59E0B"
        : "#6B7280";

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 hover:bg-white/5 animate-scale-in"
      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
    >
      <div className="relative">
        {/* Glow ring for active agents */}
        {agent.status === "online" && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              margin: -4,
              border: `2px solid ${agent.color}`,
              opacity: 0.4,
            }}
          />
        )}
        <div
          className="flex size-12 items-center justify-center rounded-full border-2 text-xl transition-transform duration-200 group-hover:scale-110"
          style={{
            borderColor: agent.color,
            background: `${agent.color}15`,
            boxShadow: agent.status === "online" ? `0 0 12px ${agent.glowColor}` : "none",
          }}
        >
          {agent.emoji}
        </div>
        {/* Status dot */}
        <span
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2"
          style={{ borderColor: "var(--bg-base)", background: statusColor }}
        />
      </div>
      <span
        className="text-[10px] font-medium truncate max-w-[60px]"
        style={{ color: "var(--text-secondary)" }}
      >
        {agent.name}
      </span>
    </button>
  );
}

/** Activity Feed Item */
function ActivityFeedItem({
  activity,
  index,
}: {
  activity: ActivityItem;
  index: number;
}) {
  return (
    <div
      className="flex items-start gap-3 py-3 animate-fade-up"
      style={{ animationDelay: `${0.6 + index * 0.08}s` }}
    >
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full"
        style={{ background: activity.agentColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)" }}>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {activity.agentName}
          </span>{" "}
          {activity.description}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {activity.timestamp}
        </p>
      </div>
    </div>
  );
}

/** Quick Task Item */
function QuickTask({
  text,
  agentColor,
  agentName,
  index,
}: {
  text: string;
  agentColor: string;
  agentName: string;
  index: number;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <div
      className="flex items-center gap-3 py-2.5 animate-fade-up"
      style={{ animationDelay: `${0.7 + index * 0.08}s` }}
    >
      <button
        onClick={() => setChecked(!checked)}
        className="flex size-5 shrink-0 items-center justify-center rounded border transition-colors duration-200"
        style={{
          borderColor: checked ? agentColor : "var(--border-subtle)",
          background: checked ? `${agentColor}20` : "transparent",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke={agentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span
        className="flex-1 text-sm transition-all duration-200"
        style={{
          color: checked ? "var(--text-muted)" : "var(--text-secondary)",
          textDecoration: checked ? "line-through" : "none",
        }}
      >
        {text}
      </span>
      <span
        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium"
        style={{ background: `${agentColor}15`, color: agentColor }}
      >
        {agentName}
      </span>
    </div>
  );
}

/** Chart tooltip */
function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{ background: "var(--bg-card-solid)", borderColor: "var(--border-subtle)" }}
    >
      <p className="mb-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();
  const greeting = useGreeting();

  /* Animated count-up values */
  const revenueValue = useCountUp(24892, 1.5, 0.3);
  const campaignsValue = useCountUp(3, 0.8, 0.4);
  const agentsOnlineValue = useCountUp(8, 1.0, 0.5);
  const contentValue = useCountUp(147, 1.2, 0.6);

  /* Chart data */
  const revenueData = useMemo(() => generateRevenueData(), []);

  /* Online agents count */
  const onlineCount = AGENTS.filter((a) => a.status === "online").length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* ═══════════════════ Section 1: Welcome Banner ═══════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 animate-fade-up"
        style={{
          background: "var(--gradient-sunset)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Radial glow background */}
        <div
          className="pointer-events-none absolute inset-0 animate-glow-oscillate"
          style={{
            background: "radial-gradient(ellipse at center, rgba(245,158,11,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {greeting}, Isaac
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Your Swarm is active. {onlineCount} agents online, {campaignsValue} campaigns running.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/mission-control")}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              style={{
                background: "var(--gradient-gold)",
                color: "#0C0A09",
              }}
            >
              <Plus className="size-4" />
              New Mission
            </button>
            <button
              onClick={() => navigate("/agents")}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-amber-500/10"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <MessageSquare className="size-4" />
              Chat with Agents
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Section 2: Stats Row ═══════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<DollarSign className="size-5 text-emerald-400" />}
          iconBg="rgba(132, 204, 22, 0.12)"
          label="Revenue this month"
          value={`$${revenueValue.toLocaleString()}`}
          trend="+12.5%"
          trendColor="#84CC16"
          delay={0.3}
        />
        <StatCard
          icon={<Rocket className="size-5 text-amber-400" />}
          iconBg="rgba(245, 158, 11, 0.12)"
          label="Active campaigns"
          value={String(campaignsValue)}
          trend="+1 new this week"
          trendColor="var(--text-muted)"
          delay={0.42}
        />
        <StatCard
          icon={<Bot className="size-5 text-cyan-400" />}
          iconBg="rgba(6, 182, 212, 0.12)"
          label="Agents online"
          value={`${agentsOnlineValue} / 12`}
          trend="8 active"
          trendColor="var(--text-muted)"
          delay={0.54}
        />
        <StatCard
          icon={<FileText className="size-5 text-purple-400" />}
          iconBg="rgba(168, 85, 247, 0.12)"
          label="Content pieces created"
          value={String(contentValue)}
          trend="+23 this week"
          trendColor="var(--text-muted)"
          delay={0.66}
        />
      </div>

      {/* ═══════════════════ Section 3: Two-Column Layout ═══════════════════ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* ── Left Column (65% ~ 3/5) ── */}
        <div className="xl:col-span-3 space-y-6">
          {/* Revenue Chart */}
          <div
            className="rounded-2xl border p-6 animate-fade-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.5s",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Revenue Overview
              </h2>
              <div className="flex gap-1">
                {["7D", "30D", "90D"].map((t) => (
                  <button
                    key={t}
                    className="rounded-lg px-3 py-1 text-xs font-medium transition-colors duration-200"
                    style={{
                      color: t === "30D" ? "var(--text-primary)" : "var(--text-muted)",
                      background: t === "30D" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-subtle)"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border-subtle)" }}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill="url(#revGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div
            className="rounded-2xl border p-6 animate-fade-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.6s",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Recent Activity
              </h2>
              <button
                className="text-xs font-medium transition-colors duration-200 hover:text-amber-400"
                style={{ color: "var(--text-accent)" }}
              >
                View All
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {ACTIVITIES.map((activity, idx) => (
                <ActivityFeedItem key={activity.id} activity={activity} index={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column (35% ~ 2/5) ── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Agent Status Orbs */}
          <div
            className="rounded-2xl border p-6 animate-fade-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.5s",
            }}
          >
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Active Agents
            </h2>
            <div className="grid grid-cols-4 gap-2">
              {AGENTS.map((agent, idx) => (
                <AgentOrb
                  key={agent.id}
                  agent={agent}
                  index={idx}
                  onClick={() => navigate("/agents")}
                />
              ))}
            </div>
          </div>

          {/* Quick Tasks */}
          <div
            className="rounded-2xl border p-6 animate-fade-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.7s",
            }}
          >
            <h2
              className="mb-3 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Quick Tasks
            </h2>
            <div>
              <QuickTask
                text="Write product description for new collection"
                agentColor="#F59E0B"
                agentName="Copywriter"
                index={0}
              />
              <QuickTask
                text="Schedule social posts for next week"
                agentColor="#EC4899"
                agentName="Social Media"
                index={1}
              />
              <QuickTask
                text="Review SEO report and approve changes"
                agentColor="#84CC16"
                agentName="SEO"
                index={2}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl border p-6 animate-fade-up"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              backdropFilter: "blur(12px)",
              animationDelay: "0.8s",
            }}
          >
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/mission-control")}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-amber-500/10"
                style={{
                  background: "rgba(245, 158, 11, 0.06)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Rocket className="size-4" style={{ color: "var(--accent-primary)" }} />
                New Mission
              </button>
              <button
                onClick={() => navigate("/agents")}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-amber-500/10"
                style={{
                  background: "rgba(245, 158, 11, 0.06)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Bot className="size-4" style={{ color: "var(--accent-info)" }} />
                View Agents
              </button>
              <button
                onClick={() => navigate("/memory-bank")}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-amber-500/10"
                style={{
                  background: "rgba(245, 158, 11, 0.06)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Brain className="size-4" style={{ color: "var(--accent-purple)" }} />
                Brain AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════ Section 4: Campaign Preview ═══════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            name: "Savannah Summer Sale",
            status: "Active",
            statusColor: "#22C55E",
            progress: 68,
            agentColor: "#EF4444",
            budget: "$8,400 spent",
            days: "12 days left",
            content: "24 pieces",
          },
          {
            name: "Brand Awareness Q3",
            status: "Active",
            statusColor: "#22C55E",
            progress: 42,
            agentColor: "#A855F7",
            budget: "$5,200 spent",
            days: "28 days left",
            content: "18 pieces",
          },
          {
            name: "SEO Refresh 2025",
            status: "Completed",
            statusColor: "#6B7280",
            progress: 100,
            agentColor: "#84CC16",
            budget: "$3,800 spent",
            days: "Completed",
            content: "31 pieces",
          },
        ].map((campaign, idx) => (
          <div
            key={campaign.name}
            className="glass-card card-lift p-5 animate-fade-up"
            style={{ animationDelay: `${0.8 + idx * 0.15}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {campaign.name}
              </h3>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${campaign.statusColor}15`,
                  color: campaign.statusColor,
                }}
              >
                {campaign.status}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Progress
                </span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}
                >
                  {campaign.progress}%
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--border-subtle)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${campaign.progress}%`,
                    background: campaign.agentColor,
                    boxShadow: `0 0 8px ${campaign.agentColor}40`,
                  }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-3 flex items-center gap-4">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {campaign.budget}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {campaign.days}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {campaign.content}
              </span>
            </div>

            {/* View Details link */}
            <button
              className="text-xs font-medium transition-colors duration-200 hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
