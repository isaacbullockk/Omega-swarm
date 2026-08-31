/**
 * Omega Swarm v5.1 — Agent Memory Context
 *
 * Builds the "what the user has taught us" block injected into AI prompts
 * (planner, copywriter, agent chat). This is the mechanism that makes the
 * Memory Bank actually teach the agents instead of being a dead page.
 *
 * Guardrails:
 *  - hard cap on entries (8) and total characters (2000) so prompts stay lean
 *  - any DB failure degrades to an empty string (generation still works)
 */

import { db, isPostgresAvailable } from "../db/connection";
import { memories } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const MAX_ENTRIES = 8;
const MAX_CHARS = 2000;

export async function getMemoryContext(userId: string): Promise<string> {
  if (!isPostgresAvailable() || !db) return "";
  try {
    const rows = await db
      .select({
        title: memories.title,
        content: memories.content,
        type: memories.type,
      })
      .from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.date))
      .limit(MAX_ENTRIES);

    const knowledge = rows.filter((r) => r.content && r.content.trim().length > 0);
    if (knowledge.length === 0) return "";

    let block = "\n\nBRAND KNOWLEDGE (user-taught — respect this above defaults):";
    for (const r of knowledge) {
      const line = `\n- [${r.type}] ${r.title}: ${r.content}`;
      if (block.length + line.length > MAX_CHARS) break;
      block += line;
    }
    return block;
  } catch (err) {
    console.warn("[Memory] Context build failed (non-fatal):", (err as Error).message);
    return "";
  }
}
