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
  RefreshCw,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActivityItem {
  id: string;
  agentColor: string;
  agentName: string;
  description: string;
  timestamp: string;
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

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

/** Stat Card Skeleton */
function StatCardSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="glass-card card-lift p-5 animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3.5 w-24 rounded bg-white/5 animate-pulse" />
          <div className="h-8 w-20 rounded bg-white/5 animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
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

/** Activity Feed Skeleton */
function ActivityFeedSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="mt-1.5 size-2 shrink-0 rounded-full bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
            <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Error State */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border p-8"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <AlertCircle className="size-8" style={{ color: "#EF4444" }} />
      <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
        style={{
          background: "rgba(245, 158, 11, 0.15)",
          color: "var(--accent-primary)",
        }}
      >
        <RefreshCw className="size-4" />
        Retry
      </button>
    </div>
  );
}

/** Empty State */
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className="flex size-12 items-center justify-center rounded-full"
        style={{ background: "rgba(245, 158, 11, 0.1)" }}
      >
        {icon}
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      <p className="text-xs text-center max-w-[240px]" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      {action}
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

  /* tRPC queries for real data */
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = trpc.analytics.stats.useQuery();

  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = trpc.analytics.events.useQuery({ limit: 50 });

  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = trpc.agent.getCampaigns.useQuery();

  /* Derived values */
  const activeCampaignsCount = useMemo(
    () => campaigns?.filter((c) => c.status === "running").length ?? 0,
    [campaigns]
  );

  const totalEngagement = stats?.totalEngagement ?? 0;
  const totalContentPieces = stats?.totalContentPieces ?? 0;
  const agentsOnline = stats?.agentsOnline ?? 0;
  const totalViews = stats?.totalViews ?? 0;

  /* Animated count-up values -- animate from 0 to real values */
  const engagementValue = useCountUp(totalEngagement, 0.5, 0.3);
  const campaignsValue = useCountUp(activeCampaignsCount, 0.5, 0.4);
  const agentsOnlineValue = useCountUp(agentsOnline, 0.5, 0.5);
  const contentValue = useCountUp(totalContentPieces, 0.5, 0.6);

  /* Activity items from real events */
  const activities: ActivityItem[] = useMemo(() => {
    if (!events) return [];
    return events.map((evt) => ({
      id: evt.id,
      agentColor: evt.agentColor ?? "#F59E0B",
      agentName: evt.agentName ?? "System",
      description: evt.description,
      timestamp: formatRelativeTime(evt.timestamp),
    }));
  }, [events]);

  /* Combined loading & error states */
  const isLoading = statsLoading || eventsLoading || campaignsLoading;
  const hasError = statsError || eventsError || campaignsError;

  const handleRetry = () => {
    if (statsError) refetchStats();
    if (eventsError) refetchEvents();
    if (campaignsError) refetchCampaigns();
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* =================== Section 1: Welcome Banner =================== */}
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
              {greeting}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {agentsOnline} agents ready, {activeCampaignsCount} campaigns active.
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

      {/* =================== Section 2: Stats Row =================== */}
      {hasError && !isLoading ? (
        <ErrorState
          message="Failed to load dashboard data. Please try again."
          onRetry={handleRetry}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            <>
              <StatCardSkeleton delay={0.3} />
              <StatCardSkeleton delay={0.42} />
              <StatCardSkeleton delay={0.54} />
              <StatCardSkeleton delay={0.66} />
            </>
          ) : (
            <>
              <StatCard
                icon={<DollarSign className="size-5 text-emerald-400" />}
                iconBg="rgba(132, 204, 22, 0.12)"
                label="Total Engagement"
                value={engagementValue.toLocaleString()}
                trend={`${totalViews.toLocaleString()} total views`}
                trendColor="var(--text-muted)"
                delay={0.3}
              />
              <StatCard
                icon={<Rocket className="size-5 text-amber-400" />}
                iconBg="rgba(245, 158, 11, 0.12)"
                label="Active campaigns"
                value={String(campaignsValue)}
                trend={`${campaigns?.length ?? 0} total campaigns`}
                trendColor="var(--text-muted)"
                delay={0.42}
              />
              <StatCard
                icon={<Bot className="size-5 text-cyan-400" />}
                iconBg="rgba(6, 182, 212, 0.12)"
                label="Agents online"
                value={String(agentsOnlineValue)}
                trend="All available"
                trendColor="var(--text-muted)"
                delay={0.54}
              />
              <StatCard
                icon={<FileText className="size-5 text-purple-400" />}
                iconBg="rgba(168, 85, 247, 0.12)"
                label="Content pieces created"
                value={String(contentValue)}
                trend={`${stats?.totalPosts ?? 0} posts, ${stats?.totalVideos ?? 0} videos`}
                trendColor="var(--text-muted)"
                delay={0.66}
              />
            </>
          )}
        </div>
      )}

      {/* =================== Section 3: Two-Column Layout =================== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* -- Left Column (65% ~ 3/5) -- */}
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
            </div>
            <EmptyState
              icon={<BarChart3 className="size-6" style={{ color: "var(--accent-primary)" }} />}
              title="No revenue data yet"
              description="Deploy your first campaign to start tracking revenue performance."
              action={
                <button
                  onClick={() => navigate("/mission-control")}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Rocket className="size-3.5" />
                  Start a Mission
                </button>
              }
            />
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
            {eventsError ? (
              <ErrorState
                message="Failed to load activity feed."
                onRetry={refetchEvents}
              />
            ) : eventsLoading ? (
              <ActivityFeedSkeleton />
            ) : activities.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No recent activity yet.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {activities.map((activity, idx) => (
                  <ActivityFeedItem key={activity.id} activity={activity} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* -- Right Column (35% ~ 2/5) -- */}
        <div className="xl:col-span-2 space-y-6">
          {/* Agent Status */}
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
            <EmptyState
              icon={<Bot className="size-6" style={{ color: "var(--accent-primary)" }} />}
              title="No agents deployed yet"
              description="Launch a mission to activate your AI agents."
              action={
                <button
                  onClick={() => navigate("/mission-control")}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Rocket className="size-3.5" />
                  Deploy Agents
                </button>
              }
            />
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
            <EmptyState
              icon={<FileText className="size-6" style={{ color: "var(--accent-primary)" }} />}
              title="No tasks yet"
              description="Create a mission to generate tasks for your agents."
            />
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

      {/* =================== Section 4: Campaign Preview =================== */}
      {campaignsError ? (
        <ErrorState
          message="Failed to load campaigns."
          onRetry={refetchCampaigns}
        />
      ) : campaignsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-card card-lift p-5 animate-fade-up"
              style={{ animationDelay: `${0.8 + i * 0.15}s` }}
            >
              <div className="h-5 w-3/4 rounded bg-white/5 animate-pulse mb-3" />
              <div className="h-1.5 w-full rounded bg-white/5 animate-pulse mb-4" />
              <div className="flex gap-4 mb-3">
                <div className="h-3 w-16 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-12 rounded bg-white/5 animate-pulse" />
                <div className="h-3 w-14 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.slice(0, 6).map((campaign, idx) => {
            const completedOutputs = campaign.outputs.filter((o) => o.status === "completed").length;
            const totalOutputs = campaign.outputs.length;
            const progress = totalOutputs > 0 ? Math.round((completedOutputs / totalOutputs) * 100) : 0;
            const statusColor =
              campaign.status === "running"
                ? "#22C55E"
                : campaign.status === "completed"
                  ? "#3B82F6"
                  : campaign.status === "failed"
                    ? "#EF4444"
                    : "#F59E0B";
            const daysSince = Math.floor(
              (Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={campaign.id}
                className="glass-card card-lift p-5 animate-fade-up"
                style={{ animationDelay: `${0.8 + idx * 0.15}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-base font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {campaign.title}
                  </h3>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-medium shrink-0"
                    style={{
                      background: `${statusColor}15`,
                      color: statusColor,
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
                      {progress}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "var(--border-subtle)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: statusColor,
                        boxShadow: `0 0 8px ${statusColor}40`,
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
                    {daysSince}d
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {completedOutputs}/{totalOutputs} done
                  </span>
                </div>

                {/* View Details link */}
                <button
                  onClick={() => navigate("/mission-control")}
                  className="text-xs font-medium transition-colors duration-200 hover:underline"
                  style={{ color: "var(--accent-primary)" }}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border p-10 animate-fade-up"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            animationDelay: "0.8s",
          }}
        >
          <Rocket className="size-10" style={{ color: "var(--accent-primary)", opacity: 0.5 }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            No campaigns yet
          </p>
          <p className="text-xs text-center max-w-[300px]" style={{ color: "var(--text-muted)" }}>
            Start your first mission to see campaign progress and results here.
          </p>
          <button
            onClick={() => navigate("/mission-control")}
            className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "var(--gradient-gold)",
              color: "#0C0A09",
            }}
          >
            <Plus className="size-4" />
            Start New Mission
          </button>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
