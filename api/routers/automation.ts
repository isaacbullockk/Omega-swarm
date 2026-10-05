/**
 * Omega Swarm v5.1 — Automation Router
 *
 * Endpoints:
 *   - getSettings    read automation config for the current user
 *   - updateSettings write automation config (master switch, auto-publish,
 *                    preferred days, time window, platforms, brand voice)
 *   - generateNow    manual trigger: pre-create next week's drafts immediately
 *   - runNow         manual trigger: force a publish tick (respects settings)
 *   - queuePost      manually queue a single post for scheduling
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";
import { automationSettings, contentPosts, analyticsEvents } from "../../db/schema";
import { eq } from "drizzle-orm";
import { runPublishTick, runGenerationTick } from "../scheduler";
import { generateCaption } from "../openai";
import { getMemoryContext } from "../memoryContext";

const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const validPlatforms = ["instagram", "facebook", "linkedin"] as const;

export const automationRouter = router({
  getSettings: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable() || !db) return null;
    const rows = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, ctx.user.id))
      .limit(1);
    if (rows[0]) return rows[0];
    // Return soft defaults when row hasn't been created yet
    return {
      id: "",
      userId: ctx.user.id,
      enabled: false,
      autoPublish: false,
      preferredDays: ["tuesday", "wednesday", "thursday"],
      timeWindowStart: 9,
      timeWindowEnd: 11,
      timezone: "Europe/Amsterdam",
      platforms: ["instagram", "facebook", "linkedin"],
      brandVoice: "",
      lastRunAt: null,
      nextGenAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  updateSettings: authedProcedure
    .input(
      z.object({
        enabled: z.boolean().default(false),
        autoPublish: z.boolean().default(false),
        preferredDays: z.array(z.enum(validDays)).min(1).max(7).default(["tuesday", "wednesday", "thursday"]),
        timeWindowStart: z.number().int().min(0).max(23).default(9),
        timeWindowEnd: z.number().int().min(0).max(23).default(11),
        timezone: z.string().max(50).default("Europe/Amsterdam"),
        platforms: z.array(z.enum(validPlatforms)).min(1).max(3).default(["instagram", "facebook", "linkedin"]),
        brandVoice: z.string().max(255).default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const existing = await db
        .select()
        .from(automationSettings)
        .where(eq(automationSettings.userId, ctx.user.id))
        .limit(1);

      const now = new Date();

      if (existing[0]) {
        await db
          .update(automationSettings)
          .set({
            enabled: input.enabled,
            autoPublish: input.autoPublish,
            preferredDays: input.preferredDays,
            timeWindowStart: input.timeWindowStart,
            timeWindowEnd: input.timeWindowEnd,
            timezone: input.timezone,
            platforms: input.platforms,
            brandVoice: input.brandVoice,
            updatedAt: now,
          })
          .where(eq(automationSettings.id, existing[0].id));
      } else {
        await db.insert(automationSettings).values({
          userId: ctx.user.id,
          enabled: input.enabled,
          autoPublish: input.autoPublish,
          preferredDays: input.preferredDays,
          timeWindowStart: input.timeWindowStart,
          timeWindowEnd: input.timeWindowEnd,
          timezone: input.timezone,
          platforms: input.platforms,
          brandVoice: input.brandVoice,
          updatedAt: now,
        });
      }

      return { success: true };
    }),

  /** Manual trigger: generate next week's drafts now */
  generateNow: authedProcedure.mutation(async ({ ctx }) => {
    if (!isPostgresAvailable() || !db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }
    const settingsRows = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, ctx.user.id))
      .limit(1);
    if (!settingsRows[0]?.enabled) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Automation must be enabled first" });
    }

    const r = await runGenerationTick(ctx.user.id);

    await db.insert(analyticsEvents).values({
      userId: ctx.user.id,
      clientId: null,
      type: "ai_generation",
      title: "Manual generation triggered",
      description: `Generated ${r.generated} drafts`,
      agentColor: "#8B5CF6",
      agentName: "Planner",
    });

    return r;
  }),

  /** Manual trigger: force a publish tick now */
  runNow: authedProcedure.mutation(async ({ ctx }) => {
    if (!isPostgresAvailable() || !db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }
    const settingsRows = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.userId, ctx.user.id))
      .limit(1);
    if (!settingsRows[0]?.enabled) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Automation must be enabled first" });
    }

    const r = await runPublishTick(ctx.user.id);

    await db.insert(analyticsEvents).values({
      userId: ctx.user.id,
      clientId: null,
      type: "ai_generation",
      title: "Manual publish triggered",
      description: `Checked ${r.checked}, published ${r.published}, drafted ${r.drafted}`,
      agentColor: "#10B981",
      agentName: "Autopilot",
    });

    return r;
  }),

  /** Manually queue a single post for the scheduler */
  queuePost: authedProcedure
    .input(
      z.object({
        date: z.string().datetime({ offset: true }),
        topic: z.string().min(1).max(500),
        brandVoice: z.string().max(255).optional(),
        withImage: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!isPostgresAvailable() || !db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const memoryContext = await getMemoryContext(ctx.user.id);
      const caption = await generateCaption(input.topic, input.brandVoice, memoryContext);
      const imageUrl = input.withImage
        ? `https://image.pollinations.ai/prompt/${encodeURIComponent(
            `Instagram post: ${input.topic}. Professional marketing visual.`
          )}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`
        : null;

      const [row] = await db
        .insert(contentPosts)
        .values({
          userId: ctx.user.id,
          clientId: null,
          title: input.topic.slice(0, 255),
          caption,
          type: "social",
          status: "scheduled",
          date: new Date(input.date),
          imageUrl,
          instagramPostId: null,
          likes: 0,
          comments: 0,
          views: 0,
          referenceAssets: [],
        })
        .returning({ id: contentPosts.id });

      return { id: row.id, scheduled: true };
    }),
});
