import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { codeSymbiosis } from "../openrouter";

/**
 * Code Symbiosis Router — Kimi K3 generates, Nemotron 3 Ultra fact-checks.
 * Used for marketing automation scripts, CRM integrations, data pipelines.
 */
export const codegenRouter = router({
  generate: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10).max(4000),
      })
    )
    .mutation(async ({ input }) => {
      const result = await codeSymbiosis(input.prompt);
      return {
        approved: result.approved,
        status: result.evaluatie.status,
        fouten: result.evaluatie.fouten,
        ruweCode: result.ruwe_code,
        veiligeCode: result.veilige_code,
      };
    }),
});
