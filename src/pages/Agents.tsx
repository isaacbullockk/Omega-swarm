import { useState, useMemo, useCallback, memo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Zap,
  Brain,
  TrendingUp,
  Send,
  Loader2,
  Sparkles,
  X,
  User,
} from "lucide-react";
import { ChatMessage, ChatEmptyState, TypingIndicator } from "@/components/ChatMessage";
import type { AgentInfo, ChatMessageData } from "@/components/ChatMessage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: "online" | "busy" | "offline";
  role: string;
  personality: string;
  capabilities: string[];
  model: string;
  temperature: number;
}

/* ------------------------------------------------------------------ */
/*  Sub-components (memoized)                                          */
/* ------------------------------------------------------------------ */

const AgentCard = memo(function AgentCard({
  agent,
  selected,
  onClick,
}: {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl p-4 transition-all duration-200"
      style={{
        background: selected ? `${agent.color}15` : "var(--bg-card)",
        border: `1px solid ${selected ? `${agent.color}40` : "var(--border-subtle)"}`,
        boxShadow: selected ? `0 0 20px ${agent.color}15` : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{
            background: `${agent.color}20`,
            border: `1px solid ${agent.color}40`,
          }}
        >
          {agent.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {agent.name}
            </span>
            <span
              className="size-2 rounded-full"
              style={{
                background:
                  agent.status === "online"
                    ? "#22C55E"
                    : agent.status === "busy"
                    ? "#F59E0B"
                    : "#7A6E5F",
              }}
            />
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {agent.role}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: `${agent.color}12`,
              color: agent.color,
              border: `1px solid ${agent.color}20`,
            }}
          >
            {cap}
          </span>
        ))}
      </div>
    </button>
  );
});

const SwarmChat = memo(function SwarmChat({
  messages,
  isTyping,
  currentAgent,
  input,
  setInput,
  onSend,
  onClear,
}: {
  messages: ChatMessageData[];
  isTyping: boolean;
  currentAgent: AgentInfo | null;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onClear: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        height: "calc(100dvh - 180px)",
      }}
    >
      {/* Chat Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-3">
          <Bot className="size-5" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Swarm Chat
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          >
            {messages.length} messages
          </span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <X className="size-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && currentAgent ? (
          <ChatEmptyState agent={currentAgent} />
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              agent={msg.role === "agent" ? currentAgent ?? undefined : undefined}
            />
          ))
        )}
        {isTyping && currentAgent && <TypingIndicator agent={currentAgent} />}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex-1 flex items-center rounded-xl px-4 py-2.5"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <User className="size-4 mr-2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the swarm..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <button
            onClick={onSend}
            disabled={!input.trim() || isTyping}
            className="flex size-10 items-center justify-center rounded-xl transition-all"
            style={{
              background: input.trim() && !isTyping ? "var(--gradient-gold)" : "var(--bg-elevated)",
              color: input.trim() && !isTyping ? "#0C0A09" : "var(--text-muted)",
              cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
            }}
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Agents() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const { data: agents, isLoading } = trpc.agent.list.useQuery();
  const createAgent = trpc.agent.create.useMutation({
    onSuccess: () => {
      // Refetch agents after creation
      window.location.reload();
    },
  });

  /* ---- Memoized filtered agents ---- */
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!search.trim()) return agents;
    const q = search.toLowerCase();
    return agents.filter(
      (a: Agent) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  }, [agents, search]);

  /* ---- Memoized stats ---- */
  const stats = useMemo(() => {
    if (!agents) return { total: 0, online: 0, busy: 0, offline: 0 };
    return {
      total: agents.length,
      online: agents.filter((a: Agent) => a.status === "online").length,
      busy: agents.filter((a: Agent) => a.status === "busy").length,
      offline: agents.filter((a: Agent) => a.status === "offline").length,
    };
  }, [agents]);

  const selectedAgent = useMemo(() => {
    if (!agents || !selectedAgentId) return null;
    return agents.find((a: Agent) => a.id === selectedAgentId) ?? null;
  }, [agents, selectedAgentId]);

  const currentAgentInfo: AgentInfo | null = useMemo(() => {
    if (!selectedAgent) return null;
    return {
      id: selectedAgent.id,
      name: selectedAgent.name,
      emoji: selectedAgent.emoji,
      color: selectedAgent.color,
      status: selectedAgent.status,
      personality: selectedAgent.personality,
      capabilities: selectedAgent.capabilities,
    };
  }, [selectedAgent]);

  const handleSend = useCallback(() => {
    if (!chatInput.trim() || !selectedAgent || isTyping) return;

    const userMsg: ChatMessageData = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        "I understand. Let me analyze that for you...",
        "Great question! Based on my capabilities, here's what I think...",
        "I've processed your request. Here are my insights...",
        "Interesting! Let me break this down...",
      ];
      const response: ChatMessageData = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: responses[Math.floor(Math.random() * responses.length)],
        agentId: selectedAgent.id,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  }, [chatInput, selectedAgent, isTyping]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-elevated)" }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl" style={{ background: "var(--bg-elevated)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              AI Agent Hub
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Manage and chat with your swarm
            </p>
          </div>
          <button
            onClick={() => createAgent.mutate({ name: "New Agent", role: "assistant" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:brightness-110"
            style={{
              background: "var(--gradient-gold)",
              color: "#0C0A09",
            }}
          >
            <Sparkles className="size-4" />
            Create Agent
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up stagger-1">
          {[
            { label: "Total Agents", value: stats.total, icon: <Bot className="size-4" />, color: "var(--accent-primary)" },
            { label: "Online", value: stats.online, icon: <Zap className="size-4" />, color: "#22C55E" },
            { label: "Busy", value: stats.busy, icon: <Brain className="size-4" />, color: "#F59E0B" },
            { label: "Offline", value: stats.offline, icon: <TrendingUp className="size-4" />, color: "#7A6E5F" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2" style={{ color: stat.color }}>
                {stat.icon}
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search + Grid */}
        <div className="animate-fade-up stagger-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-xl px-4 py-3 text-sm mb-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent: Agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgentId === agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
              />
            ))}
            {filteredAgents.length === 0 && (
              <div
                className="col-span-full rounded-2xl p-12 text-center"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
              >
                <Bot className="size-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No agents found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Swarm Chat */}
        {selectedAgent && currentAgentInfo && (
          <div className="animate-fade-up stagger-3">
            <SwarmChat
              messages={messages}
              isTyping={isTyping}
              currentAgent={currentAgentInfo}
              input={chatInput}
              setInput={setChatInput}
              onSend={handleSend}
              onClear={handleClear}
            />
          </div>
        )}
      </div>
    </div>
  );
}
