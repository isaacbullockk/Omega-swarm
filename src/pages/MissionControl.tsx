import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, Bot, Terminal, Activity, Copy, Check, ExternalLink,
  Image, Sparkles, ChevronDown, ChevronUp, TrendingUp,
  BarChart3, Zap, Globe, Users, Target, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router";

/* ───────── Types ───────── */
interface LogEntry {
  timestamp: string;
  agent: string;
  agentColor: string;
  message: string;
}

interface AgentNode {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  role: string;
  angle: number;
}

interface AgentTooltip {
  name: string;
  role: string;
  color: string;
}

/* ───────── Constants ───────── */
const AGENTS: AgentNode[] = [
  { id: "copywriter", name: "Copywriter", emoji: "✍️", color: "#F59E0B", bgColor: "bg-amber-500/20", role: "Ad copy, emails, landing pages", angle: 0 },
  { id: "social", name: "Social", emoji: "📱", color: "#EC4899", bgColor: "bg-pink-500/20", role: "Viral content & calendars", angle: 30 },
  { id: "sales", name: "Sales", emoji: "💼", color: "#22C55E", bgColor: "bg-emerald-500/20", role: "Funnels & objection handling", angle: 60 },
  { id: "creative", name: "Creative", emoji: "🎨", color: "#A855F7", bgColor: "bg-purple-500/20", role: "Campaign themes & visuals", angle: 90 },
  { id: "seo", name: "SEO", emoji: "🔍", color: "#06B6D4", bgColor: "bg-cyan-500/20", role: "Keywords & content optimization", angle: 120 },
  { id: "analytics", name: "Analytics", emoji: "📊", color: "#94A3B8", bgColor: "bg-slate-500/20", role: "KPIs, funnels & reports", angle: 150 },
  { id: "sentinel", name: "Sentinel", emoji: "👁️", color: "#EF4444", bgColor: "bg-red-500/20", role: "Competitor intel & sentiment", angle: 180 },
  { id: "geo", name: "GEO", emoji: "🤖", color: "#6366F1", bgColor: "bg-indigo-500/20", role: "AI engine citation optimization", angle: 210 },
  { id: "privacy", name: "Privacy", emoji: "🔒", color: "#22C55E", bgColor: "bg-green-500/20", role: "Compliance & zero-party data", angle: 240 },
  { id: "ambient", name: "Ambient", emoji: "🌐", color: "#14B8A6", bgColor: "bg-teal-500/20", role: "Cross-device campaigns", angle: 270 },
  { id: "budget", name: "Budget", emoji: "💰", color: "#EAB308", bgColor: "bg-yellow-500/20", role: "Auto budget allocation", angle: 300 },
  { id: "orchestrator", name: "Orchestrator", emoji: "🧠", color: "#9333EA", bgColor: "bg-violet-500/20", role: "Coordinates all agents", angle: 330 },
];

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: "09:14:32", agent: "System", agentColor: "#8B949E", message: "Omega Swarm v4.1 initialized — 12 agents standing by" },
  { timestamp: "09:14:33", agent: "Sentinel", agentColor: "#EF4444", message: "14 competitor feeds connected" },
  { timestamp: "09:14:34", agent: "GEO", agentColor: "#6366F1", message: "Optimizing content for ChatGPT, Perplexity, Gemini, Claude" },
  { timestamp: "09:14:35", agent: "Budget RL", agentColor: "#EAB308", message: "Auto-budget allocation module active" },
  { timestamp: "09:14:36", agent: "Privacy Agent", agentColor: "#22C55E", message: "Zero-party data collection framework active" },
  { timestamp: "09:14:37", agent: "Orchestrator", agentColor: "#9333EA", message: "Swarm topology online — awaiting mission parameters" },
  { timestamp: "09:14:38", agent: "Creative Director", agentColor: "#A855F7", message: "Brand voice module loaded — customizable in Brand Voice Studio" },
  { timestamp: "09:14:39", agent: "SEO Strategist", agentColor: "#06B6D4", message: "Keyword index refreshed — 2.4M terms indexed" },
];

const SWARM_MODES = [
  { id: "parallel", label: "Parallel", icon: "⚡" },
  { id: "sequential", label: "Sequential", icon: "🔗" },
  { id: "adaptive", label: "Adaptive", icon: "🧠" },
  { id: "battle", label: "Battle", icon: "⚔️" },
];

