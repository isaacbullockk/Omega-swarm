import { useState, useEffect, useRef, useCallback } from "react";
import {
  Rocket,
  Zap,
  Link2,
  Brain,
  Swords,
  Terminal,
  Activity,
  Shield,
  Globe,
  Lock,
  Flower2,
  TrendingUp,
  ChevronDown,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  role: string;
  angle: number;
}

interface SwarmMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface AgentTooltipData {
  name: string;
  role: string;
  color: string;
}

/* ───────── Constants ───────── */
const AGENTS: AgentNode[] = [
  { id: "copywriter", name: "Maya", emoji: "✍️", color: "#F59E0B", role: "Ad copy, landing pages, emails", angle: 0 },
  { id: "social", name: "Pulse", emoji: "📱", color: "#EC4899", role: "Social content & viral posts", angle: 30 },
  { id: "sales", name: "Ace", emoji: "💰", color: "#EF4444", role: "Funnels & conversions", angle: 60 },
  { id: "creative", name: "Vision", emoji: "🎨", color: "#A855F7", role: "Visual assets & branding", angle: 90 },
  { id: "seo", name: "Scout", emoji: "🔍", color: "#84CC16", role: "Keywords & SEO strategy", angle: 120 },
  { id: "analytics", name: "Nexus", emoji: "📊", color: "#06B6D4", role: "Data analysis & reports", angle: 150 },
  { id: "sentinel", name: "Sentinel", emoji: "🛡️", color: "#3B82F6", role: "Threat intel & monitoring", angle: 180 },
  { id: "geo", name: "GEO", emoji: "🌍", color: "#14B8A6", role: "Geo-targeting optimization", angle: 210 },
  { id: "privacy", name: "Cipher", emoji: "🔒", color: "#6366F1", role: "Privacy & compliance", angle: 240 },
  { id: "ambient", name: "Aura", emoji: "🌸", color: "#D946EF", role: "Ambient awareness", angle: 270 },
  { id: "budget", name: "Ledger", emoji: "💹", color: "#22C55E", role: "Budget optimization", angle: 300 },
  { id: "orchestrator", name: "Prime", emoji: "🧠", color: "#F59E0B", role: "Coordinates all agents", angle: 330 },
];

const SWARM_MODES: SwarmMode[] = [
  { id: "parallel", name: "Parallel", icon: <Zap className="w-5 h-5" />, description: "All agents work simultaneously for maximum speed" },
  { id: "sequential", name: "Sequential", icon: <Link2 className="w-5 h-5" />, description: "Agents execute in order, each building on the last" },
  { id: "adaptive", name: "Adaptive", icon: <Brain className="w-5 h-5" />, description: "AI dynamically assigns tasks based on performance" },
  { id: "battle", name: "Battle", icon: <Swords className="w-5 h-5" />, description: "Agents compete to produce the best results" },
];

const LAYERS = [
  { id: "sentinel", label: "Sentinel", color: "#3B82F6" },
  { id: "geo", label: "GEO", color: "#14B8A6" },
  { id: "privacy", label: "Privacy", color: "#6366F1" },
  { id: "ambient", label: "Ambient", color: "#D946EF" },
  { id: "budget", label: "Budget RL", color: "#22C55E" },
];

const BRAND_VOICES = [
  "Soulful, confident, community-driven",
  "Playful, witty, Gen-Z focused",
  "Professional, authoritative, data-backed",
  "Warm, empathetic, story-driven",
  "Bold, provocative, contrarian",
  "Custom...",
];

const BUDGET_OPTIONS = [
  { value: "50-100", label: "\u20AC50 - \u20AC100" },
  { value: "100-250", label: "\u20AC100 - \u20AC250" },
  { value: "250-500", label: "\u20AC250 - \u20AC500" },
  { value: "500-1000", label: "\u20AC500 - \u20AC1000" },
  { value: "1000+", label: "\u20AC1000+" },
];

