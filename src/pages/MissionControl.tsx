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
import { Rocket, Bot, Terminal, Activity, Copy, Check, ExternalLink, Image, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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

// Agent result type comes from tRPC campaign query

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
  { timestamp: "09:14:32", agent: "System", agentColor: "#8B949E", message: "Omega Swarm v4.0 initialized — 12 agents standing by" },
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
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
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
      // Fallback
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
        // Now execute the REAL mission via tRPC
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
  const svgSize = 420;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 155;

  /* Brand voice display */
  const brandVoiceDisplay = brandVoiceData
    ? `${brandVoiceData.tone}`
    : "Soulful, confident, community-driven";

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC] p-6 font-[Inter]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ═══ Section 1: Page Header ═══ */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deploy Mission</h1>
            <p className="text-[#8B949E] text-sm mt-0.5">Configure your AI marketing campaign</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ═══ Left Column: Form + Deploy ═══ */}
          <div className="space-y-6">
            {/* Section 2: Mission Configuration Form */}
            <div className="rounded-2xl border border-[#21262D] bg-[#0D1117] p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#9333EA]" />
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

                {/* Budget + Timeline row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8B949E] mb-2">Budget</label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="bg-[#161B22] border-[#21262D] text-[#F0F6FC] focus:ring-purple-500/20">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161B22] border-[#21262D]">
                        <SelectItem value="50-100" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">€50 - €100</SelectItem>
                        <SelectItem value="100-250" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">€100 - €250</SelectItem>
                        <SelectItem value="250-500" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">€250 - €500</SelectItem>
                        <SelectItem value="custom" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">Custom</SelectItem>
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
                        <SelectItem value="1w" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">1 Week</SelectItem>
                        <SelectItem value="2w" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">2 Weeks</SelectItem>
                        <SelectItem value="1m" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">1 Month</SelectItem>
                        <SelectItem value="3m" className="text-[#F0F6FC] focus:bg-purple-500/10 focus:text-[#F0F6FC]">3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Brand Voice */}
                <div className="rounded-xl border border-[#21262D] bg-[#161B22] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#8B949E]">Brand Voice</label>
                    <Link
                      to="/brand-voice"
                      className="text-xs text-[#9333EA] hover:text-[#A855F7] transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Customize
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="text-sm font-medium text-[#F0F6FC]">
                      {brandVoiceDisplay}
                    </span>
                  </div>
                  <p className="text-xs text-[#484F58] mt-2">
                    Omega Swarm will write in this voice. Go to{" "}
                    <Link to="/brand-voice" className="text-[#9333EA] hover:underline">Brand Voice Studio</Link>{" "}
                    to customize.
                  </p>
                </div>

                {/* Generate Visual Assets Toggle */}
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
                    <Switch
                      checked={generateVisuals}
                      onCheckedChange={setGenerateVisuals}
                      className="data-[state=checked]:bg-[#9333EA]"
                    />
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
            </div>

            {/* Section 3: Deploy Button */}
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
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6" />
                  Deploy Omega Swarm
                </>
              )}
            </button>

            {/* ═══ Section 6: Mission Results ═══ */}
            {campaignResults.length > 0 && (
              <div className="rounded-2xl border border-[#21262D] bg-[#0D1117] p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#9333EA]" />
                  Mission Results
                  <span className="text-xs font-normal text-[#484F58] ml-2">
                    {campaignResults.filter((o) => o.status === "completed").length} / {campaignResults.length} agents
                  </span>
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#21262D] scrollbar-track-transparent pr-1">
                  {campaignResults.map((output) => {
                    const isExpanded = expandedResults.has(output.agentId);
                    const isSocialAgent = output.agentId === "social";
                    const isCompleted = output.status === "completed";
                    const isRunning = output.status === "running";

                    return (
                      <div
                        key={output.agentId}
                        className="rounded-xl border border-[#21262D] bg-[#161B22] overflow-hidden transition-all"
                      >
                        {/* Header - always visible */}
                        <button
                          onClick={() => output.output && toggleResult(output.agentId)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1C2128] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{output.agentEmoji}</span>
                            <span className="text-sm font-semibold text-[#F0F6FC]">{output.agentName}</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
                                isCompleted
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : isRunning
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-[#21262D] text-[#484F58]"
                              )}
                            >
                              {output.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {output.output && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(output.output, output.agentId);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D] transition-all"
                                  title="Copy output"
                                >
                                  {copiedId === output.agentId ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  {copiedId === output.agentId ? "Copied" : "Copy"}
                                </button>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-[#484F58]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#484F58]" />
                                )}
                              </>
                            )}
                          </div>
                        </button>

                        {/* Expandable content */}
                        {isExpanded && output.output && (
                          <div className="px-4 pb-4 border-t border-[#21262D]">
                            <pre className="mt-3 p-3 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#C9D1D9] font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                              {output.output}
                            </pre>
                            {isSocialAgent && (
                              <div className="mt-3 flex items-center gap-2">
                                <Link
                                  to="/social-connections"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-[#9333EA] to-[#7E22CE] text-white hover:shadow-[0_0_16px_rgba(147,51,234,0.3)] transition-all"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Post to Instagram
                                </Link>
                                <span className="text-[10px] text-[#484F58]">
                                  Connects to your linked Instagram accounts
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══ Right Column: Console + Topology ═══ */}
          <div className="space-y-6">
            {/* Section 4: Live Console */}
            <div className="rounded-2xl border border-[#21262D] bg-[#0D1117] overflow-hidden">
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
                    <span style={{ color: log.agentColor }} className="shrink-0 font-semibold min-w-[110px]">
                      {log.agent}:
                    </span>
                    <span className="text-[#F0F6FC]">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Swarm Topology */}
            <div className="rounded-2xl border border-[#21262D] bg-[#0D1117] p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#9333EA]" />
                Swarm Topology
              </h2>
              <div className="flex justify-center">
                <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full">
                  {/* Connection lines from center to each node */}
                  {AGENTS.map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    return (
                      <line
                        key={`line-${agent.id}`}
                        x1={cx}
                        y1={cy}
                        x2={pos.x}
                        y2={pos.y}
                        stroke="url(#lineGradient)"
                        strokeWidth={1}
                        opacity={0.4}
                      />
                    );
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7E22CE" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  {/* Agent nodes */}
                  {AGENTS.map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    const isOrchestrator = agent.id === "orchestrator";
                    const nodeRadius = isOrchestrator ? 32 : 24;

                    return (
                      <g
                        key={agent.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          const rect = (e.target as SVGElement).closest("svg")?.getBoundingClientRect();
                          if (rect) {
                            setTooltip({
                              x: pos.x,
                              y: pos.y - nodeRadius - 10,
                              data: { name: agent.name, role: agent.role, color: agent.color },
                            });
                          }
                        }}
                        style={{ filter: `drop-shadow(0 0 6px ${agent.color}30)` }}
                      >
                        {/* Pulse ring for orchestrator */}
                        {isOrchestrator && (
                          <circle r={nodeRadius + 6} fill="none" stroke={agent.color} strokeWidth={1.5} opacity={0.4}>
                            <animate attributeName="r" values={`${nodeRadius + 4};${nodeRadius + 14};${nodeRadius + 4}`} dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {/* Node circle */}
                        <circle
                          r={nodeRadius}
                          fill={isOrchestrator ? `${agent.color}20` : "#161B22"}
                          stroke={agent.color}
                          strokeWidth={2}
                        />
                        {/* Emoji */}
                        <text
                          y={isOrchestrator ? 2 : 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={isOrchestrator ? 20 : 14}
                        >
                          {agent.emoji}
                        </text>
                        {/* Label */}
                        <text
                          y={nodeRadius + 14}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#8B949E"
                          fontSize={10}
                          fontWeight={500}
                        >
                          {agent.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Orchestrator (main hub) */}
                  <g transform={`translate(${cx}, ${cy})`}>
                    <circle r={38} fill="#9333EA15" stroke="#9333EA" strokeWidth={2.5}>
                      <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.5;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <text y={2} textAnchor="middle" dominantBaseline="middle" fontSize={24}>
                      🧠
                    </text>
                    <text y={52} textAnchor="middle" dominantBaseline="middle" fill="#9333EA" fontSize={11} fontWeight={600}>
                      Orchestrator
                    </text>
                  </g>
                </svg>
              </div>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-50 rounded-xl border border-[#21262D] bg-[#161B22] px-4 py-3 shadow-xl pointer-events-none"
                  style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
                >
                  <div className="text-sm font-semibold" style={{ color: tooltip.data.color }}>
                    {tooltip.data.name}
                  </div>
                  <div className="text-xs text-[#8B949E] mt-0.5">{tooltip.data.role}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
