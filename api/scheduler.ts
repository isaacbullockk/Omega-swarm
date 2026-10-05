/**
 * Omega Swarm v5.1 — Content Scheduler (Autopilot)
 *
 * Runs on a 15-minute interval from server.ts. Two jobs:
 *   1. PUBLISH: Finds scheduled posts whose date has arrived. If the user has
 *      auto-publish ON and the local time matches their preferred day+window,
 *      publishes to all connected platforms. Otherwise flips to "draft" for
 *      manual review.
 *   2. GENERATE: Once per week, pre-creates AI-written drafts for the next
 *      7 days using the Master Briefing calendar and voice rules.
 *
 * Safety:
 *   - One failing post never aborts the rest (per-post try/catch)
 *   - A post is only processed once: status goes scheduled → published/draft
 *   - Platforms are resolved live from social_accounts; missing connections
 *     are skipped with a log line, never a crash.
 *   - Timezone-aware: Isaac runs Europe/Amsterdam; other users may override.
 */

import { eq, and, lte, sql } from "drizzle-orm";
import { db, isPostgresAvailable } from "../db/connection";
import { contentPosts, automationSettings, socialAccounts, analyticsEvents } from "../db/schema";
import { resolveTarget, publishPost } from "./socialPublish";
import { generateCaption } from "./openai";
import { getMemoryContext } from "./memoryContext";
import type { PublishResult } from "./socialPublish";

const PUBLISH_TICK_MS = 15 * 60 * 1000; // 15 minutes
const GEN_TICK_MS = 24 * 60 * 60 * 1000; // daily (but internally gates to once/week)
const INITIAL_DELAY_MS = 30 * 1000; // after migrations

let runningPublish = false;
let runningGen = false;

/** Day names in English, lowercased, matching DB JSON storage */
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** Get local day-of-week (0-6) and hour (0-23) for a timezone */
function localDayAndHour(date: Date, tz: string): { dayName: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "numeric",
    hour12: false,
  }).formatToParts(date);
  const dayName = (parts.find((p) => p.type === "weekday")?.value ?? "monday").toLowerCase();
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  return { dayName, hour };
}

/**
 * Build a UTC Date that represents `hour:minute` in the target timezone on
 * the same calendar day as `date`. Brute-forces standard offsets (-12..+14)
 * so it works regardless of DST transitions.
 */
function makeTimeInTimezone(date: Date, hour: number, minute: number, tz: string): Date {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10);
  const day = parseInt(parts.find((p) => p.type === "day")!.value, 10);

  for (let offset = -12; offset <= 14; offset++) {
    const candidate = new Date(Date.UTC(year, month - 1, day, hour - offset, minute));
    const checkParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).formatToParts(candidate);
    const checkHour = parseInt(checkParts.find((p) => p.type === "hour")!.value, 10);
    const checkMinute = parseInt(checkParts.find((p) => p.type === "minute")!.value, 10);
    if (checkHour === hour && checkMinute === minute) {
      return candidate;
    }
  }
  // Fallback (should never hit for valid IANA zones)
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

