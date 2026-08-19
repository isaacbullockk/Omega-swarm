import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgres://localhost:5432/omega_swarm",
  },
  strict: true,
  verbose: true,
} satisfies Config;
