import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  Eye,
  Target,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Star,
  Award,
  Medal,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  percent: number;
}

interface AgentLeader {
  rank: number;
  name: string;
  role: string;
  tasks: number;
  successRate: number;
  avgQuality: number;
  color: string;
}

interface ChannelData {
  name: string;
  percent: number;
  color: string;
  leads: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PERFORMANCE_DATA_7D = [
  { day: "Mon", impressions: 42000, conversions: 1800 },
  { day: "Tue", impressions: 48000, conversions: 2100 },
  { day: "Wed", impressions: 45000, conversions: 1950 },
  { day: "Thu", impressions: 52000, conversions: 2400 },
  { day: "Fri", impressions: 58000, conversions: 2800 },
  { day: "Sat", impressions: 61000, conversions: 3100 },
  { day: "Sun", impressions: 55000, conversions: 2700 },
];

const PERFORMANCE_DATA_30D = [
  { day: "W1", impressions: 98000, conversions: 3200 },
  { day: "W2", impressions: 112000, conversions: 4100 },
  { day: "W3", impressions: 105000, conversions: 3800 },
  { day: "W4", impressions: 128000, conversions: 5200 },
  { day: "W5", impressions: 118000, conversions: 4700 },
  { day: "W6", impressions: 135000, conversions: 5800 },
  { day: "W7", impressions: 142000, conversions: 6100 },
  { day: "W8", impressions: 138000, conversions: 5900 },
];

const PERFORMANCE_DATA_90D = [
  { day: "M1", impressions: 380000, conversions: 12800 },
  { day: "M2", impressions: 420000, conversions: 15200 },
  { day: "M3", impressions: 398000, conversions: 14100 },
  { day: "M4", impressions: 445000, conversions: 16800 },
  { day: "M5", impressions: 410000, conversions: 14900 },
  { day: "M6", impressions: 468000, conversions: 18200 },
  { day: "M7", impressions: 489000, conversions: 19500 },
  { day: "M8", impressions: 512000, conversions: 21000 },
  { day: "M9", impressions: 421000, conversions: 10900 },
];

const FUNNEL_STAGES: FunnelStage[] = [
  { name: "Impressions", value: 10000, color: "#06B6D4", percent: 100 },
  { name: "Clicks", value: 2400, color: "#F59E0B", percent: 60 },
  { name: "Leads", value: 847, color: "#A855F7", percent: 35 },
  { name: "Customers", value: 142, color: "#84CC16", percent: 10 },
];

const CHANNELS: ChannelData[] = [
  { name: "Instagram", percent: 32, color: "#EC4899", leads: 1231 },
  { name: "LinkedIn", percent: 25, color: "#3B82F6", leads: 962 },
  { name: "Google", percent: 20, color: "#F59E0B", leads: 770 },
  { name: "TikTok", percent: 13, color: "#06B6D4", leads: 500 },
  { name: "Email", percent: 10, color: "#84CC16", leads: 384 },
];

const AGENT_LEADERS: AgentLeader[] = [
  { rank: 1, name: "Ace", role: "Sales", tasks: 487, successRate: 96, avgQuality: 9.4, color: "#EF4444" },
  { rank: 2, name: "Maya", role: "Copywriter", tasks: 623, successRate: 92, avgQuality: 9.2, color: "#F59E0B" },
  { rank: 3, name: "Scout", role: "SEO", tasks: 534, successRate: 88, avgQuality: 9.0, color: "#84CC16" },
  { rank: 4, name: "Pulse", role: "Social Media", tasks: 712, successRate: 85, avgQuality: 8.7, color: "#EC4899" },
  { rank: 5, name: "Nexus", role: "Analytics", tasks: 398, successRate: 81, avgQuality: 8.5, color: "#06B6D4" },
  { rank: 6, name: "Vision", role: "Creative Director", tasks: 445, successRate: 78, avgQuality: 8.3, color: "#A855F7" },
];

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

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

function useCountUpFloat(target: number, duration = 1500, decimals = 1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, decimals]);
  return value;
}

