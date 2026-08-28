/**
 * Omega Swarm v5.0 — Lead Nurturing Router
 * Nemotron + Kimi Symbiosis: 3-step AI workflow
 * Step 1: Nemotron Planner (analyze → strategize)
 * Step 2: Kimi Copywriter (write → convert)
 * Step 3: Nemotron Validator (check → format → send)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { leads, analyticsEvents } from "../../db/schema";
import { eq } from "drizzle-orm";
import { nemotronPlanner, kimiCopywriter, nemotronValidator, scoreLeadFast } from "../openrouter";

/* ─── Zod Schemas ─── */

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  source: z.string().optional(),
  behavior: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

const nurtureSchema = z.object({
  leadId: z.string().uuid(),
  brandVoice: z.string().optional(),
  targetPlatform: z.enum(["hubspot", "activecampaign", "generic"]).default("generic"),
});

const webhookSchema = z.object({
  leadId: z.string().uuid(),
  platform: z.enum(["hubspot", "activecampaign", "generic"]).default("generic"),
  webhookUrl: z.string().url().optional(),
});

/* ─── Helper: Get client context for the user ─── */
async function getClientContext(userId: string) {
  if (!isPostgresAvailable() || !db) return null;
  const { clients } = await import("../../db/schema");
  const result = await db.select().from(clients).where(eq(clients.userId, userId)).limit(1);
  return result[0] || null;
}

