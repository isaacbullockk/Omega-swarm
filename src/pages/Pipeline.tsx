import { useState, useMemo, memo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  Target,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Metric {
  name: string;
  value: number;
  change: number;
  spark: number[];
}

interface ForecastPoint {
  date: string;
  predicted: number;
  confidence: [number, number];
}

interface FunnelStage {
  stage: string;
  value: number;
  percentage: number;
}

interface Conversion {
  source: string;
  value: number;
  conversion: number;
}

interface PipelineData {
  metrics: Metric[];
  dailyActivity: { date: string; value: number }[];
  forecast: ForecastPoint[];
  funnel: FunnelStage[];
  conversions: Conversion[];
  topContent: { title: string; engagement: number; type: string }[];
  sentiment: { label: string; value: number; color: string }[];
  channelPerformance: { channel: string; value: number; growth: number }[];
  agentPerformance: { agent: string; tasks: number; success: number }[];
}

/* ------------------------------------------------------------------ */
/*  Sub-components (memoized)                                          */
/* ------------------------------------------------------------------ */

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  change,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  delay: number;
}) {
  return (
    <div
      className="animate-fade-up rounded-2xl p-5 md:p-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
        >
          {icon}
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            color: change.startsWith("+") ? "#84CC16" : "#F59E0B",
            background: change.startsWith("+") ? "rgba(132,204,22,0.15)" : "rgba(245,158,11,0.15)",
          }}
        >
          {change}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Pipeline() {
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "forecast" | "content" | "agents">("overview");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: pipeline, isLoading } = trpc.analytics.getPipeline.useQuery({ range: dateRange });
  const { data: metrics } = trpc.analytics.getMetrics.useQuery();
  const { data: forecast } = trpc.analytics.getForecast.useQuery({ range: dateRange });

  const safePipeline: PipelineData = pipeline ?? {
    metrics: [],
    dailyActivity: [],
    forecast: [],
    funnel: [],
    conversions: [],
    topContent: [],
    sentiment: [],
    channelPerformance: [],
    agentPerformance: [],
  };

  const safeMetrics: Metric[] = metrics ?? [];
  const safeForecast: ForecastPoint[] = forecast ?? [];

  /* ---- Memoized chart data ---- */
  const barData = useMemo(() => {
    if (!safePipeline.dailyActivity?.length) return [];
    return safePipeline.dailyActivity.map((d) => ({
      name: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
      value: d.value,
    }));
  }, [safePipeline.dailyActivity]);

  const lineData = useMemo(() => {
    if (!safeForecast.length) return [];
    return safeForecast.map((f) => ({
      date: new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      predicted: f.predicted,
      lower: f.confidence[0],
      upper: f.confidence[1],
    }));
  }, [safeForecast]);

  const radarData = useMemo(() => {
    if (!safeMetrics.length) return [];
    return safeMetrics.map((m) => ({ subject: m.name, A: m.value, fullMark: 100 }));
  }, [safeMetrics]);

  const pieData = useMemo(() => {
    if (!safePipeline.sentiment?.length) return [];
    return safePipeline.sentiment.map((s) => ({ name: s.label, value: s.value, color: s.color }));
  }, [safePipeline.sentiment]);

  const funnelData = useMemo(() => {
    if (!safePipeline.funnel?.length) return [];
    return safePipeline.funnel.map((f) => ({ name: f.stage, value: f.value, percentage: f.percentage }));
  }, [safePipeline.funnel]);

  const conversionData = useMemo(() => {
    if (!safePipeline.conversions?.length) return [];
    return safePipeline.conversions.map((c) => ({ name: c.source, value: c.value, conversion: c.conversion }));
  }, [safePipeline.conversions]);

  const channelData = useMemo(() => {
    if (!safePipeline.channelPerformance?.length) return [];
    return safePipeline.channelPerformance.map((c) => ({ name: c.channel, value: c.value, growth: c.growth }));
  }, [safePipeline.channelPerformance]);

  const agentData = useMemo(() => {
    if (!safePipeline.agentPerformance?.length) return [];
    return safePipeline.agentPerformance.map((a) => ({ name: a.agent, tasks: a.tasks, success: a.success }));
  }, [safePipeline.agentPerformance]);

  const topContent = useMemo(() => safePipeline.topContent ?? [], [safePipeline.topContent]);

  const handleDateRangeChange = useCallback((range: "7d" | "30d" | "90d") => {
    setDateRange(range);
  }, []);

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
          <div className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Pipeline & Analytics
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Track performance, forecast, and conversions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleDateRangeChange(range)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: dateRange === range ? "var(--accent-primary)" : "var(--bg-card)",
                  color: dateRange === range ? "#0C0A09" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart3 className="size-5" style={{ color: "var(--accent-primary)" }} />}
            label="Total Views"
            value={String(safeMetrics.reduce((sum: number, m: Metric) => sum + m.value, 0))}
            change="+15%"
            delay={0}
          />
          <StatCard
            icon={<TrendingUp className="size-5" style={{ color: "#84CC16" }} />}
            label="Conversions"
            value={String(safePipeline.conversions?.reduce((sum: number, c: Conversion) => sum + c.value, 0) ?? 0)}
            change="+8%"
            delay={100}
          />
          <StatCard
            icon={<Target className="size-5" style={{ color: "var(--accent-secondary)" }} />}
            label="Funnel Rate"
            value={`${safePipeline.funnel?.[safePipeline.funnel.length - 1]?.percentage ?? 0}%`}
            change="+3%"
            delay={200}
          />
          <StatCard
            icon={<Sparkles className="size-5" style={{ color: "#3B82F6" }} />}
            label="AI Tasks"
            value={String(safePipeline.agentPerformance?.reduce((sum: number, a) => sum + a.tasks, 0) ?? 0)}
            change="+22%"
            delay={300}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-fade-up stagger-2">
          {(
            [
              { key: "overview", label: "Overview", icon: <BarChart3 className="size-4" /> },
              { key: "funnel", label: "Funnel", icon: <TrendingDown className="size-4" /> },
              { key: "forecast", label: "Forecast", icon: <Calendar className="size-4" /> },
              { key: "content", label: "Content", icon: <Sparkles className="size-4" /> },
              { key: "agents", label: "Agents", icon: <Target className="size-4" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeTab === tab.key ? "#0C0A09" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-3">
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Daily Activity
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Performance Radar
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border-subtle)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={12} />
                    <PolarRadiusAxis stroke="var(--text-muted)" fontSize={12} />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="var(--accent-primary)"
                      fill="var(--accent-primary)"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Sentiment Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Channel Performance
              </h2>
              <div className="space-y-4">
                {channelData.map((channel) => (
                  <div key={channel.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {channel.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                        {channel.value}
                        <span
                          className="ml-2 text-xs"
                          style={{ color: channel.growth >= 0 ? "#84CC16" : "#EF4444" }}
                        >
                          {channel.growth >= 0 ? "+" : ""}
                          {channel.growth}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(Math.abs(channel.value), 100)}%`,
                          background: "var(--gradient-gold)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {channelData.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No channel data available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Funnel Tab */}
        {activeTab === "funnel" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-3">
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Conversion Funnel
              </h2>
              <div className="space-y-4">
                {funnelData.map((stage, index) => (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {stage.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                        {stage.value}
                        <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          ({stage.percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${stage.percentage}%`,
                          background: `var(--gradient-gold)`,
                          opacity: 1 - index * 0.15,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {funnelData.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No funnel data available
                  </p>
                )}
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Conversion Sources
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--accent-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === "forecast" && (
          <div className="rounded-2xl p-5 md:p-6 animate-fade-up stagger-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              AI Forecast
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--accent-primary)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lower"
                    stroke="var(--text-muted)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="upper"
                    stroke="var(--text-muted)"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-3">
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Top Content
              </h2>
              <div className="space-y-4">
                {topContent.map((content, index) => (
                  <div
                    key={content.title}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "var(--bg-elevated)" }}
                  >
                    <div
                      className="flex size-8 items-center justify-center rounded-lg text-sm font-bold"
                      style={{ background: "var(--accent-primary)", color: "#0C0A09" }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {content.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {content.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                        {content.engagement}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        engagements
                      </p>
                    </div>
                  </div>
                ))}
                {topContent.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No content data available
                  </p>
                )}
              </div>
            </div>

            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Content Performance
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topContent.map((c) => ({ name: c.title.slice(0, 20), value: c.engagement }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div
            className="rounded-2xl p-5 md:p-6 animate-fade-up stagger-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Agent Performance
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tasks" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="success" fill="#84CC16" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
