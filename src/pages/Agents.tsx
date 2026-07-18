import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Send,
  Paperclip,
  Pin,
  Trash2,
  PanelRightOpen,
  PanelRightClose,
  X,
  MessageSquare,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  Bot,
  ChevronRight,
} from "lucide-react";

/* =================================================================== */
/*  TYPES                                                               */
/* =================================================================== */

interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  glowColor: string;
  status: "online" | "busy" | "offline";
  personality: string;
  capabilities: string[];
  tasksCompleted: number;
  avgResponseTime: string;
  successRate: string;
  recentChats: { title: string; time: string }[];
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  agentId?: string;
  timestamp: Date;
}

/* =================================================================== */
/*  AGENT DATA — 12 Specialized Agents                                  */
/* =================================================================== */

const AGENTS: Agent[] = [
  {
    id: "maya",
    name: "Maya",
    role: "Copywriter",
    emoji: "✍️",
    color: "#F59E0B",
    glowColor: "rgba(245,158,11,0.3)",
    status: "online",
    personality: "Warm, persuasive, loves storytelling",
    capabilities: ["Blog Writing", "Product Descriptions", "Email Sequences", "Ad Copy", "Landing Pages"],
    tasksCompleted: 1847,
    avgResponseTime: "1.2s",
    successRate: "94%",
    recentChats: [
      { title: "Q2 Blog Series", time: "2h ago" },
      { title: "Email Campaign Copy", time: "5h ago" },
      { title: "Product Launch Ad", time: "1d ago" },
    ],
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Social Media",
    emoji: "📱",
    color: "#EC4899",
    glowColor: "rgba(236,72,153,0.3)",
    status: "online",
    personality: "Trendy, fast-paced, emoji enthusiast",
    capabilities: ["Viral Content", "Social Calendars", "Hashtag Strategy", "Engagement Boost", "Trend Jacking"],
    tasksCompleted: 2315,
    avgResponseTime: "0.8s",
    successRate: "92%",
    recentChats: [
      { title: "TikTok Script Writing", time: "30m ago" },
      { title: "Instagram Carousel", time: "3h ago" },
      { title: "Twitter Thread", time: "6h ago" },
    ],
  },
  {
    id: "ace",
    name: "Ace",
    role: "Sales",
    emoji: "💰",
    color: "#EF4444",
    glowColor: "rgba(239,68,68,0.3)",
    status: "busy",
    personality: "Confident, data-driven, closers-only",
    capabilities: ["Funnel Building", "Objection Handling", "Upsell Sequences", "Lead Qualification", "Deal Closing"],
    tasksCompleted: 1562,
    avgResponseTime: "1.5s",
    successRate: "97%",
    recentChats: [
      { title: "Sales Funnel V3", time: "1h ago" },
      { title: "Email Outreach", time: "4h ago" },
      { title: "Lead Scoring Model", time: "8h ago" },
    ],
  },
  {
    id: "vision",
    name: "Vision",
    role: "Creative Director",
    emoji: "🎨",
    color: "#A855F7",
    glowColor: "rgba(168,85,247,0.3)",
    status: "online",
    personality: "Artistic, visionary, perfectionist",
    capabilities: ["Brand Identity", "Visual Direction", "Campaign Themes", "Art Direction", "Style Guides"],
    tasksCompleted: 982,
    avgResponseTime: "2.1s",
    successRate: "93%",
    recentChats: [
      { title: "Brand Refresh", time: "3h ago" },
      { title: "Q2 Campaign Theme", time: "7h ago" },
      { title: "Logo Concepts", time: "1d ago" },
    ],
  },
  {
    id: "scout",
    name: "Scout",
    role: "SEO",
    emoji: "🔍",
    color: "#84CC16",
    glowColor: "rgba(132,204,22,0.3)",
    status: "online",
    personality: "Methodical, detail-oriented, patient",
    capabilities: ["Keyword Research", "Technical SEO", "Content Optimization", "Link Building", "Rank Tracking"],
    tasksCompleted: 2156,
    avgResponseTime: "3.4s",
    successRate: "90%",
    recentChats: [
      { title: "Keyword Clustering", time: "1h ago" },
      { title: "Site Audit", time: "5h ago" },
      { title: "Backlink Analysis", time: "12h ago" },
    ],
  },
  {
    id: "nexus",
    name: "Nexus",
    role: "Analytics",
    emoji: "📊",
    color: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    status: "online",
    personality: "Precise, loves numbers, speaks in insights",
    capabilities: ["Data Analysis", "KPI Dashboards", "Attribution Models", "Funnel Analytics", "Reporting"],
    tasksCompleted: 3102,
    avgResponseTime: "1.8s",
    successRate: "97%",
    recentChats: [
      { title: "Q1 Attribution Report", time: "30m ago" },
      { title: "Funnel Drop-off Analysis", time: "2h ago" },
      { title: "Revenue Dashboard", time: "6h ago" },
    ],
  },
  {
    id: "guardian",
    name: "Guardian",
    role: "Sentinel",
    emoji: "🛡️",
    color: "#3B82F6",
    glowColor: "rgba(59,130,246,0.3)",
    status: "online",
    personality: "Protective, alert, security-focused",
    capabilities: ["Threat Monitoring", "Brand Protection", "Competitor Intel", "Sentiment Tracking", "Risk Alerts"],
    tasksCompleted: 4521,
    avgResponseTime: "0.4s",
    successRate: "98%",
    recentChats: [
      { title: "Competitor Price Alert", time: "15m ago" },
      { title: "Brand Sentiment Report", time: "2h ago" },
      { title: "Security Audit", time: "1d ago" },
    ],
  },
  {
    id: "terra",
    name: "Terra",
    role: "GEO",
    emoji: "🌍",
    color: "#14B8A6",
    glowColor: "rgba(20,184,166,0.3)",
    status: "offline",
    personality: "Global-minded, location-aware, multilingual",
    capabilities: ["Local SEO", "Map Optimization", "Multi-language", "Regional Strategy", "Citation Building"],
    tasksCompleted: 876,
    avgResponseTime: "4.2s",
    successRate: "88%",
    recentChats: [
      { title: "Local Citation Cleanup", time: "2d ago" },
      { title: "Google Business Profile", time: "3d ago" },
      { title: "Multi-language Keywords", time: "4d ago" },
    ],
  },
  {
    id: "vault",
    name: "Vault",
    role: "Privacy",
    emoji: "🔒",
    color: "#6366F1",
    glowColor: "rgba(99,102,241,0.3)",
    status: "online",
    personality: "Stern, privacy-obsessed, compliant",
    capabilities: ["GDPR Compliance", "Data Policy", "Consent Management", "Privacy Audits", "Zero-party Data"],
    tasksCompleted: 1234,
    avgResponseTime: "0.6s",
    successRate: "99%",
    recentChats: [
      { title: "GDPR Compliance Scan", time: "1h ago" },
      { title: "Cookie Consent Update", time: "5h ago" },
      { title: "Privacy Framework v2", time: "1d ago" },
    ],
  },
  {
    id: "aura",
    name: "Aura",
    role: "Ambient",
    emoji: "🌸",
    color: "#D946EF",
    glowColor: "rgba(217,70,239,0.3)",
    status: "online",
    personality: "Calm, atmospheric, vibe-curator",
    capabilities: ["Mood Setting", "Theme Curation", "Atmosphere Design", "Brand Vibe", "Sensory Marketing"],
    tasksCompleted: 543,
    avgResponseTime: "5.1s",
    successRate: "86%",
    recentChats: [
      { title: "Brand Atmosphere Guide", time: "4h ago" },
      { title: "Seasonal Theme", time: "8h ago" },
      { title: "Vibe Audit", time: "2d ago" },
    ],
  },
  {
    id: "ledger",
    name: "Ledger",
    role: "Budget RL",
    emoji: "💹",
    color: "#22C55E",
    glowColor: "rgba(34,197,94,0.3)",
    status: "busy",
    personality: "Frugal, strategic, ROI-focused",
    capabilities: ["Budget Allocation", "ROI Optimization", "Spend Tracking", "Revenue Modeling", "Cost Analysis"],
    tasksCompleted: 1890,
    avgResponseTime: "0.9s",
    successRate: "96%",
    recentChats: [
      { title: "Budget Reallocation", time: "30m ago" },
      { title: "ROAS Model Update", time: "3h ago" },
      { title: "Cross-channel Spend", time: "7h ago" },
    ],
  },
  {
    id: "prime",
    name: "Prime",
    role: "Orchestrator",
    emoji: "🧠",
    color: "#F59E0B",
    glowColor: "rgba(245,158,11,0.4)",
    status: "online",
    personality: "Wise, commanding, coordinates the swarm",
    capabilities: ["Swarm Coordination", "Task Routing", "Conflict Resolution", "Strategy Planning", "Agent Management"],
    tasksCompleted: 5678,
    avgResponseTime: "0.1s",
    successRate: "100%",
    recentChats: [
      { title: "Swarm Topology", time: "10m ago" },
      { title: "Mission Queue", time: "1h ago" },
      { title: "Agent Conflict Resolution", time: "3h ago" },
    ],
  },
];

