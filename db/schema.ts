/**
 * Omega Swarm v5.0 — PostgreSQL Schema (Drizzle ORM)
 *
 * Replaces JSON file store with proper relational database.
 * All tables have created_at/updated_at timestamps.
 * Foreign keys enforce referential integrity.
 * Indexes optimize common queries.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  serial,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ─── Enums ─── */
export const campaignStatusEnum = pgEnum("campaign_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const agentOutputStatusEnum = pgEnum("agent_output_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "social",
  "video",
  "ad",
  "blog",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "published",
  "draft",
  "scheduled",
]);

export const videoStatusEnum = pgEnum("video_status", [
  "ready",
  "generating",
  "failed",
]);

export const socialPlatformEnum = pgEnum("social_platform", [
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "twitter",
  "linkedin",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "image",
  "video",
  "audio",
  "reference",
]);

export const memoryTypeEnum = pgEnum("memory_type", [
  "win",
  "loss",
  "pattern",
  // Memory Bank knowledge types (teaching the agents)
  "insight",
  "fact",
  "strategy",
  "feedback",
]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "post_created",
  "video_generated",
  "campaign_started",
  "campaign_completed",
  "agent_chat",
  "instagram_published",
  "user_login",
  "user_registered",
  "content_downloaded",
  "ai_generation",
]);

/* ─── Users & Auth ─── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }),
    role: varchar("role", { length: 20 }).notNull().default("user"), // user, admin
    isGuest: boolean("is_guest").notNull().default(false),
    guestExpiresAt: timestamp("guest_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sessions_token_idx").on(table.token),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

/* ─── Credits / Spending (€50 cap) ─── */

export const credits = pgTable(
  "credits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).notNull().default("50.00"),
    spent: decimal("spent", { precision: 10, scale: 2 }).notNull().default("0.00"),
    currency: varchar("currency", { length: 3 }).notNull().default("EUR"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("credits_user_id_idx").on(table.userId)]
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    serviceType: varchar("service_type", { length: 50 }).notNull(), // groq, openai, pollinations, kling
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("credit_transactions_user_id_idx").on(table.userId),
    index("credit_transactions_created_at_idx").on(table.createdAt),
  ]
);

/* ─── Clients (Brand Accounts) ─── */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    handle: varchar("handle", { length: 50 }).notNull(),
    tagline: text("tagline"),
    tier: integer("tier").notNull().default(1),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, paused, archived
    bioFull: text("bio_full"),
    bioMedium: text("bio_medium"),
    bioShort: text("bio_short"),
    location: varchar("location", { length: 100 }),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
    accentColor: varchar("accent_color", { length: 7 }),
    photoHeadshot: text("photo_headshot"),
    photoPerformance: text("photo_performance"),
    photoCasual: text("photo_casual"),
    website: text("website"),
    socialLinks: jsonb("social_links"), // { instagram, twitter, linkedin, youtube, tiktok, spotify }
    brandHierarchy: jsonb("brand_hierarchy"), // Array of tier objects
    namingRules: jsonb("naming_rules"), // Record of rule objects
    toneWords: jsonb("tone_words"), // Array of strings
    bannedPhrases: jsonb("banned_phrases"), // Array of strings
    contentPillars: jsonb("content_pillars"), // Array of pillar objects
    storyBank: jsonb("story_bank"), // Array of story objects
    calendarEntries: jsonb("calendar_entries"), // Array of calendar entries
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("clients_user_id_idx").on(table.userId),
    index("clients_status_idx").on(table.status),
  ]
);

/* ─── Assets (User-Uploaded Reference Content) ─── */

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: assetTypeEnum("type").notNull(),
    dataUrl: text("data_url"),
    url: text("url"),
    description: text("description"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    usedIn: jsonb("used_in").$type<string[]>().notNull().default([]), // content IDs
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("assets_user_id_idx").on(table.userId),
    index("assets_client_id_idx").on(table.clientId),
    index("assets_type_idx").on(table.type),
  ]
);

