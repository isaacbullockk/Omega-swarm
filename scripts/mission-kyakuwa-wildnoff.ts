/**
 * MISSION: MUSICIANS ON STANDBY
 *
 * Doel: WILDNOFF boeken voor corporate gigs, artist-support en events.
 * Één propositie: 800+ musici op standby die jouw set leren en je gig
 * leveren — elke genre, bijna zonder voorbereiding.
 *
 * WILDNOFF = het boekbare merk.
 * Kyakuwa = één van de verhalen die het bewijzen.
 *
 * Gebruik:
 *   npx tsx scripts/mission-kyakuwa-wildnoff.ts
 *
 * Output: /tmp/mission-kyakuwa-wildnoff.json
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

const VOICE = `Hook op regel 1 — de eerste zin moet scrollen stoppen.
Korte alinea's van 1-3 zinnen. Geen em-dashes.
Warm, direct, persoonlijk. Humble authority.
Engels by default. Dutch alleen als het publiek duidelijk Nederlands-lokaal is.
CTA staat altijd in de eerste comment (niet in de post zelf).`;

const PROOF = `José Chameleone & Bobi Wine: één repetitie met standby musici, daarna Amsterdam afgesloten.
Kyakuwa: twee repetities, runner-up Hard Rock Rising 2026 (2e van 70 acts).
WILDNOFF: Paradiso, Bimhuis, Concertgebouw, North Sea Jazz.
Klanten: Accenture, Oracle, VodafoneZiggo.
800+ musici in het netwerk. Formations van 6-12 members, handpicked per event.
Genres: Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop & meer.`;

const PITCH = `Het is geen band. Het is infrastructuur.
Musici zo voorbereid, zo breed en zo professioneel dat het aantal repetities in enkelvoud wordt gemeten.
We verkopen geen setlist. We verkopen aliveness — het gevoel in de zaal wanneer iets onverwachts en moois live gebeurt, in real time, zonder vangnet.`;

const CTA = `Send us your songs.
DM of mail info@isaacbullock.com`;

const posts: MissionPost[] = [
  // ─── PILLAR: One-Rehearsal Stories ───
  {
    id: "ms-001",
    date: isoDate(2, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "José Chameleone & Bobi Wine: één repetitie, Amsterdam afgesloten.",
    captionPrompt: `${VOICE}\n\nScene: de oproep komt binnen. José Chameleone en Bobi Wine — twee van de grootste artiesten uit Oost-Afrika — spelen morgen in Amsterdam. Hun eigen band kon niet mee.\n\nEén repetitie. Eén. Met musici die ze nog nooit hadden ontmoet.\n\nDie avond stond de zaal stil en barstte daarna los. Dat is niet talent alleen — dat is infrastructuur. 800+ musici op standby die jouw set leren, jouw sound begrijpen, en jouw gig leveren alsof ze jaren met je hebben gespeeld.\n\n${PITCH}\n\n${PROOF}\n\nEindig met een vraag: hoeveel repetities had jouw laatste live-act nodig?`,
    cta: CTA,
    hashtags: ["#livemusic", "#eventprofs", "#amsterdam"],
  },
  {
    id: "ms-002",
    date: isoDate(5, 19, 0),
    platform: "instagram",
    pillar: "one-rehearsal",
    topic: "Kyakuwa: twee repetities, runner-up van 70 acts.",
    captionPrompt: `${VOICE}\n\nScene: Hard Rock Rising 2026. 70 acts. Bands die al jaren samenspelen. Kyakuwa had twee repetities.\n\nTwee.\n\nNiet omdat het slordig was. Omdat de standby-musici het repertoire al kenden voor de eerste noot viel. Omdat het netwerk zo breed is dat de juiste muzikanten altijd beschikbaar zijn — niet beschikbaar-ish, maar beschikbaar-morgen.\n\n${PITCH}\n\nEindig met een vraag: wanneer wist jij dat je klaar was voor het podium?`,
    cta: CTA,
    hashtags: ["#kyakuwa", "#hardrockrising", "#livemusic", "#amsterdam"],
  },
  {
    id: "ms-003",
    date: isoDate(9, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "De oproep die elke eventmanager kent — en hoe wij hem beantwoorden.",
    captionPrompt: `${VOICE}\n\n"De drummer is ziek. De gig is morgen. Kunnen jullie?"\n\nDe standaardantwoorden: nee, misschien, of een vervanger die het repertoire niet kent. Onze antwoord: ja. En niet ja-met-een-asterisk, maar ja-met-dezelfde-kwaliteit.\n\n${PITCH}\n\n800+ musici. 6-12 per formatie. Handpicked voor jouw event. Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop. De repetitie count? Single digits. Altijd.\n\n${PROOF}\n\nEindig met een vraag: wat is het ergste wat je ooit hebt meegemaakt met een last-minute vervanging?`,
    cta: CTA,
    hashtags: ["#eventprofs", "#livemusic", "#corporateevents"],
  },

  // ─── PILLAR: Any Genre, Proof It ───
  {
    id: "ms-004",
    date: isoDate(12, 19, 0),
    platform: "instagram",
    pillar: "any-genre",
    topic: "Dezelfde musici. Week 1: Afrobeat. Week 2: Rock. Week 3: Corporate pop.",
    captionPrompt: `${VOICE}\n\nDit zijn dezelfde mensen.\n\nNiet een afdeling Afrobeat en een afdeling Rock. Dezelfde musici die week 1 een Afrobeat-set spelen voor 800 mensen, week 2 een Rock-set voor een corporate eindejaarsfeest, en week 3 een Pop-set als artist-support voor een internationale act.\n\nHoe? Omdat we geen band zijn. We zijn infrastructuur. De muzikant die gisteren Fela Kuti speelde, speelt vandaag Stevie Wonder en morgen jouw originele set.\n\n${PITCH}\n\n${PROOF}\n\nEindig met een vraag: welke artiest zou jij willen horen gespeeld door een band die ze nooit heeft ontmoet?`,
    cta: CTA,
    hashtags: ["#afrobeat", "#rock", "#pop", "#livemusic"],
  },
  {
    id: "ms-005",
    date: isoDate(16, 9, 0),
    platform: "linkedin",
    pillar: "any-genre",
    topic: "Accenture, Oracle, VodafoneZiggo — waarom corporates ons boeken.",
    captionPrompt: `${VOICE}\n\nCorporates boeken geen bands. Ze boeken zekerheid.\n\nAccenture. Oracle. VodafoneZiggo. Ze kiezen WILDNOFF niet omdat we goedkoop zijn. Ze kiezen ons omdat we het enige zijn dat goedkoop NIET is: premium, voorbereid, en zonder verrassingen op de dag zelf.\n\nDe brief komt binnen: "We willen Afrobeat met een Jazz twist, voor 600 mensen, in drie weken." Onze reactie: "Stuur je songs. We zijn er."\n\n${PITCH}\n\n${PROOF}\n\nEindig met een vraag: wat is het belangrijkste dat je zoekt in een live-act voor je volgende event?`,
    cta: CTA,
    hashtags: ["#corporateevents", "#eventprofs", "#livemusic"],
  },
  {
    id: "ms-006",
    date: isoDate(19, 19, 0),
    platform: "instagram",
    pillar: "any-genre",
    topic: "Artist-support: jij vliegt in, wij staan al op het podium.",
    captionPrompt: `${VOICE}\n\nInternationale act vliegt naar Nederland. Kan de eigen band niet meenemen. De oplossing die ze verwachten: een lokale coverband die hun hits naplayt.\n\nDe oplossing die ze krijgen: standby musici die hun set leren alsof ze jaren mee op tour zijn geweest.\n\nJosé Chameleone & Bobi Wine. Één repetitie. Dat is het bewijs.\n\n${PITCH}\n\n${PROOF}\n\nEindig met een vraag: welke internationale artiest zou jij willen zien met een lokale band die hun set kent?`,
    cta: CTA,
    hashtags: ["#artistsupport", "#livemusic", "#touring", "#amsterdam"],
  },

  // ─── PILLAR: Behind the Standby ───
  {
    id: "ms-007",
    date: isoDate(23, 9, 0),
    platform: "linkedin",
    pillar: "behind-standby",
    topic: "Hoe het netwerk werkt: de oproep, de match, de readiness.",
    captionPrompt: `${VOICE}\n\nHet is 14:00. De oproep komt binnen. Drummer ziek, gig morgen 20:00.\n\nStap 1: de setlist wordt doorgestuurd.\nStap 2: het netwerk wordt gescand — niet op genre, maar op readiness. Wie heeft de avond vrij, kent het repertoire, en heeft met deze musici gespeeld?\nStap 3: binnen 2 uur is de vervanger bevestigd.\nStap 4: één repetitie. Soms geen.\nStap 5: de gig.\n\n${PITCH}\n\n800+ musici. Niet een database. Een netwerk van mensen die elkaar kennen, elkaar vertrouwen, en elkaar dekken. Dat is waarom het werkt.\n\nEindig met een vraag: hoeveel van jouw leveranciers zouden binnen 2 uur een vervanging regelen?`,
    cta: CTA,
    hashtags: ["#eventprofs", "#operations", "#livemusic"],
  },
  {
    id: "ms-008",
    date: isoDate(26, 19, 0),
    platform: "instagram",
    pillar: "behind-standby",
    topic: "Recruitment: jij zou de volgende kunnen zijn.",
    captionPrompt: `${VOICE}\n\nElke post is ook een oproep.\n\nBen jij muzikant? Speel je Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop? Heb je ooit op een podium gestaan en gedacht: "Dit zou ik vaker willen doen, maar ik weet niet hoe ik aan de gigs kom?"\n\nWij weten hoe. 800+ musici. Open jams elke 2e zondag in Amsterdam. Gigs die variëren van intieme diners tot Paradiso en North Sea Jazz.\n\nJe hoeft geen volledige band te hebben. Je hoeft alleen maar klaar te zijn.\n\nEindig met een vraag: welk podium staat op jouw bucket list?`,
    cta: "DM ons je demo.",
    hashtags: ["#musicianswanted", "#amsterdam", "#livemusic", "#joinus"],
  },
  {
    id: "ms-009",
    date: isoDate(30, 9, 0),
    platform: "linkedin",
    pillar: "behind-standby",
    topic: "Van 40 musici naar 800+: de 15-jarige groei van WILDNOFF.",
    captionPrompt: `${VOICE}\n\n2010. Café Storing. 40 musici, 200 muziekliefhebbers. Een open sessie die niemand wist dat het een begin was.\n\nNu: 800+ musici. Paradiso. Bimhuis. Concertgebouw. North Sea Jazz. Hard Rock Rising. Accenture. Oracle. VodafoneZiggo.\n\nDe groei was niet gepland. Het was het gevolg van één ding: iedereen die op het podium stond, bracht iemand mee die ook klaar was. Niet op aanbeveling — op bewijs.\n\n${PITCH}\n\nEindig met een vraag: wat is het beste netwerk dat je organisch hebt opgebouwd?`,
    cta: CTA,
    hashtags: ["#network", "#growth", "#livemusic", "#amsterdam"],
  },

  // ─── PILLAR: The Founder Frontman ───
  {
    id: "ms-010",
    date: isoDate(33, 19, 0),
    platform: "instagram",
    pillar: "founder",
    topic: "Isaac Bullock: TEDx-spreker die ook Paradiso afsluit.",
    captionPrompt: `${VOICE}\n\nIsaac Bullock Kintu. TEDxHilversum. ChangeNOW Paris, 3.000 mensen, afgesloten met een lied. Accenture Marketing Lead & Digital Channels Lead. 8+ jaar. €1M opgehaald voor Solarus Sunpower.\n\nEn daarna: Paradiso. North Sea Jazz. Hard Rock Rising runner-up. ISC 2020 winner.\n\nDe brug: hij verbindt het ogenschijnlijk onverbonden. De boardroom en het podium zijn voor hem niet twee werelden — het is één gesprek met verschillende volumes.\n\nEindig met een vraag: ken jij iemand die twee werelden verbindt die niemand anders ziet?`,
    cta: CTA,
    hashtags: ["#isaacbullock", "#tedx", "#paradiso", "#livemusic"],
  },
  {
    id: "ms-011",
    date: isoDate(37, 9, 0),
    platform: "linkedin",
    pillar: "founder",
    topic: "Kyakuwa: het verhaal achter de naam, en waarom het de missie verklaart.",
    captionPrompt: `${VOICE}\n\nKyakuwa betekent niet "a gift from God." Het betekent: "Accept the Gift."\n\nHet spreekwoord van Isaac's moeder: "Wat God geeft, aanvaard je met open handen." Niet passief ontvangen. Actief aanvaarden.\n\nDat is de hele missie. We geven niet alleen een optreden. We geven een kans — aan artiesten die hun band niet kunnen meenemen, aan eventmanagers die vastzitten, aan musici die op een podium willen staan maar niet weten hoe.\n\nAccept the Gift. Dat is wat we vragen. En wat we leveren.\n\nEindig met een vraag: welk cadeau heb jij onlangs aanvaard dat je leven veranderde?`,
    cta: CTA,
    hashtags: ["#kyakuwa", "#mission", "#leadership", "#music"],
  },
  {
    id: "ms-012",
    date: isoDate(40, 19, 0),
    platform: "instagram",
    pillar: "founder",
    topic: "De 6 ventures van Isaac Bullock — en waarom WILDNOFF het hart is.",
    captionPrompt: `${VOICE}\n\nSessiecat. NetWorthy. BuurtPlay. Kitufu Residences. Quipu. Omega Swarm. En WILDNOFF.\n\nZes ventures. Één patroon: verbinden wat niet verbonden lijkt.\n\nSessiecat verbindt musici met gigs. NetWorthy verbindt talent met werk zonder CV. BuurtPlay verbindt buren met sport. Kitufu verbindt fans met Afrika. Quipu verbindt schone koken met carbon credits. Omega Swarm verbindt AI met marketing.\n\nWILDNOFF verbindt het allemaal — want zonder de muziek zijn de andere ventures ideeën. Met de muziek zijn ze bewijs.\n\nEindig met een vraag: welk project van jou is het hart waar de rest om draait?`,
    cta: CTA,
    hashtags: ["#entrepreneur", "#wildnoff", "#kyakuwa", "#mission"],
  },

  // ─── BONUS: Eindejaars push ───
  {
    id: "ms-013",
    date: isoDate(44, 9, 0),
    platform: "linkedin",
    pillar: "one-rehearsal",
    topic: "Eindejaarsfeesten: waarom november de beste maand is om te boeken.",
    captionPrompt: `${VOICE}\n\nNovember. De eindejaarsfeesten worden gepland. De meeste bands zijn al volgeboekt. De goede bands al helemaal.\n\nOns voordeel: we zijn niet één band. We zijn 800+ musici. Als de ene formatie vol is, bouwen we een nieuwe. Voor jouw genre. Voor jouw zaal. Voor jouw datum.\n\n${PITCH}\n\n${PROOF}\n\nDe enige vraag die we stellen: "Stuur je songs. We zijn er."\n\nEindig met een vraag: wanneer boek jij je live-act voor het eindejaarsfeest?`,
    cta: CTA,
    hashtags: ["#eindejaarsfeest", "#corporateevents", "#eventprofs"],
  },
];

function main() {
  console.log("\n=== MISSION: MUSICIANS ON STANDBY ===\n");
  console.log("Objective: Get WILDNOFF booked for corporate gigs, artist support, events.");
  console.log("Proposition: 800+ musicians on standby. Any genre. Single-digit rehearsals.");
  console.log("Primary channel: LinkedIn (bookers). Secondary: Instagram (visual proof).\n");

  const byPillar = Object.groupBy(posts, (p) => p.pillar);
  for (const [pillar, list] of Object.entries(byPillar)) {
    console.log(`${pillar}: ${list!.length} posts`);
  }

  console.log(`\nTotal: ${posts.length} posts over ~45 days (3/week cadence)\n`);

  for (const post of posts) {
    const date = new Date(post.date).toLocaleDateString("nl-NL", {
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
  console.log(`\n✅ Mission opgeslagen naar: ${outputPath}\n`);

  console.log("Success Metrics (3 months):");
  console.log("   • 3+ inbound booking inquiries/month");
  console.log("   • 1+ booked gig/month in €3.500-5.000 range");
  console.log("   • 2+ artist-support bookings (one-rehearsal model)");
  console.log("   • 50+ new musician signups\n");
}

main();