const LAYERS = [
  { id: "sentinel", label: "Sentinel", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "geo", label: "GEO", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  { id: "privacy", label: "Privacy", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { id: "ambient", label: "Ambient", color: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
  { id: "budget", label: "Budget RL", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
];

const DEPLOY_LOGS: LogEntry[] = [
  { timestamp: "09:15:01", agent: "Orchestrator", agentColor: "#9333EA", message: "Mission parameters received — parsing objective" },
  { timestamp: "09:15:02", agent: "Sentinel", agentColor: "#EF4444", message: "Competitor threat analysis initiated" },
  { timestamp: "09:15:03", agent: "Creative Director", agentColor: "#A855F7", message: "Generating campaign concept variants..." },
  { timestamp: "09:15:04", agent: "Copywriter GPT", agentColor: "#F59E0B", message: "Ad copy generation started — 12 variants" },
  { timestamp: "09:15:05", agent: "Social Media", agentColor: "#EC4899", message: "Content calendar auto-scheduling" },
  { timestamp: "09:15:06", agent: "Budget RL", agentColor: "#EAB308", message: "Dynamic budget redistribution active" },
  { timestamp: "09:15:07", agent: "GEO Agent", agentColor: "#6366F1", message: "Submitting optimized content to AI engines" },
  { timestamp: "09:15:08", agent: "Orchestrator", agentColor: "#9333EA", message: "Mission deployed — all agents executing" },
];

/* ───────── Helper: get position on circle ───────── */
function getCirclePos(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/* ───────── Stat Card Component ───────── */
function StatCard({
  title, value, subtitle, subtitleColor, icon: Icon, iconColor, iconBg, progress, progressColor
}: {
  title: string;
  value: string | number;
  subtitle: string;
  subtitleColor: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border-[#21262D] bg-[#0D1117] p-5 hover:border-[#30363D] transition-all duration-300 group">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" style={{ color: iconColor }} />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <Badge variant="outline" className="border-[#21262D] text-[#8B949E] bg-transparent text-[10px]">
          {title}
        </Badge>
      </div>
      <div className="text-2xl font-bold text-[#F0F6FC] tracking-tight">{value}</div>
      <div className={`text-xs mt-1 font-medium ${subtitleColor}`}>{subtitle}</div>
      {progress !== undefined && (
        <div className="mt-3">
          <Progress value={progress} className="h-1.5 bg-[#21262D]" />
          <div className="text-[10px] text-[#484F58] mt-1 text-right">{progress}% capacity</div>
        </div>
      )}
    </Card>
  );
}

/* ───────── Component ───────── */
export default function MissionControl() {
  const [objective, setObjective] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [swarmMode, setSwarmMode] = useState("parallel");
  const [activeLayers, setActiveLayers] = useState<string[]>(LAYERS.map((l) => l.id));
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: AgentTooltip } | null>(null);
  const [generateVisuals, setGenerateVisuals] = useState(false);
  const [completedCampaignId, setCompletedCampaignId] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  /* Auto-scroll console */
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  /* Toggle layer */
  const toggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, l]
    );
  }, []);

  /* Toggle result expansion */
  const toggleResult = useCallback((agentId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);

  /* Copy to clipboard */
  const handleCopy = useCallback(async (text: string, agentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(agentId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(agentId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  /* Brand voice query */
  const { data: brandVoiceData } = trpc.brandVoice.get.useQuery();

  /* tRPC mutation for real mission execution */
  const executeMission = trpc.agent.executeMission.useMutation({
    onSuccess: (data) => {
      setLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), agent: "Orchestrator", agentColor: "#9333EA", message: `Mission ${data.campaignId} complete — ${data.agentsExecuted} agents executed` },
      ]);
      setIsDeploying(false);
      setCompletedCampaignId(data.campaignId);
      refCampaign.refetch();
    },
    onError: (err) => {
      setLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), agent: "System", agentColor: "#EF4444", message: `Error: ${err.message}` },
      ]);
      setIsDeploying(false);
    },
  });

  const refCampaign = trpc.agent.getCampaigns.useQuery();
  const campaignsData = refCampaign.data ?? [];

  /* Fetch campaign results when completed */
  const campaignQuery = trpc.agent.getCampaign.useQuery(
    { id: completedCampaignId ?? "" },
    { enabled: !!completedCampaignId }
  );

  const campaignResults = campaignQuery.data?.outputs ?? [];

  /* Deploy handler */
  const handleDeploy = useCallback(() => {
    if (!objective.trim() || !budget || !timeline) return;
    setIsDeploying(true);
    setCompletedCampaignId(null);
    setExpandedResults(new Set());
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), agent: "Orchestrator", agentColor: "#9333EA", message: "─── DEPLOYMENT INITIATED ───" },
    ]);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= DEPLOY_LOGS.length) {
        clearInterval(interval);
        executeMission.mutate({
          objective,
          budget,
          timeline,
          mode: swarmMode,
        });
        return;
      }
      setLogs((prev) => [...prev, DEPLOY_LOGS[i]]);
      i++;
    }, 600);
  }, [objective, budget, timeline, swarmMode, executeMission]);

  /* SVG Topology dimensions */
  const svgSize = 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 145;

  /* Brand voice display */
  const brandVoiceDisplay = brandVoiceData
    ? `${brandVoiceData.tone}`
    : "Soulful, confident, community-driven";

  /* Campaign stats */
  const activeCampaigns = campaignsData.filter((c: any) => c.status === "running" || c.status === "active").length;
  const totalTasks = campaignsData.reduce((acc: number, c: any) => acc + (c.tasksTotal || 0), 0);
  const completedTasks = campaignsData.reduce((acc: number, c: any) => acc + (c.tasksCompleted || 0), 0);
  const avgRoi = campaignsData.length > 0
    ? "+" + Math.round(campaignsData.reduce((acc: number, c: any) => acc + parseInt((c.roi || "0").replace(/[^0-9]/g, "")), 0) / campaignsData.length) + "%"
    : "+0%";

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/25 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.15)]">
              <Rocket className="w-6 h-6 text-[#9333EA]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-[#8B949E] text-sm mt-0.5">
                {activeCampaigns > 0
                  ? `${activeCampaigns} campaign${activeCampaigns > 1 ? "s" : ""} running — swarm is active`
                  : "Your AI marketing swarm is standing by"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1.5 px-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              11/12 Agents Online
            </Badge>
          </div>
        </div>

        {/* ═══ Stats Grid ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Campaigns"
            value={activeCampaigns}
            subtitle="+2 this week"
            subtitleColor="text-emerald-400"
            icon={Target}
            iconColor="#EC4899"
            iconBg="bg-pink-500/10"
          />
          <StatCard
            title="Tasks Completed"
            value={completedTasks}
            subtitle={`${totalTasks - completedTasks} remaining`}
            subtitleColor="text-amber-400"
            icon={Zap}
            iconColor="#F59E0B"
            iconBg="bg-amber-500/10"
            progress={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
            progressColor="bg-amber-500"
          />
          <StatCard
            title="Win Rate"
            value="78.2%"
            subtitle="+5.4% vs last month"
            subtitleColor="text-emerald-400"
            icon={BarChart3}
            iconColor="#22C55E"
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="Avg ROI"
            value={avgRoi}
            subtitle="Above benchmark"
            subtitleColor="text-purple-400"
            icon={TrendingUp}
            iconColor="#9333EA"
            iconBg="bg-purple-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ═══ Left: Form + Deploy ═══ */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#9333EA]" />
                </div>
                Mission Configuration
              </h2>

              <div className="space-y-5">
                {/* Objective */}
                <div>
                  <label className="block text-sm font-medium text-[#8B949E] mb-2">
                    Mission Objective
                  </label>
                  <Textarea
                    placeholder="e.g., Launch eco-friendly water bottle targeting Gen Z fitness enthusiasts, €200 budget, 2-week sprint"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] placeholder:text-[#484F58] focus:border-[#9333EA] focus:ring-purple-500/20 min-h-[100px] resize-none"
                  />
                </div>

                {/* Budget + Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B949E] mb-2">Budget</label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] focus:ring-purple-500/20">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161B22] border-[#21262D]">
                        <SelectItem value="50-100" className="text-[#F0F6FC] focus:bg-purple-500/10">€50 - €100</SelectItem>
                        <SelectItem value="100-250" className="text-[#F0F6FC] focus:bg-purple-500/10">€100 - €250</SelectItem>
                        <SelectItem value="250-500" className="text-[#F0F6FC] focus:bg-purple-500/10">€250 - €500</SelectItem>
                        <SelectItem value="custom" className="text-[#F0F6FC] focus:bg-purple-500/10">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B949E] mb-2">Timeline</label>
                    <Select value={timeline} onValueChange={setTimeline}>
                      <SelectTrigger className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] focus:ring-purple-500/20">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161B22] border-[#21262D]">
                        <SelectItem value="1w" className="text-[#F0F6FC] focus:bg-purple-500/10">1 Week</SelectItem>
                        <SelectItem value="2w" className="text-[#F0F6FC] focus:bg-purple-500/10">2 Weeks</SelectItem>
                        <SelectItem value="1m" className="text-[#F0F6FC] focus:bg-purple-500/10">1 Month</SelectItem>
                        <SelectItem value="3m" className="text-[#F0F6FC] focus:bg-purple-500/10">3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Brand Voice */}
                <div className="rounded-xl border border-[#21262D] bg-gradient-to-br from-[#161B22] to-[#0D1117] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#8B949E] flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      Brand Voice
                    </label>
                    <Link to="/brand-voice" className="text-xs text-[#9333EA] hover:text-[#A855F7] transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Customize
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                    <span className="text-sm font-medium text-[#F0F6FC]">{brandVoiceDisplay}</span>
                  </div>
                </div>

                {/* Generate Visuals */}
                <div className="rounded-xl border border-[#21262D] bg-[#161B22] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Image className="w-4 h-4 text-[#9333EA]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#F0F6FC]">Generate Visual Assets</label>
                        <p className="text-xs text-[#484F58]">Creates DALL-E images and AI video clips for your campaign</p>
                      </div>
                    </div>
                    <Switch checked={generateVisuals} onCheckedChange={setGenerateVisuals} className="data-[state=checked]:bg-[#9333EA]" />
                  </div>
                </div>

                {/* Swarm Mode */}
                <div>
                  <label className="block text-sm font-medium text-[#8B949E] mb-2">Swarm Mode</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SWARM_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSwarmMode(mode.id)}
                        className={cn(
                          "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all",
                          swarmMode === mode.id
                            ? "bg-purple-500/15 border-[#9333EA] text-[#F0F6FC] shadow-[0_0_12px_rgba(147,51,234,0.15)]"
                            : "bg-[#161B22] border-[#21262D] text-[#8B949E] hover:border-[#30363D] hover:text-[#F0F6FC]"
                        )}
                      >
                        <span>{mode.icon}</span>
                        <span className="hidden sm:inline">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Layers */}
                <div>
                  <label className="block text-sm font-medium text-[#8B949E] mb-2">Active Layers</label>
                  <div className="flex flex-wrap gap-2">
                    {LAYERS.map((layer) => (
                      <button
                        key={layer.id}
                        onClick={() => toggleLayer(layer.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                          activeLayers.includes(layer.id)
                            ? `${layer.color} shadow-[0_0_8px_rgba(34,197,94,0.1)]`
                            : "bg-[#161B22] border-[#21262D] text-[#484F58] hover:border-[#30363D]"
                        )}
                      >
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !objective.trim() || !budget || !timeline}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                isDeploying || !objective.trim() || !budget || !timeline
                  ? "bg-[#161B22] border border-[#21262D] text-[#484F58] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.45)] hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {isDeploying ? (
                <>
                  <Activity className="w-6 h-6 animate-pulse" />
                  Deploying Swarm...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Deploy Omega Swarm
                </>
              )}
            </button>

            {/* Mission Results */}
            {campaignResults.length > 0 && (
              <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#9333EA]" />
                  Mission Results
                  <Badge variant="outline" className="border-[#21262D] text-[#8B949E] bg-transparent text-[10px]">
                    {campaignResults.filter((o: any) => o.status === "completed").length} / {campaignResults.length} agents
                  </Badge>
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#21262D] scrollbar-track-transparent pr-1">
                  {campaignResults.map((output: any) => {
                    const isExpanded = expandedResults.has(output.agentId);
                    const isSocialAgent = output.agentId === "social";
                    const isCompleted = output.status === "completed";
                    const isRunning = output.status === "running";
                    return (
                      <div key={output.agentId} className="rounded-xl border border-[#21262D] bg-[#161B22] overflow-hidden transition-all hover:border-[#30363D]">
                        <button
                          onClick={() => output.output && toggleResult(output.agentId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1C2128] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{output.agentEmoji}</span>
                            <span className="text-sm font-semibold text-[#F0F6FC]">{output.agentName}</span>
                            <Badge className={cn(
                              "text-[10px] uppercase font-medium",
                              isCompleted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              isRunning ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-[#21262D] text-[#484F58] border-[#21262D]"
                            )}>
                              {output.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {output.output && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(output.output, output.agentId); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-all"
                                >
                                  {copiedId === output.agentId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                  {copiedId === output.agentId ? "Copied" : "Copy"}
                                </button>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-[#484F58]" /> : <ChevronDown className="w-4 h-4 text-[#484F58]" />}
                              </>
                            )}
                          </div>
                        </button>
                        {isExpanded && output.output && (
                          <div className="px-4 pb-4 border-t border-[#21262D]">
                            <pre className="mt-3 p-3 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#C9D1D9] font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                              {output.output}
                            </pre>
                            {isSocialAgent && (
                              <div className="mt-3 flex items-center gap-2">
                                <Link to="/social-connections" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white hover:shadow-[0_0_16px_rgba(147,51,234,0.3)] transition-all">
                                  <ExternalLink className="w-3 h-3" />
                                  Post to Instagram
                                </Link>
                                <span className="text-[10px] text-[#484F58]">Connects to your linked Instagram accounts</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ═══ Right: Console + Topology ═══ */}
          <div className="space-y-6">
            {/* Live Console */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262D] bg-[#161B22]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#8B949E]" />
                  <span className="text-sm font-medium text-[#8B949E]">Live Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22C55E]" />
                  </span>
                  <span className="text-xs font-semibold text-[#22C55E]">LIVE</span>
                </div>
              </div>
              <div
                ref={consoleRef}
                className="p-4 h-[260px] overflow-y-auto font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-[#21262D] scrollbar-track-transparent"
              >
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#484F58] shrink-0">[{log.timestamp}]</span>
                    <span style={{ color: log.agentColor }} className="shrink-0 font-semibold min-w-[110px]">{log.agent}:</span>
                    <span className="text-[#F0F6FC]">{log.message}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Swarm Topology */}
            <Card className="rounded-2xl border-[#21262D] bg-[#0D1117] p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[#9333EA]" />
                </div>
                Swarm Topology
                <Badge variant="outline" className="border-[#21262D] text-[#8B949E] bg-transparent text-[10px] ml-auto">
                  12 agents
                </Badge>
              </h2>
              <div className="flex justify-center">
                <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full">
                  {AGENTS.map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    return (
                      <line key={`line-${agent.id}`} x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke="url(#lineGradient)" strokeWidth={1} opacity={0.4} />
                    );
                  })}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7E22CE" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  {AGENTS.map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    const isOrchestrator = agent.id === "orchestrator";
                    const nodeRadius = isOrchestrator ? 32 : 24;
                    return (
                      <g key={agent.id} transform={`translate(${pos.x}, ${pos.y})`} className="cursor-pointer"
                        onClick={(e) => {
                          const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                          if (rect) {
                            setTooltip({ x: pos.x, y: pos.y - nodeRadius - 10, data: { name: agent.name, role: agent.role, color: agent.color } });
                          }
                        }}
                        style={{ filter: `drop-shadow(0 0 6px ${agent.color}30)` }}>
                        {isOrchestrator && (
                          <circle r={nodeRadius + 6} fill="none" stroke={agent.color} strokeWidth={1.5} opacity={0.4}>
                            <animate attributeName="r" values={`${nodeRadius + 4};${nodeRadius + 14};${nodeRadius + 4}`} dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle r={nodeRadius} fill={isOrchestrator ? `${agent.color}20` : "#161B22"} stroke={agent.color} strokeWidth={2} />
                        <text y={isOrchestrator ? 2 : 1} textAnchor="middle" dominantBaseline="middle" fontSize={isOrchestrator ? 20 : 14}>{agent.emoji}</text>
                        <text y={nodeRadius + 14} textAnchor="middle" dominantBaseline="middle" fill="#8B949E" fontSize={10} fontWeight={500}>{agent.name}</text>
                      </g>
                    );
                  })}
                  <g transform={`translate(${cx}, ${cy})`}>
                    <circle r={38} fill="#9333EA15" stroke="#9333EA" strokeWidth={2.5}>
                      <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.5;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <text y={2} textAnchor="middle" dominantBaseline="middle" fontSize={24}>🧠</text>
                    <text y={52} textAnchor="middle" dominantBaseline="middle" fill="#9333EA" fontSize={11} fontWeight={600}>Orchestrator</text>
                  </g>
                </svg>
              </div>
              {tooltip && (
                <div className="absolute z-50 rounded-xl border border-[#21262D] bg-[#161B22] px-4 py-3 shadow-xl pointer-events-none"
                  style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}>
                  <div className="text-sm font-semibold" style={{ color: tooltip.data.color }}>{tooltip.data.name}</div>
                  <div className="text-xs text-[#8B949E] mt-0.5">{tooltip.data.role}</div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
