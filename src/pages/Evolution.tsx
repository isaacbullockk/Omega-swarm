import {
  TrendingUp,
  TrendingDown,
  Dna,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";

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

// --- Data ---

const winRateData: WinRatePoint[] = [
  { week: "Week 1", rate: 42 },
  { week: "Week 2", rate: 48 },
  { week: "Week 3", rate: 51 },
  { week: "Week 4", rate: 58 },
  { week: "Week 5", rate: 62 },
  { week: "Week 6", rate: 67 },
  { week: "Week 7", rate: 71 },
  { week: "Week 8", rate: 73 },
  { week: "Now", rate: 78.2 },
];

const improvements: ImprovementCard[] = [
  {
    id: "1",
    title: "Hook Timing",
    description: "Evolved from 3s \u2192 1.5s hooks. +18% retention.",
    direction: "up",
    confidence: 94,
  },
  {
    id: "2",
    title: "CTA Placement",
    description: "Mid-content CTAs outperform end-CTAs by 12%.",
    direction: "up",
    confidence: 91,
  },
  {
    id: "3",
    title: "Social Proof Density",
    description: "3 testimonials per page is optimal. 4+ = diminishing.",
    direction: "up",
    confidence: 88,
  },
  {
    id: "4",
    title: '"Revolutionary" Word',
    description: "Pruned from vocabulary. -12% CTR when present.",
    direction: "down",
    confidence: 85,
  },
];

const agents: AgentRow[] = [
  {
    id: "a1",
    name: "Creative Director",
    winRate: 94,
    tasks: 142,
    improvement: 28,
    trend: [68, 72, 75, 80, 84, 88, 91, 94],
    color: "#9333EA",
  },
  {
    id: "a2",
    name: "Copywriter GPT",
    winRate: 91,
    tasks: 198,
    improvement: 32,
    trend: [58, 64, 68, 74, 78, 84, 88, 91],
    color: "#3B82F6",
  },
  {
    id: "a3",
    name: "SEO Strategist",
    winRate: 88,
    tasks: 156,
    improvement: 24,
    trend: [64, 66, 70, 74, 78, 82, 86, 88],
    color: "#22C55E",
  },
  {
    id: "a4",
    name: "Data Analyst",
    winRate: 86,
    tasks: 134,
    improvement: 19,
    trend: [68, 70, 72, 76, 78, 82, 84, 86],
    color: "#F59E0B",
  },
  {
    id: "a5",
    name: "Sales Closer",
    winRate: 82,
    tasks: 178,
    improvement: 22,
    trend: [58, 62, 66, 70, 74, 76, 80, 82],
    color: "#EF4444",
  },
  {
    id: "a6",
    name: "Sentinel",
    winRate: 79,
    tasks: 112,
    improvement: 18,
    trend: [60, 62, 64, 68, 72, 74, 77, 79],
    color: "#8B949E",
  },
  {
    id: "a7",
    name: "Social Media Agent",
    winRate: 76,
    tasks: 165,
    improvement: 15,
    trend: [56, 58, 62, 66, 68, 72, 74, 76],
    color: "#9333EA",
  },
  {
    id: "a8",
    name: "GEO Agent",
    winRate: 74,
    tasks: 98,
    improvement: 20,
    trend: [52, 54, 58, 62, 66, 70, 72, 74],
    color: "#3B82F6",
  },
  {
    id: "a9",
    name: "Ambient Agent",
    winRate: 71,
    tasks: 87,
    improvement: 14,
    trend: [52, 54, 58, 60, 64, 66, 69, 71],
    color: "#22C55E",
  },
  {
    id: "a10",
    name: "Budget RL",
    winRate: 68,
    tasks: 124,
    improvement: 16,
    trend: [48, 50, 54, 58, 60, 64, 66, 68],
    color: "#F59E0B",
  },
  {
    id: "a11",
    name: "Privacy Agent",
    winRate: 66,
    tasks: 76,
    improvement: 10,
    trend: [50, 52, 54, 58, 60, 62, 64, 66],
    color: "#EF4444",
  },
  {
    id: "a12",
    name: "RL Optimizer",
    winRate: 65,
    tasks: 92,
    improvement: 12,
    trend: [48, 50, 52, 56, 58, 60, 63, 65],
    color: "#8B949E",
  },
];

// --- Components ---

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ v, i }));
  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WinRateGauge({ value }: { value: number }) {
  const radius = 80;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Decorative outer ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[#21262D] scale-125" />
        <div className="absolute inset-0 rounded-full border border-[#21262D]/50 scale-110" />

        <svg
          height={radius * 2}
          width={radius * 2}
          className="rotate-[-90deg]"
        >
          {/* Background track */}
          <circle
            stroke="#21262D"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress arc */}
          <circle
            stroke="#9333EA"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]"
          />
          {/* Subtle gradient overlay ring */}
          <circle
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity={0.3}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#7E22CE" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#9333EA]">{value}%</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm font-medium text-[#F0F6FC]">Current Win Rate</p>
        <p className="text-xs text-[#8B949E] mt-1">+36% from week 1</p>
      </div>
    </div>
  );
}