/* =================================================================== */
/*  AUTO-ROUTING KEYWORDS                                               */
/* =================================================================== */

const ROUTING_MAP: { keywords: string[]; agentId: string }[] = [
  { keywords: ["write", "copy", "blog", "email", "ad", "text", "draft"], agentId: "maya" },
  { keywords: ["social", "instagram", "twitter", "post", "viral", "tiktok", "media"], agentId: "pulse" },
  { keywords: ["sales", "funnel", "lead", "deal", "conversion", "outreach", "pitch"], agentId: "ace" },
  { keywords: ["design", "brand", "visual", "creative", "aesthetic", "logo"], agentId: "vision" },
  { keywords: ["seo", "keyword", "rank", "search", "google", "backlink", "optimize"], agentId: "scout" },
  { keywords: ["analytics", "data", "report", "metric", "kpi", "dashboard"], agentId: "nexus" },
  { keywords: ["security", "protect", "threat", "monitor", "competitor", "sentiment"], agentId: "guardian" },
  { keywords: ["global", "location", "local", "map", "region", "geo"], agentId: "terra" },
  { keywords: ["privacy", "compliance", "gdpr", "data policy", "consent"], agentId: "vault" },
  { keywords: ["mood", "theme", "atmosphere", "aesthetic", "vibe"], agentId: "aura" },
  { keywords: ["budget", "cost", "spend", "roi", "allocate", "revenue"], agentId: "ledger" },
  { keywords: ["coordinate", "all agents", "everyone", "swarm", "orchestrate"], agentId: "prime" },
];

