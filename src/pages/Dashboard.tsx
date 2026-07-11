import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  CheckCircle2,
  Percent,
  Bot,
  Plus,
  Zap,
  Clock,
  Target,
  Eye,
  Brain,
  BarChart3,
  DollarSign,
  Users,
  Search,
  Megaphone,
  Lock,
  ChevronRight,
  Workflow,
  Rocket,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Campaign {
  id: string;
  name: string;
  status: "Running" | "Review" | "Planning";
  progress: number;
  agents: number;
  lastActivity: string;
}

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  timestamp: string;
}

interface Agent {
  id: string;
  name: string;
  color: string;
  active: boolean;
  angle: number;
}

/* ------------------------------------------------------------------ */
/*  Demo Data                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITIES: ActivityItem[] = [
  {
    id: "a1",
    icon: <CheckCircle2 className="size-4" />,
    color: "#22C55E",
    description: "Copywriter GPT completed ad variants for Eco Bottle",
    timestamp: "2 min ago",
  },
  {
    id: "a2",
    icon: <Search className="size-4" />,
    color: "#A855F7",
    description: "SEO Strategist found 47 new keywords",
    timestamp: "15 min ago",
  },
  {
    id: "a3",
    icon: <Zap className="size-4" />,
    color: "#F59E0B",
    description: "Budget RL shifted €30 from LinkedIn to TikTok",
    timestamp: "32 min ago",
  },
  {
    id: "a4",
    icon: <Eye className="size-4" />,
    color: "#EF4444",
    description: "Sentinel detected competitor price drop on Product X",
    timestamp: "1 hr ago",
  },
  {
    id: "a5",
    icon: <Megaphone className="size-4" />,
    color: "#EC4899",
    description: "Social Media Agent scheduled 12 posts for next week",
    timestamp: "2 hr ago",
  },
  {
    id: "a6",
    icon: <BarChart3 className="size-4" />,
    color: "#8B949E",
    description: "Analytics report: CTR up 23% on latest campaign",
    timestamp: "3 hr ago",
  },
  {
    id: "a7",
    icon: <Lock className="size-4" />,
    color: "#22C55E",
    description: "Privacy Agent purged 234 expired consent records",
    timestamp: "5 hr ago",
  },
  {
    id: "a8",
    icon: <Brain className="size-4" />,
    color: "#A855F7",
    description: "Memory Bank learned: Gen Z prefers hooks in first 1.5s",
    timestamp: "Yesterday",
  },
];

const AGENTS: Agent[] = [
  { id: "ag1", name: "Copywriter", color: "#F59E0B", active: true, angle: 0 },
  { id: "ag2", name: "Social", color: "#EC4899", active: true, angle: 30 },
  { id: "ag3", name: "Sales", color: "#22C55E", active: true, angle: 60 },
  { id: "ag4", name: "Creative", color: "#A855F7", active: true, angle: 90 },
  { id: "ag5", name: "SEO", color: "#06B6D4", active: true, angle: 120 },
  { id: "ag6", name: "Analytics", color: "#8B949E", active: false, angle: 150 },
  { id: "ag7", name: "Sentinel", color: "#EF4444", active: true, angle: 180 },
  { id: "ag8", name: "GEO", color: "#6366F1", active: true, angle: 210 },
  { id: "ag9", name: "Privacy", color: "#22C55E", active: true, angle: 240 },
  { id: "ag10", name: "Ambient", color: "#14B8A6", active: true, angle: 270 },
  { id: "ag11", name: "Budget", color: "#EAB308", active: true, angle: 300 },
  { id: "ag12", name: "Orchestrator", color: "#8B5CF6", active: false, angle: 330 },
];

function generateChartData(days: number) {
  const data: {
    date: string;
    impressions: number;
    conversions: number;
  }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const baseImp = 12000 + Math.sin(i * 0.3) * 4000;
    const baseConv = 300 + Math.sin(i * 0.3) * 120;
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      impressions: Math.round(baseImp + Math.random() * 3000),
      conversions: Math.round(baseConv + Math.random() * 80),
    });
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning, Isaac";
  if (hour < 18) return "Good afternoon, Isaac";
  return "Good evening, Isaac";
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  const variants: Record<
    Campaign["status"],
    { bg: string; text: string; dot: string }
  > = {
    Running: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    Review: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    Planning: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-400",
    },
  };
  const v = variants[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${v.bg} ${v.text}`}
    >
      <span className={`size-1.5 rounded-full ${v.dot}`} />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Mini sparkline for KPI card */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Progress ring for KPI card */