const TIMELINE_OPTIONS = [
  { value: "1w", label: "1 week" },
  { value: "2w", label: "2 weeks" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
];

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: "09:14:32", agent: "System", agentColor: "#7A6E5F", message: "Omega Swarm v4.2 initialized" },
  { timestamp: "09:14:33", agent: "Prime", agentColor: "#F59E0B", message: "Orchestrator standing by" },
  { timestamp: "09:14:34", agent: "Sentinel", agentColor: "#3B82F6", message: "Threat monitoring active" },
  { timestamp: "09:14:35", agent: "GEO", agentColor: "#14B8A6", message: "Location services online" },
  { timestamp: "09:14:36", agent: "Cipher", agentColor: "#6366F1", message: "Privacy layer confirmed" },
  { timestamp: "09:14:37", agent: "Aura", agentColor: "#D946EF", message: "Ambient sensors calibrated" },
  { timestamp: "09:14:38", agent: "Ledger", agentColor: "#22C55E", message: "Budget RL module loaded" },
];

const DEPLOY_SEQUENCE: LogEntry[] = [
  { timestamp: "09:23:01", agent: "Prime", agentColor: "#F59E0B", message: ">> Mission initiated by user" },
  { timestamp: "09:23:01", agent: "Prime", agentColor: "#F59E0B", message: ">> Swarm Mode: PARALLEL activated" },
  { timestamp: "09:23:02", agent: "Prime", agentColor: "#F59E0B", message: "\u2713 Orchestrator coordinating 12 agents" },
  { timestamp: "09:23:03", agent: "Maya", agentColor: "#F59E0B", message: "\u2713 Assigned: ad copy, landing page" },
  { timestamp: "09:23:03", agent: "Pulse", agentColor: "#EC4899", message: "\u2713 Assigned: campaign posts, stories" },
  { timestamp: "09:23:04", agent: "Vision", agentColor: "#A855F7", message: "\u2713 Assigned: visual concepts" },
  { timestamp: "09:23:04", agent: "Scout", agentColor: "#84CC16", message: "\u2713 Assigned: keyword optimization" },
  { timestamp: "09:23:05", agent: "Ledger", agentColor: "#22C55E", message: ">> Budget allocated across agents" },
  { timestamp: "09:23:06", agent: "Prime", agentColor: "#F59E0B", message: "\u2713 All agents online and ready" },
  { timestamp: "09:23:07", agent: "Prime", agentColor: "#F59E0B", message: ">> Campaign deployment: ACTIVE" },
  { timestamp: "09:23:10", agent: "Maya", agentColor: "#F59E0B", message: "Starting landing page copy draft..." },
  { timestamp: "09:23:12", agent: "Pulse", agentColor: "#EC4899", message: "Social calendar generated \u2014 14 posts" },
  { timestamp: "09:23:15", agent: "Vision", agentColor: "#A855F7", message: "3 visual concepts ready for review" },
  { timestamp: "09:23:18", agent: "Prime", agentColor: "#F59E0B", message: "Swarm operating at 100% efficiency" },
];

/* ───────── Helper: get position on circle ───────── */
function getCirclePos(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/* ───────── AnimatedTypingLine component ───────── */
function AnimatedTypingLine({ log }: { log: LogEntry }) {
  const [displayed, setDisplayed] = useState("");
  const fullText = log.message;
  const speed = 15; // ms per char

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0" style={{ color: "#7A6E5F", fontFamily: "var(--font-mono)" }}>
        [{log.timestamp}]
      </span>
      <span className="shrink-0 font-semibold min-w-[80px]" style={{ color: log.agentColor, fontFamily: "var(--font-mono)" }}>
        {log.agent}:
      </span>
      <span style={{ color: "#FAF5EF", fontFamily: "var(--font-mono)" }}>
        {displayed}
        {displayed.length < fullText.length && (
          <span className="animate-blink" style={{ color: "#F59E0B" }}>|</span>
        )}
      </span>
    </div>
  );
}

/* ───────── ConsoleLine component ───────── */
function ConsoleLine({ log, index }: { log: LogEntry; index: number }) {
  const isNew = index >= 7; // first 7 are initial logs
  if (isNew) {
    return <AnimatedTypingLine log={log} />;
  }
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0" style={{ color: "#7A6E5F", fontFamily: "var(--font-mono)" }}>
        [{log.timestamp}]
      </span>
      <span className="shrink-0 font-semibold min-w-[80px]" style={{ color: log.agentColor, fontFamily: "var(--font-mono)" }}>
        {log.agent}:
      </span>
      <span style={{ color: "#FAF5EF", fontFamily: "var(--font-mono)" }}>{log.message}</span>
    </div>
  );
}

