import { useState, useCallback, useMemo, memo } from "react";
import { Link } from "react-router";
import { trpc } from "@/lib/trpc";
import {
  Rocket,
  Zap,
  TrendingUp,
  BarChart3,
  Calendar,
  ArrowRight,
  Users,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  status: "success" | "info" | "warning";
}

interface Metric {
  name: string;
  value: number;
  change: number;
  spark: number[];
}

interface Stats {
  activeMissions: number;
  totalAgents: number;
  contentProduced: number;
  avgEngagement: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function statusColor(status: ActivityItem["status"]): string {
  switch (status) {
    case "success":
      return "#84CC16";
    case "warning":
      return "#F59E0B";
    default:
      return "#3B82F6";
  }
}

function statusBg(status: ActivityItem["status"]): string {
  switch (status) {
    case "success":
      return "rgba(132,204,22,0.15)";
    case "warning":
      return "rgba(245,158,11,0.15)";
    default:
      return "rgba(59,130,246,0.15)";
  }
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

const ActivityRow = memo(function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div
      className="group flex items-start gap-4 rounded-xl p-4 transition-colors"
      style={{
        border: "1px solid transparent",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--bg-card)";
        e.currentTarget.style.borderColor = "var(--border-subtle)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: statusBg(item.status),
          border: `1px solid ${statusColor(item.status)}25`,
        }}
      >
        <Activity className="size-4" style={{ color: statusColor(item.status) }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {item.title}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          {item.description}
        </p>
        <p className="mt-1 text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
          {new Date(item.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "performance">("overview");

  const { data: recentActivities, isLoading: activityLoading } =
    trpc.metrics.recentActivities.useQuery();
  const { data: metrics, isLoading: metricsLoading } =
    trpc.analytics.getMetrics.useQuery();
  const { data: stats, isLoading: statsLoading } =
    trpc.metrics.stats.useQuery();

  const isLoading = activityLoading || metricsLoading || statsLoading;

  /* ---- Memoized chart data ---- */
  const activityByDay = useMemo(() => {
    if (!recentActivities?.length) return [];
    const dayCounts: Record<string, number> = {};
    recentActivities.forEach((a: ActivityItem) => {
      const day = new Date(a.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
      });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({ day, activities: dayCounts[day] || 0 }));
  }, [recentActivities]);

  /* ---- Memoized sliced activities ---- */
  const recentFive = useMemo(() => {
    if (!recentActivities) return [];
    return recentActivities.slice(0, 5);
  }, [recentActivities]);

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

  const safeStats: Stats = stats ?? {
    activeMissions: 0,
    totalAgents: 0,
    contentProduced: 0,
    avgEngagement: 0,
  };

  const safeMetrics: Metric[] = metrics ?? [];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Swarm performance & recent activity
            </p>
          </div>
          <Link
            to="/pipeline"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
            style={{
              background: "var(--gradient-gold)",
              color: "#0C0A09",
            }}
          >
            <BarChart3 className="size-4" />
            Analytics
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Rocket className="size-5" style={{ color: "var(--accent-primary)" }} />}
            label="Active Missions"
            value={String(safeStats.activeMissions)}
            change="+12%"
            delay={0}
          />
          <StatCard
            icon={<Users className="size-5" style={{ color: "var(--accent-secondary)" }} />}
            label="Total Agents"
            value={String(safeStats.totalAgents)}
            change="+5"
            delay={100}
          />
          <StatCard
            icon={<Zap className="size-5" style={{ color: "#84CC16" }} />}
            label="Content Produced"
            value={String(safeStats.contentProduced)}
            change="+28%"
            delay={200}
          />
          <StatCard
            icon={<TrendingUp className="size-5" style={{ color: "#3B82F6" }} />}
            label="Avg Engagement"
            value={`${safeStats.avgEngagement}%`}
            change="+8%"
            delay={300}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-fade-up stagger-2">
          {(["overview", "performance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                background: activeTab === tab ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeTab === tab ? "#0C0A09" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-3">
            {/* Activity Feed */}
            <div
              className="lg:col-span-2 rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="size-5" style={{ color: "var(--accent-primary)" }} />
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Recent Activity
                </h2>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                {recentFive.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
                {recentFive.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No recent activity
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div
                className="rounded-2xl p-5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Launch Mission", to: "/mission-control", icon: <Rocket className="size-4" /> },
                    { label: "Create Content", to: "/content-library", icon: <Zap className="size-4" /> },
                    { label: "View Analytics", to: "/pipeline", icon: <BarChart3 className="size-4" /> },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-primary)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <span style={{ color: "var(--accent-primary)" }}>{action.icon}</span>
                      {action.label}
                      <ArrowRight className="size-3.5 ml-auto" style={{ color: "var(--text-muted)" }} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up stagger-3">
            {/* Activity Chart */}
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Activity by Day
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="activities" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metrics */}
            <div
              className="rounded-2xl p-5 md:p-6"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Key Metrics
              </h2>
              <div className="space-y-4">
                {safeMetrics.map((metric: Metric) => (
                  <div key={metric.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {metric.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                        {metric.value}
                        <span
                          className="ml-2 text-xs"
                          style={{ color: metric.change >= 0 ? "#84CC16" : "#EF4444" }}
                        >
                          {metric.change >= 0 ? "+" : ""}
                          {metric.change}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(Math.abs(metric.value), 100)}%`,
                          background: "var(--gradient-gold)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {safeMetrics.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                    No metrics available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
