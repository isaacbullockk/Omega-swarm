import { Dna } from "lucide-react";

// --- Types ---

interface WinRatePoint {
  week: string;
  rate: number;
}

interface ImprovementCard {
  id: string;
  title: string;
  description: string;
  direction: "up" | "down";
  confidence: number;
}

interface AgentRow {
  id: string;
  name: string;
  winRate: number;
  tasks: number;
  improvement: number;
  trend: number[];
  color: string;
}

// --- Main Page Component ---

export default function Evolution() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC]">
      {/* Section 1: Page Header */}
      <div className="px-6 py-6 border-b border-[#21262D]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#9333EA]/10 border border-[#9333EA]/20 flex items-center justify-center">
            <Dna className="w-5 h-5 text-[#9333EA]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F0F6FC]">
              Swarm Evolution
            </h1>
            <p className="text-sm text-[#8B949E]">
              Win rates, learned patterns, and performance trends
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-[#9333EA]/10 border border-[#9333EA]/20 flex items-center justify-center mb-6">
            <Dna className="w-8 h-8 text-[#9333EA] opacity-50" />
          </div>
          <p className="text-lg font-semibold text-[#F0F6FC]">
            No evolution data yet
          </p>
          <p className="text-sm text-[#8B949E] mt-2">
            Run campaigns to track performance
          </p>
        </div>
      </div>
    </div>
  );
}
