/**
 * Omega Swarm — Isaac Bullock Master Briefing (source of truth for agents)
 *
 * Parsed from the Master Briefing document Isaac supplied (September 2026).
 * Two exports:
 *   BRIEFING_MEMORIES  — typed Memory Bank entries (one-click import teaches
 *                        every agent the facts, the voice, and the 2026 plan)
 *   CALENDAR_PLAN      — the September/October 2026 content calendar used by
 *                        the "Generate Calendar" feature (drafts only, nothing
 *                        auto-publishes)
 *
 * Keep entries SHORT and FACTUAL. The memory context injected into prompts is
 * capped (~3000 chars, newest first), so the highest-value rules live in the
 * entries listed last here (imported newest).
 */

export interface BriefingMemory {
  title: string;
  content: string;
  type: "insight" | "fact" | "strategy" | "feedback" | "win" | "loss" | "pattern";
  tags: string[];
}

export const BRIEFING_MEMORIES: BriefingMemory[] = [
  {
    title: "Who Isaac is",
    content:
      "Isaac Bullock Kintu. Ugandan-born, former refugee, 25 years in the Netherlands, based in Amstelveen. Ex-Accenture strategist (Global Inclusion & Diversity Excellence Award 2016). Founder of 6+ ventures. Singer-songwriter and frontman of WILDNOFF.",
    type: "fact",
    tags: ["identity", "bio"],
  },
  {
    title: "Kyakuwa meaning (never mistranslate)",
    content:
      "Kyakuwa is Isaac's artist name, given by his mother after the proverb: what God gives, you accept with open hands. Meaning: \"Accept the Gift.\" NEVER translate it as \"a gift from God.\"",
    type: "fact",
    tags: ["identity", "kyakuwa"],
  },
  {
    title: "Credentials and stages",
    content:
      "ISC award-winning songwriter (International Songwriting Competition 2020). TEDxHilversum 2016: \"Cutting Luck Out of the Equation.\" Stages: Paradiso, North Sea Jazz, HaarlemJazz (10 consecutive years), ChangeNOW Paris. War Child theme song with Lavinia Meijer. National TV (Beau) anti-laughing-gas campaign that helped change the law.",
    type: "fact",
    tags: ["credentials", "proof"],
  },
  {
    title: "NetWorthy venture",
    content:
      "Matching platform for overlooked talent. Rules-based, explainable, auditable matching with anonymous mode. EU AI Act compliant by design. Solo founder, 7 years in development, academic dialogue with VU Amsterdam and HvA. Standalone venture, NOT a successor of Refugee Talent Hub.",
    type: "fact",
    tags: ["networthy", "venture"],
  },
  {
    title: "Sessiecat venture",
    content:
      "All-in-one platform for musicians, bandleaders and tour managers: booking holds, setlists and sheet music, payouts/escrow, tour logistics, gear leads, GDPR-compliant. It is a PLATFORM. Lead with the booking/escrow USP, not audio features. sessiecat.com",
    type: "fact",
    tags: ["sessiecat", "venture"],
  },
  {
    title: "Taglines and home links",
    content:
      "Tagline: \"I connect the seemingly unconnected.\" Supporting line: \"I invite people to feel something, then inspire them to move.\" Every post links home: Spotify or isaacbullock.org. Instagram @isaacbullockk, LinkedIn /in/isaacbullock.",
    type: "fact",
    tags: ["tagline", "links"],
  },
  {
    title: "2026 music release calendar",
    content:
      "Weekly Sunday releases via UnitedMasters. Sand in the Wind Sept 5. Persevere Sept 8 (Hard Rock Rising show day). Smile My Boy Sept 10. Two held-back toppers Sept 13 and Sept 20. EP \"Accept the Gift\" Sept 27: Smile My Boy, Persevere, Sand in the Wind, Onumya, Path or Walker. Spotify editorial pitch at least 7 days before each release.",
    type: "strategy",
    tags: ["2026", "music", "calendar"],
  },
  {
    title: "NetWorthy 2026 priorities",
    content:
      "WSAI pavilion Oct 7-8 at Taets. AI Matchmaking event Oct 7. October micro-pilot in Amsterdam: 20 talents, 2 employers. The pilot is the year's most important proof point and prices the seed round: EUR 500k, close H1 2027. Frame traction as proof-in-motion, never oversell.",
    type: "strategy",
    tags: ["2026", "networthy"],
  },
  {
    title: "Sessiecat 2026 priorities",
    content:
      "Slush mission application submitted. Tester recruitment from Isaac's own musician network. Lead with booking/escrow USP. Stripe Connect Express for compliant payouts. Band claim-link pilot at rehearsals.",
    type: "strategy",
    tags: ["2026", "sessiecat"],
  },
  {
    title: "Content patterns",
    content:
      "A. The scene: mid-moment, what happened, what it means, question. B. The bridge: two worlds he connects, the insight only he can see, invitation. C. Milestone with meaning: achievement as story, credit to others, what's next. D. The honest take: positive about someone's news, one sharp fair question, open invitation, never an attack.",
    type: "strategy",
    tags: ["voice", "patterns"],
  },
  {
    title: "Platform rules",
    content:
      "LinkedIn: native uploads only, never YouTube links. Tag people in the story. Post Tue-Thu 9-11. Reply to every comment in the first hour. Instagram/TikTok/Shorts: vertical video, captions on everything, same clip natively to all three. Max 3 hashtags on LinkedIn.",
    type: "strategy",
    tags: ["voice", "platforms"],
  },
  {
    title: "Banned in Isaac's copy",
    content:
      "NEVER: em dashes, semicolons in social copy, buzzwords (passionate, thrilled, humbled and honoured, game-changer), humble-brags, long backstory before the point, hashtag walls, press-release tone.",
    type: "strategy",
    tags: ["voice", "banned"],
  },
  {
    title: "Voice hard rules",
    content:
      "Warm, direct, personal, confident without bragging. Story first, meaning second, call to action last. Hook first line: the first sentence must stop the scroll on its own. English by default, Dutch when the audience is clearly Dutch-local. Short paragraphs of 1-3 sentences. End with an easy question or invitation people can actually answer. Show the scene, then name the meaning. Humble authority: he shares stages with big names as a peer, not a fan.",
    type: "strategy",
    tags: ["voice", "rules"],
  },
  {
    title: "Honesty is strategy",
    content:
      "Isaac's ventures are early and he says so plainly. Never oversell traction; frame it as proof-in-motion. Never fabricate numbers, names or credentials. If a fact is not in the briefing, ask Isaac before inventing. If a post serves none of the 2026 priorities, say so and propose one that does.",
    type: "insight",
    tags: ["honesty", "decision-rules"],
  },
];

