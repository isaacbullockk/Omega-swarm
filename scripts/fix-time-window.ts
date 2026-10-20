/**
 * FIX TIME WINDOW — Remove time window restriction so posts publish anytime
 *
 * The mission generates posts at 7:30, 9:00, 19:00 etc.
 * The autopilot only publishes between 9:00-11:00 by default.
 * Posts outside that window become "draft" instead of published.
 *
 * This script widens the window to cover the full day.
 */

import { db, isPostgresAvailable } from "../db/connection";
import { automationSettings } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("\n=== FIX TIME WINDOW ===\n");

  if (!isPostgresAvailable() || !db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  const rows = await db.select().from(automationSettings);

  if (rows.length === 0) {
    console.error("❌ No automation settings found");
    process.exit(1);
  }

  for (const row of rows) {
    await db.update(automationSettings)
      .set({
        timeWindowStart: 0,
        timeWindowEnd: 23,
      })
      .where(eq(automationSettings.id, row.id));

    console.log(`✅ Updated user ${row.userId}`);
    console.log(`   Time window: ${row.timeWindowStart}:00-${row.timeWindowEnd}:00 → 0:00-23:00 (full day)`);
  }

  console.log("\n🚀 Posts will now publish at ANY time of day, not just 9-11 AM.");
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
