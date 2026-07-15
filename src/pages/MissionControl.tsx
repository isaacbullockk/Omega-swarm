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
  BarChart3, Zap, Globe, Users, Target, Clock, Sun, Leaf, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Link } from "react-router";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/* ═══════════════════════════════════════════
   SAVANNAH SUMMER DESIGN SYSTEM
   ═══════════════════════════════════════════ */

const COLORS = {
  // Backgrounds
  bgDeep: "#0C0A09",        // Rich espresso dark
  bgCard: "rgba(28, 25, 23, 0.7)", // Warm dark with glass
  bgElevated: "rgba(41, 37, 36, 0.6)",
  bgInput: "rgba(28, 25, 23, 0.5)",

  // Savannah palette
  amber: "#F59E0B",
  amberGlow: "rgba(245, 158, 11, 0.15)",
  gold: "#EAB308",
  goldGlow: "rgba(234, 179, 8, 0.12)",
  sunset: "#F97316",
  sunsetGlow: "rgba(249, 115, 22, 0.12)",
  sage: "#84CC16",
  sageGlow: "rgba(132, 204, 22, 0.12)",
  cream: "#FEF3C7",
  warm: "#FDE68A",

  // Text
  textPrimary: "#FAF7F2",    // Warm white
  textSecondary: "#A8A29E",  // Warm gray
  textMuted: "#78716C",      // Stone gray

  // Borders
  border: "rgba(120, 113, 108, 0.2)",
  borderHover: "rgba(245, 158, 11, 0.3)",

  // Accents
  accent: "#F59E0B",
  accentHover: "#FBBF24",
  success: "#84CC16",
  successGlow: "rgba(132, 204, 22, 0.15)",
};

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
  angle: number;
}

/* ───────── Constants ───────── */
const AGENTS: AgentNode[] = [
  { id: "copywriter", name: "Copywriter", emoji: "✍️", color: "#F59E0B", angle: 0 },
  { id: "social", name: "Social", emoji: "📱", color: "#EC4899", angle: 30 },
  { id: "sales", name: "Sales", emoji: "💼", color: "#22C55E", angle: 60 },
  { id: "creative", name: "Creative", emoji: "🎨", color: "#A855F7", angle: 90 },
  { id: "seo", name: "SEO", emoji: "🔍", color: "#06B6D4", angle: 120 },
  { id: "analytics", name: "Analytics", emoji: "📊", color: "#94A3B8", angle: 150 },
  { id: "sentinel", name: "Sentinel", emoji: "👁️", color: "#EF4444", angle: 180 },
  { id: "geo", name: "GEO", emoji: "🤖", color: "#6366F1", angle: 210 },
  { id: "privacy", name: "Privacy", emoji: "🔒", color: "#22C55E", angle: 240 },
  { id: "ambient", name: "Ambient", emoji: "🌐", color: "#14B8A6", angle: 270 },
  { id: "budget", name: "Budget", emoji: "💰", color: "#EAB308", angle: 300 },
  { id: "orchestrator", name: "Orchestrator", emoji: "🧠", color: "#F59E0B", angle: 330 },
];

const INITIAL_LOGS: LogEntry[] = [
  { timestamp: "09:14:32", agent: "System", agentColor: COLORS.textMuted, message: "Omega Swarm v4.1 initialized — 12 agents standing by" },
  { timestamp: "09:14:33", agent: "Sentinel", agentColor: "#EF4444", message: "14 competitor feeds connected" },
  { timestamp: "09:14:34", agent: "GEO", agentColor: "#6366F1", message: "Optimizing content for ChatGPT, Perplexity, Gemini, Claude" },
  { timestamp: "09:14:35", agent: "Budget RL", agentColor: COLORS.amber, message: "Auto-budget allocation module active" },
  { timestamp: "09:14:36", agent: "Privacy", agentColor: "#22C55E", message: "Zero-party data collection framework active" },
  { timestamp: "09:14:37", agent: "Orchestrator", agentColor: COLORS.amber, message: "Swarm topology online — awaiting mission parameters" },
  { timestamp: "09:14:38", agent: "Creative", agentColor: "#A855F7", message: "Brand voice module loaded" },
  { timestamp: "09:14:39", agent: "SEO", agentColor: "#06B6D4", message: "Keyword index refreshed — 2.4M terms indexed" },
];

