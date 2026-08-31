/**
 * Omega Swarm v5.0 — Agent Router (PostgreSQL + Auth)
 *
 * AI generation endpoints use rateLimitedProcedure (10 req/min).
 * List operations use authedProcedure. Campaign data is filtered by user_id.
 * Replaces JSON store with Drizzle ORM + PostgreSQL.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { generateWithAgent, chatWithAgent } from "../openai";
import { getMemoryContext } from "../memoryContext";
import { db, isPostgresAvailable } from "../../db/connection";
import { campaigns, brandVoices } from "../../db/schema";
import { eq, and } from "drizzle-orm";

const AGENTS = [
  { id: "copywriter", name: "Maya", emoji: "✍️", role: "You are Maya, an expert copywriter. You write compelling ad copy, email sequences, landing pages, and product descriptions that convert" },
  { id: "social", name: "Pulse", emoji: "📱", role: "You are Pulse, a social media expert. You create viral social media content, content calendars, and engagement strategies for TikTok, Instagram, and LinkedIn" },
  { id: "sales", name: "Ace", emoji: "💰", role: "You are Ace, a sales expert. You build high-converting sales funnels, write objection handlers, and create follow-up sequences" },
  { id: "creative", name: "Vision", emoji: "🎨", role: "You are Vision — a Creative Director who thinks like Steve Jobs, Seth Godin, and a world-class marketing strategist fused into one relentless mind." },
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

/* ─── Zod Schemas ─── */

const executeMissionSchema = z.object({
  clientId: z.string().uuid().optional(),
  objective: z.string().min(1, "Objective is required"),
  budget: z.string().default("$5K - $20K"),
  timeline: z.string().default("2 Weeks"),
  mode: z.enum(["sequential", "parallel", "adaptive", "battle"]).default("parallel"),
});

const runAgentSchema = z.object({
  campaignId: z.string().uuid(),
  agentId: z.string().min(1, "Agent ID is required"),
  objective: z.string().min(1, "Objective is required"),
  budget: z.string().default("$5K - $20K"),
  timeline: z.string().default("2 Weeks"),
});

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  agentId: z.string().optional(),
});

