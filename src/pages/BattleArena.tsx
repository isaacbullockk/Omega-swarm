import React, { useState } from "react";
import {
  Swords,
  Trophy,
  Timer,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Swords as SwordsIcon,
  Zap,
  Target,
  DollarSign,
  MousePointerClick,
  Users,
  ShoppingCart,
  Flame,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BattleRecord {
  id: number;
  battle: string;
  metric: string;
  winner: "A" | "B";
  aResult: string;
  bResult: string;
  confidence: number;
  date: string;
}

interface MetricOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const battleHistory: BattleRecord[] = [
  {
    id: 1,
    battle: "Campaign #42 vs #43",
    metric: "Conversion",
    winner: "A",
    aResult: "4.2%",
    bResult: "3.8%",
    confidence: 94,
    date: "2 days ago",
  },
  {
    id: 2,
    battle: "Campaign #40 vs #41",
    metric: "CTR",
    winner: "B",
    aResult: "2.1%",
    bResult: "2.7%",
    confidence: 89,
    date: "5 days ago",
  },
  {
    id: 3,
    battle: "Campaign #38 vs #39",
    metric: "CPA",
    winner: "A",
    aResult: "$18.50",
    bResult: "$22.10",
    confidence: 91,
    date: "1 week ago",
  },
  {
    id: 4,
    battle: "Headline V1 vs V2",
    metric: "Engagement",
    winner: "A",
    aResult: "5.4%",
    bResult: "4.1%",
    confidence: 87,
    date: "2 weeks ago",
  },
];

const metrics: MetricOption[] = [
  { value: "conversion", label: "Conversion Rate", icon: <ShoppingCart size={14} /> },
  { value: "ctr", label: "CTR", icon: <MousePointerClick size={14} /> },
  { value: "cpa", label: "CPA", icon: <DollarSign size={14} /> },
  { value: "engagement", label: "Engagement", icon: <Users size={14} /> },
  { value: "revenue", label: "Revenue", icon: <TrendingUp size={14} /> },
];

const championOptions = [
  "Current Best Campaign",
  "Summer Sale V2",
  "Holiday Special",
  "Enterprise Funnel A",
];

const challengerOptions = [
  "New Variant #44",
  "Challenger Alpha",
  "Variant B2",
  "Test Campaign X",
];

// ─── Mini Sparkline Component ────────────────────────────────────────────────

const MiniSparkline: React.FC<{ color?: string }> = ({ color = "#22C55E" }) => {
  const points = [20, 35, 28, 45, 38, 52, 48, 65, 58, 72, 68, 78];
  const width = 120;
  const height = 36;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const svgPoints = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${svgPoints} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-80">
      <defs>
        <linearGradient id={`sparklineGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparklineGrad-${color.replace("#", "")})`}
      />
      <polyline
        points={svgPoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── Components ──────────────────────────────────────────────────────────────

const WinnerBadge: React.FC<{ winner: "A" | "B" }> = ({ winner }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
      winner === "A"
        ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
        : "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
    }`}
  >
    <Trophy size={10} />
    {winner} Wins
  </span>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const BattleArena: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("conversion");
  const [champion, setChampion] = useState("Current Best Campaign");
  const [challenger, setChallenger] = useState("New Variant #44");
  const [trafficSplit, setTrafficSplit] = useState(50);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══════════════════════════════════════════
            SECTION 1: Page Header
        ═══════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 bg-[#9333EA]/10 border border-[#9333EA]/20 rounded-xl">
                <Swords size={20} className="text-[#9333EA]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Battle Arena</h1>
            </div>
            <p className="text-[#8B949E] text-sm ml-[52px]">
              A/B test campaign variants — let the best strategy win
            </p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="inline-flex items-center gap-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <SwordsIcon size={16} />
            New Battle
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 2: Active Battle
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame size={18} className="text-[#F59E0B]" />
            Active Battle
          </h2>

          <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden">
            {/* Champion vs Challenger */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-0">
              {/* Champion (A) */}
              <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#21262D] bg-[#22C55E]/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                    <Trophy size={16} className="text-[#22C55E]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#22C55E] font-bold uppercase tracking-wider">Champion (A)</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#F0F6FC] mb-1">Current Best Campaign</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-bold text-[#22C55E]">78.2%</div>
                    <div className="text-xs text-[#8B949E] mt-0.5">Win Rate</div>
                  </div>
                  <div className="text-xs text-[#484F58] bg-[#161B22] px-2 py-1 rounded-md">
                    Conversion Rate
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <MiniSparkline color="#22C55E" />
                  <div className="text-xs text-[#22C55E] font-mono flex items-center gap-1">
                    <TrendingUp size={10} />
                    +12.4%
                  </div>
                </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center py-4 md:py-0 md:px-6 bg-[#0A0A0F]/50">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#484F58] tracking-widest">VS</div>
                  <div className="text-[10px] text-[#484F58] mt-1 uppercase tracking-widest">Live</div>
                </div>
              </div>

              {/* Challenger (B) */}
              <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-[#21262D] bg-[#F59E0B]/[0.02]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
                    <Zap size={16} className="text-[#F59E0B]" />
                  </div>
                  <div>
                    <div className="text-xs text-[#F59E0B] font-bold uppercase tracking-wider">Challenger (B)</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#F0F6FC] mb-1">New Variant #44</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <div className="text-3xl font-bold text-[#F59E0B]">—</div>
                    <div className="text-xs text-[#8B949E] mt-0.5">Win Rate</div>
                  </div>
                  <div className="text-xs text-[#484F58] bg-[#161B22] px-2 py-1 rounded-md">
                    Conversion Rate
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
                  <Timer size={12} />
                  <span className="font-medium animate-pulse">Running test...</span>
                </div>
                <div className="mt-3 h-9" /> {/* spacer to align with sparkline */}
              </div>
            </div>

            {/* Live Battle Progress Bar */}
            <div className="px-6 md:px-8 py-5 border-t border-[#21262D] bg-[#161B22]/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="text-xs text-[#8B949E] font-medium">Live Results</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#484F58]">
                  <Timer size={12} />
                  Running 00:04:23
                </div>
              </div>
              <div className="flex gap-1 h-3">
                <div
                  className="bg-gradient-to-r from-[#22C55E] to-[#22C55E]/70 rounded-l-full transition-all duration-700 flex items-center justify-end pr-1"
                  style={{ width: "58%" }}
                >
                  <span className="text-[9px] font-bold text-white/80">A</span>
                </div>
                <div
                  className="bg-gradient-to-l from-[#F59E0B] to-[#F59E0B]/70 rounded-r-full transition-all duration-700 flex items-center pl-1"
                  style={{ width: "42%" }}
                >
                  <span className="text-[9px] font-bold text-white/80">B</span>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-[#22C55E] font-bold">58%</span>
                <span className="text-xs text-[#F59E0B] font-bold">42%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 3: Battle History Table
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target size={18} className="text-[#3B82F6]" />
            Battle History
          </h2>

          <div className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#21262D] bg-[#161B22]/50">
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Battle</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Metric</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">Winner</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider text-right">A Result</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider text-right">B Result</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider text-center">Confidence</div>
              <div className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider text-right">Date</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#21262D]">
              {battleHistory.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_1fr_1fr] gap-2 md:gap-4 px-5 py-4 hover:bg-[#161B22]/30 transition-colors items-center"
                >
                  <div className="text-sm font-medium text-[#F0F6FC]">{record.battle}</div>
                  <div className="text-xs text-[#8B949E] bg-[#161B22] px-2 py-1 rounded-md inline-flex w-fit">
                    {record.metric}
                  </div>
                  <div>
                    <WinnerBadge winner={record.winner} />
                  </div>
                  <div
                    className={`text-sm font-mono font-medium text-right ${
                      record.winner === "A" ? "text-[#22C55E]" : "text-[#8B949E]"
                    }`}
                  >
                    {record.aResult}
                  </div>
                  <div
                    className={`text-sm font-mono font-medium text-right ${
                      record.winner === "B" ? "text-[#F59E0B]" : "text-[#8B949E]"
                    }`}
                  >
                    {record.bResult}
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-[#21262D] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#9333EA] rounded-full"
                          style={{ width: `${record.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#8B949E]">{record.confidence}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#484F58] text-right">{record.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 4: Start New Battle (Collapsible Form)
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-[#9333EA] transition-colors"
          >
            <SwordsIcon size={18} className="text-[#9333EA]" />
            Start New Battle
            {formOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {formOpen && (
            <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-6 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Select Metric */}
                <div>
                  <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
                    Select Metric
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {metrics.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setSelectedMetric(m.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          selectedMetric === m.value
                            ? "bg-[#9333EA]/10 border-[#9333EA]/40 text-[#9333EA]"
                            : "bg-[#161B22] border-[#21262D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#30363D]"
                        }`}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Champion Select */}
                <div>
                  <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
                    Champion (A)
                  </label>
                  <select
                    value={champion}
                    onChange={(e) => setChampion(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#21262D] rounded-lg px-4 py-2.5 text-sm text-[#F0F6FC] focus:outline-none focus:border-[#9333EA] transition-colors appearance-none"
                  >
                    {championOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Challenger Select */}
                <div>
                  <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
                    Challenger (B)
                  </label>
                  <select
                    value={challenger}
                    onChange={(e) => setChallenger(e.target.value)}
                    className="w-full bg-[#161B22] border border-[#21262D] rounded-lg px-4 py-2.5 text-sm text-[#F0F6FC] focus:outline-none focus:border-[#9333EA] transition-colors appearance-none"
                  >
                    {challengerOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Traffic Split */}
                <div>
                  <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider mb-2">
                    Traffic Split — {trafficSplit}% / {100 - trafficSplit}%
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={trafficSplit}
                    onChange={(e) => setTrafficSplit(Number(e.target.value))}
                    className="w-full h-2 bg-[#21262D] rounded-full appearance-none cursor-pointer accent-[#9333EA]"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-[#22C55E] font-mono">A: {trafficSplit}%</span>
                    <span className="text-xs text-[#F59E0B] font-mono">B: {100 - trafficSplit}%</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-[#21262D]">
                <button className="inline-flex items-center gap-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  <SwordsIcon size={16} />
                  Start Battle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleArena;