const SWARM_MODES = [
  { id: "parallel", label: "Parallel", icon: "⚡" },
  { id: "sequential", label: "Sequential", icon: "🔗" },
  { id: "adaptive", label: "Adaptive", icon: "🧠" },
  { id: "battle", label: "Battle", icon: "⚔️" },
];

const LAYERS = [
  { id: "sentinel", label: "Sentinel", color: "border-red-500/30 text-red-400 bg-red-500/10" },
  { id: "geo", label: "GEO", color: "border-indigo-500/30 text-indigo-400 bg-indigo-500/10" },
  { id: "privacy", label: "Privacy", color: "border-lime-500/30 text-lime-400 bg-lime-500/10" },
  { id: "ambient", label: "Ambient", color: "border-teal-500/30 text-teal-400 bg-teal-500/10" },
  { id: "budget", label: "Budget RL", color: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
];

const DEPLOY_LOGS: LogEntry[] = [
  { timestamp: "09:15:01", agent: "Orchestrator", agentColor: COLORS.amber, message: "Mission parameters received — parsing objective" },
  { timestamp: "09:15:02", agent: "Sentinel", agentColor: "#EF4444", message: "Competitor threat analysis initiated" },
  { timestamp: "09:15:03", agent: "Creative", agentColor: "#A855F7", message: "Generating campaign concept variants..." },
  { timestamp: "09:15:04", agent: "Copywriter", agentColor: COLORS.amber, message: "Ad copy generation started — 12 variants" },
  { timestamp: "09:15:05", agent: "Social", agentColor: "#EC4899", message: "Content calendar auto-scheduling" },
  { timestamp: "09:15:06", agent: "Budget", agentColor: COLORS.gold, message: "Dynamic budget redistribution active" },
  { timestamp: "09:15:07", agent: "GEO", agentColor: "#6366F1", message: "Submitting optimized content to AI engines" },
  { timestamp: "09:15:08", agent: "Orchestrator", agentColor: COLORS.amber, message: "Mission deployed — all agents executing" },
];

/* ───────── Helper: circle position ───────── */
function getCirclePos(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/* ═══════════════════════════════════════════
   ANIMATED PARTICLE BACKGROUND
   ═══════════════════════════════════════════ */
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number; color: string }[] = [];
    const colors = ["245, 158, 11", "234, 179, 8", "249, 115, 22", "132, 204, 22", "251, 191, 36"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ═══════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════ */
function StatCard({
  title, value, subtitle, subtitleColor, icon: Icon, iconColor, iconBg, delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  subtitleColor: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;
    gsap.from(cardRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      delay,
      ease: "power3.out",
    });
  }, { scope: cardRef });

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-500 group"
      style={{
        background: COLORS.bgCard,
        borderColor: COLORS.border,
        backdropFilter: "blur(20px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.borderHover;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${iconGlow(iconColor)}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
        <Icon className="w-full h-full" style={{ color: iconColor }} />
      </div>
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <span className="text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-full border" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
          {title}
        </span>
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: COLORS.textPrimary }}>{value}</div>
      <div className={`text-xs mt-1.5 font-medium ${subtitleColor}`}>{subtitle}</div>
    </div>
  );
}