export const leadRouter = router({
  /* ─── Score a lead with the fast Nemotron model (0-100) ─── */
  score: rateLimitedProcedure
    .input(z.object({ leadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      const rows = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);
      const lead = rows[0];
      if (!lead || lead.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      let result: { score: number; reason: string };
      try {
        result = await scoreLeadFast({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          source: lead.source,
          behavior: lead.behavior,
          tags: lead.tags ?? [],
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Lead scoring failed: ${(err as Error).message}`,
        });
      }

      await db.update(leads).set({ score: result.score }).where(eq(leads.id, lead.id));
      return result;
    }),

  /* ─── Create a new lead ─── */
  create: authedProcedure
    .input(leadSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      try {
        const result = await db
          .insert(leads)
          .values({
            userId: ctx.user.id,
            name: input.name,
            email: input.email,
            company: input.company || null,
            source: input.source || null,
            behavior: input.behavior || null,
            tags: input.tags,
            status: "new",
            score: 50,
          })
          .returning();

        await db.insert(analyticsEvents).values({
          userId: ctx.user.id,
          type: "ai_generation",
          title: "Lead created",
          description: `Lead ${input.name} <${input.email}> created`,
          agentColor: "#10B981",
          agentName: "Symbiosis",
        });

        return result[0];
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create lead: ${(err as Error).message}`,
        });
      }
    }),

  /* ─── List all leads for user ─── */
  list: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable() || !db) return [];
    try {
      return await db.select().from(leads).where(eq(leads.userId, ctx.user.id)).orderBy(leads.createdAt);
    } catch {
      return [];
    }
  }),

  /* ─── Get single lead ─── */
  get: authedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) return null;
      const result = await db.select().from(leads).where(eq(leads.id, input.id)).limit(1);
      return result[0] || null;
    }),

  /* ─── Step 1+2+3: Full Symbiosis Nurture ─── */
  nurture: rateLimitedProcedure
    .input(nurtureSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      try {
        // Fetch lead
        const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

        // Fetch client context
        const client = await getClientContext(ctx.user.id);
        const clientContext = client
          ? {
              name: client.name,
              industry: "Music & Strategy", // Hardcoded for Isaac Bullock
              productSummary: `${client.name} - ${client.tagline || "Strategic brand building"}`,
              tone: input.brandVoice || "Bold, authentic, visionary",
            }
          : {
              name: "Isaac Bullock",
              industry: "Music & Strategy",
              productSummary: "Strategic brand building for visionary artists",
              tone: input.brandVoice || "Bold, authentic, visionary",
            };

        // ─── STEP 1: Nemotron Planner ───
        console.log(`[SYMBIOSIS] Step 1: Nemotron analyzing lead ${lead.email}`);
        const plan = await nemotronPlanner({
          leadData: {
            name: lead.name,
            email: lead.email,
            source: lead.source || undefined,
            company: lead.company || undefined,
            behavior: lead.behavior || undefined,
          },
          clientContext,
        });

        // ─── STEP 2: Kimi Copywriter ───
        console.log(`[SYMBIOSIS] Step 2: Kimi writing email for ${lead.email}`);
        const email = await kimiCopywriter({
          brief: plan.copywriterBrief,
          brandVoice: clientContext.tone,
          productInfo: plan.productInfo,
          recipient: { name: lead.name, company: lead.company || undefined },
          segment: plan.segment,
        });

        // ─── STEP 3: Nemotron Validator ───
        console.log(`[SYMBIOSIS] Step 3: Nemotron validating email for ${lead.email}`);
        const validation = await nemotronValidator({
          email: { subject: email.subject, body: email.body, cta: email.cta },
          brandVoice: clientContext.tone,
          targetPlatform: input.targetPlatform,
        });

        // Update lead record
        await db
          .update(leads)
          .set({
            status: validation.valid ? "nurtured" : "review",
            score: validation.valid ? Math.min((lead.score || 50) + 10, 100) : lead.score,
            lastEmailSubject: email.subject,
            lastEmailBody: email.body,
            lastEmailValidated: validation.valid,
            validationIssues: validation.issues,
            updatedAt: new Date(),
          })
          .where(eq(leads.id, input.leadId));

        // Log analytics
        await db.insert(analyticsEvents).values({
          userId: ctx.user.id,
          type: "ai_generation",
          title: validation.valid ? "Email nurtured (validated)" : "Email nurtured (needs review)",
          description: `Symbiosis workflow for ${lead.name}: ${email.subject.slice(0, 60)}`,
          agentColor: validation.valid ? "#10B981" : "#F59E0B",
          agentName: "Symbiosis",
          metadata: { strategy: plan.strategy, segment: plan.segment, platform: input.targetPlatform },
        });

        return {
          leadId: lead.id,
          email: {
            subject: email.subject,
            body: email.body,
            cta: email.cta,
            tone: email.tone,
            personalizationNotes: email.personalizationNotes,
          },
          validation: {
            valid: validation.valid,
            issues: validation.issues,
          },
          strategy: {
            urgency: plan.urgency,
            segment: plan.segment,
            brief: plan.copywriterBrief,
          },
          webhookPayload: validation.webhookJson,
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error("[Lead] Nurture error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Nurture failed: ${(err as Error).message}`,
        });
      }
    }),

  /* ─── Send to CRM via webhook ─── */
  sendToCrm: authedProcedure
    .input(webhookSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const [lead] = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      if (!lead.lastEmailSubject || !lead.lastEmailBody) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No nurtured email for this lead. Run nurture first." });
      }

      const webhookUrl = input.webhookUrl || process.env[`${input.platform.toUpperCase()}_WEBHOOK_URL`];
      if (!webhookUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No webhook URL configured for ${input.platform}. Set ${input.platform.toUpperCase()}_WEBHOOK_URL env var or pass webhookUrl.`,
        });
      }

      try {
        const payload = {
          contact: {
            email: lead.email,
            firstname: lead.name.split(" ")[0],
            lastname: lead.name.split(" ").slice(1).join(" ") || "",
            company: lead.company || "",
            source: lead.source || "omega-swarm",
            lead_score: lead.score,
          },
          email: {
            subject: lead.lastEmailSubject,
            body: lead.lastEmailBody,
            status: lead.lastEmailValidated ? "approved" : "review",
          },
          metadata: {
            platform: input.platform,
            sentFrom: "omega-swarm-symbiosis",
            timestamp: new Date().toISOString(),
          },
        };

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${await response.text()}`);
        }

        await db.update(leads).set({ status: "sent", updatedAt: new Date() }).where(eq(leads.id, input.leadId));

        await db.insert(analyticsEvents).values({
          userId: ctx.user.id,
          type: "campaign_started",
          title: "Lead sent to CRM",
          description: `${lead.name} sent to ${input.platform}`,
          agentColor: "#3B82F6",
          agentName: "Symbiosis",
        });

        return { success: true, platform: input.platform, leadId: lead.id };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `CRM send failed: ${(err as Error).message}`,
        });
      }
    }),
});