// Custom tooltip for the area chart
interface TooltipPayloadItem {
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#8B949E] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[#9333EA]">
        {payload[0].value}%
      </p>
    </div>
  );
}

// --- Main Page Component ---

export default function Evolution() {
  const currentWinRate = 78.2;

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

      <div className="px-6 py-6 space-y-6">
        {/* Section 2: Win Rate Gauge */}
        <div className="flex justify-center">
          <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-8 w-full max-w-sm flex flex-col items-center">
            <WinRateGauge value={currentWinRate} />
          </div>
        </div>

        {/* Section 3: Evolution Chart */}
        <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-[#F0F6FC]">
                Win Rate Evolution
              </h2>
              <p className="text-xs text-[#8B949E] mt-0.5">
                8-week progression with trend trajectory
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30 text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              +36%
            </Badge>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={winRateData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="winRateGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#9333EA" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#9333EA"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  stroke="#484F58"
                  tick={{ fill: "#8B949E", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#21262D" }}
                />
                <YAxis
                  stroke="#484F58"
                  tick={{ fill: "#8B949E", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "#21262D" }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Trend line */}
                <ReferenceLine
                  y={73}
                  stroke="#22C55E"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: "Trend",
                    position: "right",
                    fill: "#22C55E",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#9333EA"
                  strokeWidth={2.5}
                  fill="url(#winRateGradient)"
                  dot={{
                    r: 4,
                    fill: "#0A0A0F",
                    stroke: "#9333EA",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#9333EA",
                    stroke: "#0A0A0F",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4: Genetic Improvements Cards */}
        <div>
          <h2 className="text-sm font-semibold text-[#F0F6FC] mb-4">
            Genetic Improvements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {improvements.map((item) => (
              <div
                key={item.id}
                className="bg-[#161B22] border border-[#21262D] rounded-lg p-4 hover:border-[#30363D] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.direction === "up"
                        ? "bg-[#22C55E]/10"
                        : "bg-[#EF4444]/10"
                    }`}
                  >
                    {item.direction === "up" ? (
                      <TrendingUp className="w-4 h-4 text-[#22C55E]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-[#9333EA]/10 text-[#9333EA] border-[#9333EA]/20"
                  >
                    {item.confidence}% conf
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-[#F0F6FC] mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Agent Performance Table */}
        <div className="bg-[#0D1117] border border-[#21262D] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#21262D]">
            <h2 className="text-sm font-semibold text-[#F0F6FC]">
              Agent Performance
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Individual agent win rates and 8-week trends
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-[#21262D] hover:bg-transparent">
                <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider w-48">
                  Agent
                </TableHead>
                <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                  Win Rate
                </TableHead>
                <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                  Tasks
                </TableHead>
                <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                  Improvement
                </TableHead>
                <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider text-right">
                  Trend (8wk)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const winColor =
                  agent.winRate >= 80
                    ? "text-[#22C55E]"
                    : agent.winRate >= 60
                      ? "text-[#F59E0B]"
                      : "text-[#EF4444]";

                const winBadgeBg =
                  agent.winRate >= 80
                    ? "bg-[#22C55E]/10 border-[#22C55E]/30"
                    : agent.winRate >= 60
                      ? "bg-[#F59E0B]/10 border-[#F59E0B]/30"
                      : "bg-[#EF4444]/10 border-[#EF4444]/30";

                return (
                  <TableRow
                    key={agent.id}
                    className="border-[#21262D] hover:bg-[#161B22] transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: agent.color }}
                        />
                        <span className="text-sm font-medium text-[#F0F6FC]">
                          {agent.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`${winBadgeBg} ${winColor} text-xs font-semibold`}
                      >
                        {agent.winRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-[#8B949E]">
                        {agent.tasks}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-[#22C55E]">
                        +{agent.improvement}%
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end">
                        <MiniSparkline
                          data={agent.trend}
                          color={agent.color}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
