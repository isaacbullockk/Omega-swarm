import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Video,
  Globe,
  Share2,
  Music,
  AtSign,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

/* ───────── Types ───────── */
type PlatformKey = "instagram" | "youtube" | "facebook" | "linkedin";

interface AccountCardProps {
  account: {
    id: string;
    /** DB enum is wider than the UI config — unknown platforms fall back in the card */
    platform: string;
    accountName: string;
    handle: string;
    connected: boolean;
  };
  onConnect: () => void;
}

/* ───────── Platform Config ───────── */
// Covers the full DB enum (6 platforms); the connect modal only offers the
// subset with a working publish path.
const PLATFORM_CONFIG: Record<string, { icon: typeof Camera; color: string; bgColor: string; borderColor: string; label: string }> = {
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
  linkedin: {
    icon: Share2,
    color: "#0A66C2",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
    label: "LinkedIn",
  },
  // Display-only entries for legacy DB rows — these platforms have no
  // publish path yet, so they are NOT offered in the connect modal
  tiktok: {
    icon: Music,
    color: "#22D3EE",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    label: "TikTok",
  },
  twitter: {
    icon: AtSign,
    color: "#94A3B8",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    label: "X / Twitter",
  },
};

/* ───────── Account Card ───────── */
function AccountCard({ account, onConnect }: AccountCardProps) {
  const utils = trpc.useUtils();
  const config = (PLATFORM_CONFIG as Record<string, (typeof PLATFORM_CONFIG)[PlatformKey]>)[account.platform] ?? PLATFORM_CONFIG.linkedin;
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
            onClick={onConnect}
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

/* ───────── Connect Modal (real: wired to social.connect) ───────── */
function ConnectModal({ defaultPlatform, onClose }: { defaultPlatform: PlatformKey; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [platform, setPlatform] = useState<PlatformKey>(defaultPlatform);
  const [accountName, setAccountName] = useState("");
  const [handle, setHandle] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [pageId, setPageId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const connect = trpc.social.connect.useMutation({
    onSuccess: () => {
      utils.social.list.invalidate();
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          connect.mutate({
            platform,
            accountName: accountName || handle || platform,
            handle: handle || accountName || platform,
            accessToken,
            pageId: pageId || undefined,
          });
        }}
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: "#0D1117", border: "1px solid #21262D" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "#F0F6FC" }}>Connect account</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="size-5" style={{ color: "#8B949E" }} />
          </button>
        </div>

        <div className="flex gap-2">
          {/* Only platforms with a real publish path are offered (YouTube is display-only until its integration ships) */}
          {(["linkedin", "instagram", "facebook"] as PlatformKey[]).map((p) => {
            const cfg = PLATFORM_CONFIG[p];
            const Icon = cfg.icon;
            return (
              <button key={p} type="button" onClick={() => setPlatform(p)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: platform === p ? cfg.color + "20" : "transparent",
                  color: platform === p ? cfg.color : "#8B949E",
                  border: `1px solid ${platform === p ? cfg.color + "60" : "#21262D"}`,
                }}>
                <Icon className="size-4" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {platform === "linkedin" && (
          <p className="text-[11px] leading-relaxed rounded-lg p-3" style={{ background: "#0A66C215", color: "#7AB8F5" }}>
            LinkedIn: create an app at developer.linkedin.com, request the scopes
            <strong> openid, profile, w_member_social</strong>, generate a token, paste it below.
            Your person URN is derived automatically.
          </p>
        )}
        {platform === "instagram" && (
          <p className="text-[11px] leading-relaxed rounded-lg p-3" style={{ background: "#EC489915", color: "#F9A8D4" }}>
            Instagram: paste a long-lived Meta token and your IG Business account ID
            (or use the token exchange in Settings). IG must be a Business/Creator
            account linked to a Facebook Page.
          </p>
        )}

        <input type="text" placeholder="Account name (e.g. Isaac Bullock)" value={accountName} onChange={(e) => setAccountName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ background: "#010409", border: "1px solid #21262D", color: "#F0F6FC" }} />
        <input type="text" placeholder="Handle (e.g. @isaacbullockk)" value={handle} onChange={(e) => setHandle(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
          style={{ background: "#010409", border: "1px solid #21262D", color: "#F0F6FC" }} />
        <textarea placeholder="Access token" required value={accessToken} onChange={(e) => setAccessToken(e.target.value)} rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none font-mono"
          style={{ background: "#010409", border: "1px solid #21262D", color: "#F0F6FC" }} />
        {platform !== "linkedin" && (
          <input type="text" placeholder="Page / Account ID (optional)" value={pageId} onChange={(e) => setPageId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none"
            style={{ background: "#010409", border: "1px solid #21262D", color: "#F0F6FC" }} />
        )}

        {error && (
          <p className="text-xs rounded-lg p-3" style={{ background: "#EF444415", color: "#FCA5A5" }}>{error}</p>
        )}

        <Button type="submit" disabled={connect.isPending || !accessToken.trim()}
          className="w-full rounded-xl font-bold"
          style={{ background: PLATFORM_CONFIG[platform].color, color: "#fff" }}>
          {connect.isPending ? "Verifying token…" : `Connect ${PLATFORM_CONFIG[platform].label}`}
        </Button>
        <p className="text-[10px] text-center" style={{ color: "#484F58" }}>
          Tokens are encrypted (AES-256-GCM) before they touch the database.
        </p>
      </form>
    </div>
  );
}

/* ───────── Component ───────── */
export default function SocialConnections() {
  const { data: accounts, isLoading } = trpc.social.list.useQuery();
  const [connectPlatform, setConnectPlatform] = useState<PlatformKey | null>(null);

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
                <AccountCard key={account.id} account={account} onConnect={() => setConnectPlatform((account.platform as PlatformKey) in PLATFORM_CONFIG ? (account.platform as PlatformKey) : "linkedin")} />
              ))}
              {/* Add-account tile — the actual entry point for connecting */}
              <button
                onClick={() => setConnectPlatform("linkedin")}
                className="rounded-2xl border border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all hover:border-opacity-80 min-h-[120px]"
                style={{ borderColor: "#30363D", background: "transparent", color: "#8B949E" }}
              >
                <Link2 className="size-6" />
                <span className="text-sm font-medium">Connect an account</span>
                <span className="text-[10px]">LinkedIn, Instagram, Facebook</span>
              </button>
            </div>
          )}
        </div>

        {connectPlatform && (
          <ConnectModal defaultPlatform={connectPlatform} onClose={() => setConnectPlatform(null)} />
        )}

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
                Connect your LinkedIn, Instagram, and Facebook accounts so Omega Swarm
                can publish content directly. LinkedIn posts go to your personal profile
                (openid, profile, w_member_social scopes). Instagram needs a Business
                account linked to a Facebook Page. Tokens are encrypted at rest
                (AES-256-GCM) and never leave the server.
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