function ProgressRing({
  percentage,
  size = 48,
  stroke = 4,
}: {
  percentage: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percentage / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#21262D"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#9333EA"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#F0F6FC]"
        style={{ fontFamily: "JetBrains Mono, monospace" }}
      >
        {percentage}%
      </span>
    </div>
  );
}

/** Mini bar chart for Win Rate KPI */
function MiniBarChart() {
  const data = [
    { v: 62 },
    { v: 68 },
    { v: 65 },
    { v: 71 },
    { v: 69 },
    { v: 74 },
    { v: 78 },
  ];
  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="v" fill="#22C55E" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Custom Tooltip for area chart */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{ background: "#161B22", borderColor: "#21262D" }}
    >
      <p className="mb-1 text-xs text-[#484F58]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-[#8B949E]">{p.name}:</span>
          <span
            className="font-semibold text-[#F0F6FC]"
            style={{ fontFamily: "JetBrains Mono, monospace" }}
          >
            {p.name === "Impressions"
              ? p.value.toLocaleString()
              : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Agent Swarm Visualization */
function AgentSwarmViz() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 0.2);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const cx = 140;
  const cy = 140;
  const orbitRadius = 100;

  return (
    <div className="flex items-center justify-center py-6">
      <svg
        width={280}
        height={280}
        viewBox="0 0 280 280"
        className="overflow-visible"
      >
        {/* Orbit rings */}
        <circle
          cx={cx}
          cy={cy}
          r={orbitRadius}
          fill="none"
          stroke="#21262D"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
        <circle
          cx={cx}
          cy={cy}
          r={orbitRadius * 0.65}
          fill="none"
          stroke="#21262D"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.3}
        />

        {/* Connection lines from hub to agents */}
        {AGENTS.map((agent) => {
          const rad = ((agent.angle + rotation) * Math.PI) / 180;
          const x = cx + orbitRadius * Math.cos(rad);
          const y = cy + orbitRadius * Math.sin(rad);
          return (
            <line
              key={`line-${agent.id}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={agent.active ? agent.color : "#484F58"}
              strokeWidth={0.5}
              opacity={agent.active ? 0.2 : 0.05}
            />
          );
        })}

        {/* Central hub */}
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9333EA" stopOpacity={0.6} />
            <stop offset="50%" stopColor="#9333EA" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={45} fill="url(#hubGlow)">
          <animate
            attributeName="r"
            values="40;48;40"
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
        <circle
          cx={cx}
          cy={cy}
          r={24}
          fill="#0D1117"
          stroke="#9333EA"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#A855F7"
          fontSize={20}
          fontWeight={700}
          fontFamily="JetBrains Mono, monospace"
        >
          &#937;
        </text>

        {/* Agent dots */}
        {AGENTS.map((agent) => {
          const rad = ((agent.angle + rotation) * Math.PI) / 180;
          const x = cx + orbitRadius * Math.cos(rad);
          const y = cy + orbitRadius * Math.sin(rad);
          return (
            <g key={agent.id}>
              {/* Glow ring for active agents */}
              {agent.active && (
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill={agent.color}
                  opacity={0.15}
                >
                  <animate
                    attributeName="r"
                    values="8;14;8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.2;0.05;0.2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={agent.active ? agent.color : "#484F58"}
                opacity={agent.active ? 1 : 0.4}
                stroke="#0D1117"
                strokeWidth={2}
              />
              {/* Label */}
              <text
                x={x + (x > cx ? 12 : -12)}
                y={y + 3}
                textAnchor={x > cx ? "start" : "end"}
                fill={agent.active ? agent.color : "#484F58"}
                fontSize={8}
                fontFamily="JetBrains Mono, monospace"
                opacity={agent.active ? 0.8 : 0.4}
              >
                {agent.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard Component                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const greeting = useGreeting();
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");

  /* ── Fetch real campaign data ── */
  const { data: campaignsData, isLoading: campaignsLoading } = trpc.agent.getCampaigns.useQuery();

  const chartData = useMemo(
    () => generateChartData(timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90),
    [timeRange]
  );

  const sparkData = [28, 35, 32, 40, 38, 42, 45, 48, 46, 52, 50, 55, 53, 58];

  const totalImpressions = chartData.reduce((s, d) => s + d.impressions, 0);
  const totalConversions = chartData.reduce((s, d) => s + d.conversions, 0);
  const avgCTR = ((totalConversions / totalImpressions) * 100).toFixed(2);
  const costPerConv = (42.5).toFixed(2);

  /* ── Map real campaigns to display format ── */
  const campaigns: Campaign[] = useMemo(() => {
    if (!campaignsData || campaignsData.length === 0) return [];
    return campaignsData.map((c) => ({
      id: c.id,
      name: c.title || c.objective.slice(0, 50) + (c.objective.length > 50 ? "..." : ""),
      status: c.status === "running" ? "Running" : c.status === "completed" ? "Review" : "Planning",
      progress: c.status === "completed" ? 100 : c.status === "running" ? 65 : 25,
      agents: c.outputs?.length || 12,
      lastActivity: c.createdAt
        ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Recently",
    }));
  }, [campaignsData]);

  const activeCampaignsCount = campaigns.filter((c) => c.status === "Running").length;

  return (
    <div
      className="min-h-screen w-full px-6 py-6"
      style={{
        background: "#0A0A0F",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ============================================================ */}
      {/* 1. PAGE HEADER                                               */}
      {/* ============================================================ */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#F0F6FC" }}
          >
            Mission Control
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
            {greeting} &mdash; Your AI marketing swarm is standing by
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/mission-control">
            <Button
              className="gap-2 rounded-lg border-none font-medium"
              style={{ background: "#9333EA", color: "#F0F6FC" }}
            >
              <Plus className="size-4" />
              New Mission
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2 rounded-lg font-medium"
            style={{
              borderColor: "#21262D",
              color: "#F0F6FC",
              background: "transparent",
            }}
          >
            <Workflow className="size-4" />
            View Pipeline
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. KPI STATS ROW                                             */}
      {/* ============================================================ */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* KPI 1: Active Campaigns */}
        <Card
          className="group relative overflow-hidden rounded-xl border py-6 transition-colors duration-200"
          style={{
            background: "#0D1117",
            borderColor: "#21262D",
            padding: "24px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "#30363D")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "#21262D")
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#8B949E" }}>
                Active Campaigns
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "#F0F6FC", fontFamily: "JetBrains Mono, monospace" }}
              >
                {campaignsLoading ? (
                  <Skeleton className="h-8 w-12" style={{ background: "#21262D" }} />
                ) : (
                  activeCampaignsCount
                )}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                <TrendingUp className="size-3" />+2 this week
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="size-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <MiniSparkline data={sparkData} color="#22C55E" />
          </div>
        </Card>

        {/* KPI 2: Tasks in Progress */}
        <Card
          className="group relative overflow-hidden rounded-xl border py-6 transition-colors duration-200"
          style={{
            background: "#0D1117",
            borderColor: "#21262D",
            padding: "24px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "#30363D")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "#21262D")
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#8B949E" }}>
                Tasks in Progress
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "#F0F6FC", fontFamily: "JetBrains Mono, monospace" }}
              >
                34
              </p>
              <p className="mt-1 text-xs" style={{ color: "#8B949E" }}>
                <span style={{ color: "#22C55E" }}>12 completed</span> today
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <CheckCircle2 className="size-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <ProgressRing percentage={73} />
            <span
              className="text-xs"
              style={{ color: "#484F58", fontFamily: "JetBrains Mono, monospace" }}
            >
              73% capacity
            </span>
          </div>
        </Card>

        {/* KPI 3: Win Rate */}
        <Card
          className="group relative overflow-hidden rounded-xl border py-6 transition-colors duration-200"
          style={{
            background: "#0D1117",
            borderColor: "#21262D",
            padding: "24px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "#30363D")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "#21262D")
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#8B949E" }}>
                Win Rate
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "#F0F6FC", fontFamily: "JetBrains Mono, monospace" }}
              >
                78.2%
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#22C55E" }}>
                <TrendingUp className="size-3" />+5.4% vs last month
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Percent className="size-5 text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <MiniBarChart />
          </div>
        </Card>

        {/* KPI 4: Agents Online */}
        <Card
          className="group relative overflow-hidden rounded-xl border py-6 transition-colors duration-200"
          style={{
            background: "#0D1117",
            borderColor: "#21262D",
            padding: "24px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "#30363D")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "#21262D")
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "#8B949E" }}>
                Agents Online
              </p>
              <p
                className="mt-2 text-3xl font-bold"
                style={{ color: "#F0F6FC", fontFamily: "JetBrains Mono, monospace" }}
              >
                11<span className="text-lg" style={{ color: "#484F58" }}>/12</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#F59E0B" }}>
                1 updating
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <Bot className="size-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex -space-x-2">
              {AGENTS.slice(0, 5).map((a) => (
                <Avatar
                  key={a.id}
                  className="size-7 border-2"
                  style={{ borderColor: "#0D1117", background: a.color + "20" }}
                >
                  <AvatarFallback
                    className="text-[9px] font-bold"
                    style={{ color: a.color, background: a.color + "18" }}
                  >
                    {a.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              <Avatar
                className="size-7 border-2"
                style={{ borderColor: "#0D1117" }}
              >
                <AvatarFallback
                  className="text-[9px] font-bold"
                  style={{ color: "#8B949E", background: "#21262D" }}
                >
                  +6
                </AvatarFallback>
              </Avatar>
            </div>
            <span className="relative flex h-3 w-3">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: "#22C55E" }}
              />
              <span
                className="relative inline-flex size-3 rounded-full"
                style={{ background: "#22C55E" }}
              />
            </span>
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* ROW: Active Campaigns + Activity Feed                         */}
      {/* ============================================================ */}
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 3. ACTIVE CAMPAIGNS */}
        <Card
          className="col-span-1 rounded-xl border xl:col-span-2"
          style={{ background: "#0D1117", borderColor: "#21262D" }}
        >
          <CardHeader className="px-6 pb-4" style={{ paddingTop: "24px" }}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className="text-lg font-semibold"
                  style={{ color: "#F0F6FC" }}
                >
                  Active Campaigns
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {campaignsLoading
                    ? "Loading campaigns..."
                    : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} currently running`}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                style={{ color: "#8B949E" }}
              >
                View all <ChevronRight className="size-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Loading state */}
            {campaignsLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-lg p-4"
                    style={{ background: "#161B22" }}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" style={{ background: "#21262D" }} />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" style={{ background: "#21262D" }} />
                        <Skeleton className="h-3 w-32" style={{ background: "#21262D" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!campaignsLoading && campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
                  style={{ background: "#161B22" }}
                >
                  <Rocket className="h-8 w-8" style={{ color: "#484F58" }} />
                </div>
                <p className="text-base font-medium" style={{ color: "#F0F6FC" }}>
                  No missions yet
                </p>
                <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
                  Deploy your first mission to see results here.
                </p>
                <Link to="/mission-control" className="mt-4">
                  <Button
                    className="gap-2 rounded-lg font-medium"
                    style={{ background: "#9333EA", color: "#fff" }}
                  >
                    <Rocket className="size-4" />
                    Deploy Mission
                  </Button>
                </Link>
              </div>
            )}

            {/* Campaign list */}
            {!campaignsLoading && campaigns.length > 0 && (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="group rounded-lg p-4 transition-colors duration-150"
                    style={{ background: "#161B22" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#1C2128")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#161B22")
                    }
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: "#9333EA15" }}
                        >
                          <Target
                            className="size-5"
                            style={{ color: "#A855F7" }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#F0F6FC" }}
                          >
                            {campaign.name}
                          </p>
                          <p className="text-xs" style={{ color: "#484F58" }}>
                            Last activity {campaign.lastActivity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <StatusBadge status={campaign.status} />
                        <div className="flex items-center gap-2">
                          <Users
                            className="size-3.5"
                            style={{ color: "#8B949E" }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: "#8B949E",
                              fontFamily: "JetBrains Mono, monospace",
                            }}
                          >
                            {campaign.agents} agents
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: "#484F58" }}>
                          Progress
                        </span>
                        <span
                          className="text-[11px] font-semibold"
                          style={{
                            color: "#F0F6FC",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {campaign.progress}%
                        </span>
                      </div>
                      <Progress
                        value={campaign.progress}
                        className="h-1.5"
                        style={
                          {
                            "--progress-bg": "#21262D",
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. RECENT ACTIVITY FEED */}
        <Card
          className="rounded-xl border"
          style={{ background: "#0D1117", borderColor: "#21262D" }}
        >
          <CardHeader className="px-6 pb-4" style={{ paddingTop: "24px" }}>
            <CardTitle
              className="text-lg font-semibold"
              style={{ color: "#F0F6FC" }}
            >
              Recent Activity
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Live feed from your agent swarm
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ScrollArea className="h-[480px] px-6">
              <div className="space-y-0">
                {ACTIVITIES.map((activity, idx) => (
                  <React.Fragment key={activity.id}>
                    <div
                      className="group flex items-start gap-3 py-3.5 transition-colors duration-150"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#161B22")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{
                        marginLeft: "-12px",
                        marginRight: "-12px",
                        paddingLeft: "12px",
                        paddingRight: "12px",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: activity.color + "18" }}
                      >
                        <span style={{ color: activity.color }}>
                          {activity.icon}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm leading-snug"
                          style={{ color: "#C9D1D9" }}
                        >
                          {activity.description}
                        </p>
                        <p
                          className="mt-0.5 flex items-center gap-1 text-[11px]"
                          style={{ color: "#484F58" }}
                        >
                          <Clock className="size-3" />
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                    {idx < ACTIVITIES.length - 1 && (
                      <Separator
                        style={{
                          background: "#21262D",
                          marginLeft: "44px",
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* ROW: Campaign Performance Chart + Agent Swarm                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 5. CAMPAIGN PERFORMANCE CHART */}
        <Card
          className="col-span-1 rounded-xl border xl:col-span-2"
          style={{ background: "#0D1117", borderColor: "#21262D" }}
        >
          <CardHeader className="px-6 pb-2" style={{ paddingTop: "24px" }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle
                  className="text-lg font-semibold"
                  style={{ color: "#F0F6FC" }}
                >
                  Campaign Performance
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Impressions vs Conversions over time
                </CardDescription>
              </div>
              <Tabs
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as typeof timeRange)}
                className="w-fit"
              >
                <TabsList
                  className="h-8 rounded-md p-0.5"
                  style={{ background: "#161B22" }}
                >
                  {(["7D", "30D", "90D"] as const).map((t) => (
                    <TabsTrigger
                      key={t}
                      value={t}
                      className="rounded px-3 py-1 text-xs font-medium transition-all"
                      style={{
                        color: timeRange === t ? "#F0F6FC" : "#484F58",
                        background:
                          timeRange === t ? "#9333EA" : "transparent",
                      }}
                    >
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="impGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#9333EA"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="#9333EA"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="convGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#22C55E"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="#22C55E"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#21262D"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#484F58", fontSize: 11 }}
                    axisLine={{ stroke: "#21262D" }}
                    tickLine={false}
                    interval={timeRange === "7D" ? 0 : timeRange === "30D" ? 4 : 14}
                  />
                  <YAxis
                    tick={{ fill: "#484F58", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    stroke="#9333EA"
                    strokeWidth={2}
                    fill="url(#impGradient)"
                    name="Impressions"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#22C55E"
                    strokeWidth={2}
                    fill="url(#convGradient)"
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Metrics */}
            <div
              className="mt-4 grid grid-cols-2 gap-4 rounded-lg p-4 sm:grid-cols-4"
              style={{ background: "#161B22" }}
            >
              {[
                {
                  label: "Total Impressions",
                  value: totalImpressions.toLocaleString(),
                  icon: <Eye className="size-4 text-purple-400" />,
                },
                {
                  label: "Total Conversions",
                  value: totalConversions.toLocaleString(),
                  icon: <CheckCircle2 className="size-4 text-emerald-400" />,
                },
                {
                  label: "Avg CTR",
                  value: `${avgCTR}%`,
                  icon: <Percent className="size-4 text-blue-400" />,
                },
                {
                  label: "Cost/Conv",
                  value: `€${costPerConv}`,
                  icon: <DollarSign className="size-4 text-amber-400" />,
                },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "#0D1117" }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: "#484F58" }}>
                      {m.label}
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{
                        color: "#F0F6FC",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {m.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 6. AGENT SWARM VISUALIZATION */}
        <Card
          className="rounded-xl border"
          style={{ background: "#0D1117", borderColor: "#21262D" }}
        >
          <CardHeader className="px-6 pb-2" style={{ paddingTop: "24px" }}>
            <div className="flex items-center gap-2">
              <CardTitle
                className="text-lg font-semibold"
                style={{ color: "#F0F6FC" }}
              >
                Agent Swarm
              </CardTitle>
              <span
                className="flex h-2 w-2 rounded-full"
                style={{ background: "#22C55E" }}
              />
            </div>
            <CardDescription className="mt-1 text-sm">
              11 of 12 agents currently active
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-4">
            <AgentSwarmViz />

            {/* Agent Legend */}
            <div className="mx-6 grid grid-cols-2 gap-x-4 gap-y-2">
              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
                  style={{ background: agent.active ? "#161B22" : "transparent" }}
                >
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{
                      background: agent.active ? agent.color : "#484F58",
                      opacity: agent.active ? 1 : 0.4,
                    }}
                  />
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      color: agent.active ? "#C9D1D9" : "#484F58",
                    }}
                  >
                    {agent.name}
                  </span>
                  {agent.active && (
                    <span
                      className="ml-auto text-[10px]"
                      style={{ color: "#22C55E" }}
                    >
                      ON
                    </span>
                  )}
                  {!agent.active && (
                    <span
                      className="ml-auto text-[10px]"
                      style={{ color: "#484F58" }}
                    >
                      IDLE
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}