export const agentRouter = router({
  /* ─── Get all agents (public info, no DB needed) ─── */
  list: authedProcedure.query(async () => {
    return AGENTS.map((a) => ({
      ...a,
      status: "idle" as const,
      tasksCompleted: 0,
      winRate: "0.0",
      responseTime: "0ms",
      capabilities: getCapabilities(a.id),
    }));
  }),

  /* ─── Execute a mission with all agents (rate limited) ─── */
  executeMission: rateLimitedProcedure
    .input(executeMissionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Create campaign record
        const campaignResult = await db!
          .insert(campaigns)
          .values({
            userId: ctx.user.id,
            clientId: input.clientId ?? null,
            title: input.objective.slice(0, 60) + (input.objective.length > 60 ? "..." : ""),
            objective: input.objective,
            budget: input.budget,
            timeline: input.timeline,
            mode: input.mode,
            status: "running",
            outputs: AGENTS.map((a) => ({
              agentId: a.id,
              agentName: a.name,
              agentEmoji: a.emoji,
              status: "pending" as const,
              output: "",
            })),
          })
          .returning();

        const campaign = campaignResult[0];
        const campaignId = campaign.id;

        // Execute agents based on mode
        const executingAgents = input.mode === "adaptive"
          ? selectAdaptiveAgents(input.objective)
          : AGENTS;

        if (input.mode === "sequential") {
          for (const agent of executingAgents) {
            await runAgentInDb(ctx.user.id, campaignId, agent, input);
          }
        } else {
          await Promise.all(executingAgents.map((a) => runAgentInDb(ctx.user.id, campaignId, a, input)));
        }

        // Mark campaign complete
        await db!
          .update(campaigns)
          .set({ status: "completed", completedAt: new Date() })
          .where(
            and(eq(campaigns.id, campaignId), eq(campaigns.userId, ctx.user.id))
          );

        return { campaignId, agentsExecuted: executingAgents.length };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Agent] ExecuteMission error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to execute mission",
        });
      }
    }),

  /* ─── Get campaign with outputs (user-scoped) ─── */
  getCampaign: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }
      try {
        const result = await db!
          .select()
          .from(campaigns)
          .where(
            and(eq(campaigns.id, input.id), eq(campaigns.userId, ctx.user.id))
          )
          .limit(1);
        if (!result[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
        }
        return result[0];
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Agent] GetCampaign error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch campaign",
        });
      }
    }),

  /* ─── Get all campaigns for the authenticated user ─── */
  getCampaigns: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    try {
      return await db!
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, ctx.user.id))
        .orderBy(campaigns.createdAt);
    } catch (err) {
      console.error("[Agent] GetCampaigns error:", (err as Error).message);
      return [];
    }
  }),

  /* ─── Run a single agent (rate limited) ─── */
  runAgent: rateLimitedProcedure
    .input(runAgentSchema)
    .mutation(async ({ input }) => {
      const agent = AGENTS.find((a) => a.id === input.agentId);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      try {
        const output = await generateWithAgent(
          agent.name,
          agent.role,
          input.objective,
          input.budget,
          input.timeline
        );

        return { agentId: agent.id, agentName: agent.name, output };
      } catch (err) {
        console.error("[Agent] RunAgent error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to run agent",
        });
      }
    }),

  /* ─── Chat — direct AI response for the agent hub (rate limited) ─── */
  chat: rateLimitedProcedure
    .input(chatSchema)
    .mutation(async ({ ctx, input }) => {
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

      const backendAgentId = input.agentId
        ? (agentMap[input.agentId] || "orchestrator")
        : "orchestrator";
      const agent = AGENTS.find((a) => a.id === backendAgentId);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      }

      let brandVoice: { tone: string; description: string } | null = null;
      try {
        if (isPostgresAvailable()) {
          const savedVoice = await db!
            .select()
            .from(brandVoices)
            .where(eq(brandVoices.userId, ctx.user.id))
            .limit(1);
          if (savedVoice[0]) {
            brandVoice = { tone: savedVoice[0].tone, description: savedVoice[0].description };
          }
        }
      } catch {
        // ignore
      }

      try {
        const memoryContext = await getMemoryContext(ctx.user.id);
        const output = await chatWithAgent(
          agent.name,
          agent.role,
          input.message,
          brandVoice,
          memoryContext
        );

        return { output, agentName: agent.name, agentEmoji: agent.emoji };
      } catch (err) {
        console.error("[Agent] Chat error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to chat with agent",
        });
      }
    }),
});

/* ─── Helpers ─── */

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

async function runAgentInDb(
  userId: string,
  campaignId: string,
  agent: (typeof AGENTS)[0],
  input: { objective: string; budget: string; timeline: string }
) {
  if (!isPostgresAvailable()) return;

  // Fetch campaign
  const campaignResult = await db!
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)))
    .limit(1);
  const campaign = campaignResult[0];
  if (!campaign) return;

  // Fetch brand voice
  let brandVoice: { tone: string; description: string } | null = null;
  try {
    const savedVoice = await db!
      .select()
      .from(brandVoices)
      .where(eq(brandVoices.userId, userId))
      .limit(1);
    if (savedVoice[0]) {
      brandVoice = { tone: savedVoice[0].tone, description: savedVoice[0].description };
    }
  } catch {
    // ignore
  }

  // Update to running
  const outputs = (campaign.outputs || []) as Array<{
    agentId: string;
    agentName: string;
    agentEmoji: string;
    status: string;
    output: string;
    startedAt?: string;
    completedAt?: string;
  }>;
  const out = outputs.find((o) => o.agentId === agent.id);
  if (out) {
    out.status = "running";
    out.startedAt = new Date().toISOString();
  }
  await db!
    .update(campaigns)
    .set({ outputs })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));

  // Generate content
  try {
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
  } catch {
    if (out) {
      out.status = "failed";
    }
  }

  await db!
    .update(campaigns)
    .set({ outputs })
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, userId)));
}