function iconGlow(hex: string) {
  return hex.replace("#", "rgba(").replace(/$/, ", 0.15)")
    .replace(/^rgba\(F/, "rgba(245").replace(/^rgba\(E/, "rgba(234")
    .replace(/^rgba\(2/, "rgba(34").replace(/^rgba\(9/, "rgba(132") + ")";
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function MissionControl() {
  const [objective, setObjective] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [swarmMode, setSwarmMode] = useState("parallel");
  const [activeLayers, setActiveLayers] = useState<string[]>(LAYERS.map((l) => l.id));
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [generateVisuals, setGenerateVisuals] = useState(false);
  const [completedCampaignId, setCompletedCampaignId] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  /* ─── Auto-scroll console ─── */
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  /* ─── GSAP entrance animations ─── */
  useGSAP(() => {
    // Header
    gsap.from(headerRef.current, { y: -40, opacity: 0, duration: 1, ease: "power3.out" });
    // Left panel
    gsap.from(leftPanelRef.current, { x: -60, opacity: 0, duration: 0.9, delay: 0.3, ease: "power3.out" });
    // Right panel
    gsap.from(rightPanelRef.current, { x: 60, opacity: 0, duration: 0.9, delay: 0.5, ease: "power3.out" });
  }, { scope: [headerRef, leftPanelRef, rightPanelRef] });

  /* ─── Toggle helpers ─── */
  const toggleLayer = useCallback((id: string) => {
    setActiveLayers((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, l]);
  }, []);

  const toggleResult = useCallback((agentId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      next.has(agentId) ? next.delete(agentId) : next.add(agentId);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (text: string, agentId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(agentId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(agentId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  /* ─── tRPC queries & mutations ─── */
  const { data: brandVoiceData } = trpc.brandVoice.get.useQuery();

  const executeMission = trpc.agent.executeMission.useMutation({
    onSuccess: (data) => {
      setLogs((prev) => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), agent: "Orchestrator", agentColor: COLORS.amber, message: `Mission ${data.campaignId} complete — ${data.agentsExecuted} agents executed` },
      ]);
      setIsDeploying(false);
      setCompletedCampaignId(data.campaignId);
      refCampaign.refetch();
    },
    onError: (err) => {
      setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), agent: "System", agentColor: "#EF4444", message: `Error: ${err.message}` }]);
      setIsDeploying(false);
    },
  });

  const refCampaign = trpc.agent.getCampaigns.useQuery();
  const campaignsData = refCampaign.data ?? [];

  const campaignQuery = trpc.agent.getCampaign.useQuery(
    { id: completedCampaignId ?? "" },
    { enabled: !!completedCampaignId }
  );
  const campaignResults = campaignQuery.data?.outputs ?? [];

  /* ─── Deploy handler ─── */
  const handleDeploy = useCallback(() => {
    if (!objective.trim() || !budget || !timeline) return;
    setIsDeploying(true);
    setCompletedCampaignId(null);
    setExpandedResults(new Set());
    setLogs((prev) => [...prev, { timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }), agent: "Orchestrator", agentColor: COLORS.amber, message: "─── DEPLOYMENT INITIATED ───" }]);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= DEPLOY_LOGS.length) {
        clearInterval(interval);
        executeMission.mutate({ objective, budget, timeline, mode: swarmMode });
        return;
      }
      setLogs((prev) => [...prev, DEPLOY_LOGS[i]]);
      i++;
    }, 600);
  }, [objective, budget, timeline, swarmMode, executeMission]);

  /* ─── SVG dimensions ─── */
  const svgSize = 400;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 145;

  /* ─── Derived values ─── */
  const brandVoiceDisplay = brandVoiceData ? `${brandVoiceData.tone}` : "Soulful, confident, community-driven";
  const activeCampaigns = campaignsData.filter((c: any) => c.status === "running" || c.status === "active").length;
  const totalTasks = campaignsData.reduce((acc: number, c: any) => acc + (c.tasksTotal || 0), 0);
  const completedTasks = campaignsData.reduce((acc: number, c: any) => acc + (c.tasksCompleted || 0), 0);
  const avgRoi = campaignsData.length > 0
    ? "+" + Math.round(campaignsData.reduce((acc: number, c: any) => acc + parseInt((c.roi || "0").replace(/[^0-9]/g, "")), 0) / campaignsData.length) + "%"
    : "+0%";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: COLORS.bgDeep, color: COLORS.textPrimary, fontFamily: "Inter, system-ui, sans-serif" }}>
      <ParticleBackground />

      {/* Warm ambient gradient overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.04) 0%, transparent 60%)" }} />

      <div className="relative" style={{ zIndex: 2 }}>
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

          {/* ═══ HEADER ═══ */}
          <div ref={headerRef} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,179,8,0.1))", border: `1px solid ${COLORS.border}` }}>
                <Sun className="w-7 h-7" style={{ color: COLORS.amber }} />
                <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 25px ${COLORS.amberGlow} inset` }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: COLORS.textPrimary }}>
                  Mission <span style={{ color: COLORS.amber }}>Control</span>
                </h1>
                <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: COLORS.textMuted }}>
                  <Leaf className="w-3.5 h-3.5" style={{ color: COLORS.sage }} />
                  {activeCampaigns > 0
                    ? `${activeCampaigns} campaign${activeCampaigns > 1 ? "s" : ""} active — swarm is buzzing`
                    : "Your AI marketing swarm is standing by in the Savannah"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: COLORS.sage }} />
              </span>
              <span className="text-xs font-semibold" style={{ color: COLORS.sage }}>11/12 Agents Online</span>
            </div>
          </div>

          {/* ═══ STATS GRID ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Campaigns" value={activeCampaigns} subtitle="+2 this week" subtitleColor="text-lime-400" icon={Target} iconColor="#EC4899" iconBg="rgba(236,72,153,0.1)" delay={0} />
            <StatCard title="Tasks Completed" value={completedTasks} subtitle={`${totalTasks - completedTasks} remaining`} subtitleColor="text-amber-400" icon={Zap} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={0.1} />
            <StatCard title="Win Rate" value="78.2%" subtitle="+5.4% vs last month" subtitleColor="text-lime-400" icon={BarChart3} iconColor="#22C55E" iconBg="rgba(34,197,94,0.1)" delay={0.2} />
            <StatCard title="Avg ROI" value={avgRoi} subtitle="Above benchmark" subtitleColor="text-amber-400" icon={TrendingUp} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" delay={0.3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ═══ LEFT: Form + Deploy ═══ */}
            <div ref={leftPanelRef} className="space-y-6">
              <div className="rounded-2xl border p-6" style={{ background: COLORS.bgCard, borderColor: COLORS.border, backdropFilter: "blur(20px)" }}>
                <h2 className="text-lg font-semibold mb-5 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLORS.amberGlow }}>
                    <Bot className="w-4 h-4" style={{ color: COLORS.amber }} />
                  </div>
                  Mission Configuration
                </h2>

                <div className="space-y-5">
                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Mission Objective</label>
                    <Textarea
                      placeholder="e.g., Launch eco-friendly water bottle targeting Gen Z fitness enthusiasts, €200 budget, 2-week sprint"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="min-h-[100px] resize-none border rounded-xl transition-all duration-300 focus:ring-2"
                      style={{ background: COLORS.bgInput, borderColor: COLORS.border, color: COLORS.textPrimary }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.amber; e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.amberGlow}`; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Budget + Timeline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Budget</label>
                      <Select value={budget} onValueChange={setBudget}>
                        <SelectTrigger className="border rounded-xl" style={{ background: COLORS.bgInput, borderColor: COLORS.border, color: COLORS.textPrimary }}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#1C1917", borderColor: COLORS.border }}>
                          {["50-100", "100-250", "250-500", "custom"].map((v) => (
                            <SelectItem key={v} value={v} className="focus:bg-amber-500/10" style={{ color: COLORS.textPrimary }}>
                              {v === "custom" ? "Custom" : `€${v.replace("-", " - €")}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Timeline</label>
                      <Select value={timeline} onValueChange={setTimeline}>
                        <SelectTrigger className="border rounded-xl" style={{ background: COLORS.bgInput, borderColor: COLORS.border, color: COLORS.textPrimary }}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent style={{ background: "#1C1917", borderColor: COLORS.border }}>
                          {["1w:1 Week", "2w:2 Weeks", "1m:1 Month", "3m:3 Months"].map((opt) => {
                            const [val, label] = opt.split(":");
                            return <SelectItem key={val} value={val} className="focus:bg-amber-500/10" style={{ color: COLORS.textPrimary }}>{label}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Brand Voice */}
                  <div className="rounded-xl border p-4" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(132,204,22,0.03))", borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium flex items-center gap-2" style={{ color: COLORS.textSecondary }}>
                        <Users className="w-3.5 h-3.5" /> Brand Voice
                      </label>
                      <Link to="/brand-voice" className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: COLORS.amber }}>
                        <Sparkles className="w-3 h-3" /> Customize
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5" style={{ color: COLORS.sunset }} />
                      <span className="text-sm font-medium">{brandVoiceDisplay}</span>
                    </div>
                  </div>

                  {/* Generate Visuals */}
                  <div className="rounded-xl border p-4" style={{ background: COLORS.bgInput, borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLORS.amberGlow }}>
                          <Image className="w-4 h-4" style={{ color: COLORS.amber }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium" style={{ color: COLORS.textPrimary }}>Generate Visual Assets</label>
                          <p className="text-xs" style={{ color: COLORS.textMuted }}>DALL-E images and AI video clips</p>
                        </div>
                      </div>
                      <Switch checked={generateVisuals} onCheckedChange={setGenerateVisuals} />
                    </div>
                  </div>

                  {/* Swarm Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Swarm Mode</label>
                    <div className="grid grid-cols-4 gap-2">
                      {SWARM_MODES.map((mode) => (
                        <button key={mode.id} onClick={() => setSwarmMode(mode.id)}
                          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-300"
                          style={{
                            background: swarmMode === mode.id ? COLORS.amberGlow : COLORS.bgInput,
                            borderColor: swarmMode === mode.id ? COLORS.amber : COLORS.border,
                            color: swarmMode === mode.id ? COLORS.warm : COLORS.textMuted,
                            boxShadow: swarmMode === mode.id ? `0 0 15px ${COLORS.amberGlow}` : "none",
                          }}
                        >
                          <span>{mode.icon}</span>
                          <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Layers */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: COLORS.textSecondary }}>Active Layers</label>
                    <div className="flex flex-wrap gap-2">
                      {LAYERS.map((layer) => (
                        <button key={layer.id} onClick={() => toggleLayer(layer.id)}
                          className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300", activeLayers.includes(layer.id) ? layer.color : "border-stone-700 text-stone-500 bg-stone-800/50 hover:border-stone-600")}
                        >
                          {layer.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deploy Button */}
              <button onClick={handleDeploy} disabled={isDeploying || !objective.trim() || !budget || !timeline}
                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300"
                style={{
                  background: isDeploying || !objective.trim() || !budget || !timeline
                    ? "rgba(28,25,23,0.5)" : "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: isDeploying || !objective.trim() || !budget || !timeline ? COLORS.textMuted : "#fff",
                  border: isDeploying || !objective.trim() || !budget || !timeline ? `1px solid ${COLORS.border}` : "none",
                  cursor: isDeploying || !objective.trim() || !budget || !timeline ? "not-allowed" : "pointer",
                  boxShadow: isDeploying || !objective.trim() || !budget || !timeline ? "none" : "0 0 30px rgba(245,158,11,0.3)",
                }}
                onMouseEnter={(e) => { if (!(isDeploying || !objective.trim() || !budget || !timeline)) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 45px rgba(245,158,11,0.45)"; }}
                onMouseLeave={(e) => { if (!(isDeploying || !objective.trim() || !budget || !timeline)) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(245,158,11,0.3)"; }}
              >
                {isDeploying ? <><Activity className="w-6 h-6 animate-pulse" /> Deploying Swarm...</> : <><Rocket className="w-6 h-6" /> Deploy Omega Swarm</>}
              </button>

              {/* Results */}
              {campaignResults.length > 0 && (
                <div className="rounded-2xl border p-6" style={{ background: COLORS.bgCard, borderColor: COLORS.border, backdropFilter: "blur(20px)" }}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                    <Sparkles className="w-5 h-5" style={{ color: COLORS.amber }} />
                    Mission Results
                    <span className="text-[10px] px-2 py-0.5 rounded-full border ml-auto" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
                      {campaignResults.filter((o: any) => o.status === "completed").length} / {campaignResults.length} agents
                    </span>
                  </h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#292524 transparent" }}>
                    {campaignResults.map((output: any) => {
                      const isExpanded = expandedResults.has(output.agentId);
                      const isCompleted = output.status === "completed";
                      return (
                        <div key={output.agentId} className="rounded-xl border overflow-hidden transition-all duration-300" style={{ background: COLORS.bgInput, borderColor: COLORS.border }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.borderHover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = COLORS.border; }}
                        >
                          <button onClick={() => output.output && toggleResult(output.agentId)} className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{output.agentEmoji}</span>
                              <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>{output.agentName}</span>
                              <span className={cn("text-[10px] uppercase font-medium px-2 py-0.5 rounded-full border", isCompleted ? "border-lime-500/30 text-lime-400 bg-lime-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10")}>{output.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {output.output && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleCopy(output.output, output.agentId); }} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors" style={{ color: COLORS.textMuted }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = COLORS.textPrimary; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = COLORS.textMuted; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                  >
                                    {copiedId === output.agentId ? <Check className="w-3 h-3 text-lime-400" /> : <Copy className="w-3 h-3" />}
                                    {copiedId === output.agentId ? "Copied" : "Copy"}
                                  </button>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" style={{ color: COLORS.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: COLORS.textMuted }} />}
                                </>
                              )}
                            </div>
                          </button>
                          {isExpanded && output.output && (
                            <div className="px-4 pb-4 border-t" style={{ borderColor: COLORS.border }}>
                              <pre className="mt-3 p-3 rounded-lg border text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto" style={{ background: COLORS.bgDeep, borderColor: COLORS.border, color: COLORS.textSecondary }}>{output.output}</pre>
                              {output.agentId === "social" && (
                                <div className="mt-3 flex items-center gap-2">
                                  <Link to="/social-connections" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 0 15px rgba(245,158,11,0.2)" }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 25px rgba(245,158,11,0.35)"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 15px rgba(245,158,11,0.2)"; }}
                                  >
                                    <ExternalLink className="w-3 h-3" /> Post to Instagram
                                  </Link>
                                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>Connects to your linked Instagram accounts</span>
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

            {/* ═══ RIGHT: Console + Topology ═══ */}
            <div ref={rightPanelRef} className="space-y-6">
              {/* Live Console */}
              <div className="rounded-2xl border overflow-hidden" style={{ background: COLORS.bgCard, borderColor: COLORS.border, backdropFilter: "blur(20px)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "rgba(28,25,23,0.8)", borderColor: COLORS.border }}>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                    <span className="text-sm font-medium" style={{ color: COLORS.textMuted }}>Live Console</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: COLORS.sage }} />
                    </span>
                    <span className="text-xs font-semibold" style={{ color: COLORS.sage }}>LIVE</span>
                  </div>
                </div>
                <div ref={consoleRef} className="p-4 h-[260px] overflow-y-auto font-mono text-xs space-y-1.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#292524 transparent" }}>
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="shrink-0" style={{ color: COLORS.textMuted }}>[{log.timestamp}]</span>
                      <span className="shrink-0 font-semibold min-w-[110px]" style={{ color: log.agentColor }}>{log.agent}:</span>
                      <span style={{ color: COLORS.textPrimary }}>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Swarm Topology */}
              <div className="rounded-2xl border p-6" style={{ background: COLORS.bgCard, borderColor: COLORS.border, backdropFilter: "blur(20px)" }}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: COLORS.amberGlow }}>
                    <Globe className="w-4 h-4" style={{ color: COLORS.amber }} />
                  </div>
                  Swarm Topology
                  <span className="text-[10px] px-2 py-0.5 rounded-full border ml-auto" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>12 agents</span>
                </h2>
                <div className="flex justify-center">
                  <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="max-w-full">
                    {AGENTS.map((agent) => {
                      const pos = getCirclePos(agent.angle, radius, cx, cy);
                      return <line key={`line-${agent.id}`} x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke="rgba(245,158,11,0.15)" strokeWidth={1} />;
                    })}
                    {AGENTS.map((agent) => {
                      const pos = getCirclePos(agent.angle, radius, cx, cy);
                      const isOrchestrator = agent.id === "orchestrator";
                      const nodeR = isOrchestrator ? 32 : 24;
                      return (
                        <g key={agent.id} transform={`translate(${pos.x}, ${pos.y})`}>
                          {isOrchestrator && (
                            <circle r={nodeR + 6} fill="none" stroke={agent.color} strokeWidth={1.5} opacity={0.3}>
                              <animate attributeName="r" values={`${nodeR + 4};${nodeR + 14};${nodeR + 4}`} dur="2.5s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                          <circle r={nodeR} fill={isOrchestrator ? `${agent.color}18` : "#1C1917"} stroke={agent.color} strokeWidth={2} />
                          <text y={isOrchestrator ? 2 : 1} textAnchor="middle" dominantBaseline="middle" fontSize={isOrchestrator ? 20 : 14}>{agent.emoji}</text>
                          <text y={nodeR + 14} textAnchor="middle" dominantBaseline="middle" fill="#A8A29E" fontSize={10} fontWeight={500}>{agent.name}</text>
                        </g>
                      );
                    })}
                    <g transform={`translate(${cx}, ${cy})`}>
                      <circle r={38} fill="rgba(245,158,11,0.08)" stroke="#F59E0B" strokeWidth={2.5}>
                        <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.5;0.8" dur="3s" repeatCount="indefinite" />
                      </circle>
                      <text y={2} textAnchor="middle" dominantBaseline="middle" fontSize={24}>🧠</text>
                      <text y={52} textAnchor="middle" dominantBaseline="middle" fill="#F59E0B" fontSize={11} fontWeight={600}>Orchestrator</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
