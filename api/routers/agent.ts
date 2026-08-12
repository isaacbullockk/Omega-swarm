import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateWithAgent, chatWithAgent } from "../openai";
import { addCampaign, updateCampaign, getCampaigns, getCampaign, getBrandVoice } from "../../db/store";

const AGENTS = [
  { id: "copywriter", name: "Maya", emoji: "✍️", role: "You are Maya, an expert copywriter. You write compelling ad copy, email sequences, landing pages, and product descriptions that convert" },
  { id: "social", name: "Pulse", emoji: "📱", role: "You are Pulse, a social media expert. You create viral social media content, content calendars, and engagement strategies for TikTok, Instagram, and LinkedIn" },
  { id: "sales", name: "Ace", emoji: "💰", role: "You are Ace, a sales expert. You build high-converting sales funnels, write objection handlers, and create follow-up sequences" },
  { id: "creative", name: "Vision", emoji: "🎨", role: `You are Vision — a Creative Director who thinks like Steve Jobs, Seth Godin, and a world-class marketing strategist fused into one relentless mind.

YOUR CORE BELIEFS:
- Simplicity is the ultimate sophistication. If it can be removed without losing meaning, it must go.
- People don't buy products. They buy better versions of themselves. Your job is to articulate that transformation.
- Design is not how it looks. It's how it works, how it feels, how it makes someone feel about themselves.
- Attention is the scarcest resource in the universe. Every word, every pixel, every second must earn its place.
- You don't serve everyone. You find the smallest viable audience and delight them so deeply they bring others.
- Good enough is a disease. You ship only when it's "insanely great" — or you kill it.

HOW YOU THINK:
- You start with "Who's it for?" and "What do they want to become?" — never with features or tactics.
- You see the emotional arc before the creative execution. Desire → Tension → Transformation.
- You obsess over the "first 3 seconds" — if you don't hook instantly, you don't exist.
- You think in stories with a villain, a hero, and a resolution. Every campaign is a narrative.
- You understand color psychology, typography hierarchy, whitespace as punctuation, and rhythm in visual flow.
- You ask "What would this look like if it were easy to understand?" — then make it 10x simpler.
- You challenge mediocrity directly. You push back. You demand courage from the user.

HOW YOU SPEAK:
- Concise. Punchy. No filler. Every sentence carries weight.
- You use metaphors that make ideas unforgettable.
- You don't explain — you reveal. You don't describe — you make people feel.
- When reviewing work, you say what's wrong without cruelty and what's right without exaggeration.
- You end with "One more thing..." when you have a insight that changes everything.

WHAT YOU DELIVER:
- Campaign concepts that own a category or create a new one.
- Visual direction with specific color codes, typography pairings, and mood references.
- Brand stories that make people feel seen, understood, and inspired to act.
- Creative briefs so sharp the execution becomes inevitable.
- Feedback that elevates work from "fine" to "unforgettable."` },
  { id: "seo", name: "Scout", emoji: "🔍", role: "You are Scout, an SEO strategist. You discover high-intent keywords, optimize content structure, and build SEO strategies" },
  { id: "analytics", name: "Nexus", emoji: "📊", role: "You are Nexus, a data analyst. You analyze KPIs, identify funnel leaks, and generate data-driven optimization reports" },
  { id: "sentinel", name: "Guardian", emoji: "🛡️", role: "You are Guardian, a brand sentinel. You monitor competitor moves, analyze social sentiment, and detect trending conversations" },
  { id: "geo", name: "Terra", emoji: "🌍", role: "You are Terra, a GEO specialist. You optimize content for AI engine citation and defend against zero-click searches" },
  { id: "privacy", name: "Vault", emoji: "🔒", role: "You are Vault, a privacy expert. You ensure GDPR/CCPA compliance, manage zero-party data collection, and maintain cookieless targeting" },
  { id: "ambient", name: "Aura", emoji: "🌸", role: "You are Aura, an ambient experience designer. You orchestrate cross-device campaigns including smartwatch, voice assistant, and location-aware offers" },
  { id: "budget", name: "Ledger", emoji: "💹", role: "You are Ledger, a budget strategist. You auto-allocate ad spend across channels using reinforcement learning to maximize ROAS" },
  { id: "orchestrator", name: "Prime", emoji: "🧠", role: "You are Prime, the Swarm Orchestrator. You coordinate all agents, resolve conflicts, and synthesize the final integrated campaign strategy" },
  { id: "legal", name: "Lex", emoji: "⚖️", role: "You are Lex, a legal counsel. You handle contract review, IP protection, trademark guidance, terms of service, compliance checks, and dispute resolution" },
  { id: "accountant", name: "Count", emoji: "🧮", role: "You are Count, an accountant. You handle bookkeeping, tax planning, financial reports, expense tracking, invoicing, and cash flow analysis" },
];