/* ───────── Component ───────── */
export default function MissionControl() {
  const [objective, setObjective] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [brandVoice, setBrandVoice] = useState(BRAND_VOICES[0]);
  const [swarmMode, setSwarmMode] = useState("parallel");
  const [activeLayers, setActiveLayers] = useState<string[]>(LAYERS.map((l) => l.id));
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: AgentTooltipData } | null>(null);
  const [deployed, setDeployed] = useState(false);
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

  /* Deploy handler */
  const handleDeploy = useCallback(() => {
    if (!objective.trim() || !budget || !timeline) return;
    setIsDeploying(true);
    setDeployed(true);
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }), agent: "Prime", agentColor: "#F59E0B", message: "\u2501\u2501\u2501 DEPLOYMENT INITIATED \u2501\u2501\u2501" },
    ]);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= DEPLOY_SEQUENCE.length) {
        clearInterval(interval);
        setIsDeploying(false);
        return;
      }
      setLogs((prev) => [...prev, DEPLOY_SEQUENCE[i]]);
      i++;
    }, 700);
  }, [objective, budget, timeline]);

  /* SVG Topology dimensions */
  const svgSize = 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 145;

  /* Budget dropdown open state */
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] p-6 lg:p-8" style={{ fontFamily: "var(--font-primary)" }}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ═══ Page Header ═══ */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "0s" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.25)" }}
            >
              <Rocket className="w-6 h-6" style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <h1 className="text-[2.25rem] font-bold tracking-tight" style={{ color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                Mission Control
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Deploy your Swarm on new campaigns
              </p>
            </div>
          </div>
          <div className="mt-4 h-px w-full" style={{ backgroundColor: "var(--border-subtle)" }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          {/* ═══════════════════════════ LEFT COLUMN ═══════════════════════════ */}
          <div className="space-y-6">
            {/* ── Mission Configuration Card ── */}
            <div
              className="animate-fade-up card-lift"
              style={{
                animationDelay: "0.08s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "32px",
                backdropFilter: "blur(12px)",
              }}
            >
              <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
                Mission Configuration
              </h2>

              <div className="space-y-5">
                {/* Mission Objective */}
                <div style={{ animationDelay: "0.16s" }} className="animate-fade-up" >
                  <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Mission Objective
                  </label>
                  <textarea
                    placeholder="Launch eco-friendly water bottle targeting Gen Z fitness enthusiasts with emphasis on sustainability..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={4}
                    className="w-full rounded-[10px] px-4 py-3 text-sm resize-none transition-all focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-primary)",
                    }}
                  />
                </div>

                {/* Budget + Timeline row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Budget */}
                  <div style={{ animationDelay: "0.24s" }} className="animate-fade-up relative" >
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Budget
                    </label>
                    <button
                      onClick={() => setBudgetOpen(!budgetOpen)}
                      className="w-full rounded-[10px] px-4 py-2.5 text-sm flex items-center justify-between transition-all focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: budget ? "var(--text-primary)" : "var(--text-muted)",
                      }}
                    >
                      <span>{budget ? BUDGET_OPTIONS.find((b) => b.value === budget)?.label : "Select budget"}</span>
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </button>
                    {budgetOpen && (
                      <div
                        className="absolute z-50 w-full mt-1 rounded-[10px] overflow-hidden shadow-xl"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {BUDGET_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setBudget(opt.value); setBudgetOpen(false); }}
                            className="w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-amber-500/10"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div style={{ animationDelay: "0.32s" }} className="animate-fade-up relative" >
                    <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Timeline
                    </label>
                    <button
                      onClick={() => setTimelineOpen(!timelineOpen)}
                      className="w-full rounded-[10px] px-4 py-2.5 text-sm flex items-center justify-between transition-all focus:outline-none"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                        color: timeline ? "var(--text-primary)" : "var(--text-muted)",
                      }}
                    >
                      <span>{timeline ? TIMELINE_OPTIONS.find((t) => t.value === timeline)?.label : "Select timeline"}</span>
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    </button>
                    {timelineOpen && (
                      <div
                        className="absolute z-50 w-full mt-1 rounded-[10px] overflow-hidden shadow-xl"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {TIMELINE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => { setTimeline(opt.value); setTimelineOpen(false); }}
                            className="w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-amber-500/10"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Voice */}
                <div style={{ animationDelay: "0.40s" }} className="animate-fade-up relative" >
                  <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Brand Voice
                  </label>
                  <button
                    onClick={() => setVoiceOpen(!voiceOpen)}
                    className="w-full rounded-[10px] px-4 py-2.5 text-sm flex items-center justify-between transition-all focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                      <span>{brandVoice}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </button>
                  {voiceOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 rounded-[10px] overflow-hidden shadow-xl"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {BRAND_VOICES.map((voice) => (
                        <button
                          key={voice}
                          onClick={() => { setBrandVoice(voice); setVoiceOpen(false); }}
                          className="w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-amber-500/10"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {voice}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swarm Mode Selector */}
                <div style={{ animationDelay: "0.48s" }} className="animate-fade-up" >
                  <label className="block text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Swarm Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SWARM_MODES.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setSwarmMode(mode.id)}
                        className={cn(
                          "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                          swarmMode === mode.id
                            ? "border-[#F59E0B]"
                            : "border-transparent hover:border-[#3D3229]"
                        )}
                        style={{
                          background: swarmMode === mode.id
                            ? "rgba(245, 158, 11, 0.08)"
                            : "var(--bg-elevated)",
                          boxShadow: swarmMode === mode.id
                            ? "0 0 20px rgba(245, 158, 11, 0.15)"
                            : "none",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span style={{ color: swarmMode === mode.id ? "#F59E0B" : "var(--text-muted)" }}>
                            {mode.icon}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: swarmMode === mode.id ? "var(--text-primary)" : "var(--text-secondary)" }}
                          >
                            {mode.name}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {mode.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Layers */}
                <div style={{ animationDelay: "0.56s" }} className="animate-fade-up" >
                  <label className="block text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                    Active Layers
                  </label>
                  <div className="space-y-2">
                    {LAYERS.map((layer) => {
                      const isActive = activeLayers.includes(layer.id);
                      return (
                        <button
                          key={layer.id}
                          onClick={() => toggleLayer(layer.id)}
                          className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 transition-all duration-200"
                          style={{
                            background: isActive ? `${layer.color}10` : "var(--bg-elevated)",
                            border: `1px solid ${isActive ? `${layer.color}40` : "var(--border-subtle)"}`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full transition-all"
                              style={{
                                backgroundColor: isActive ? layer.color : "var(--text-muted)",
                                opacity: isActive ? 1 : 0.3,
                                boxShadow: isActive ? `0 0 8px ${layer.color}60` : "none",
                              }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}
                            >
                              {layer.label}
                            </span>
                          </div>
                          <div
                            className="w-9 h-5 rounded-full relative transition-all duration-200"
                            style={{
                              backgroundColor: isActive ? layer.color : "var(--border-subtle)",
                            }}
                          >
                            <div
                              className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                              style={{
                                left: isActive ? "18px" : "2px",
                                backgroundColor: "#fff",
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Deploy Button ── */}
            <div
              className="animate-fade-up"
              style={{ animationDelay: "0.64s", opacity: 0 }}
            >
              <button
                onClick={handleDeploy}
                disabled={isDeploying || !objective.trim() || !budget || !timeline}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200",
                  isDeploying || !objective.trim() || !budget || !timeline
                    ? "cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-[0.98]"
                )}
                style={
                  !isDeploying && objective.trim() && budget && timeline
                    ? {
                        background: "linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #FBBF24 100%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s linear infinite",
                        color: "#0C0A09",
                        boxShadow: "0 0 30px rgba(245,158,11,0.35), 0 0 60px rgba(245,158,11,0.15)",
                      }
                    : {
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                      }
                }
              >
                {isDeploying ? (
                  <>
                    <Activity className="w-6 h-6 animate-pulse" />
                    Initializing Swarm...
                  </>
                ) : deployed ? (
                  <>
                    <span className="text-xl">✓</span>
                    Swarm Deployed
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6" />
                    Deploy Swarm
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
          <div className="space-y-6">
            {/* ── Live Console ── */}
            <div
              className="animate-fade-up overflow-hidden"
              style={{
                animationDelay: "0.12s",
                opacity: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
              }}
            >
              {/* Console Header */}
              <div
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  </div>
                  <Terminal className="w-4 h-4 ml-2" style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                    swarm-console
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: "#84CC16", animation: "pulseGlow 2s ease-in-out infinite" }}
                    />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#84CC16]" />
                  </span>
                  <span className="text-xs font-bold" style={{ color: "#84CC16" }}>LIVE</span>
                </div>
              </div>

              {/* Console Output */}
              <div
                ref={consoleRef}
                className="p-4 overflow-y-auto"
                style={{
                  height: "320px",
                  maxHeight: "400px",
                  backgroundColor: "var(--bg-base)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <ConsoleLine key={i} log={log} index={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Swarm Topology SVG ── */}
            <div
              className="animate-scale-in relative"
              style={{
                animationDelay: "0.2s",
                opacity: 0,
                background: "var(--gradient-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Activity className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                Swarm Topology
              </h2>
              <div className="flex justify-center">
                <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.15} />
                    </linearGradient>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </radialGradient>
                  </defs>

                  {/* Background glow */}
                  <circle cx={cx} cy={cy} r={radius + 40} fill="url(#centerGlow)" />

                  {/* Connection lines from center to each agent */}
                  {AGENTS.filter((a) => a.id !== "orchestrator").map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    return (
                      <g key={`line-${agent.id}`}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={pos.x}
                          y2={pos.y}
                          stroke="url(#lineGradient)"
                          strokeWidth={1.5}
                          opacity={0.4}
                        />
                        {/* Animated traveling dot */}
                        <circle r={2.5} fill="#F59E0B" opacity={0.8}>
                          <animateMotion
                            dur={`${2 + Math.random() * 2}s`}
                            repeatCount="indefinite"
                            path={`M${cx},${cy} L${pos.x},${pos.y}`}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Pulse rings for active agents */}
                  {AGENTS.filter((a) => a.id !== "orchestrator").map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    return (
                      <g key={`pulse-${agent.id}`}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={28}
                          fill="none"
                          stroke={agent.color}
                          strokeWidth={1}
                          opacity={0}
                        >
                          <animate
                            attributeName="r"
                            values="24;42;24"
                            dur={`${1.5 + Math.random() * 0.5}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.5;0;0.5"
                            dur={`${1.5 + Math.random() * 0.5}s`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Agent nodes */}
                  {AGENTS.filter((a) => a.id !== "orchestrator").map((agent) => {
                    const pos = getCirclePos(agent.angle, radius, cx, cy);
                    const nodeR = 22;
                    return (
                      <g
                        key={agent.id}
                        className="cursor-pointer"
                        onClick={() => setTooltip({
                          x: pos.x,
                          y: pos.y - nodeR - 12,
                          data: { name: agent.name, role: agent.role, color: agent.color },
                        })}
                        style={{ filter: `drop-shadow(0 0 6px ${agent.color}40)` }}
                      >
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={nodeR}
                          fill={`${agent.color}15`}
                          stroke={agent.color}
                          strokeWidth={2}
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={14}
                        >
                          {agent.emoji}
                        </text>
                        <text
                          x={pos.x}
                          y={pos.y + nodeR + 12}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#C4B5A0"
                          fontSize={10}
                          fontWeight={500}
                          fontFamily="var(--font-primary)"
                        >
                          {agent.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Orchestrator node */}
                  <g>
                    {/* Outer pulse ring */}
                    <circle cx={cx} cy={cy} r={42} fill="none" stroke="#F59E0B" strokeWidth={1.5} opacity={0.3}>
                      <animate attributeName="r" values="38;50;38" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                    </circle>
                    {/* Second pulse ring */}
                    <circle cx={cx} cy={cy} r={38} fill="none" stroke="#F59E0B" strokeWidth={1} opacity={0.2}>
                      <animate attributeName="r" values="34;48;34" dur="3s" begin="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" begin="1s" repeatCount="indefinite" />
                    </circle>
                    {/* Main center circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={34}
                      fill="rgba(245,158,11,0.12)"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                    />
                    <text
                      x={cx}
                      y={cy + 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={22}
                    >
                      🧠
                    </text>
                    <text
                      x={cx}
                      y={cy + 50}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#F59E0B"
                      fontSize={11}
                      fontWeight={600}
                      fontFamily="var(--font-primary)"
                    >
                      Orchestrator
                    </text>
                  </g>
                </svg>
              </div>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-50 rounded-xl px-4 py-3 pointer-events-none"
                  style={{
                    left: `${(tooltip.x / svgSize) * 100}%`,
                    top: `${(tooltip.y / svgSize) * 100}%`,
                    transform: "translate(-50%, -100%)",
                    background: "var(--bg-elevated)",
                    border: "1px solid #3D3229",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: tooltip.data.color }}>
                    {tooltip.data.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {tooltip.data.role}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