/** Publish a single scheduled post to every connected platform the user wants */
async function publishScheduledPost(post: {
  id: string;
  userId: string;
  caption: string;
  imageUrl: string | null;
  title: string;
}): Promise<{ published: number; errors: string[] }> {
  const result = { published: 0, errors: [] as string[] };

  // Load this user's automation settings to know which platforms to target
  if (!db) return result;
  const settingsRows = await db
    .select()
    .from(automationSettings)
    .where(eq(automationSettings.userId, post.userId))
    .limit(1);
  const settings = settingsRows[0];
  const targetPlatforms = (settings?.platforms as string[] | undefined) ?? ["instagram", "facebook", "linkedin"];

  for (const platform of targetPlatforms) {
    if (platform !== "instagram" && platform !== "facebook" && platform !== "linkedin") continue;

    try {
      const target = await resolveTarget(post.userId, { platform });
      if (!target) {
        console.log(`[Scheduler] ${post.id}: no connected ${platform} account — skipping`);
        continue;
      }
      // Instagram requires an image URL
      if (platform === "instagram" && !post.imageUrl) {
        result.errors.push("Instagram requires an image URL");
        continue;
      }

      const pub = await publishPost(target, post.caption, post.imageUrl ?? undefined);
      if (pub.success) {
        result.published++;
        // Stamp platform-specific post id when available
        if (platform === "instagram" && pub.postId) {
          await db
            .update(contentPosts)
            .set({ instagramPostId: pub.postId })
            .where(eq(contentPosts.id, post.id));
        }
      } else {
        result.errors.push(`${platform}: ${pub.error ?? "unknown"}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      result.errors.push(`${platform}: ${msg}`);
    }
  }

  return result;
}

/** Core publish tick: scheduled → published (auto) or draft (review) */
export async function runPublishTick(userId?: string): Promise<{
  checked: number;
  published: number;
  drafted: number;
  failed: number;
}> {
  const result = { checked: 0, published: 0, drafted: 0, failed: 0 };
  if (!isPostgresAvailable() || !db) return result;

  const now = new Date();

  // Find posts that are scheduled and whose date has arrived
  const whereClause = userId
    ? and(eq(contentPosts.status, "scheduled"), lte(contentPosts.date, now), eq(contentPosts.userId, userId))
    : and(eq(contentPosts.status, "scheduled"), lte(contentPosts.date, now));

  const duePosts = await db
    .select({
      id: contentPosts.id,
      userId: contentPosts.userId,
      caption: contentPosts.caption,
      imageUrl: contentPosts.imageUrl,
      title: contentPosts.title,
      date: contentPosts.date,
    })
    .from(contentPosts)
    .where(whereClause)
    .orderBy(contentPosts.date);

  result.checked = duePosts.length;
  if (duePosts.length === 0) return result;

  for (const post of duePosts) {
    try {
      // Load user's automation settings
      const settingsRows = await db
        .select()
        .from(automationSettings)
        .where(eq(automationSettings.userId, post.userId))
        .limit(1);
      const settings = settingsRows[0];

      // If automation is off entirely, leave as scheduled (user hasn't opted in)
      if (!settings?.enabled) {
        console.log(`[Scheduler] ${post.id}: automation disabled for user — leaving scheduled`);
        continue;
      }

      const tz = settings.timezone || "Europe/Amsterdam";
      const { dayName, hour } = localDayAndHour(now, tz);
      const preferredDays = (settings.preferredDays as string[] | undefined) ?? ["tuesday", "wednesday", "thursday"];
      const inPreferredDay = preferredDays.includes(dayName);
      const inWindow = hour >= settings.timeWindowStart && hour <= settings.timeWindowEnd;

      if (settings.autoPublish && inPreferredDay && inWindow) {
        // Auto-publish path
        const pub = await publishScheduledPost(post);
        if (pub.published > 0) {
          await db
            .update(contentPosts)
            .set({ status: "published" })
            .where(eq(contentPosts.id, post.id));
          result.published++;

          await db.insert(analyticsEvents).values({
            userId: post.userId,
            clientId: null,
            type: "ai_generation",
            title: "Auto-published",
            description: `"${post.title}" published to ${pub.published} platform(s)`,
            agentColor: "#10B981",
            agentName: "Autopilot",
          });
        } else {
          // Publish attempted but every platform failed — leave as draft for user to fix
          await db
            .update(contentPosts)
            .set({ status: "draft" })
            .where(eq(contentPosts.id, post.id));
          result.drafted++;
          console.warn(`[Scheduler] ${post.id}: auto-publish failed on all platforms — moved to draft`, pub.errors);
        }
      } else {
        // Review mode (or outside day/window): flip to draft
        await db
          .update(contentPosts)
          .set({ status: "draft" })
          .where(eq(contentPosts.id, post.id));
        result.drafted++;
        console.log(`[Scheduler] ${post.id}: moved to draft (review mode or outside ${dayName} ${hour}h window)`);
      }
    } catch (err) {
      result.failed++;
      console.error(`[Scheduler] ${post.id}: tick error:`, (err as Error).message);
    }
  }

  // Record last run (per-user when scoped, else global heuristic)
  try {
    if (userId) {
      await db
        .update(automationSettings)
        .set({ lastRunAt: now })
        .where(eq(automationSettings.userId, userId));
    } else {
      await db.execute(
        sql`UPDATE automation_settings SET last_run_at = NOW() WHERE last_run_at IS NULL OR last_run_at < NOW() - INTERVAL '1 hour'`
      );
    }
  } catch {
    // non-fatal
  }

  return result;
}

/** Weekly draft generation: create scheduled posts for the next 7 days */
export async function runGenerationTick(userId?: string): Promise<{
  generated: number;
  failed: number;
}> {
  const result = { generated: 0, failed: 0 };
  if (!isPostgresAvailable() || !db) return result;

  const now = new Date();

  // Find users with automation enabled whose nextGenAt is due
  const whereClause = userId
    ? and(eq(automationSettings.enabled, true), eq(automationSettings.userId, userId))
    : eq(automationSettings.enabled, true);

  const users = await db
    .select({
      userId: automationSettings.userId,
      brandVoice: automationSettings.brandVoice,
      timezone: automationSettings.timezone,
      nextGenAt: automationSettings.nextGenAt,
    })
    .from(automationSettings)
    .where(whereClause);

  for (const cfg of users) {
    // Gate: only generate once per week (or if never generated)
    const nextGen = cfg.nextGenAt ? new Date(cfg.nextGenAt) : null;
    if (nextGen && nextGen > now) continue; // not yet

    try {
      const memoryContext = await getMemoryContext(cfg.userId);
      const tz = cfg.timezone || "Europe/Amsterdam";

      // Build 7 daily topics from the calendar plan + rolling patterns
      const topics = generateWeeklyTopics(now, tz);

      for (const item of topics) {
        try {
          const caption = await generateCaption(item.topic, cfg.brandVoice || undefined, memoryContext);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
            `Instagram post: ${item.topic}. Professional marketing visual.`
          )}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

          await db.insert(contentPosts).values({
            userId: cfg.userId,
            clientId: null,
            title: item.topic.slice(0, 255),
            caption,
            type: "social",
            status: "scheduled",
            date: item.date,
            imageUrl,
            instagramPostId: null,
            likes: 0,
            comments: 0,
            views: 0,
            referenceAssets: [],
          });
          result.generated++;
        } catch (err) {
          result.failed++;
          console.error("[Scheduler] Generation item failed:", item.topic, (err as Error).message);
        }
      }

      // Stamp next generation for 7 days later
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await db
        .update(automationSettings)
        .set({ nextGenAt: nextWeek })
        .where(eq(automationSettings.userId, cfg.userId));
    } catch (err) {
      console.error("[Scheduler] Generation tick failed for user", cfg.userId, (err as Error).message);
    }
  }

  return result;
}

/** Generate 7 topic/date pairs for the week ahead, informed by the briefing */
function generateWeeklyTopics(now: Date, tz: string): Array<{ date: Date; topic: string }> {
  const topics: Array<{ date: Date; topic: string }> = [];
  const templates = [
    "Pattern A — The scene: a moment from this week that connects to something bigger. What happened, what it means, question.",
    "Pattern B — The bridge: two worlds Isaac connects that most people don't see. The insight, the invitation.",
    "Pattern C — Milestone with meaning: credit others, say what's next, never humble-brag.",
    "Pattern D — Honest take: react to someone else's good news with a sharp fair question and an open invitation.",
    "Behind the music: one truth about writing or performing that fans don't usually hear.",
    "NetWorthy update: proof-in-motion, never oversold. What's moving this week.",
    "Sessiecat update: booking/escrow first. What's helping musicians right now.",
  ];

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    // Build a timezone-aware Date at 09:30 in the user's timezone
    const scheduled = makeTimeInTimezone(d, 9, 30, tz);

    const template = templates[(i - 1) % templates.length];
    topics.push({ date: scheduled, topic: template });
  }

  return topics;
}

/** Wire the scheduler loops. Call once from server bootstrap. */
export function startScheduler(): void {
  const publishTick = async () => {
    if (runningPublish) return;
    runningPublish = true;
    try {
      const r = await runPublishTick();
      if (r.checked > 0) {
        console.log(`[Scheduler] Publish tick: checked=${r.checked} published=${r.published} drafted=${r.drafted} failed=${r.failed}`);
      }
    } catch (err) {
      console.error("[Scheduler] Publish tick failed:", (err as Error).message);
    } finally {
      runningPublish = false;
    }
  };

  const genTick = async () => {
    if (runningGen) return;
    runningGen = true;
    try {
      const r = await runGenerationTick();
      if (r.generated > 0 || r.failed > 0) {
        console.log(`[Scheduler] Gen tick: generated=${r.generated} failed=${r.failed}`);
      }
    } catch (err) {
      console.error("[Scheduler] Gen tick failed:", (err as Error).message);
    } finally {
      runningGen = false;
    }
  };

  setTimeout(() => {
    publishTick();
    genTick();
  }, INITIAL_DELAY_MS);

  setInterval(publishTick, PUBLISH_TICK_MS);
  setInterval(genTick, GEN_TICK_MS);
  console.log("[Scheduler] Autopilot loops started (publish every 15min, gen daily)");
}
