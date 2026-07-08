import React, { useState } from "react";
import {
  Brain,
  Database,
  Search,
  SearchIcon,
  Command,
  Trophy,
  XCircle,
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Calendar,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemoryItem {
  id: number;
  title: string;
  outcome: "WIN" | "LOSS";
  ctr: string;
  cpa: string;
  date: string;
  agents: string[];
}

interface Pattern {
  id: number;
  text: string;
  confidence: number;
  dotColor: string;
}

interface StatCard {
  label: string;
  value: number;
  progress: number;
  colorClass: string;
  barClass: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const memoryItems: MemoryItem[] = [
  {
    id: 1,
    title: "Sustainable fitness gear launch",
    outcome: "WIN",
    ctr: "4.2%",
    cpa: "$16.80",
    date: "2025-07-01",
    agents: ["✍️", "📱", "🎨"],
  },
  {
    id: 2,
    title: "Premium SaaS onboarding flow",
    outcome: "WIN",
    ctr: "3.8%",
    cpa: "$12.40",
    date: "2025-07-02",
    agents: ["💼", "📊", "✍️"],
  },
  {
    id: 3,
    title: "Holiday flash sale campaign",
    outcome: "LOSS",
    ctr: "1.9%",
    cpa: "$34.20",
    date: "2025-07-03",
    agents: ["📱", "✍️"],
  },
  {
    id: 4,
    title: "B2B lead gen webinar series",
    outcome: "WIN",
    ctr: "5.1%",
    cpa: "$22.10",
    date: "2025-07-04",
    agents: ["🔍", "💼", "🎨"],
  },
  {
    id: 5,
    title: "Gen Z skincare brand awareness",
    outcome: "WIN",
    ctr: "6.7%",
    cpa: "$8.90",
    date: "2025-07-05",
    agents: ["📱", "🎨", "📊"],
  },
  {
    id: 6,
    title: "Enterprise software demo funnel",
    outcome: "WIN",
    ctr: "4.5%",
    cpa: "$45.00",
    date: "2025-07-06",
    agents: ["💼", "🔍", "✍️"],
  },
];

const patterns: Pattern[] = [
  { id: 1, text: "Gen Z prefers hooks in first 1.5s", confidence: 94, dotColor: "bg-[#22C55E]" },
  { id: 2, text: "Email subject lines with numbers +34% open rate", confidence: 91, dotColor: "bg-[#22C55E]" },
  { id: 3, text: "Luxury tone underperforms for <$50 products", confidence: 78, dotColor: "bg-[#F59E0B]" },
  { id: 4, text: "TikTok CTAs at 3s beat 7s by 18%", confidence: 82, dotColor: "bg-[#F59E0B]" },
  { id: 5, text: "'Revolutionary' is a negative signal (-12% CTR)", confidence: 88, dotColor: "bg-[#EF4444]" },
];

const stats: StatCard[] = [
  { label: "Episodic", value: 1247, progress: 84, colorClass: "text-[#9333EA]", barClass: "bg-[#9333EA]" },
  { label: "Semantic", value: 234, progress: 23, colorClass: "text-pink-400", barClass: "bg-pink-400" },
  { label: "Procedural", value: 156, progress: 16, colorClass: "text-red-400", barClass: "bg-gradient-to-r from-red-500 to-red-700" },
];

const filterOptions = ["All", "Wins", "Losses", "Patterns"] as const;
type FilterOption = (typeof filterOptions)[number];

// ─── Components ──────────────────────────────────────────────────────────────

const ProgressBar: React.FC<{ progress: number; barClass: string }> = ({ progress, barClass }) => (
  <div className="w-full h-2 bg-[#21262D] rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${barClass}`}
      style={{ width: `${progress}%` }}
    />
  </div>
);

const StatCardComponent: React.FC<{ stat: StatCard }> = ({ stat }) => (
  <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 hover:border-[#30363D] transition-colors">
    <div className="flex items-center justify-between mb-3">
      <span className="text-[#8B949E] text-sm font-medium">{stat.label}</span>
      <span className={`text-2xl font-bold ${stat.colorClass}`}>{stat.value.toLocaleString()}</span>
    </div>
    <ProgressBar progress={stat.progress} barClass={stat.barClass} />
    <div className="mt-2 text-right text-xs text-[#484F58]">{stat.progress}%</div>
  </div>
);

const MemoryCard: React.FC<{ item: MemoryItem }> = ({ item }) => {
  const isWin = item.outcome === "WIN";

  return (
    <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 hover:border-[#30363D] transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-[#484F58] text-sm font-mono">#{item.id}</span>
          <h3 className="text-[#F0F6FC] font-semibold text-base group-hover:text-[#9333EA] transition-colors">
            {item.title}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            isWin
              ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
              : "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20"
          }`}
        >
          {isWin ? <Trophy size={12} /> : <XCircle size={12} />}
          {item.outcome}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MousePointerClick size={14} className="text-[#484F58]" />
          <div>
            <div className="text-xs text-[#484F58]">CTR</div>
            <div className="text-sm text-[#F0F6FC] font-medium">{item.ctr}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-[#484F58]" />
          <div>
            <div className="text-xs text-[#484F58]">CPA</div>
            <div className="text-sm text-[#F0F6FC] font-medium">{item.cpa}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#484F58]" />
          <div>
            <div className="text-xs text-[#484F58]">Date</div>
            <div className="text-sm text-[#F0F6FC] font-medium">{item.date}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#21262D]">
        <span className="text-xs text-[#484F58] mr-1">Agents:</span>
        <div className="flex gap-2">
          {item.agents.map((agent, idx) => (
            <span
              key={idx}
              className="inline-flex items-center justify-center w-7 h-7 bg-[#161B22] border border-[#21262D] rounded-lg text-sm"
              title={`Agent ${agent}`}
            >
              {agent}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const PatternItem: React.FC<{ pattern: Pattern }> = ({ pattern }) => (
  <div className="flex items-start gap-3 py-3 border-b border-[#21262D] last:border-0">
    <div className={`w-2.5 h-2.5 rounded-full ${pattern.dotColor} mt-1.5 flex-shrink-0`} />
    <div className="flex-1 min-w-0">
      <p className="text-[#F0F6FC] text-sm leading-relaxed">{pattern.text}</p>
      <div className="flex items-center gap-2 mt-1">
        <div className="flex-1 h-1 bg-[#21262D] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9333EA] rounded-full"
            style={{ width: `${pattern.confidence}%` }}
          />
        </div>
        <span className="text-xs text-[#8B949E] font-mono">{pattern.confidence}%</span>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const MemoryBank: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = memoryItems.filter((item) => {
    const matchesFilter =
      activeFilter === "All"
        ? true
        : activeFilter === "Wins"
        ? item.outcome === "WIN"
        : activeFilter === "Losses"
        ? item.outcome === "LOSS"
        : true;
    const matchesSearch = searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ═══════════════════════════════════════════
            SECTION 1: Page Header
        ═══════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 bg-[#9333EA]/10 border border-[#9333EA]/20 rounded-xl">
              <Brain size={20} className="text-[#9333EA]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Memory Bank</h1>
            </div>
            <Database size={16} className="text-[#484F58] ml-1" />
          </div>
          <p className="text-[#8B949E] text-sm ml-[52px]">1,247 episodes of swarm learning</p>

          {/* Search Bar */}
          <div className="mt-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
              <input
                type="text"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161B22] border border-[#21262D] rounded-lg pl-10 pr-16 py-2.5 text-sm text-[#F0F6FC] placeholder:text-[#484F58] focus:outline-none focus:border-[#9333EA] transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#484F58]">
                <Command size={12} />
                <span className="text-xs">K</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-[#161B22] border border-[#21262D] rounded-lg p-1">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeFilter === filter
                      ? "bg-[#9333EA] text-white"
                      : "text-[#8B949E] hover:text-[#F0F6FC]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 2: Memory Analytics
        ═══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCardComponent key={stat.label} stat={stat} />
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            SECTION 3 & 4: Memory Items + Patterns
        ═══════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Memory Items List */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles size={18} className="text-[#9333EA]" />
                Recent Memories
              </h2>
              <span className="text-xs text-[#484F58]">{filteredItems.length} results</span>
            </div>
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <MemoryCard key={item.id} item={item} />
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-[#484F58]">
                  <SearchIcon size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No memories found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Learned Patterns Sidebar */}
          <div className="lg:w-96">
            <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5 sticky top-6">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#22C55E]" />
                Top Learned Patterns
              </h2>
              <p className="text-xs text-[#484F58] mb-4">Insights extracted from swarm intelligence</p>

              <div>
                {patterns.map((pattern) => (
                  <PatternItem key={pattern.id} pattern={pattern} />
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#21262D]">
                <div className="flex items-center justify-between text-xs text-[#484F58]">
                  <span>Confidence Threshold</span>
                  <span className="text-[#8B949E]">&gt; 75%</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span className="text-xs text-[#8B949E]">High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span className="text-xs text-[#8B949E]">Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    <span className="text-xs text-[#8B949E]">Caution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryBank;
