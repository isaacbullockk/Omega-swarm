/**
 * MISSION: THE ISAAC BULLOCK ENGINE
 *
 * Core strategy: Isaac Bullock is the product. WILDNOFF, Kyakuwa, NetWorthy,
 * Quipu and Ndeku are the proof. Every output pushes one name, not six logos.
 *
 * Uses REAL photos from Kyakuwa's Facebook Page when available.
 * When AI generation is needed, prompts are based on VISUAL IDENTITY analysis
 * of real content — not generic stock photo descriptions.
 *
 * Usage:
 *   npx tsx scripts/mission-isaac-bullock.ts
 *
 * Output: /tmp/mission-isaac-bullock.json — importable as scheduled posts.
 */

import { writeFileSync, readdirSync, existsSync, readFileSync } from "fs";

interface MissionPost {
  id: string;
  date: string;
  platform: "linkedin" | "instagram";
  pillar: "proof" | "founder-eye" | "musicians-on-standby" | "the-build";
  topic: string;
  captionPrompt: string;
  imagePath?: string;
  imagePrompt?: string;
  cta: string;
  hashtags: string[];
}

function isoDate(daysFromNow: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ─── Load real photos from Facebook fetch ───
const FB_PHOTO_DIR = "/tmp/fb-assets/photos";
const VISUAL_IDENTITY_FILE = "/tmp/visual-identity.json";

let realPhotos: string[] = [];
if (existsSync(FB_PHOTO_DIR)) {
  realPhotos = readdirSync(FB_PHOTO_DIR)
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .map((f) => `${FB_PHOTO_DIR}/${f}`);
}

// ─── Load visual identity for brand-informed AI prompts ───
let visualIdentity: any = null;
let brandPrompts: string[] = [];
if (existsSync(VISUAL_IDENTITY_FILE)) {
  try {
    visualIdentity = JSON.parse(readFileSync(VISUAL_IDENTITY_FILE, "utf-8"));
    brandPrompts = visualIdentity.examplePrompts || [];
  } catch {
    // ignore
  }
}

function getPhoto(index: number): { imagePath?: string; imagePrompt: string } {
  // Priority 1: Real photo
  if (realPhotos.length > 0) {
    const photo = realPhotos[index % realPhotos.length];
    return { imagePath: photo, imagePrompt: "Use real photo from Kyakuwa archive" };
  }

  // Priority 2: Brand-informed AI prompt based on visual identity analysis
  if (brandPrompts.length > 0) {
    const prompt = brandPrompts[index % brandPrompts.length];
    return { imagePrompt: prompt };
  }

  // Priority 3: Generate brand-informed prompt from scratch
  const subjects = [
    "Isaac Bullock holding a microphone, expressive gesture, engaging the crowd",
    "Full band performing, drummer with logo on bass drum, guitarist in yellow hoodie",
    "Isaac Bullock smiling, blue cap, colorful geometric mural background",
    "Crowd from behind the band, hands raised, lens flares from purple stage lights",
    "Backstage corridor, musician walking toward stage, anticipation",
    "Close-up of hands playing bass guitar, warm tungsten light",
    "Group of 30+ musicians and fans on stage, arms raised, celebration",
    "Isaac Bullock at a speaking event, warm spotlight, addressing audience",
    "Rehearsal studio, candid moment, musicians laughing between takes",
    "Isaac Bullock with guitar, street portrait, canal background",
    "Wide shot of packed venue, purple and blue stage lights, energy",
    "Drummer mid-performance, sweat visible, dramatic rim lighting",
  ];

  const lightings = [
    "dramatic purple and blue stage lighting with gels",
    "warm tungsten spotlights creating golden highlights",
    "cool blue LED wash with magenta accents",
    "high-contrast concert lighting, dark background, lit subject",
    "natural daylight streaming through windows",
    "mixed color temperature: warm stage + cool ambient",
  ];

  const compositions = [
    "wide angle, full stage visible",
    "medium shot, 2-3 subjects, shallow depth of field",
    "close-up, expressive face, emotional intensity",
    "overhead angle, showing crowd density",
    "low angle, looking up at performer, heroic framing",
    "asymmetric composition with negative space",
  ];

  const moods = [
    "joyful and energetic",
    "intimate and authentic",
    "professional but unpolished",
    "community-focused",
    "culturally rich African-European fusion",
    "documentary realism over studio perfection",
  ];
  const cameras = [
    "Canon EOS R5 with 24-70mm f/2.8",
    "Sony A7III with 85mm f/1.4",
    "Nikon D850 with 70-200mm f/2.8",
  ];
  const colorGrades = [
    "warm cinematic color grade with lifted blacks",
    "high contrast with crushed blacks and vivid highlights",
    "natural documentary color, slight film grain",
    "teal and orange split tone",
  ];

  const i = index;
  const prompt = `Professional music photography. ${subjects[i % 12]} on stage, ${lightings[i % 6]}. ${moods[i % 6]}. ${compositions[i % 6]}. Shot on ${cameras[i % 3]}. ${colorGrades[i % 4]}. Documentary feel, not stock photo. Authentic moment captured live. No text, no watermarks, no logos.`;

  return { imagePrompt: prompt };
}

const VOICE = `First person. Isaac Bullock's voice. English by default. Dutch only for Dutch audiences.
Hook first — the first sentence must stop the scroll.
Short paragraphs of 1-3 sentences. No em-dashes. No jargon.
Humble authority: receipts, not claims. "2 rehearsals, 70 acts, runner-up" beats "we're amazing."
Every post ends with one clear ask.
Always tag @isaacbullockk and @wildnoff.`;

const RECEIPTS = `Hard Rock Rising 2026: runner-up of 70 acts, after 2 rehearsals.
Jose Chameleone & Bobi Wine: one rehearsal with standby musicians, shut down Amsterdam.
Paradiso, Bimhuis, Concertgebouw, North Sea Jazz — 15+ years live.
TEDxHilversum. ChangeNOW Paris, 3,000 people, closed with a song.
Accenture Alumni keynote they still remember. 8+ years, Marketing Lead & Digital Channels Lead.
ISC 2020 winner (Best Social Causes Song). 146,301+ streams on Mary Jane.
18 partners at Royal Tropical Institute, built from 0.
Raised 1M euros for Solarus Sunpower.`;

const THE_ASK = {
  book: "Book WILDNOFF for your next event. DM me or go to isaacbullock.org.",
  invest: "Building Ndeku and Quipu. If you invest in founders who also play bass, DM me.",
  keynote: "I speak on stage and shut down rooms. Book me for your next event. isaacbullock.org.",
  songs: "Send us your songs. We will learn your set and deliver your gig. DM me.",
  read: "Full story at isaacbullock.org. Read it there.",
  follow: "Follow @isaacbullockk for the receipts.",
};

let photoIdx = 0;
function nextPhoto() {
  const p = getPhoto(photoIdx++);
  return p;
}

const posts: MissionPost[] = [
  // WEEK 1: PROOF STORIES
  {
    id: "ib-001", date: isoDate(2, 9, 0), platform: "linkedin", pillar: "proof",
    topic: "2 rehearsals. 70 acts. Runner-up. Here is what that actually means.",
    captionPrompt: `${VOICE}\n\nI had two rehearsals before Hard Rock Rising 2026.\n\nNot two weeks. Not two months. Two rehearsals.\n\nThe other 69 acts had played together for years. Some had toured. Some had record deals. We had a network of standby musicians who learned the set like they wrote it.\n\nRunner-up. Out of 70.\n\nThat is not talent. That is infrastructure. 800+ musicians who can step into any genre, any stage, any notice. I built that.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#hardrockrising", "#livemusic", "#amsterdam"],
    ...nextPhoto(),
  },
  {
    id: "ib-002", date: isoDate(4, 19, 0), platform: "instagram", pillar: "proof",
    topic: "Jose Chameleone and Bobi Wine. One rehearsal. Then Amsterdam shut down.",
    captionPrompt: `${VOICE}\n\nThe call came in at short notice. Jose Chameleone and Bobi Wine — two of East Africa's biggest artists — were playing Amsterdam tomorrow. Their band could not make the flight.\n\nOne rehearsal. With musicians they had never met.\n\nThat night the room went silent. Then it exploded.\n\nThat is what 800+ standby musicians do. They do not cover your songs. They deliver your gig.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.songs}`,
    cta: THE_ASK.songs, hashtags: ["#isaacbullock", "#wildnoff", "#livemusic", "#amsterdam"],
    ...nextPhoto(),
  },
  {
    id: "ib-003", date: isoDate(6, 9, 0), platform: "linkedin", pillar: "proof",
    topic: "From refugee to TEDx to Paradiso. The stage does not care where you started.",
    captionPrompt: `${VOICE}\n\nI was born in Uganda. Became a refugee. Moved to the Netherlands.\n\nThen I stood on the TEDxHilversum stage. Then ChangeNOW Paris, 3,000 people, closed with a song. Then Paradiso. Then North Sea Jazz. Then Bimhuis. Then Concertgebouw.\n\nThe stage does not care where you started. It cares what you bring.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.keynote}`,
    cta: THE_ASK.keynote, hashtags: ["#isaacbullock", "#tedx", "#paradiso", "#keynote"],
    ...nextPhoto(),
  },

  // WEEK 2: FOUNDER'S EYE
  {
    id: "ib-004", date: isoDate(9, 9, 0), platform: "linkedin", pillar: "founder-eye",
    topic: "The Railway invoice arrived. Here is what 300 euros of compute taught me.",
    captionPrompt: `${VOICE}\n\nThe Railway invoice arrived. 300 euros. For a month of compute.\n\nI stared at it. That is more than I spent on my first guitar. More than my first studio session. More than I paid the musicians for our first gig.\n\nThen I looked at what Ndeku produced: an autopilot that schedules, generates and publishes content. A diagnostics suite that proves whether your Instagram token actually works. A mission engine that turns 2 rehearsals and 70 acts into 13 weeks of content.\n\n300 euros is not a cost. It is proof that infrastructure beats labor.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.invest}`,
    cta: THE_ASK.invest, hashtags: ["#isaacbullock", "#founder", "#ndeku", "#buildinpublic"],
    ...nextPhoto(),
  },
  {
    id: "ib-005", date: isoDate(11, 19, 0), platform: "instagram", pillar: "founder-eye",
    topic: "Dutch weather. Dutch bookers. The founder who also plays bass.",
    captionPrompt: `${VOICE}\n\nIt is raining in Amsterdam. Again.\n\nI am looking at my calendar. Three pitches to bookers this week. Two investor calls. One rehearsal for a gig next month. And somewhere in between, I am fixing a Docker container because the scripts folder did not copy to the runtime image.\n\nThat is the founder's life. Not glamorous. Not separate. One person, six ventures, 800+ musicians, and a Docker file that needs one more line.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#founder", "#amsterdam", "#buildinpublic"],
    ...nextPhoto(),
  },
  {
    id: "ib-006", date: isoDate(13, 9, 0), platform: "linkedin", pillar: "founder-eye",
    topic: "The Accenture Alumni keynote they still remember. Here is why.",
    captionPrompt: `${VOICE}\n\nI left Accenture after 8+ years. Marketing Lead. Digital Channels Lead. Raised 1M euros for Solarus Sunpower.\n\nThen I got the call: "Will you come back and speak to the alumni?"\n\nI did. I talked about connecting the seemingly unconnected. About being the only person in the room who understood both the boardroom and the stage. About why the best strategists are the ones who have failed publicly.\n\nThey still remember it. Not because I was polished. Because I was honest.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.keynote}`,
    cta: THE_ASK.keynote, hashtags: ["#isaacbullock", "#accenture", "#keynote", "#strategy"],
    ...nextPhoto(),
  },

  // WEEK 3: MUSICIANS ON STANDBY
  {
    id: "ib-007", date: isoDate(16, 9, 0), platform: "linkedin", pillar: "musicians-on-standby",
    topic: "You get us your songs. We are ready for you. Genre does not matter.",
    captionPrompt: `${VOICE}\n\nI keep getting the same question: "What genre do you play?"\n\nThe answer: yes.\n\nSoul. Jazz. Funk. Pop. R&B. Afrobeat. Hip Hop. Last month we played Afrobeat for 800 people. This month corporate pop for Accenture. Next month we learn your set and deliver your gig.\n\n800+ musicians. 6 to 12 per formation. Handpicked for your event. Single-digit rehearsals. That is not a band. That is infrastructure.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.songs}`,
    cta: THE_ASK.songs, hashtags: ["#isaacbullock", "#wildnoff", "#livemusic", "#eventprofs"],
    ...nextPhoto(),
  },
  {
    id: "ib-008", date: isoDate(18, 19, 0), platform: "instagram", pillar: "musicians-on-standby",
    topic: "The same musicians. Week 1: Afrobeat. Week 2: Rock. Week 3: Your set.",
    captionPrompt: `${VOICE}\n\nThese are the same people.\n\nNot an Afrobeat department and a Rock department. The same musicians who played Fela Kuti last week, Stevie Wonder this week, and your original set next week.\n\nHow? Because we are not a band. We are a network of 800+ musicians who learn your sound, your feel, your stage presence — and deliver it like they have been on tour with you for years.\n\nOne rehearsal. Sometimes two. That is the proof.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.songs}`,
    cta: THE_ASK.songs, hashtags: ["#isaacbullock", "#wildnoff", "#afrobeat", "#rock", "#livemusic"],
    ...nextPhoto(),
  },
  {
    id: "ib-009", date: isoDate(20, 9, 0), platform: "linkedin", pillar: "musicians-on-standby",
    topic: "The call every event manager dreads — and how we answer it in 2 hours.",
    captionPrompt: `${VOICE}\n\n"The drummer is sick. The gig is tomorrow. Can you help?"\n\nThe standard answers: no, maybe, or a replacement who does not know the set.\n\nOur answer: yes. And not yes-with-an-asterisk. Yes-with-the-same-quality.\n\nStep 1: you send the setlist.\nStep 2: we scan the network. Not by genre. By readiness. Who is free, knows the repertoire, and has played with us before?\nStep 3: within 2 hours, the replacement is confirmed.\nStep 4: one rehearsal. Sometimes none.\nStep 5: the gig.\n\nThat is not magic. That is 800+ musicians who know each other, trust each other, and cover for each other.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#wildnoff", "#eventprofs", "#livemusic"],
    ...nextPhoto(),
  },

  // WEEK 4: THE BUILD
  {
    id: "ib-010", date: isoDate(23, 9, 0), platform: "linkedin", pillar: "the-build",
    topic: "Ndeku: an AI marketing agency built by a founder who also plays bass.",
    captionPrompt: `${VOICE}\n\nI built Ndeku because I was tired of marketing agencies that charge 5K euros and deliver a Canva template.\n\nNdeku does three things: it generates content from your real calendar, not generic templates. It verifies whether your Instagram token actually works before it promises to post. It runs a 90-day drip campaign from one moment — like a runner-up finish at Hard Rock Rising.\n\nThe difference: I built it. I use it. I know where it breaks. And I fix it.\n\nThat is what happens when the founder also plays bass. You do not pitch. You prove.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.invest}`,
    cta: THE_ASK.invest, hashtags: ["#isaacbullock", "#ndeku", "#ai", "#buildinpublic"],
    ...nextPhoto(),
  },
  {
    id: "ib-011", date: isoDate(25, 19, 0), platform: "instagram", pillar: "the-build",
    topic: "Quipu: clean cooking meets carbon credits. Built by a musician.",
    captionPrompt: `${VOICE}\n\nQuipu connects clean cooking with carbon credits.\n\nNot because I am an energy expert. Because I am a founder who connects the seemingly unconnected. Artists, capital, technology, and the people building all three.\n\nThe same person who shut down Paradiso last month is negotiating carbon credit frameworks this month. The same network that finds musicians for WILDNOFF finds partners for Quipu.\n\nThat is the Isaac Bullock engine. Six ventures. One pattern. Connect what does not seem to connect.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.invest}`,
    cta: THE_ASK.invest, hashtags: ["#isaacbullock", "#quipu", "#cleantech", "#carboncredits"],
    ...nextPhoto(),
  },
  {
    id: "ib-012", date: isoDate(27, 9, 0), platform: "linkedin", pillar: "the-build",
    topic: "NetWorthy: hiring without CVs. Because I never had one that mattered.",
    captionPrompt: `${VOICE}\n\nI never had a CV that got me hired.\n\nI got hired because someone saw me play. Because someone heard me speak. Because someone trusted me before I had the title.\n\nNetWorthy is that trust, systematized. No CVs. No cover letters. Just proof of what you can do, matched with people who need it.\n\nWe built it because the best people never fit the form.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.read}`,
    cta: THE_ASK.read, hashtags: ["#isaacbullock", "#networthy", "#hiring", "#futureofwork"],
    ...nextPhoto(),
  },

  // WEEK 5: PROOF STORIES (drip continues)
  {
    id: "ib-013", date: isoDate(30, 9, 0), platform: "linkedin", pillar: "proof",
    topic: "What 70 acts taught me about readiness.",
    captionPrompt: `${VOICE}\n\nI played against 70 acts at Hard Rock Rising.\n\nSome had toured Europe. Some had label deals. Some had played together for a decade.\n\nWe had two rehearsals.\n\nThe difference was not talent. It was readiness. The network of 800+ musicians who can step into any genre, any stage, any notice. Who do not need months to gel. Who need one rehearsal to sound like they have been on tour for years.\n\nThat is what I sell. Not music. Readiness.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#hardrockrising", "#livemusic", "#readiness"],
    ...nextPhoto(),
  },
  {
    id: "ib-014", date: isoDate(32, 19, 0), platform: "instagram", pillar: "proof",
    topic: "The band member spotlight: who are the 800+ musicians?",
    captionPrompt: `${VOICE}\n\nMeet Jose. Drummer. Played with Chameleone after one rehearsal.\n\nMeet Pedro. Bassist. Learned a 20-song set in 48 hours for a corporate gig.\n\nMeet Joshua. Guitarist. Has played Jazz, Rock, Afrobeat and Pop in the same month.\n\nThese are not session musicians. They are standby professionals. People who can step into any genre, any stage, any notice — and deliver.\n\n800+ of them. That is the WILDNOFF engine.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.songs}`,
    cta: THE_ASK.songs, hashtags: ["#isaacbullock", "#wildnoff", "#musicians", "#livemusic"],
    ...nextPhoto(),
  },
  {
    id: "ib-015", date: isoDate(34, 9, 0), platform: "linkedin", pillar: "proof",
    topic: "From 0 to 18 partners at the Royal Tropical Institute.",
    captionPrompt: `${VOICE}\n\nI walked into the Royal Tropical Institute with an idea.\n\nNo partners. No funding. No track record in that space.\n\nI walked out with 18 partners.\n\nHow? Not by pitching. By connecting. By finding the people who needed what I had — a network, a stage presence, a founder who understands both artists and capital — and giving it to them before they asked.\n\nThat is the pattern. Connect the seemingly unconnected. Artists, capital, technology, and the people building all three.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.invest}`,
    cta: THE_ASK.invest, hashtags: ["#isaacbullock", "#partnerships", "#founder", "#network"],
    ...nextPhoto(),
  },

  // WEEK 6: FOUNDER'S EYE
  {
    id: "ib-016", date: isoDate(37, 9, 0), platform: "linkedin", pillar: "founder-eye",
    topic: "The VICE Playlist Vol. 2 submission. Another chapter.",
    captionPrompt: `${VOICE}\n\nI submitted to VICE Playlist Vol. 2 today.\n\nNot because I need validation. Because every submission is a chapter. Every rejection is data. Every acceptance is proof.\n\nThe 90-day drip does not stop at Hard Rock Rising. It applies to every moment. A gig. A launch. A submission. You take one win and you squeeze 13 weeks of content out of it.\n\nThat is what Ndeku does. That is what I do. That is the engine.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.follow}`,
    cta: THE_ASK.follow, hashtags: ["#isaacbullock", "#vice", "#playlist", "#newmusic"],
    ...nextPhoto(),
  },
  {
    id: "ib-017", date: isoDate(39, 19, 0), platform: "instagram", pillar: "founder-eye",
    topic: "6 ventures. One founder. No cofounder.",
    captionPrompt: `${VOICE}\n\nSessiecat. NetWorthy. BuurtPlay. Kitufu Residences. Quipu. Ndeku.\n\nSix ventures. One founder. No cofounder.\n\nNot because I am a control freak. Because I move faster alone. Because I have learned that the best partnerships are the ones you build after you have proven the model.\n\nWILDNOFF is the heart. The music is the proof. Everything else is infrastructure.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.read}`,
    cta: THE_ASK.read, hashtags: ["#isaacbullock", "#founder", "#solofounder", "#buildinpublic"],
    ...nextPhoto(),
  },
  {
    id: "ib-018", date: isoDate(41, 9, 0), platform: "linkedin", pillar: "founder-eye",
    topic: "The booker who said no. And the one who said yes.",
    captionPrompt: `${VOICE}\n\nA booker told me last week: "Your music is great, but your brand is not clear."\n\nHe was right. I was selling six different things to six different people. Kyakuwa to music fans. WILDNOFF to event managers. NetWorthy to HR directors. Quipu to climate investors.\n\nSo I changed the brand. Not the products. The story.\n\nNow I sell one thing: Isaac Bullock. The product is me. The ventures are proof. The stage is the storefront.\n\nThat booker who said no? He booked me for next month.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#founder", "#branding", "#livemusic"],
    ...nextPhoto(),
  },

  // WEEK 7: MUSICIANS ON STANDBY
  {
    id: "ib-019", date: isoDate(44, 9, 0), platform: "linkedin", pillar: "musicians-on-standby",
    topic: "The year-end party pitch. Why November is the month to book.",
    captionPrompt: `${VOICE}\n\nNovember. The year-end parties are being planned. The best bands are already fully booked.\n\nOur advantage: we are not one band. We are 800+ musicians. If one formation is full, we build a new one. For your genre. For your venue. For your date.\n\nSoul. Jazz. Funk. Pop. R&B. Afrobeat. Hip Hop. Corporate pop with a Jazz twist. Full takeover: sound, lights, music.\n\nThe only question we ask: "Send us your songs. We are there."\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#wildnoff", "#yearendparty", "#corporateevents"],
    ...nextPhoto(),
  },
  {
    id: "ib-020", date: isoDate(46, 19, 0), platform: "instagram", pillar: "musicians-on-standby",
    topic: "Recruitment: you could be the next musician on that stage.",
    captionPrompt: `${VOICE}\n\nAre you a musician?\n\nDo you play Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop? Have you ever stood on a stage and thought: "I would do this more often, but I do not know how to get the gigs?"\n\nI know how. 800+ musicians. Open jams every 2nd Sunday in Amsterdam. Gigs from intimate dinners to Paradiso and North Sea Jazz.\n\nYou do not need a full band. You only need to be ready.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\nDM me your demo.`,
    cta: "DM me your demo.", hashtags: ["#isaacbullock", "#wildnoff", "#musicianswanted", "#amsterdam"],
    ...nextPhoto(),
  },
  {
    id: "ib-021", date: isoDate(48, 9, 0), platform: "linkedin", pillar: "musicians-on-standby",
    topic: "Artist support: why we invest in the artists, not the brand.",
    captionPrompt: `${VOICE}\n\nI do not invest in logos.\n\nI invest in the 800+ musicians who show up. The ones who learn your set in 48 hours. The ones who step into a genre they have never played and own it.\n\nWILDNOFF is not a brand. It is infrastructure. The stage, the sound, the lights, the network — that is what we build. The artists? They are already there. They just need the stage.\n\nThat is why I book them. That is why I invest in them. That is why 800+ musicians trust this network.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.songs}`,
    cta: THE_ASK.songs, hashtags: ["#isaacbullock", "#wildnoff", "#musicians", "#investment"],
    ...nextPhoto(),
  },

  // WEEK 8: THE BUILD (final push)
  {
    id: "ib-022", date: isoDate(51, 9, 0), platform: "linkedin", pillar: "the-build",
    topic: "Document, do not pitch. What 8 weeks of daily posts taught me.",
    captionPrompt: `${VOICE}\n\nI started posting daily 8 weeks ago.\n\nNot because a marketing guru told me to. Because I had 360 old Facebook posts, 19 photos, 60 videos, and zero system.\n\nThen I built Ndeku. And the system appeared.\n\nThe rule is simple: document, do not pitch. Show the invoice. Show the Docker fix. Show the rehearsal. Show the stage. The receipts sell louder than the claims.\n\nThat is what I learned. That is what I teach. That is the engine.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.read}`,
    cta: THE_ASK.read, hashtags: ["#isaacbullock", "#ndeku", "#buildinpublic", "#contentstrategy"],
    ...nextPhoto(),
  },
  {
    id: "ib-023", date: isoDate(53, 19, 0), platform: "instagram", pillar: "the-build",
    topic: "The investor pitch that actually works. (It is not the one you think.)",
    captionPrompt: `${VOICE}\n\nI used to pitch investors with slides.\n\nMarket size. Revenue projections. Exit strategy. Then I realized: the best investors do not invest in decks. They invest in people who ship.\n\nNow my pitch is: open isaacbullock.org. Watch the TEDx. Read the posts. Check the receipts. Then call me.\n\nThat pitch has a 60% conversion rate. Because it is not a pitch. It is proof.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.invest}`,
    cta: THE_ASK.invest, hashtags: ["#isaacbullock", "#investor", "#founder", "#pitch"],
    ...nextPhoto(),
  },
  {
    id: "ib-024", date: isoDate(55, 9, 0), platform: "linkedin", pillar: "the-build",
    topic: "What comes after 8 weeks? The 90-day drip.",
    captionPrompt: `${VOICE}\n\n8 weeks of posts. 24 pieces of content. 4 pillars. One name.\n\nNow what?\n\nNow the 90-day drip. Every win becomes 13 weeks of content. Hard Rock Rising becomes recruitment posts. TEDx becomes keynote pitches. VICE Playlist becomes proof of momentum.\n\nThe engine does not stop. It compounds.\n\nThat is Ndeku. That is Isaac Bullock. That is the product.\n\n${RECEIPTS}\n\nTag @isaacbullockk and @wildnoff.\n\n${THE_ASK.book}`,
    cta: THE_ASK.book, hashtags: ["#isaacbullock", "#ndeku", "#contentstrategy", "#founder"],
    ...nextPhoto(),
  },
];

// ─── Generate mission JSON ───
const output = {
  mission: "The Isaac Bullock Engine",
  version: "5.1.0",
  generatedAt: new Date().toISOString(),
  totalPosts: posts.length,
  photoPool: {
    realPhotos: realPhotos.length,
    brandInformedPrompts: brandPrompts.length,
    source: realPhotos.length > 0 ? FB_PHOTO_DIR : brandPrompts.length > 0 ? VISUAL_IDENTITY_FILE : "generated-from-brand-dna",
  },
  schedule: posts,
};

writeFileSync("/tmp/mission-isaac-bullock.json", JSON.stringify(output, null, 2));

console.log(`\n=== MISSION: THE ISAAC BULLOCK ENGINE ===\n`);
console.log(`Total posts: ${posts.length}`);
console.log(`Real photos available: ${realPhotos.length}`);
console.log(`Brand-informed prompts: ${brandPrompts.length}`);

if (realPhotos.length > 0) {
  console.log(`Photo source: ${FB_PHOTO_DIR} (REAL)`);
} else if (brandPrompts.length > 0) {
  console.log(`Prompt source: ${VISUAL_IDENTITY_FILE} (BRAND-INFORMED)`);
} else {
  console.log(`Prompt source: Generated from brand DNA (FALLBACK)`);
}

console.log(`Output: /tmp/mission-isaac-bullock.json\n`);
console.log("Sample posts:");
for (const p of posts.slice(0, 3)) {
  const imgInfo = p.imagePath
    ? `[REAL: ${p.imagePath.split("/").pop()}]`
    : p.imagePrompt?.includes("Professional music photography")
    ? "[BRAND-INFORMED AI]"
    : "[GENERIC AI]";
  console.log(`  ${p.id} | ${p.platform} | ${p.pillar} | ${p.topic.slice(0, 45)}... ${imgInfo}`);
}
console.log("");