/** September/October 2026 content calendar (drafts for review, not auto-posts) */
export interface CalendarPlanItem {
  date: string; // ISO date
  topic: string;
}

export const CALENDAR_PLAN: CalendarPlanItem[] = [
  {
    date: "2026-09-05T09:00:00+02:00",
    topic: "Release day: \"Sand in the Wind\" by Kyakuwa is out now. The scene: a song about holding on when everything moves. Pattern C: milestone with meaning. Link to Spotify.",
  },
  {
    date: "2026-09-08T09:30:00+02:00",
    topic: "Show day: Hard Rock Rising with WILDNOFF tonight, and \"Persevere\" drops the same day. Band: Jose, Pedro, Joshua, Olivier, Raymond, credit them by name. Pattern C: milestone with meaning.",
  },
  {
    date: "2026-09-10T09:30:00+02:00",
    topic: "\"Smile My Boy\" is out. A father watching his son become himself. Pattern A: the scene, then what it means, then a question parents can answer.",
  },
  {
    date: "2026-09-13T10:00:00+02:00",
    topic: "Sunday release: another held-back topper from the upcoming EP \"Accept the Gift\". Build curiosity for the EP without naming the track as filler. Pattern A.",
  },
  {
    date: "2026-09-16T09:00:00+02:00",
    topic: "Entered the International Songwriting Competition 2026 with \"Sand in the Wind\" (R&B/Soul) and \"Persevere\" (Singer-Songwriter). ISC 2020 winner returning. Pattern C, credit the ISC community.",
  },
  {
    date: "2026-09-20T10:00:00+02:00",
    topic: "Sunday release: the last held-back topper before the EP. One week to \"Accept the Gift\" (Sept 27). Pattern A: the scene of writing it, then the invitation to pre-save.",
  },
  {
    date: "2026-09-27T10:00:00+02:00",
    topic: "EP release day: \"Accept the Gift\" is out. Five tracks: Smile My Boy, Persevere, Sand in the Wind, Onumya, Path or Walker. The Kyakuwa proverb behind the title. Pattern C: the milestone as story, credit to everyone who carried it, what is next.",
  },
  {
    date: "2026-10-07T09:00:00+02:00",
    topic: "World Summit AI week: NetWorthy at Taets, Oct 7-8, and the AI Matchmaking event Oct 7. The bridge pattern: overlooked talent meets explainable, auditable matching. \"The talent is there, the bridges are missing.\" Invitation to meet at the pavilion.",
  },
];
