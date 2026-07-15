import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Video,
  Globe,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ───────── Types ───────── */
interface AccountCardProps {
  account: {
    id: string;
    platform: "instagram" | "youtube" | "facebook";
    accountName: string;
    handle: string;
    connected: boolean;
  };
}

/* ───────── Platform Config ───────── */
const PLATFORM_CONFIG = {
  instagram: {
    icon: Camera,
    color: "#EC4899",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    label: "Instagram",
  },
  youtube: {
    icon: Video,
    color: "#EF4444",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "YouTube",
  },
  facebook: {
    icon: Globe,
    color: "#3B82F6",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Facebook",
  },
};

/* ───────── Account Card ───────── */
function AccountCard({ account }: AccountCardProps) {
  const utils = trpc.useUtils();
  const config = PLATFORM_CONFIG[account.platform];
  const Icon = config.icon;

  const disconnectMutation = trpc.social.disconnect.useMutation({
    onSuccess: () => {
      utils.social.list.invalidate();
    },
  });

  return (
    <Card
      className="rounded-2xl border p-6 transition-all duration-200 hover:border-opacity-50"
      style={{
        background: "#0D1117",
        borderColor: account.connected ? config.color + "30" : "#21262D",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: config.color + "15" }}
          >
            <Icon className="h-6 w-6" style={{ color: config.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "#F0F6FC" }}>
                {account.accountName}
              </h3>
              {account.connected && (
                <Badge
                  variant="outline"
                  className="gap-1 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0 text-[10px] text-emerald-400"
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Connected
                </Badge>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>
              {account.handle}
            </p>
            <p className="text-[10px] mt-1" style={{ color: "#484F58" }}>
              {config.label}
            </p>
          </div>
        </div>

        {account.connected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnectMutation.mutate({ id: account.id })}
            disabled={disconnectMutation.isPending}
            className="gap-1.5 rounded-lg border-[#21262D] text-[#8B949E] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
            style={{ background: "transparent" }}
          >
            <Unlink className="h-3.5 w-3.5" />
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 rounded-lg font-medium"
            style={{ background: config.color, color: "#fff" }}
          >
            <Link2 className="h-3.5 w-3.5" />
            Connect
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ───────── Component ───────── */
export default function SocialConnections() {
  const { data: accounts, isLoading } = trpc.social.list.useQuery();

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Globe className="w-6 h-6 text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Social Connections</h1>
            <p className="text-[#8B949E] text-sm mt-0.5">
              Link your social accounts for Omega Swarm to post directly
            </p>
          </div>
        </div>

        {/* ═══ Connected Accounts ═══ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Accounts</h2>
            <Badge
              variant="outline"
              className="border-[#9333EA]/30 text-[#9333EA] bg-purple-500/10"
            >
              {accounts?.filter((a) => a.connected).length || 0} connected
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="rounded-2xl border border-[#21262D] p-6"
                  style={{ background: "#0D1117" }}
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" style={{ background: "#21262D" }} />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" style={{ background: "#21262D" }} />
                      <Skeleton className="h-3 w-24" style={{ background: "#21262D" }} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts?.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>

        {/* ═══ Info Card ═══ */}
        <Card
          className="rounded-2xl border border-[#21262D] p-6"
          style={{ background: "#0D1117" }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "#F0F6FC" }}>
                How it works
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8B949E" }}>
                Connect your Instagram, YouTube, and Facebook accounts so Omega Swarm
                can publish content directly. Your credentials are stored securely and
                never shared. The Social Media Agent uses these connections to auto-post
                your campaign content at optimal times.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["@wildnoff", "@kyakuwamusic", "@isaacbullockk"].map((handle) => (
                  <Badge
                    key={handle}
                    variant="outline"
                    className="rounded-full border-[#21262D] text-[#8B949E]"
                  >
                    {handle}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