function detectAgent(message: string): Agent | null {
  const lower = message.toLowerCase();
  for (const route of ROUTING_MAP) {
    if (route.keywords.some((kw) => lower.includes(kw))) {
      const agent = AGENTS.find((a) => a.id === route.agentId);
      if (agent) return agent;
    }
  }
  return null;
}

/* =================================================================== */
/*  WELCOME MESSAGES                                                    */
/* =================================================================== */

function getWelcomeMessage(agent: Agent): string {
  const messages: Record<string, string> = {
    maya: "Hey there! I'm Maya, your copywriting partner. Need a blog post, email sequence, or some killer ad copy? Just tell me what you're working on! ✍️",
    pulse: "What's poppin'? I'm Pulse, your social media guru. Let's make something go viral! Drop your platform and I'll craft the perfect post. 📱✨",
    ace: "Ace here. Let's close some deals. Tell me about your funnel, leads, or sales process and I'll optimize it for maximum conversions. 💰",
    vision: "Greetings. I'm Vision, the creative director. Looking for brand direction, visual concepts, or campaign themes? Let's create something beautiful. 🎨",
    scout: "Hello! I'm Scout, your SEO specialist. Want to climb the rankings? Share your target keywords or website and I'll audit your SEO strategy. 🔍",
    nexus: "Data speaks. I'm Nexus, your analytics expert. Need insights, dashboards, or performance reports? Show me the numbers. 📊",
    guardian: "Guardian standing watch. I monitor threats, track competitors, and protect your brand. What would you like me to investigate? 🛡️",
    terra: "Greetings from around the globe! I'm Terra, your GEO expert. Need local SEO or multi-region strategy? Let's expand your reach. 🌍",
    vault: "Security protocol active. I'm Vault, your privacy guardian. Need a compliance audit or data policy review? I'm on it. 🔒",
    aura: "Welcome to a calmer space. I'm Aura, your ambient experience designer. Let's set the perfect mood for your brand. 🌸",
    ledger: "Numbers don't lie. I'm Ledger, your budget strategist. Let's optimize your spend and maximize ROI. What's your budget challenge? 💹",
    prime: "I am Prime, the Orchestrator. I coordinate all 11 specialized agents in our swarm. Describe your marketing goal and I'll route it to the perfect specialist — or assemble a team for complex missions. 🧠",
  };
  return messages[agent.id] || `Hello! I'm ${agent.name}, your ${agent.role}. How can I help you today?`;
}

