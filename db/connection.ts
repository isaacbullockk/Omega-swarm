/**
 * Omega Swarm v5.0 — Database Connection (Drizzle ORM + PostgreSQL)
 *
 * Uses PostgreSQL connection pool from Railway (or local).
 * Falls back to local JSON store if DATABASE_URL is not available (development).
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  (() => {
    console.warn("[DB] No DATABASE_URL found — using local JSON fallback");
    return null;
  })();

export let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
export let pool: Pool | null = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 20, // connection pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    db = drizzle(pool, { schema });
    console.log("[DB] PostgreSQL connected successfully");
  } catch (err) {
    console.error("[DB] PostgreSQL connection failed:", (err as Error).message);
    console.warn("[DB] Falling back to local JSON store");
  }
}

export function isPostgresAvailable(): boolean {
  return db !== null && pool !== null;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log("[DB] PostgreSQL pool closed");
  }
}
