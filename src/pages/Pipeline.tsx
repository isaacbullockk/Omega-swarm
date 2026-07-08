import { useState } from "react";
import {
  Layout,
  List,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  MoreHorizontal,
  Download,
  Trash2,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TaskStatus = "queued" | "in-progress" | "review" | "completed" | "failed";

interface Task {
  id: string;
  title: string;
  agent: string;
  agentColor: string;
  status: TaskStatus;
  progress?: number;
  timestamp: string;
  detail?: string;
}

interface ColumnConfig {
  id: TaskStatus;
  label: string;
  borderColor: string;
  indicatorColor: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
}

const columns: ColumnConfig[] = [
  {
    id: "queued",
    label: "QUEUED",
    borderColor: "border-[#484F58]",
    indicatorColor: "bg-[#484F58]",
    badgeVariant: "secondary",
  },
  {
    id: "in-progress",
    label: "IN PROGRESS",
    borderColor: "border-[#F59E0B]",
    indicatorColor: "bg-[#F59E0B]",
    badgeVariant: "outline",
  },
  {
    id: "review",
    label: "REVIEW",
    borderColor: "border-[#3B82F6]",
    indicatorColor: "bg-[#3B82F6]",
    badgeVariant: "default",
  },
  {
    id: "completed",
    label: "COMPLETED",
    borderColor: "border-[#22C55E]",
    indicatorColor: "bg-[#22C55E]",
    badgeVariant: "outline",
  },
  {
    id: "failed",
    label: "FAILED",
    borderColor: "border-[#EF4444]",
    indicatorColor: "bg-[#EF4444]",
    badgeVariant: "destructive",
  },
];

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Concept campaign theme",
    agent: "Creative Director",
    agentColor: "#9333EA",
    status: "queued",
    timestamp: "10m ago",
  },
  {
    id: "2",
    title: "Generate SEO keyword report",
    agent: "SEO Strategist",
    agentColor: "#3B82F6",
    status: "queued",
    timestamp: "25m ago",
  },
  {
    id: "3",
    title: "Set up privacy compliance check",
    agent: "Privacy Agent",
    agentColor: "#22C55E",
    status: "queued",
    timestamp: "1h ago",
  },
  {
    id: "4",
    title: "Draft campaign copy",
    agent: "Copywriter GPT",
    agentColor: "#F59E0B",
    status: "in-progress",
    progress: 73,
    timestamp: "Running",
    detail: "73%",
  },
  {
    id: "5",
    title: "Build sales funnel",
    agent: "Sales Closer",
    agentColor: "#EF4444",
    status: "in-progress",
    progress: 45,
    timestamp: "Running",
    detail: "45%",
  },
  {
    id: "6",
    title: "Competitor intel scan",
    agent: "Sentinel",
    agentColor: "#8B949E",
    status: "in-progress",
    progress: 60,
    timestamp: "Running",
    detail: "60%",
  },
  {
    id: "7",
    title: "Social content calendar",
    agent: "Social Media Agent",
    agentColor: "#9333EA",
    status: "review",
    timestamp: "Done",
    detail: "12 posts generated",
  },
  {
    id: "8",
    title: "Cross-device strategy",
    agent: "Ambient Agent",
    agentColor: "#3B82F6",
    status: "review",
    timestamp: "Done",
    detail: "3 campaigns mapped",
  },
  {
    id: "9",
    title: "Analyze campaign metrics",
    agent: "Data Analyst",
    agentColor: "#22C55E",
    status: "completed",
    timestamp: "Done",
    detail: "47 insights found",
  },
  {
    id: "10",
    title: "GEO content optimization",
    agent: "GEO Agent",
    agentColor: "#F59E0B",
    status: "completed",
    timestamp: "Done",
    detail: "52 citations earned",
  },
  {
    id: "11",
    title: "RL budget allocation",
    agent: "Budget RL",
    agentColor: "#EF4444",
    status: "completed",
    timestamp: "Done",
    detail: "+34% ROAS",
  },
  {
    id: "12",
    title: "Generate video storyboard",
    agent: "Creative Director",
    agentColor: "#9333EA",
    status: "failed",
    timestamp: "Failed",
    detail: "API timeout",
  },
];

const statusIcon = (status: TaskStatus) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />;
    case "failed":
      return <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
    case "in-progress":
      return <Loader2 className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />;
    case "review":
      return <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-[#484F58]" />;
  }
};

const statusLabel = (status: TaskStatus) => {
  switch (status) {
    case "completed":
      return "Done";
    case "failed":
      return "Failed";
    case "in-progress":
      return "Running";
    case "review":
      return "Done";
    default:
      return "Queued";
  }
};

