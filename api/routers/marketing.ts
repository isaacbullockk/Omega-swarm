import { z } from "zod";
import { router, rateLimitedProcedure } from "../trpc";
import { runMarketingPipeline } from "../marketingPipeline";

/**
 * Marketing Pipeline Router
 * Nemotron Orchestrator → Kimi Copy Filler → Nemotron Gateway Audit → Webhook
 * Webhook wordt GEBLOKKEERD als de audit REJECTED geeft (zero tolerance).
 */
export const marketingRouter = router({
  runPipeline: rateLimitedProcedure
    .input(
      z.object({
        payload: z.object({
          client_name: z.string().min(1),
          industry: z.string().min(1),
          campaign_goal: z.string().min(1),
          target_audience: z.string().min(1),
          core_offer: z.string().min(1),
        }),
        leadName: z.string().min(1),
        painPoint: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await runMarketingPipeline(input.payload, input.leadName, input.painPoint);
    }),
});
