import { useState, useCallback } from "react";
import { Copy, Check, Bot, User } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Local Agent type (avoids circular import with Agents.tsx)          */
/* ------------------------------------------------------------------ */

export interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: string;
  personality: string;
  capabilities: string[];
}

export interface ChatMessageData {
  id: string;
  role: "user" | "agent";
  content: string;
  agentId?: string;
  timestamp: Date;
}

/* ------------------------------------------------------------------ */
/*  Markdown-like renderer (lightweight)                              */
/* ------------------------------------------------------------------ */

function renderContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      nodes.push(
        <ul key={`list-${nodes.length}`} className="my-2 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={idx} className="mt-3 mb-1 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2 key={idx} className="mt-4 mb-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      nodes.push(
        <h1 key={idx} className="mt-4 mb-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="mt-1.5 shrink-0 size-1.5 rounded-full" style={{ background: "var(--accent-primary)" }} />
          <span>{parseInline(trimmed.slice(2))}</span>
        </li>
      );
      return;
    }

    const numMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (numMatch) {
      inList = true;
      listItems.push(
        <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="mt-0.5 shrink-0 text-xs font-mono" style={{ color: "var(--accent-primary)" }}>
            {trimmed.match(/^\d+/)?.[0]}.
          </span>
          <span>{parseInline(numMatch[1])}</span>
        </li>
      );
      return;
    }

    flushList();
    nodes.push(
      <p key={idx} className="mb-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {parseInline(trimmed)}
      </p>
    );
  });

  flushList();
  return nodes;
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;

  let lastIndex = 0;
  const combinedRegex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];
    if (matched.startsWith("***") && matched.endsWith("***")) {
      parts.push(<strong key={key++} className="italic" style={{ color: "var(--text-primary)" }}>{matched.slice(3, -3)}</strong>);
    } else if (matched.startsWith("**") && matched.endsWith("**")) {
      parts.push(<strong key={key++} style={{ color: "var(--text-primary)" }}>{matched.slice(2, -2)}</strong>);
    } else if (matched.startsWith("*") && matched.endsWith("*") && matched.length > 2) {
      parts.push(<em key={key++} style={{ color: "var(--text-accent)" }}>{matched.slice(1, -1)}</em>);
    } else if (matched.startsWith("`") && matched.endsWith("`")) {
      parts.push(<code key={key++} className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--bg-elevated)", color: "var(--accent-primary)" }}>{matched.slice(1, -1)}</code>);
    } else {
      parts.push(matched);
    }

    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                    */
/* ------------------------------------------------------------------ */

export function TypingIndicator({ agent }: { agent?: AgentInfo }) {
  return (
    <div className="flex gap-3 animate-fade-up">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{
          background: agent ? `${agent.color}20` : "var(--bg-elevated)",
          border: `1.5px solid ${agent ? `${agent.color}40` : "var(--border-subtle)"}`,
        }}
      >
        <Bot className="size-4" style={{ color: agent?.color || "var(--text-muted)" }} />
      </div>
      <div className="flex flex-col gap-1">
        {agent && (
          <span className="text-xs font-semibold" style={{ color: agent.color }}>
            {agent.name} is typing
          </span>
        )}
        <div
          className="flex items-center gap-1.5 px-4 py-3"
          style={{
            background: "var(--bg-card)",
            borderLeft: `3px solid ${agent?.color || "var(--accent-primary)"}`,
            borderRadius: "4px 16px 16px 16px",
          }}
        >
          <span className="size-2 animate-bounce rounded-full" style={{ background: agent?.color || "var(--accent-primary)", animationDelay: "0ms" }} />
          <span className="size-2 animate-bounce rounded-full" style={{ background: agent?.color || "var(--accent-primary)", animationDelay: "150ms" }} />
          <span className="size-2 animate-bounce rounded-full" style={{ background: agent?.color || "var(--accent-primary)", animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Message Bubble                                               */
/* ------------------------------------------------------------------ */

interface ChatMessageProps {
  message: ChatMessageData;
  agent?: AgentInfo;
}

export function ChatMessage({ message, agent }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="flex max-w-[85%] flex-col items-end gap-1.5 md:max-w-[70%]">
          <div className="flex items-end gap-2">
            <div
              className="px-4 py-3 shadow-lg"
              style={{
                background: "var(--gradient-gold)",
                borderRadius: "16px 16px 4px 16px",
                color: "#0C0A09",
                fontSize: 14,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              {message.content}
            </div>
            <div
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <User className="size-3.5" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
            {timeStr}
          </span>
        </div>
      </div>
    );
  }

  const agentData = agent;
  if (!agentData) return null;

  return (
    <div className="flex gap-3 animate-fade-up">
      {/* Agent Avatar with Glow */}
      <div className="relative shrink-0">
        <div
          className="flex size-9 items-center justify-center rounded-full text-base"
          style={{
            background: `${agentData.color}18`,
            border: `2px solid ${agentData.color}50`,
            boxShadow: `0 0 12px ${agentData.color}25`,
          }}
        >
          {agentData.emoji}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2"
          style={{
            background: agentData.status === "online" ? "#22C55E" : agentData.status === "busy" ? "#F59E0B" : "#7A6E5F",
            borderColor: "var(--bg-base)",
          }}
        />
      </div>

      {/* Message Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Name + Time */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: agentData.color }}>
            {agentData.name}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {timeStr}
          </span>
        </div>

        {/* Bubble */}
        <div
          className="group relative px-4 py-3"
          style={{
            background: "var(--bg-card)",
            borderLeft: `3px solid ${agentData.color}`,
            borderRadius: "4px 16px 16px 16px",
            border: `1px solid ${agentData.color}15`,
            borderLeftWidth: 3,
          }}
        >
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ color: "var(--text-muted)" }}
            title="Copy message"
          >
            {copied ? <Check className="size-3.5" style={{ color: "#84CC16" }} /> : <Copy className="size-3.5" />}
          </button>

          <div className="pr-6">
            {renderContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                       */
/* ------------------------------------------------------------------ */

export function ChatEmptyState({ agent }: { agent: AgentInfo }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <div
        className="flex size-16 items-center justify-center rounded-2xl text-3xl"
        style={{
          background: `${agent.color}15`,
          border: `2px solid ${agent.color}30`,
          boxShadow: `0 0 30px ${agent.color}15`,
        }}
      >
        {agent.emoji}
      </div>
      <div className="text-center">
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {agent.name}
        </h3>
        <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--text-muted)" }}>
          {agent.personality}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {agent.capabilities.slice(0, 4).map((cap) => (
          <span
            key={cap}
            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
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
    </div>
  );
}