export default function Pipeline() {
  const [view, setView] = useState<"board" | "list">("board");
  const [tasks] = useState<Task[]>(initialTasks);

  const tasksByColumn = (colId: TaskStatus) =>
    tasks.filter((t) => t.status === colId);

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30";
      case "failed":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30";
      case "in-progress":
        return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30";
      case "review":
        return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30";
      default:
        return "bg-[#484F58]/10 text-[#8B949E] border-[#484F58]/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F0F6FC]">
      {/* Section 1: Page Header */}
      <div className="px-6 py-6 border-b border-[#21262D]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#9333EA]/10 border border-[#9333EA]/20 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-[#9333EA]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F0F6FC]">
                Execution Pipeline
              </h1>
              <p className="text-sm text-[#8B949E]">
                Active and completed campaign tasks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-[#161B22] rounded-lg border border-[#21262D] p-0.5">
              <button
                onClick={() => setView("board")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "board"
                    ? "bg-[#9333EA] text-white"
                    : "text-[#8B949E] hover:text-[#F0F6FC]"
                }`}
              >
                <Layout className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === "list"
                    ? "bg-[#9333EA] text-white"
                    : "text-[#8B949E] hover:text-[#F0F6FC]"
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="border-[#21262D] bg-[#161B22] text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#21262D] bg-[#161B22] text-[#8B949E] hover:bg-[#21262D] hover:text-[#F0F6FC]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Section 2: Kanban Board View */}
      {view === "board" && (
        <div className="px-6 py-6">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map((col) => (
              <div
                key={col.id}
                className={`flex-shrink-0 w-72 rounded-lg border-t-4 ${col.borderColor} bg-[#0D1117] border border-[#21262D]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#21262D]">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${col.indicatorColor} ${col.id === "in-progress" ? "animate-pulse" : ""}`}
                    />
                    <span className="text-xs font-semibold tracking-wider text-[#8B949E]">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#484F58] font-medium">
                    {tasksByColumn(col.id).length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="p-3 space-y-3">
                  {tasksByColumn(col.id).map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#161B22] rounded-lg border border-[#21262D] p-4 hover:border-[#30363D] transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-medium text-[#F0F6FC] leading-snug">
                          {task.title}
                        </h3>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#484F58] hover:text-[#8B949E]">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Agent */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.agentColor }}
                        />
                        <span className="text-xs text-[#8B949E]">
                          {task.agent}
                        </span>
                      </div>

                      {/* Status Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(task.status)}
                          <span className="text-xs text-[#8B949E]">
                            {statusLabel(task.status)}
                          </span>
                        </div>
                        {task.detail && (
                          <span className="text-xs text-[#484F58]">
                            {task.detail}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {task.progress !== undefined && (
                        <div className="mt-2">
                          <Progress
                            value={task.progress}
                            className="h-1.5 bg-[#21262D]"
                          />
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-2 text-xs text-[#484F58]">
                        {task.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: List View */}
      {view === "list" && (
        <div className="px-6 py-6">
          <div className="rounded-lg border border-[#21262D] bg-[#0D1117] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#21262D] hover:bg-transparent">
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                    Task
                  </TableHead>
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                    Agent
                  </TableHead>
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                    Progress
                  </TableHead>
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider">
                    Started
                  </TableHead>
                  <TableHead className="text-[#8B949E] font-medium text-xs uppercase tracking-wider text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="border-[#21262D] hover:bg-[#161B22] transition-colors"
                  >
                    <TableCell className="py-3">
                      <span className="text-sm font-medium text-[#F0F6FC]">
                        {task.title}
                      </span>
                      {task.detail && (
                        <span className="block text-xs text-[#484F58] mt-0.5">
                          {task.detail}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.agentColor }}
                        />
                        <span className="text-sm text-[#8B949E]">
                          {task.agent}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`${getStatusBadgeClass(task.status)} text-xs font-medium`}
                      >
                        {statusIcon(task.status)}
                        <span className="ml-1">{statusLabel(task.status)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      {task.progress !== undefined ? (
                        <div className="flex items-center gap-2 w-32">
                          <Progress
                            value={task.progress}
                            className="h-1.5 bg-[#21262D] flex-1"
                          />
                          <span className="text-xs text-[#8B949E] w-8 text-right">
                            {task.progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#484F58]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-[#8B949E]">
                        {task.timestamp}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <button className="text-[#484F58] hover:text-[#8B949E] transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