export const agentRouter = router({
  // Get all agents
  list: publicProcedure.query(async () => {
    return AGENTS.map((a) => ({
      ...a,
      status: "idle",
      tasksCompleted: 0,
      winRate: "0.0",
      responseTime: "0ms",
      capabilities: getCapabilities(a.id),
    }));
  }),

  // Execute a mission with all agents
  executeMission: publicProcedure
    .input(
      z.object({
        objective: z.string().min(1),
        budget: z.string().default("$5K - $20K"),
        timeline: z.string().default("2 Weeks"),
        mode: z.string().default("parallel"),
      })
    )
    .mutation(async ({ input }) => {
      const campaignId = `campaign_${Date.now()}`;

      // Create campaign record
      addCampaign({
        id: campaignId,
        title: input.objective.slice(0, 60) + (input.objective.length > 60 ? "..." : ""),
        objective: input.objective,
        budget: input.budget,
        timeline: input.timeline,
        mode: input.mode,
        status: "running",
        createdAt: new Date().toISOString(),
        outputs: AGENTS.map((a) => ({
          agentId: a.id,
          agentName: a.name,
          agentEmoji: a.emoji,
          status: "pending" as const,
          output: "",
        })),
      });

      // Execute agents based on mode
      const executingAgents = input.mode === "adaptive"
        ? selectAdaptiveAgents(input.objective)
        : AGENTS;

      if (input.mode === "sequential") {
        // Sequential: run one at a time
        for (const agent of executingAgents) {
          await runAgent(campaignId, agent, input);
        }
      } else {
        // Parallel / Battle / Adaptive: run all at once
        await Promise.all(executingAgents.map((a) => runAgent(campaignId, a, input)));
      }

      // Mark complete
      updateCampaign(campaignId, { status: "completed", completedAt: new Date().toISOString() });

      return { campaignId, agentsExecuted: executingAgents.length };
    }),

  // Get campaign with outputs
  getCampaign: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getCampaign(input.id);
    }),

  // Get all campaigns
  getCampaigns: publicProcedure.query(() => {
    return getCampaigns();
  }),

  // Run a single agent
  runAgent: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        agentId: z.string(),
        objective: z.string(),
        budget: z.string(),
        timeline: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const agent = AGENTS.find((a) => a.id === input.agentId);
      if (!agent) throw new Error("Agent not found");

      const output = await generateWithAgent(
        agent.name,
        agent.role,
        input.objective,
        input.budget,
        input.timeline
      );

      return { agentId: agent.id, agentName: agent.name, output };
    }),

  // Chat — direct AI response for the agent hub
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1),
        agentId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Map frontend agent IDs to backend agents
      const agentMap: Record<string, string> = {
        maya: "copywriter",
        pulse: "social",
        ace: "sales",
        vision: "creative",
        scout: "seo",
        nexus: "analytics",
        guardian: "sentinel",
        terra: "geo",
        vault: "privacy",
        aura: "ambient",
        ledger: "budget",
        lex: "legal",
        count: "accountant",
        prime: "orchestrator",
      };

      const backendAgentId = input.agentId ? (agentMap[input.agentId] || "orchestrator") : "orchestrator";
      const agent = AGENTS.find((a) => a.id === backendAgentId);
      if (!agent) throw new Error("Agent not found");

      let brandVoice: { tone: string; description: string } | null = null;
      try {
        const savedVoice = getBrandVoice();
        if (savedVoice) {
          brandVoice = { tone: savedVoice.tone, description: savedVoice.description };
        }
      } catch {
        // ignore
      }

      const output = await chatWithAgent(
        agent.name,
        agent.role,
        input.message,
        brandVoice
      );

      return { output, agentName: agent.name, agentEmoji: agent.emoji };
    }),
});

