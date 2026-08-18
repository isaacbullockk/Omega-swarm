import React, { useState } from "react";
import {
  Swords,
  Trophy,
  Zap,
  Target,
  DollarSign,
  MousePointerClick,
  Users,
  TrendingUp,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Swords as SwordsIcon,
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

const battleHistory: BattleRecord[] = [];

const metrics: MetricOption[] = [
  { value: "conversion", label: "Conversion Rate", icon: <ShoppingCart size={14} /> },
  { value: "ctr", label: "CTR", icon: <MousePointerClick size={14} /> },
  { value: "cpa", label: "CPA", icon: <DollarSign size={14} /> },
  { value: "engagement", label: "Engagement", icon: <Users size={14} /> },
  { value: "revenue", label: "Revenue", icon: <TrendingUp size={14} /> },
];

const championOptions = ["No campaigns yet"];

const challengerOptions = ["Start your first mission"];

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
            SECTION 2: Active Battle (Empty State)
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-[#F59E0B]" />
            Active Battle
          </h2>

          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-[#21262D] bg-[#0D1117] py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#9333EA]/10 border border-[#9333EA]/20 flex items-center justify-center mb-6">
              <Swords size={32} className="text-[#9333EA] opacity-50" />
            </div>
            <p className="text-lg font-semibold text-[#F0F6FC]">
              No battles fought yet
            </p>
            <p className="text-sm text-[#8B949E] mt-2">
              Start a battle to compare agents
            </p>
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

            {/* Empty state for battle history */}
            {battleHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Target size={32} className="text-[#3B82F6] opacity-30" />
                <p className="mt-3 text-sm text-[#8B949E]">
                  No battle history yet
                </p>
              </div>
            )}
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
