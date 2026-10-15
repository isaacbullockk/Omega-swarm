/**
 * TEMPLATE SLAYER
 *
 * Doel: vervang generieke "Pattern A/B/C" templates door harde feiten
 * uit masterBriefing.ts. Genereert een chronologische content-kalender
 * gebaseerd op Isaac's echte mijlpalen.
 *
 * Gebruik:
 *   npx tsx scripts/template-slayer.ts
 *
 * Output: JSON array met posts die direct in de database kunnen.
 */

import { BRIEFING_MEMORIES, CALENDAR_PLAN } from "../src/data/masterBriefing";

interface RealPost {
  date: string;
  topic: string;
  eventType: "milestone" | "release" | "performance" | "venture" | "reflection";
  status: "upcoming" | "past" | "today";
  hardDeadline: string | null;
  captionPrompt: string;
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function classifyDate(dateStr: string): { status: RealPost["status"]; urgency: number } {
  const today = new Date(todayIso());
  const d = new Date(dateStr);
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: "past", urgency: 0 };
  if (diffDays === 0) return { status: "today", urgency: 10 };
  if (diffDays <= 7) return { status: "upcoming", urgency: 5 };
  return { status: "upcoming", urgency: 2 };
}

function buildPrompt(item: (typeof CALENDAR_PLAN)[number], status: string): string {
  // Haal relevante memories op
  const identity = BRIEFING_MEMORIES.find((m) => m.content.includes("Ugandan-born"))?.content || "";
  const voiceRules = BRIEFING_MEMORIES.find((m) => m.content.includes("NO em dashes"))?.content || "";
  const tagline = BRIEFING_MEMORIES.find((m) => m.content.includes("I connect the seemingly unconnected"))?.content || "";

  const base = `[IDENTITY] ${identity}\n[VOICE] ${voiceRules}\n[TAGLINE] ${tagline}\n\n`;

  if (status === "past") {
    return base + `Schrijf een terugblik op: ${item.topic}. Reflecteer op wat het betekende. Eindig met een vraag aan je volgers. Geen sjablonen. Geen em-dashes. Hook op regel 1.`;
  }

  if (status === "today") {
    return base + `VANDAAG: ${item.topic}. Schrijf een live post alsof je nu op het podium staat of de release net dropt. Scene eerst, betekenis daarna. Eindig met een vraag.`;
  }

  // upcoming
  if (item.topic.toLowerCase().includes("ep") || item.topic.toLowerCase().includes("release")) {
    return base + `AANKONDIGING: ${item.topic}. Datum: ${item.date}. Schrijf een countdown-post. Wat is het nummer dat je het meest raakt? Waarom nu? Geen "ik ben zo dankbaar" — concrete details. Eindig met een vraag.`;
  }

  if (item.topic.toLowerCase().includes("hard rock") || item.topic.toLowerCase().includes("jazz") || item.topic.toLowerCase().includes("festival")) {
    return base + `OPTREDEN: ${item.topic}. Datum: ${item.date}. Beschrijf het venue, het publiek, de setlist. Waarom deze stad? Eindig met een vraag.`;
  }

  return base + `POST: ${item.topic}. Datum: ${item.date}. Schrijf een authentieke post in Isaac's stem. Scene eerst, betekenis daarna. Eindig met een vraag.`;
}

function main() {
  console.log("\n=== TEMPLATE SLAYER ===\n");
  console.log(`Vandaag: ${todayIso()}\n`);

  const posts: RealPost[] = CALENDAR_PLAN.map((item) => {
    const { status, urgency } = classifyDate(item.date);
    const prompt = buildPrompt(item, status);

    return {
      date: item.date,
      topic: item.topic,
      eventType: item.topic.toLowerCase().includes("ep") || item.topic.toLowerCase().includes("release")
        ? "release"
        : item.topic.toLowerCase().includes("hard rock") || item.topic.toLowerCase().includes("jazz")
        ? "performance"
        : item.topic.toLowerCase().includes("networthy") || item.topic.toLowerCase().includes("sessiecat")
        ? "venture"
        : "milestone",
      status,
      hardDeadline: status === "upcoming" && urgency >= 5 ? item.date : null,
      captionPrompt: prompt,
    };
  });

  // Sorteer: eerst upcoming met deadline, dan vandaag, dan rest
  posts.sort((a, b) => {
    const urgency = { today: 3, upcoming: 2, past: 1 };
    const diff = urgency[b.status] - urgency[a.status];
    if (diff !== 0) return diff;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  console.log(`Generated ${posts.length} real posts\n`);

  for (const post of posts) {
    const marker = post.status === "today" ? "🔴 TODAY" : post.status === "upcoming" ? "⏳ UPCOMING" : "📁 ARCHIVE";
    const deadline = post.hardDeadline ? ` [DEADLINE: ${post.hardDeadline}]` : "";
    console.log(`${marker} ${post.date} | ${post.eventType.toUpperCase()} | ${post.topic}${deadline}`);
  }

  console.log("\n--- Caption Prompt (eerste upcoming) ---");
  const firstUpcoming = posts.find((p) => p.status === "upcoming");
  if (firstUpcoming) {
    console.log(firstUpcoming.captionPrompt);
  }

  // Output als importeerbaar JSON
  const outputPath = "/tmp/real-posts.json";
  require("fs").writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`\n✅ Output opgeslagen naar: ${outputPath}`);
  console.log(`   Kopieer deze naar de app om te importeren als scheduled posts.\n`);
}

main();
