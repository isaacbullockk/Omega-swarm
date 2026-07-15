import { z } from "zod";
import { publicProcedure, router } from "../trpc.ts";
import { createCampaign, getCampaigns, getCampaignById } from "../../db/store.ts";
import { TRPCError } from "@trpc/server";

const AGENTS = [
  { id: "copywriter", name: "Copywriter GPT", emoji: "✍️", capabilities: ["Copy", "Email", "Landing Pages"] },
  { id: "social", name: "Social Media Agent", emoji: "📱", capabilities: ["Social", "Content", "Viral"] },
  { id: "sales", name: "Sales Closer", emoji: "💼", capabilities: ["Funnel", "Sales", "CRO"] },
  { id: "creative", name: "Creative Director", emoji: "🎨", capabilities: ["Creative", "Brand", "Visual"] },
  { id: "seo", name: "SEO Strategist", emoji: "🔍", capabilities: ["SEO", "Keywords", "Content"] },
  { id: "analytics", name: "Data Analyst", emoji: "📊", capabilities: ["Analytics", "KPI", "Reports"] },
  { id: "sentinel", name: "Sentinel", emoji: "👁️", capabilities: ["Intel", "Alerts", "Tracking"] },
  { id: "geo", name: "GEO Agent", emoji: "🤖", capabilities: ["GEO", "AI", "Citations"] },
  { id: "privacy", name: "Privacy Agent", emoji: "🔒", capabilities: ["Privacy", "GDPR", "Compliance"] },
  { id: "ambient", name: "Ambient Agent", emoji: "🌐", capabilities: ["IoT", "Voice", "Location"] },
  { id: "budget", name: "Budget RL Agent", emoji: "💰", capabilities: ["Budget", "RL", "Optimize"] },
  { id: "orchestrator", name: "Swarm Orchestrator", emoji: "🧠", capabilities: ["Coordination", "Sync"] },
];

export const agentRouter = router({
  list: publicProcedure.query(async () => {
    return AGENTS.map((a) => ({
      ...a,
      status: Math.random() > 0.1 ? "online" : "idle",
      tasksCompleted: Math.floor(Math.random() * 500) + 50,
      winRate: (Math.random() * 15 + 80).toFixed(1),
      responseTime: `${Math.floor(Math.random() * 300 + 150)}ms`,
    }));
  }),

  executeMission: publicProcedure
    .input(z.object({
      objective: z.string(),
      budget: z.string().optional(),
      timeline: z.string().optional(),
      brandVoice: z.string().optional(),
      generateImages: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const campaign = await createCampaign({
          objective: input.objective,
          budget: input.budget,
          timeline: input.timeline,
          mode: input.brandVoice ? "enhanced" : "standard",
        });
        return { success: true, campaign };
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  getCampaigns: publicProcedure.query(async () => {
    return await getCampaigns();
  }),

  getCampaign: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getCampaignById(input.id);
    }),
});