/* ─── Campaigns ─── */

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    objective: text("objective"),
    budget: varchar("budget", { length: 50 }),
    timeline: varchar("timeline", { length: 50 }),
    mode: varchar("mode", { length: 50 }).notNull().default("sequential"), // sequential, parallel, adaptive, battle
    status: campaignStatusEnum("status").notNull().default("queued"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    outputs: jsonb("outputs").$type<
      Array<{
        agentId: string;
        agentName: string;
        agentEmoji: string;
        status: "pending" | "running" | "completed" | "failed";
        output: string;
        startedAt?: string;
        completedAt?: string;
      }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("campaigns_user_id_idx").on(table.userId),
    index("campaigns_client_id_idx").on(table.clientId),
    index("campaigns_status_idx").on(table.status),
  ]
);

/* ─── Content Posts ─── */

export const contentPosts = pgTable(
  "content_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    caption: text("caption").notNull(),
    type: contentTypeEnum("type").notNull().default("social"),
    status: contentStatusEnum("status").notNull().default("draft"),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    imageUrl: text("image_url"),
    instagramPostId: varchar("instagram_post_id", { length: 100 }),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    views: integer("views").notNull().default(0),
    referenceAssets: jsonb("reference_assets").$type<
      Array<{ name: string; url?: string; dataUrl?: string; description?: string }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_posts_user_id_idx").on(table.userId),
    index("content_posts_client_id_idx").on(table.clientId),
    index("content_posts_status_idx").on(table.status),
    index("content_posts_type_idx").on(table.type),
  ]
);

/* ─── Generated Videos ─── */

export const generatedVideos = pgTable(
  "generated_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    prompt: text("prompt").notNull(),
    videoUrl: text("video_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    duration: integer("duration").notNull().default(0),
    aspectRatio: varchar("aspect_ratio", { length: 10 }).notNull().default("16:9"),
    provider: varchar("provider", { length: 50 }).notNull().default("pollinations"), // runway, pollinations, kling
    taskId: text("task_id"), // provider-side async task id (Runway)
    status: videoStatusEnum("status").notNull().default("ready"),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    referenceAssets: jsonb("reference_assets").$type<
      Array<{ name: string; url?: string; dataUrl?: string; description?: string }>
    >(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("generated_videos_user_id_idx").on(table.userId),
    index("generated_videos_client_id_idx").on(table.clientId),
    index("generated_videos_status_idx").on(table.status),
  ]
);

/* ─── Brand Voices ─── */

export const brandVoices = pgTable(
  "brand_voices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" })
      .unique(),
    tone: varchar("tone", { length: 100 }).notNull(),
    description: text("description").notNull(),
    samples: jsonb("samples").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("brand_voices_user_id_idx").on(table.userId),
    index("brand_voices_client_id_idx").on(table.clientId),
  ]
);

/* ─── Social Accounts ─── */

export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    accountName: varchar("account_name", { length: 100 }).notNull(),
    handle: varchar("handle", { length: 50 }).notNull(),
    connected: boolean("connected").notNull().default(false),
    accessToken: text("access_token"),
    pageId: varchar("page_id", { length: 100 }),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("social_accounts_user_id_idx").on(table.userId),
    index("social_accounts_client_id_idx").on(table.clientId),
    index("social_accounts_platform_idx").on(table.platform),
    uniqueIndex("social_accounts_user_platform_handle_idx").on(table.userId, table.platform, table.handle),
  ]
);

/* ─── Bookings ─── */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    clientName: varchar("client_name", { length: 100 }).notNull(),
    clientEmail: varchar("client_email", { length: 255 }).notNull(),
    clientCompany: varchar("client_company", { length: 100 }),
    serviceId: varchar("service_id", { length: 50 }).notNull(),
    serviceName: varchar("service_name", { length: 100 }).notNull(),
    date: varchar("date", { length: 20 }).notNull(),
    time: varchar("time", { length: 10 }).notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_status_idx").on(table.status),
    index("bookings_email_idx").on(table.clientEmail),
  ]
);