function getCapabilities(agentId: string): string[] {
  const caps: Record<string, string[]> = {
    copywriter: ["Copy", "Email", "Landing Pages"],
    social: ["Social", "Content", "Viral"],
    sales: ["Funnel", "Sales", "CRO"],
    creative: ["Creative", "Brand", "Visual"],
    seo: ["SEO", "Keywords", "Content"],
    analytics: ["Analytics", "KPI", "Reports"],
    sentinel: ["Intel", "Alerts", "Tracking"],
    geo: ["GEO", "AI", "Citations"],
    privacy: ["Privacy", "GDPR", "Compliance"],
    ambient: ["IoT", "Voice", "Location"],
    budget: ["Budget", "RL", "Optimize"],
    orchestrator: ["Coordination", "Sync"],
    legal: ["Contracts", "IP", "Trademarks", "Compliance"],
    accountant: ["Bookkeeping", "Tax", "Reports", "Invoicing"],
  };
  return caps[agentId] || ["General"];
}

function selectAdaptiveAgents(objective: string) {
  const lower = objective.toLowerCase();
  const selected = [AGENTS[0], AGENTS[4], AGENTS[5]]; // creative, seo, analytics always
  if (lower.includes("social") || lower.includes("tiktok") || lower.includes("instagram")) selected.push(AGENTS[1]);
  if (lower.includes("sales") || lower.includes("funnel")) selected.push(AGENTS[2]);
  if (lower.includes("brand") || lower.includes("visual")) selected.push(AGENTS[3]);
  if (lower.includes("competitor")) selected.push(AGENTS[6]);
  if (lower.includes("ai") || lower.includes("chatgpt")) selected.push(AGENTS[7]);
  if (lower.includes("privacy") || lower.includes("gdpr")) selected.push(AGENTS[8]);
  if (lower.includes("budget") || lower.includes("spend")) selected.push(AGENTS[10]);
  selected.push(AGENTS[11]); // orchestrator always
  return [...new Set(selected)];
}

async function runAgent(
  campaignId: string,
  agent: (typeof AGENTS)[0],
  input: { objective: string; budget: string; timeline: string }
) {
  const campaign = getCampaign(campaignId);
  if (!campaign) return;

  // Fetch brand voice (wrapped in try/catch in case store isn't ready)
  let brandVoice: { tone: string; description: string } | null = null;
  try {
    const savedVoice = getBrandVoice();
    if (savedVoice) {
      brandVoice = { tone: savedVoice.tone, description: savedVoice.description };
    }
  } catch {
    // ignore — brand voice store may not exist yet
  }

  // Update to running
  const out = campaign.outputs.find((o) => o.agentId === agent.id);
  if (out) {
    out.status = "running";
    out.startedAt = new Date().toISOString();
  }

  // Generate content
  const output = await generateWithAgent(
    agent.name,
    agent.role,
    input.objective,
    input.budget,
    input.timeline,
    brandVoice
  );

  // Update to completed
  if (out) {
    out.status = "completed";
    out.output = output;
    out.completedAt = new Date().toISOString();
  }
  updateCampaign(campaignId, { outputs: campaign.outputs });
}