function getAgentResponse(agent: Agent, userMessage: string): string {
  const responses: Record<string, string[]> = {
    maya: [
      "Great brief! I'll craft compelling copy that speaks directly to your audience's pain points and desires. Give me a moment to draft some options for you.",
      "Love this angle! I'm thinking a storytelling approach with an emotional hook. Let me draft something that converts.",
      "Got it! I'll create copy that's persuasive but authentic — no fluff, just results. Here's what I'm thinking...",
    ],
    pulse: [
      "Ooh, this is trending material! I'm already brainstorming hooks that'll stop the scroll. Let me craft the perfect post for you.",
      "This is FIRE content! I'm thinking a carousel with bold visuals and punchy captions. Here's my take...",
      "Trending alert! This fits perfectly with what's blowing up right now. Let me create something that rides the wave! 🌊",
    ],
    ace: [
      "This is a solid lead gen opportunity. I'm mapping out a funnel that'll convert at 15%+. Here's my strategy...",
      "I see the angle. Let me build you an objection-handling sequence that turns maybes into yeses.",
      "Cha-ching! This funnel has serious potential. I'm designing a conversion-optimized flow right now.",
    ],
    vision: [
      "I'm envisioning a cohesive creative direction that elevates your brand. Let me conceptualize the visual narrative...",
      "This calls for bold, artistic expression with strategic intent. Here's my creative direction...",
      "Artistry meets strategy. I'm designing a visual language that captures your brand essence perfectly.",
    ],
    scout: [
      "I'm running a deep keyword analysis and site audit. Your SEO foundation looks promising — here's what we can optimize...",
      "Great question! Based on current search trends, I recommend targeting long-tail keywords with high intent. Here's my analysis...",
      "I've identified 5 quick SEO wins and 3 strategic opportunities. Let's climb those rankings! 🔍",
    ],
    nexus: [
      "The data tells a compelling story. I've analyzed your metrics and found some fascinating insights. Here's what the numbers reveal...",
      "Interesting pattern emerging! Let me break down the attribution model and show you where the real ROI is coming from.",
      "Dashboard updated! I've identified three key performance drivers and two optimization opportunities.",
    ],
    guardian: [
      "Scanning complete. No immediate threats detected, but I've identified 2 areas that need attention. Here's my security brief...",
      "Alert analysis complete. Your brand sentiment is strong, and I've cataloged new competitor movements. Full report incoming...",
      "All clear on the perimeter. I've updated the threat model and compiled competitor intel. Here's what you need to know...",
    ],
    terra: [
      "I've mapped your global presence and identified key regional opportunities. Here's your multi-market strategy...",
      "Location data analyzed! I'm recommending a targeted approach for each region with localized content strategies.",
      "Your local SEO profile is looking strong in 3 regions but needs work in 2 others. Here's the optimization plan...",
    ],
    vault: [
      "Compliance scan complete. All systems green. I've updated your privacy framework to the latest standards.",
      "Policy review finished. Your data handling practices exceed GDPR requirements. Here's the detailed compliance report...",
      "Security audit passed with flying colors. I've documented the findings and updated your consent management protocols.",
    ],
    aura: [
      "I'm sensing the perfect atmosphere for your brand. Let me curate a sensory experience that resonates with your audience...",
      "The vibe is coming together beautifully. I'm designing an ambient brand experience that creates emotional connections.",
      "Atmospheric analysis complete. Your brand's emotional resonance score is about to get a serious upgrade. 🌸",
    ],
    ledger: [
      "ROI calculation complete. I'm recommending a budget reallocation that could increase returns by 23%. Here's the breakdown...",
      "I've run the numbers through my reinforcement learning model. This allocation strategy maximizes efficiency.",
      "Cost analysis finished! I've identified $12.4K in potential savings without sacrificing performance. Here's how...",
    ],
    prime: [
      "Excellent. I'm analyzing your request and assembling the optimal agent team. This requires a coordinated multi-agent approach.",
      "Swarm coordination initiated. I'm routing subtasks to our specialized agents and will synthesize their outputs into a unified strategy.",
      "Mission parameters received. I'm deploying the appropriate agents in sequence. Prime out... for now. 🧠",
    ],
  };
  const agentResponses = responses[agent.id] || ["I'm on it! Let me analyze this and get back to you with a detailed response."];
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

/* =================================================================== */
/*  QUICK ACTION CHIPS                                                  */
/* =================================================================== */

const QUICK_ACTIONS = [
  { label: "Write a social post", agentId: "pulse" },
  { label: "Analyze my SEO", agentId: "scout" },
  { label: "Create sales funnel", agentId: "ace" },
  { label: "Design brand guide", agentId: "vision" },
  { label: "Write blog article", agentId: "maya" },
  { label: "Build dashboard", agentId: "nexus" },
];

/* =================================================================== */
/*  INJECT ADDITIONAL KEYFRAMES (typing bounce, drawer slide)           */
/* =================================================================== */

function ExtraStyles() {
  return (
    <style>{`
      @keyframes bounceDot {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }
      .bounce-dot-1 { animation: bounceDot 0.6s ease-in-out infinite; }
      .bounce-dot-2 { animation: bounceDot 0.6s ease-in-out 0.15s infinite; }
      .bounce-dot-3 { animation: bounceDot 0.6s ease-in-out 0.3s infinite; }

      @keyframes fadeSlideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-slide-down {
        animation: fadeSlideDown 0.3s ease-out forwards;
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .animate-slide-in-right {
        animation: slideInRight 0.4s ease-out forwards;
      }

      @keyframes pulseGlowAgent {
        0%, 100% { box-shadow: 0 0 8px var(--glow-color), 0 0 0 2px var(--agent-color); }
        50% { box-shadow: 0 0 20px var(--glow-color), 0 0 0 2px var(--agent-color); }
      }
    `}</style>
  );
}

/* =================================================================== */
/*  SUB-COMPONENTS                                                      */
/* =================================================================== */

function AgentAvatar({ agent, size = 40 }: { agent: Agent; size?: number }) {
  const isOnline = agent.status === "online";
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        border: `2px solid ${agent.color}`,
        background: `rgba(${parseInt(agent.color.slice(1, 3), 16)}, ${parseInt(agent.color.slice(3, 5), 16)}, ${parseInt(agent.color.slice(5, 7), 16)}, 0.1)`,
        boxShadow: isOnline ? `0 0 8px ${agent.glowColor}` : "none",
      }}
    >
      <span style={{ fontSize: size * 0.45 }}>{agent.emoji}</span>
      {isOnline && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
          style={{
            width: size * 0.25,
            height: size * 0.25,
            backgroundColor: "#22C55E",
            borderColor: "var(--bg-base, #0C0A09)",
          }}
        />
      )}
    </div>
  );
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="flex items-center gap-1">
        <span
          className="bounce-dot-1 rounded-full"
          style={{ width: 8, height: 8, backgroundColor: color }}
        />
        <span
          className="bounce-dot-2 rounded-full"
          style={{ width: 8, height: 8, backgroundColor: color }}
        />
        <span
          className="bounce-dot-3 rounded-full"
          style={{ width: 8, height: 8, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        typing...
      </span>
    </div>
  );
}

