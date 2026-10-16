/**
 * MISSION: MUSICIANS ON STANDBY
 *
 * Objective: Get WILDNOFF booked for corporate gigs, artist support shows,
 * and event work by demonstrating one ownable proposition: a network of 800+
 * musicians on standby who can learn your set and deliver your gig, whatever
 * the genre, on almost no notice.
 *
 * WILDNOFF = the bookable brand.
 * Kyakuwa = one of the stories that proves it.
 *
 * Usage:
 *   npx tsx scripts/mission-kyakuwa-wildnoff.ts
 *
 * Output: /tmp/mission-kyakuwa-wildnoff.json — importable as scheduled posts.
 */

import { writeFileSync } from "fs";

interface MissionPost {
  id: string;
  date: string;
  platform: "linkedin" | "instagram";
  pillar: "one-rehearsal" | "any-genre" | "behind-standby" | "founder";
  topic: string;
  captionPrompt: string;
  cta: string;
  hashtags: string[];
}

function isoDate(daysFromNow: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const VOICE = `Hook on line 1 — the first sentence must stop the scroll.
Short paragraphs of 1-3 sentences. No em-dashes.
Warm, direct, personal. Humble authority.
English by default. Dutch only if the audience is clearly Dutch-local.
CTA always in the first comment (never in the post body itself).`;

const PROOF = `Jose Chameleone & Bobi Wine: one rehearsal with standby musicians, then shut down Amsterdam.
Kyakuwa: two rehearsals, runner-up Hard Rock Rising 2026 (2nd of 70 acts).
WILDNOFF: Paradiso, Bimhuis, Concertgebouw, North Sea Jazz.
Clients: Accenture, Oracle, VodafoneZiggo.
800+ musicians in the network. Formations of 6-12 members, handpicked per event.
Genres: Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop & more.`;

const PITCH = `It is not a band. It is infrastructure.
Musicians so prepared, so broad and so professional that the rehearsal count is measured in single digits.
We do not sell a setlist. We sell aliveness — the feeling in the room when something unexpected and beautiful happens live, in real time, with no safety net.`;

const CTA = `Send us your songs.
DM or email info@isaacbullock.com`;

const posts: MissionPost[] = [
  // ─── PILLAR: One-Rehearsal Stories ───
  {
    id: "ms-001",
    date: isoDate(2, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "Jose Chameleone & Bobi Wine: one rehearsal, Amsterdam shut down.",
    captionPrompt: `${VOICE}\n\nScene: the call comes in. Jose Chameleone and Bobi Wine — two of East Africa's biggest artists — play tomorrow in Amsterdam. Their own band could not make it.\n\nOne rehearsal. One. With musicians they had never met.\n\nThat night the room went silent and then exploded. That is not talent alone — that is infrastructure. 800+ musicians on standby who learn your set, understand your sound, and deliver your gig like they have played with you for years.\n\n${PITCH}\n\n${PROOF}\n\nEnd with a question: how many rehearsals did your last live act need?`,
    cta: CTA,
    hashtags: ["#livemusic", "#eventprofs", "#amsterdam"],
  },
  {
    id: "ms-002",
    date: isoDate(5, 19, 0),
    platform: "instagram",
    pillar: "one-rehearsal",
    topic: "Kyakuwa: two rehearsals, runner-up out of 70 acts.",
    captionPrompt: `${VOICE}\n\nScene: Hard Rock Rising 2026. 70 acts. Bands that had played together for years. Kyakuwa had two rehearsals.\n\nTwo.\n\nNot because it was sloppy. Because the standby musicians already knew the repertoire before the first note dropped. Because the network is so broad that the right players are always available — not available-ish, but available-tomorrow.\n\n${PITCH}\n\nEnd with a question: when did you know you were ready for the stage?`,
    cta: CTA,
    hashtags: ["#kyakuwa", "#hardrockrising", "#livemusic", "#amsterdam"],
  },
  {
    id: "ms-003",
    date: isoDate(9, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "The call every event manager knows — and how we answer it.",
    captionPrompt: `${VOICE}\n\n"The drummer is sick. The gig is tomorrow. Can you do it?"\n\nThe standard answers: no, maybe, or a replacement who does not know the repertoire. Our answer: yes. And not yes-with-an-asterisk, but yes-with-the-same-quality.\n\n${PITCH}\n\n800+ musicians. 6-12 per formation. Handpicked for your event. Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop. The rehearsal count? Single digits. Always.\n\n${PROOF}\n\nEnd with a question: what is the worst last-minute replacement you have ever experienced?`,
    cta: CTA,
    hashtags: ["#eventprofs", "#livemusic", "#corporateevents"],
  },

  // ─── PILLAR: Any Genre, Proof It ───
  {
    id: "ms-004",
    date: isoDate(12, 19, 0),
    platform: "instagram",
    pillar: "any-genre",
    topic: "The same musicians. Week 1: Afrobeat. Week 2: Rock. Week 3: Corporate pop.",
    captionPrompt: `${VOICE}\n\nThese are the same people.\n\nNot an Afrobeat department and a Rock department. The same musicians who week 1 play an Afrobeat set for 800 people, week 2 play a Rock set for a corporate year-end party, and week 3 play a Pop set as artist support for an international act.\n\nHow? Because we are not a band. We are infrastructure. The musician who played Fela Kuti yesterday plays Stevie Wonder today and your original set tomorrow.\n\n${PITCH}\n\n${PROOF}\n\nEnd with a question: which artist would you want to hear played by a band that never met them?`,
    cta: CTA,
    hashtags: ["#afrobeat", "#rock", "#pop", "#livemusic"],
  },
  {
    id: "ms-005",
    date: isoDate(16, 9, 0),
    platform: "linkedin",
    pillar: "any-genre",
    topic: "Accenture, Oracle, VodafoneZiggo — why corporates book us.",
    captionPrompt: `${VOICE}\n\nCorporates do not book bands. They book certainty.\n\nAccenture. Oracle. VodafoneZiggo. They choose WILDNOFF not because we are cheap. They choose us because we are the one thing cheap is not: premium, prepared, and with no surprises on the day.\n\nThe brief comes in: "We want Afrobeat with a Jazz twist, for 600 people, in three weeks." Our response: "Send us your songs. We are there."\n\n${PITCH}\n\n${PROOF}\n\nEnd with a question: what is the most important thing you look for in a live act for your next event?`,
    cta: CTA,
    hashtags: ["#corporateevents", "#eventprofs", "#livemusic"],
  },
  {
    id: "ms-006",
    date: isoDate(19, 19, 0),
    platform: "instagram",
    pillar: "any-genre",
    topic: "Artist support: you fly in, we are already on stage.",
    captionPrompt: `${VOICE}\n\nInternational act flies to the Netherlands. Cannot bring their own band. The solution they expect: a local cover band playing their hits.\n\nThe solution they get: standby musicians who learn their set like they have been on tour for years.\n\nJose Chameleone & Bobi Wine. One rehearsal. That is the proof.\n\n${PITCH}\n\n${PROOF}\n\nEnd with a question: which international artist would you want to see with a local band that knows their set?`,
    cta: CTA,
    hashtags: ["#artistsupport", "#livemusic", "#touring", "#amsterdam"],
  },

  // ─── PILLAR: Behind the Standby ───
  {
    id: "ms-007",
    date: isoDate(23, 9, 0),
    platform: "linkedin",
    pillar: "behind-standby",
    topic: "How the network works: the call, the match, the readiness.",
    captionPrompt: `${VOICE}\n\nIt is 14:00. The call comes in. Drummer sick, gig tomorrow 20:00.\n\nStep 1: the setlist is sent through.\nStep 2: the network is scanned — not by genre, but by readiness. Who has the evening free, knows the repertoire, and has played with these musicians before?\nStep 3: within 2 hours the replacement is confirmed.\nStep 4: one rehearsal. Sometimes none.\nStep 5: the gig.\n\n${PITCH}\n\n800+ musicians. Not a database. A network of people who know each other, trust each other, and cover for each other. That is why it works.\n\nEnd with a question: how many of your suppliers would arrange a replacement within 2 hours?`,
    cta: CTA,
    hashtags: ["#eventprofs", "#operations", "#livemusic"],
  },
  {
    id: "ms-008",
    date: isoDate(26, 19, 0),
    platform: "instagram",
    pillar: "behind-standby",
    topic: "Recruitment: you could be the next one on that stage.",
    captionPrompt: `${VOICE}\n\nEvery post is also a call.\n\nAre you a musician? Do you play Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop? Have you ever stood on a stage and thought: "I would do this more often, but I do not know how to get the gigs?"\n\nWe know how. 800+ musicians. Open jams every 2nd Sunday in Amsterdam. Gigs ranging from intimate dinners to Paradiso and North Sea Jazz.\n\nYou do not need a full band. You only need to be ready.\n\nEnd with a question: which stage is on your bucket list?`,
    cta: "DM us your demo.",
    hashtags: ["#musicianswanted", "#amsterdam", "#livemusic", "#joinus"],
  },
  {
    id: "ms-009",
    date: isoDate(30, 9, 0),
    platform: "linkedin",
    pillar: "behind-standby",
    topic: "From 40 musicians to 800+: the 15-year growth of WILDNOFF.",
    captionPrompt: `${VOICE}\n\n2010. Cafe Storing. 40 musicians, 200 music lovers. An open session no one knew was a beginning.\n\nNow: 800+ musicians. Paradiso. Bimhuis. Concertgebouw. North Sea Jazz. Hard Rock Rising. Accenture. Oracle. VodafoneZiggo.\n\nThe growth was not planned. It was the result of one thing: everyone who stood on that stage brought someone who was also ready. Not by referral — by proof.\n\n${PITCH}\n\nEnd with a question: what is the best network you have built organically?`,
    cta: CTA,
    hashtags: ["#network", "#growth", "#livemusic", "#amsterdam"],
  },

  // ─── PILLAR: The Founder Frontman ───
  {
    id: "ms-010",
    date: isoDate(33, 19, 0),
    platform: "instagram",
    pillar: "founder",
    topic: "Isaac Bullock: TEDx speaker who also shuts down Paradiso.",
    captionPrompt: `${VOICE}\n\nIsaac Bullock Kintu. TEDxHilversum. ChangeNOW Paris, 3,000 people, closed with a song. Accenture Marketing Lead & Digital Channels Lead. 8+ years. Raised 1M euros for Solarus Sunpower.\n\nAnd then: Paradiso. North Sea Jazz. Hard Rock Rising runner-up. ISC 2020 winner.\n\nThe bridge: he connects the seemingly unconnected. The boardroom and the stage are not two worlds for him — it is one conversation at different volumes.\n\nEnd with a question: do you know someone who connects two worlds no one else sees?`,
    cta: CTA,
    hashtags: ["#isaacbullock", "#tedx", "#paradiso", "#livemusic"],
  },
  {
    id: "ms-011",
    date: isoDate(37, 9, 0),
    platform: "linkedin",
    pillar: "founder",
    topic: "Kyakuwa: the story behind the name, and why it explains the mission.",
    captionPrompt: `${VOICE}\n\nKyakuwa does not mean "a gift from God." It means: "Accept the Gift."\n\nThe proverb from Isaac's mother: "What God gives, you accept with open hands." Not passive receiving. Active accepting.\n\nThat is the entire mission. We do not just give a performance. We give a chance — to artists who cannot bring their band, to event managers who are stuck, to musicians who want to be on stage but do not know how.\n\nAccept the Gift. That is what we ask. And what we deliver.\n\nEnd with a question: what gift have you recently accepted that changed your life?`,
    cta: CTA,
    hashtags: ["#kyakuwa", "#mission", "#leadership", "#music"],
  },
  {
    id: "ms-012",
    date: isoDate(40, 19, 0),
    platform: "instagram",
    pillar: "founder",
    topic: "The 6 ventures of Isaac Bullock — and why WILDNOFF is the heart.",
    captionPrompt: `${VOICE}\n\nSessiecat. NetWorthy. BuurtPlay. Kitufu Residences. Quipu. Omega Swarm. And WILDNOFF.\n\nSix ventures. One pattern: connecting what seems unconnected.\n\nSessiecat connects musicians with gigs. NetWorthy connects talent with work without CVs. BuurtPlay connects neighbors with sports. Kitufu connects fans with Africa. Quipu connects clean cooking with carbon credits. Omega Swarm connects AI with marketing.\n\nWILDNOFF connects all of them — because without the music the other ventures are ideas. With the music they are proof.\n\nEnd with a question: which project of yours is the heart that everything else revolves around?`,
    cta: CTA,
    hashtags: ["#entrepreneur", "#wildnoff", "#kyakuwa", "#mission"],
  },

  // ─── BONUS: Year-end push ───
  {
    id: "ms-013",
    date: isoDate(44, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "Year-end parties: why November is the best month to book.",
    captionPrompt: `${VOICE}\n\nNovember. The year-end parties are being planned. Most bands are already fully booked. The good bands even more so.\n\nOur advantage: we are not one band. We are 800+ musicians. If one formation is full, we build a new one. For your genre. For your venue. For your date.\n\n${PITCH}\n\n${PROOF}\n\nThe only question we ask: "Send us your songs. We are there."\n\nEnd with a question: when do you book your live act for the year-end party?`,
    cta: CTA,
    hashtags: ["#yearendparty", "#corporateevents", "#eventprofs"],
  },
];

function main() {
  console.log("\n=== MISSION: MUSICIANS ON STANDBY ===\n");
  console.log("Objective: Get WILDNOFF booked for corporate gigs, artist support, events.");
  console.log("Proposition: 800+ musicians on standby. Any genre. Single-digit rehearsals.");
  console.log("Primary channel: LinkedIn (bookers). Secondary: Instagram (visual proof).\n");

  const byPillar: Record<string, MissionPost[]> = {};
  for (const p of posts) {
    byPillar[p.pillar] = byPillar[p.pillar] || [];
    byPillar[p.pillar]!.push(p);
  }
  for (const [pillar, list] of Object.entries(byPillar)) {
    console.log(`${pillar}: ${list.length} posts`);
  }

  console.log(`\nTotal: ${posts.length} posts over ~45 days (3/week cadence)\n`);

  for (const post of posts) {
    const date = new Date(post.date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const icon = post.platform === "linkedin" ? "💼" : "📸";
    console.log(`${icon} ${date} | ${post.pillar} | ${post.topic}`);
  }

  const outputPath = "/tmp/mission-kyakuwa-wildnoff.json";
  writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`\n✅ Mission saved to: ${outputPath}\n`);

  console.log("Success Metrics (3 months):");
  console.log("   • 3+ inbound booking inquiries/month");
  console.log("   • 1+ booked gig/month in EUR 3,500-5,000 range");
  console.log("   • 2+ artist-support bookings (one-rehearsal model)");
  console.log("   • 50+ new musician signups\n");
}

main();