function useAnimatedWidth(target: number, duration = 1000, delay = 0) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setWidth(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return width;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  trendUp,
  color,
  index,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  suffix: string;
  trend: string;
  trendUp: boolean;
  color: string;
  index: number;
}) {
  const count = useCountUp(value, 1500);
  const formatted =
    value >= 1000
      ? suffix === "%"
        ? `${count}${suffix}`
        : `${(count / 1000).toFixed(suffix === "K" ? 1 : 0)}${suffix || "K"}`
      : `${count}${suffix}`;

  return (
    <div
      className="animate-stagger-in stagger-dynamic rounded-2xl border p-5 card-lift"
      style={{
        animationDelay: `${index * 0.1}s`,
        background: "var(--gradient-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
        <div
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: trendUp ? "rgba(132,204,22,0.15)" : "rgba(239,68,68,0.15)",
            color: trendUp ? "#84CC16" : "#EF4444",
          }}
        >
          {trendUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {trend}
        </div>
      </div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        {suffix === "€" ? `€${count.toFixed(2)}` : formatted}
      </div>
      <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}

function FunnelBar({ stage, index }: { stage: FunnelStage; index: number }) {
  const width = useAnimatedWidth(stage.percent, 800, index * 150);

  return (
    <div
      className="animate-stagger-in stagger-dynamic"
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          {stage.name}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {stage.value.toLocaleString()}
        </span>
      </div>
      <div
        className="relative h-12 rounded-lg overflow-hidden"
        style={{ background: "var(--bg-input)" }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-lg transition-all duration-700 flex items-center justify-end px-3"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${stage.color}40, ${stage.color}80)`,
          }}
        >
          <span className="text-xs font-bold text-white/90">{stage.percent}%</span>
        </div>
      </div>
      {index < FUNNEL_STAGES.length - 1 && (
        <div className="flex justify-center my-1">
          <div
            className="h-3 w-px"
            style={{
              background: "var(--border-subtle)",
              borderLeft: "1px dashed var(--border-subtle)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function ChannelBar({ channel, index }: { channel: ChannelData; index: number }) {
  const width = useAnimatedWidth(channel.percent, 800, 300 + index * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
        {channel.name}
      </span>
      <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 flex items-center justify-end px-2"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${channel.color}60, ${channel.color})`,
          }}
        />
      </div>
      <span className="w-12 text-right text-xs font-semibold" style={{ color: channel.color }}>
        {channel.percent}%
      </span>
    </div>
  );
}

function LeaderRow({ agent, index }: { agent: AgentLeader; index: number }) {
  const barWidth = useAnimatedWidth(agent.successRate, 800, 600 + index * 100);

  const getRankIcon = () => {
    if (agent.rank === 1) return <Award className="size-4" style={{ color: "#FBBF24" }} />;
    if (agent.rank === 2) return <Medal className="size-4" style={{ color: "#C0C0C0" }} />;
    if (agent.rank === 3) return <Star className="size-4" style={{ color: "#CD7F32" }} />;
    return <span className="w-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>{agent.rank}</span>;
  };

  return (
    <div
      className="animate-stagger-in stagger-dynamic flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 hover:bg-white/[0.02]"
      style={{
        animationDelay: `${index * 0.08}s`,
        borderColor: agent.rank <= 3 ? `${agent.color}30` : "var(--border-subtle)",
        background: agent.rank <= 3 ? `${agent.color}08` : "transparent",
      }}
    >
      <div className="w-6 flex justify-center">{getRankIcon()}</div>
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: agent.color }}
      >
        {agent.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {agent.name}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {agent.tasks} tasks
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${agent.color}, ${agent.color}80)`,
              }}
            />
          </div>
          <span className="w-10 text-right text-xs font-bold" style={{ color: agent.color }}>
            {agent.successRate}%
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {agent.avgQuality}
        </div>
        <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          quality
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Tooltip                                                     */
/* ------------------------------------------------------------------ */

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-xl border px-4 py-3 shadow-lg"
      style={{
        background: "var(--bg-card-solid)",
        borderColor: "var(--accent-primary)",
      }}
    >
      <p className="mb-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.dataKey === "impressions" ? "Impressions" : "Conversions"}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Pipeline() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D">("7D");

  const chartData = useMemo(() => {
    switch (period) {
      case "30D":
        return PERFORMANCE_DATA_30D;
      case "90D":
        return PERFORMANCE_DATA_90D;
      default:
        return PERFORMANCE_DATA_7D;
    }
  }, [period]);

  const stats = [
    {
      icon: Eye,
      label: "Total Impressions",
      value: 421,
      suffix: "K",
      trend: "+12.5%",
      trendUp: true,
      color: "#06B6D4",
    },
    {
      icon: Target,
      label: "Conversions",
      value: 10900,
      suffix: "",
      trend: "+8.3%",
      trendUp: true,
      color: "#A855F7",
    },
    {
      icon: MousePointerClick,
      label: "CTR",
      value: 26,
      suffix: "%",
      trend: "+1.2%",
      trendUp: true,
      color: "#F59E0B",
    },
    {
      icon: ShoppingCart,
      label: "Cost / Conv",
      value: 0,
      suffix: "€",
      display: "€42.50",
      trend: "-5.1%",
      trendUp: true,
      color: "#84CC16",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="size-6" style={{ color: "var(--accent-primary)" }} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Analytics Pipeline
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Real-time performance insights across your Swarm
            </p>
          </div>
        </div>
        {/* Period Toggle */}
        <div
          className="inline-flex rounded-xl border p-1"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-input)" }}
        >
          {(["7D", "30D", "90D"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                period === p ? "text-black" : ""
              )}
              style={{
                background: period === p ? "var(--gradient-gold)" : "transparent",
                color: period === p ? "#0C0A09" : "var(--text-muted)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) =>
          i === 3 ? (
            <StatCard
              key={i}
              {...s}
              value={42}
              index={i}
            />
          ) : (
            <StatCard key={i} {...s} index={i} />
          )
        )}
      </div>

      {/* ── Performance Chart ── */}
      <div
        className="animate-fade-up stagger-2 rounded-2xl border p-6"
        style={{
          background: "var(--gradient-card)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Performance Overview
          </h3>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#F59E0B" }}>
              <span className="size-2 rounded-full" style={{ background: "#F59E0B" }} />
              Impressions
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#A855F7" }}>
              <span className="size-2 rounded-full" style={{ background: "#A855F7" }} />
              Conversions
            </span>
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="conversionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(41,34,29,0.5)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#7A6E5F", fontSize: 12 }}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7A6E5F", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="impressions"
                stroke="#F59E0B"
                strokeWidth={2}
                fill="url(#impressionsGrad)"
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="conversions"
                stroke="#A855F7"
                strokeWidth={2}
                fill="url(#conversionsGrad)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row: Funnel + Channels + Leaderboard ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversion Funnel */}
        <div
          className="animate-fade-up stagger-3 rounded-2xl border p-6"
          style={{
            background: "var(--gradient-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h3 className="mb-5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Conversion Funnel
          </h3>
          <div className="space-y-1">
            {FUNNEL_STAGES.map((stage, i) => (
              <FunnelBar key={stage.name} stage={stage} index={i} />
            ))}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div
          className="animate-fade-up stagger-4 rounded-2xl border p-6"
          style={{
            background: "var(--gradient-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h3 className="mb-5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Channel Breakdown
          </h3>
          <div className="space-y-4">
            {CHANNELS.map((ch, i) => (
              <ChannelBar key={ch.name} channel={ch} index={i} />
            ))}
          </div>
          <div className="mt-5 rounded-xl border p-3 text-center" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-input)" }}>
            <div className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>
              3,847
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Total Leads
            </div>
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div
          className="animate-fade-up stagger-5 rounded-2xl border p-6"
          style={{
            background: "var(--gradient-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <h3 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Agent Leaderboard
          </h3>
          <div className="space-y-2">
            {AGENT_LEADERS.map((agent, i) => (
              <LeaderRow key={agent.name} agent={agent} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
