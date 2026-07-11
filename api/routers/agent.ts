import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateWithAgent } from "../openai";
import { addCampaign, updateCampaign, getCampaigns, getCampaign, getBrandVoice } from "../../db/store";

const AGENTS = [
  { id: "copywriter", name: "Copywriter GPT", emoji: "✍️", role: "You write compelling ad copy, email sequences, landing pages, and product descriptions that convert" },
  { id: "social", name: "Social Media Agent", emoji: "📱", role: "You create viral social media content, content calendars, and engagement strategies for TikTok, Instagram, and LinkedIn" },
  { id: "sales", name: "Sales Closer", emoji: "💼", role: "You build high-converting sales funnels, write objection handlers, and create follow-up sequences" },
  { id: "creative", name: "Creative Director", emoji: "🎨", role: "You develop campaign themes, visual directions, brand storytelling, and creative briefs" },
  { id: "seo", name: "SEO Strategist", emoji: "🔍", role: "You discover high-intent keywords, optimize content structure, and build SEO strategies" },
  { id: "analytics", name: "Data Analyst", emoji: "📊", role: "You analyze KPIs, identify funnel leaks, and generate data-driven optimization reports" },
  { id: "sentinel", name: "Sentinel", emoji: "👁️", role: "You monitor competitor moves, analyze social sentiment, and detect trending conversations" },
  { id: "geo", name: "GEO Agent", emoji: "🤖", role: "You optimize content for AI engine citation (ChatGPT, Perplexity, Gemini, Claude) and defend against zero-click searches" },
  { id: "privacy", name: "Privacy Agent", emoji: "🔒", role: "You ensure GDPR/CCPA compliance, manage zero-party data collection, and maintain cookieless targeting" },
  { id: "ambient", name: "Ambient Agent", emoji: "🌐", role: "You orchestrate cross-device campaigns including smartwatch, voice assistant, and location-aware offers" },
  { id: "budget", name: "Budget RL Agent", emoji: "💰", role: "You auto-allocate ad spend across channels using reinforcement learning to maximize ROAS" },
  { id: "orchestrator", name: "Swarm Orchestrator", emoji: "🧠", role: "You coordinate all agents, resolve conflicts, and synthesize the final integrated campaign strategy" },
];

export const agentRouter = router({
  // Get all agents
  list: publicProcedure.query(async () => {
    return AGENTS.map((a) => ({
      ...a,
      status: Math.random() > 0.15 ? "online" : Math.random() > 0.5 ? "working" : "idle",
      tasksCompleted: Math.floor(Math.random() * 500) + 50,
      winRate: (65 + Math.random() * 30).toFixed(1),
      responseTime: `${Math.floor(Math.random() * 800 + 200)}ms`,
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