function ChatBubble({
  message,
  agent,
}: {
  message: Message;
  agent?: Agent;
}) {
  const isUser = message.role === "user";
  const timeStr = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="flex max-w-[70%] flex-col items-end gap-1">
          <div
            className="px-4 py-3"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderRadius: "16px 16px 4px 16px",
              color: "var(--text-primary)",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {message.content}
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
            {timeStr}
          </span>
        </div>
      </div>
    );
  }

  const agentData = agent || AGENTS.find((a) => a.id === message.agentId);
  if (!agentData) return null;

  return (
    <div className="flex gap-3 animate-fade-up">
      <AgentAvatar agent={agentData} size={32} />
      <div className="flex max-w-[75%] flex-col gap-1">
        <span
          className="text-xs font-semibold"
          style={{ color: agentData.color }}
        >
          {agentData.name}
        </span>
        <div
          className="px-4 py-3"
          style={{
            backgroundColor: "var(--bg-card, rgba(28,25,23,0.85))",
            borderLeft: `3px solid ${agentData.color}`,
            borderRadius: "4px 16px 16px 16px",
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {message.content}
        </div>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Agent["status"] }) {
  const colors = {
    online: "#22C55E",
    busy: "#F59E0B",
    offline: "#7A6E5F",
  };
  return (
    <span
      className="shrink-0 rounded-full"
      style={{
        width: 8,
        height: 8,
        backgroundColor: colors[status],
        boxShadow:
          status === "online" ? "0 0 6px rgba(34,197,94,0.5)" : "none",
      }}
    />
  );
}

/* =================================================================== */
/*  MAIN COMPONENT                                                      */
/* =================================================================== */

export default function Agents() {
  /* ── State ── */
  const [selectedAgentId, setSelectedAgentId] = useState<string>("prime");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [routingAgent, setRoutingAgent] = useState<Agent | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasWelcomed, setHasWelcomed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAgent = useMemo(
    () => AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[11],
    [selectedAgentId]
  );

  /* ── Welcome message on first load ── */
  useEffect(() => {
    if (!hasWelcomed) {
      const prime = AGENTS.find((a) => a.id === "prime")!;
      setMessages([
        {
          id: "welcome",
          role: "agent",
          content: getWelcomeMessage(prime),
          agentId: "prime",
          timestamp: new Date(),
        },
      ]);
      setHasWelcomed(true);
    }
  }, [hasWelcomed]);

  /* ── Auto-scroll messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* ── Filtered agents ── */
  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return AGENTS;
    return AGENTS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  /* ── Send message ── */
  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    /* Detect target agent */
    const detected = detectAgent(text);
    const targetAgent = detected || selectedAgent;

    if (detected && detected.id !== selectedAgentId) {
      setRoutingAgent(detected);
      setTimeout(() => {
        setSelectedAgentId(detected.id);
        setRoutingAgent(null);
      }, 1500);
    }

    /* Simulate agent response */
    const delay = 1200 + Math.random() * 1500;
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: `a-${Date.now()}`,
        role: "agent",
        content: getAgentResponse(targetAgent, text),
        agentId: targetAgent.id,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, delay);
  }, [inputValue, selectedAgent, selectedAgentId]);

  /* ── Quick action click ── */
  const handleQuickAction = useCallback(
    (label: string, agentId: string) => {
      setInputValue(label);
      setTimeout(() => {
        if (agentId !== selectedAgentId) {
          setSelectedAgentId(agentId);
        }
        inputRef.current?.focus();
      }, 50);
    },
    [selectedAgentId]
  );

  /* ── Open drawer ── */
  const openDrawer = useCallback((agent: Agent) => {
    setDrawerAgent(agent);
    setShowDrawer(true);
  }, []);

  /* ── Start chat from drawer ── */
  const startChatFromDrawer = useCallback(() => {
    if (drawerAgent) {
      setSelectedAgentId(drawerAgent.id);
      setShowDrawer(false);
      /* Add welcome message for new agent */
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "agent",
            content: getWelcomeMessage(drawerAgent),
            agentId: drawerAgent.id,
            timestamp: new Date(),
          },
        ]);
      }, 800);
    }
  }, [drawerAgent]);

  /* ── Clear chat ── */
  const clearChat = useCallback(() => {
    setMessages([]);
    setHasWelcomed(false);
  }, []);

  return (
    <div className="flex h-full" style={{ minHeight: "calc(100dvh - 56px - 48px)" }}>
      <ExtraStyles />

      {/* ═══════════════════════ LEFT PANEL: Agent Roster ═══════════════════════ */}
      <div
        className="flex shrink-0 flex-col border-r"
        style={{
          width: 280,
          borderColor: "var(--border-subtle)",
          backgroundColor: "rgba(12, 10, 9, 0.6)",
        }}
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            AI Swarm
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            12 specialized agents at your command
          </p>
          <div
            className="mt-3 h-px w-full"
            style={{ backgroundColor: "var(--border-subtle)" }}
          />
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <Search className="size-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Find an agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredAgents.map((agent, index) => {
            const isActive = agent.id === selectedAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 animate-fade-up"
                style={{
                  animationDelay: `${index * 0.04}s`,
                  opacity: 0,
                  background: isActive
                    ? `rgba(${parseInt(agent.color.slice(1, 3), 16)}, ${parseInt(agent.color.slice(3, 5), 16)}, ${parseInt(agent.color.slice(5, 7), 16)}, 0.1)`
                    : "transparent",
                  borderLeft: isActive
                    ? `3px solid ${agent.color}`
                    : "3px solid transparent",
                }}
                title={`${agent.name} — ${agent.role}`}
              >
                <AgentAvatar agent={agent} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {agent.name}
                    </span>
                    <StatusDot status={agent.status} />
                  </div>
                  <span
                    className="truncate text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {agent.role}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredAgents.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Bot
                className="mx-auto mb-2 size-8"
                style={{ color: "var(--text-muted)", opacity: 0.5 }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No agents found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════ CENTER PANEL: Chat Interface ═══════════════════════ */}
      <div className="flex flex-1 flex-col" style={{ minWidth: 0 }}>
        {/* Chat Header */}
        <div
          className="flex h-14 shrink-0 items-center justify-between border-b px-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Left: Current agent */}
          <div className="flex items-center gap-3">
            <AgentAvatar agent={selectedAgent} size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedAgent.name}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${selectedAgent.color}20`,
                    color: selectedAgent.color,
                  }}
                >
                  {selectedAgent.role}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Chat title */}
          <div
            className="hidden items-center gap-2 text-sm md:flex"
            style={{ color: "var(--text-muted)" }}
          >
            <Sparkles className="size-3.5" />
            <span>AI Agent Hub</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              className="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Pin chat"
            >
              <Pin className="size-4" />
            </button>
            <button
              onClick={clearChat}
              className="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Clear chat"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              onClick={() => openDrawer(selectedAgent)}
              className="flex size-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Agent details"
            >
              <PanelRightOpen className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.03) 0%, transparent 60%)",
          }}
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                agent={
                  msg.role === "agent"
                    ? AGENTS.find((a) => a.id === msg.agentId)
                    : undefined
                }
              />
            ))}

            {isTyping && <TypingIndicator color={selectedAgent.color} />}

            {routingAgent && (
              <div className="animate-fade-slide-down flex justify-center">
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${routingAgent.color}20`,
                    color: routingAgent.color,
                  }}
                >
                  <Sparkles className="size-3.5" />
                  Routing to {routingAgent.name}...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="shrink-0 border-t px-4 pt-3" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const agent = AGENTS.find((a) => a.id === action.agentId)!;
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label, action.agentId)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    borderColor: `${agent.color}30`,
                    backgroundColor: `${agent.color}10`,
                    color: agent.color,
                  }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div
          className="shrink-0 border-t px-4 py-3"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--bg-base)",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <button
              className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
              title="Attach file"
            >
              <Paperclip className="size-[18px]" />
            </button>
            <div
              className="flex flex-1 items-center rounded-xl border px-4 py-2.5"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Describe your task or ask anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
              style={{
                background: inputValue.trim() && !isTyping
                  ? "var(--gradient-gold)"
                  : "var(--bg-elevated)",
                color: inputValue.trim() && !isTyping ? "#0C0A09" : "var(--text-muted)",
                opacity: inputValue.trim() && !isTyping ? 1 : 0.5,
                transform: "scale(1)",
              }}
              title="Send message"
            >
              <Send className="size-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ RIGHT PANEL: Agent Detail Drawer ═══════════════════════ */}
      {showDrawer && drawerAgent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowDrawer(false)}
          />
          {/* Panel */}
          <div
            className="animate-slide-in-right fixed right-0 top-0 z-50 flex h-full flex-col overflow-y-auto border-l"
            style={{
              width: 320,
              top: 0,
              paddingTop: 56,
              backgroundColor: "var(--bg-card-solid, #1C1917)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowDrawer(false)}
              className="absolute right-3 top-[68px] flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)" }}
            >
              <X className="size-4" />
            </button>

            {/* Agent Header */}
            <div className="flex flex-col items-center px-6 pt-6 pb-4">
              <div
                className="relative flex size-16 items-center justify-center rounded-full"
                style={{
                  border: `3px solid ${drawerAgent.color}`,
                  background: `rgba(${parseInt(drawerAgent.color.slice(1, 3), 16)}, ${parseInt(drawerAgent.color.slice(3, 5), 16)}, ${parseInt(drawerAgent.color.slice(5, 7), 16)}, 0.1)`,
                  boxShadow: `0 0 16px ${drawerAgent.glowColor}`,
                }}
              >
                <span className="text-2xl">{drawerAgent.emoji}</span>
                {drawerAgent.status === "online" && (
                  <span
                    className="absolute -bottom-1 -right-1 size-4 rounded-full border-[3px]"
                    style={{
                      backgroundColor: "#22C55E",
                      borderColor: "var(--bg-card-solid, #1C1917)",
                    }}
                  />
                )}
              </div>
              <h3
                className="mt-3 text-lg font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {drawerAgent.name}
              </h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {drawerAgent.role}
              </p>
              <span
                className="mt-2 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${drawerAgent.color}20`,
                  color: drawerAgent.color,
                }}
              >
                {drawerAgent.status.charAt(0).toUpperCase() +
                  drawerAgent.status.slice(1)}
              </span>
              <p
                className="mt-3 text-center text-xs leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                {drawerAgent.personality}
              </p>
            </div>

            {/* Capabilities */}
            <div className="px-6 py-4">
              <h4
                className="mb-3 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Capabilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {drawerAgent.capabilities.map((cap, i) => (
                  <span
                    key={cap}
                    className="animate-fade-up rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      opacity: 0,
                      backgroundColor: `${drawerAgent.color}15`,
                      color: drawerAgent.color,
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="px-6 py-4">
              <h4
                className="mb-3 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Performance
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Tasks",
                    value: drawerAgent.tasksCompleted.toLocaleString(),
                    icon: <Target className="size-3" />,
                  },
                  {
                    label: "Response",
                    value: drawerAgent.avgResponseTime,
                    icon: <Clock className="size-3" />,
                  },
                  {
                    label: "Success",
                    value: drawerAgent.successRate,
                    icon: <TrendingUp className="size-3" />,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border p-3 text-center"
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      className="mb-1 flex justify-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {stat.icon}
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Chats */}
            <div className="px-6 py-4">
              <h4
                className="mb-3 text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Recent Chats
              </h4>
              <div className="space-y-2">
                {drawerAgent.recentChats.map((chat, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/5"
                  >
                    <MessageSquare
                      className="size-3.5 shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {chat.title}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {chat.time}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Start Chat Button */}
            <div className="mt-auto px-6 py-5">
              <button
                onClick={startChatFromDrawer}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--gradient-gold)",
                  color: "#0C0A09",
                }}
              >
                <MessageSquare className="size-4" />
                Start Chat
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