/* ─── Analytics Events ─── */

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    type: analyticsEventTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    agentColor: varchar("agent_color", { length: 7 }),
    agentName: varchar("agent_name", { length: 50 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_user_id_idx").on(table.userId),
    index("analytics_events_type_idx").on(table.type),
    index("analytics_events_created_at_idx").on(table.createdAt),
  ]
);

/* ─── Memories (Institutional Knowledge) ─── */

export const memories = pgTable(
  "memories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    type: memoryTypeEnum("type").notNull().default("pattern"),
    // Memory Bank knowledge fields — what the user teaches the agents.
    // `content` is injected into planner/copywriter prompts via memoryContext.
    content: text("content").notNull().default(""),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    source: varchar("source", { length: 255 }).notNull().default("user"),
    ctr: varchar("ctr", { length: 20 }),
    cpa: varchar("cpa", { length: 20 }),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    agents: text("agents"),
    confidence: integer("confidence"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("memories_user_id_idx").on(table.userId),
    index("memories_type_idx").on(table.type),
    index("memories_date_idx").on(table.date),
  ]
);

/* ─── Viral Videos ─── */

export const viralVideos = pgTable(
  "viral_videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    account: varchar("account", { length: 100 }).notNull(),
    caption: text("caption").notNull(),
    hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
    videoUrl: text("video_url").notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("viral_videos_user_id_idx").on(table.userId),
    index("viral_videos_status_idx").on(table.status),
  ]
);

/* ─── Content Assets (Library) ─── */

export const contentAssets = pgTable(
  "content_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: assetTypeEnum("type").notNull(),
    url: text("url").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    account: varchar("account", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("content_assets_user_id_idx").on(table.userId),
    index("content_assets_type_idx").on(table.type),
  ]
);

/* ─── Leads (Nemotron + Kimi Symbiosis) ─── */

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    company: varchar("company", { length: 100 }),
    source: varchar("source", { length: 100 }),
    behavior: text("behavior"),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    status: varchar("status", { length: 20 }).notNull().default("new"), // new, nurtured, review, sent, converted, lost
    score: integer("score").notNull().default(50),
    lastEmailSubject: text("last_email_subject"),
    lastEmailBody: text("last_email_body"),
    lastEmailValidated: boolean("last_email_validated"),
    validationIssues: jsonb("validation_issues"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("leads_user_id_idx").on(table.userId),
    index("leads_email_idx").on(table.email),
    index("leads_status_idx").on(table.status),
    index("leads_score_idx").on(table.score),
  ]
);

/* ─── Relations ─── */

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  credits: one(credits),
  clients: many(clients),
  assets: many(assets),
  campaigns: many(campaigns),
  contentPosts: many(contentPosts),
  generatedVideos: many(generatedVideos),
  brandVoices: many(brandVoices),
  socialAccounts: many(socialAccounts),
  bookings: many(bookings),
  analyticsEvents: many(analyticsEvents),
  memories: many(memories),
  viralVideos: many(viralVideos),
  contentAssets: many(contentAssets),
  leads: many(leads),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  assets: many(assets),
  campaigns: many(campaigns),
  contentPosts: many(contentPosts),
  generatedVideos: many(generatedVideos),
  brandVoice: one(brandVoices),
  socialAccounts: many(socialAccounts),
  bookings: many(bookings),
  memories: many(memories),
  viralVideos: many(viralVideos),
  contentAssets: many(contentAssets),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, { fields: [leads.userId], references: [users.id] }),
  client: one(clients, { fields: [leads.clientId], references: [clients.id] }),
}));

/* ─── Types ─── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type ContentPost = typeof contentPosts.$inferSelect;
export type GeneratedVideo = typeof generatedVideos.$inferSelect;
export type BrandVoice = typeof brandVoices.$inferSelect;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type ViralVideo = typeof viralVideos.$inferSelect;
export type ContentAsset = typeof contentAssets.$inferSelect;
export type Credit = typeof credits.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
