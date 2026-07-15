import { pgTable, serial, varchar, text, timestamp, json, integer } from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  objective: text("objective").notNull(),
  budget: varchar("budget", { length: 50 }),
  timeline: varchar("timeline", { length: 50 }),
  status: varchar("status", { length: 50 }).default("queued"),
  mode: varchar("mode", { length: 50 }),
  progress: integer("progress").default(0),
  agentsDeployed: integer("agents_deployed").default(0),
  tasksCompleted: integer("tasks_completed").default(0),
  tasksTotal: integer("tasks_total").default(0),
  roi: varchar("roi", { length: 50 }),
  startDate: varchar("start_date", { length: 50 }),
  endDate: varchar("end_date", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignOutputs = pgTable("campaign_outputs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  agentId: varchar("agent_id", { length: 100 }),
  agentName: varchar("agent_name", { length: 255 }),
  agentEmoji: varchar("agent_emoji", { length: 10 }),
  status: varchar("status", { length: 50 }).default("pending"),
  output: text("output"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const brandVoices = pgTable("brand_voices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").default(1),
  name: varchar("name", { length: 255 }),
  tone: text("tone"),
  description: text("description"),
  samples: json("samples").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentAssets = pgTable("content_assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  type: varchar("type", { length: 50 }),
  url: text("url"),
  tags: json("tags").$type<string[]>(),
  account: varchar("account", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const viralVideos = pgTable("viral_videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  account: varchar("account", { length: 100 }),
  caption: text("caption"),
  hashtags: json("hashtags").$type<string[]>(),
  videoUrl: text("video_url"),
  status: varchar("status", { length: 50 }).default("ready"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }),
  handle: varchar("handle", { length: 100 }),
  accountName: varchar("account_name", { length: 255 }),
  accessToken: text("access_token"),
  connected: integer("connected").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
