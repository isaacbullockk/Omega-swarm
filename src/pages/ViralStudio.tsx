import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame,
  Play,
  Camera,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ImageIcon,
} from "lucide-react";

/* ───────── Account Config ───────── */
const ACCOUNTS = [
  { value: "all", label: "All Accounts" },
  { value: "@wildnoff", label: "@wildnoff", color: "#22C55E" },
  { value: "@kyakuwamusic", label: "@kyakuwamusic", color: "#3B82F6" },
  { value: "@isaacbullockk", label: "@isaacbullockk", color: "#F59E0B" },
];

const STATUS_CONFIG = {
  ready: { label: "Ready", icon: CheckCircle2, color: "#22C55E", bg: "bg-emerald-500/10" },
  posted: { label: "Posted", icon: ExternalLink, color: "#3B82F6", bg: "bg-blue-500/10" },
  scheduled: { label: "Scheduled", icon: Calendar, color: "#F59E0B", bg: "bg-amber-500/10" },
};

/* ───────── Video Card ───────── */
function VideoCard({
  video,
}: {
  video: {
    id: string;
    title: string;
    account: string;
    caption: string;
    hashtags: string[];
    videoUrl: string;
    status: "ready" | "posted" | "scheduled";
    createdAt: string;
  };
}) {
  const utils = trpc.useUtils();
  const statusConfig = STATUS_CONFIG[video.status];
  const StatusIcon = statusConfig.icon;

  const updateStatus = trpc.viral.updateStatus.useMutation({
    onSuccess: () => {
      utils.viral.list.invalidate();
    },
  });

  const generateCaption = trpc.viral.generateCaption.useMutation({
    onSuccess: () => {
      utils.viral.list.invalidate();
    },
  });

  const accountColor =
    ACCOUNTS.find((a) => a.value === video.account)?.color || "#8B949E";

  return (
    <Card
      className="rounded-2xl border border-[#21262D] overflow-hidden transition-all duration-200 hover:border-[#30363D]"
      style={{ background: "#0D1117" }}
    >
      {/* Video Preview Area */}
      <div
        className="relative aspect-video flex items-center justify-center"
        style={{ background: "#161B22" }}
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full transition-transform hover:scale-110 cursor-pointer"
          style={{ background: "rgba(147, 51, 234, 0.2)" }}
        >
          <Play className="h-7 w-7 text-[#9333EA] ml-1" />
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`gap-1 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold ${statusConfig.bg}`}
            style={{ color: statusConfig.color }}
          >
            <StatusIcon className="h-2.5 w-2.5" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Account badge */}
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="rounded-full border-0 px-2 py-0 text-[10px] font-medium"
            style={{
              background: accountColor + "18",
              color: accountColor,
            }}
          >
            <Camera className="h-2.5 w-2.5 mr-1" />
            {video.account}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#F0F6FC" }}>
            {video.title}
          </h3>
          <p className="text-[10px] mt-1" style={{ color: "#484F58" }}>
            {new Date(video.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Caption preview */}
        <div className="rounded-lg border border-[#21262D] bg-[#161B22] p-3">
          <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "#C9D1D9" }}>
            {video.caption}
          </p>
          {video.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {video.hashtags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium"
                  style={{ color: "#9333EA" }}
                >
                  {tag}
                </span>
              ))}
              {video.hashtags.length > 6 && (
                <span className="text-[10px]" style={{ color: "#484F58" }}>
                  +{video.hashtags.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {video.status === "ready" && (
            <Button
              size="sm"
              className="gap-1.5 rounded-lg text-xs font-medium flex-1"
              style={{ background: "#9333EA", color: "#fff" }}
              onClick={() =>
                updateStatus.mutate({
                  id: video.id,
                  status: "posted",
                  postedAt: new Date().toISOString(),
                })
              }
              disabled={updateStatus.isPending}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Mark Posted
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg text-xs font-medium border-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#9333EA]/30"
            style={{ background: "transparent" }}
            onClick={() =>
              generateCaption.mutate({
                videoId: video.id,
                videoTitle: video.title,
                account: video.account,
              })
            }
            disabled={generateCaption.isPending}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generateCaption.isPending ? "Generating..." : "AI Caption"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ───────── Component ───────── */
export default function ViralStudio() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: videos, isLoading } = trpc.viral.list.useQuery(
    activeTab === "all" ? undefined : { account: activeTab }
  );

  const stats = useMemo(() => {
    if (!videos) return { ready: 0, posted: 0, scheduled: 0 };
    return {
      ready: videos.filter((v) => v.status === "ready").length,
      posted: videos.filter((v) => v.status === "posted").length,
      scheduled: videos.filter((v) => v.status === "scheduled").length,
    };
  }, [videos]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#9333EA]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Viral Studio</h1>
              <p className="text-[#8B949E] text-sm mt-0.5">
                Create and manage viral content for your accounts
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg border border-[#21262D] px-3 py-1.5"
              style={{ background: "#0D1117" }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium" style={{ color: "#8B949E" }}>
                {stats.ready} ready
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg border border-[#21262D] px-3 py-1.5"
              style={{ background: "#0D1117" }}
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium" style={{ color: "#8B949E" }}>
                {stats.scheduled} scheduled
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg border border-[#21262D] px-3 py-1.5"
              style={{ background: "#0D1117" }}
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium" style={{ color: "#8B949E" }}>
                {stats.posted} posted
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Filter Tabs ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="h-9 gap-1 rounded-lg p-1"
            style={{ background: "#161B22" }}
          >
            {ACCOUNTS.map((a) => (
              <TabsTrigger
                key={a.value}
                value={a.value}
                className="rounded-md px-3 py-1 text-xs font-medium transition-all data-[state=active]:shadow-sm"
                style={{
                  color: "#8B949E",
                }}
              >
                {a.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ═══ Video Grid ═══ */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="rounded-2xl border border-[#21262D] overflow-hidden"
                style={{ background: "#0D1117" }}
              >
                <Skeleton className="aspect-video w-full" style={{ background: "#161B22" }} />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" style={{ background: "#21262D" }} />
                  <Skeleton className="h-3 w-1/2" style={{ background: "#21262D" }} />
                  <Skeleton className="h-20 w-full" style={{ background: "#161B22" }} />
                </div>
              </Card>
            ))}
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#21262D] py-20" style={{ background: "#0D1117" }}>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
              style={{ background: "#161B22" }}
            >
              <ImageIcon className="h-8 w-8" style={{ color: "#484F58" }} />
            </div>
            <p className="text-base font-medium" style={{ color: "#F0F6FC" }}>
              No videos yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>
              Create your first viral video to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
