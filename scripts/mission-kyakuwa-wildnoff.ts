/**
 * MISSION: KYAKUWA + WILDNOFF — GIG-FOCUSED CAMPAIGN
 *
 * Doel: gigs binnenhalen. Niet alleen streams. De content demonstreert
 * dat Kyakuwa/WILDNOFF een levend netwerk is van 800+ musici die morgen
 * op jouw podium kunnen staan — van duo tot 12-koppige formatie.
 *
 * Gebruik:
 *   npx tsx scripts/mission-kyakuwa-wildnoff.ts
 *
 * Output: /tmp/mission-kyakuwa-wildnoff.json — importeerbaar als scheduled posts.
 *
 * REGEL: Alleen echte releases uit de daadwerkelijke discography.
 * Geen "Accept the Gift" EP. Geen fictieve nummers.
 */

import { writeFileSync } from "fs";

interface MissionPost {
  id: string;
  date: string;
  platform: "instagram";
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

const VOICE = `Warm, direct, persoonlijk. Hook op regel 1. Korte alinea's. Eindig met een vraag.
Nooit: em-dashes, buzzwords, humble-brag. Altijd: scene eerst, betekenis daarna.
Kyakuwa betekent "Accept the Gift" — NIET "a gift from God". Het spreekwoord:
"Wat God geeft, aanvaard je met open handen."`;

const BAND = `Jose, Pedro, Joshua, Olivier, Raymond — de core WILDNOFF band.
Maar het netwerk is 800+ musici die morgen kunnen instappen.`;

const PROOF = `Hard Rock Rising 2026: runner-up van 70 acts.
Paradiso, Bimhuis, North Sea Jazz, HaarlemJazz (10 jaar op rij).
15+ jaar live. 800+ musici in het netwerk.`;

const RELEASES = {
  latest2026: [
    "late night therapy",
    "Just Perfume",
    "Onumya",
    "Silk and Fire",
    "Path or Walker",
    "Persevere",
    "the people",
    "Chasin'",
    "smile my boy",
    "sand in the wind",
  ],
  hits: [
    { title: "Mary Jane", year: 2020, streams: "146,301+" },
  ],
  catalog: [
    "Ubuntu (2023)",
    "Sapatu (2022)",
    "F.E.A.R. (2021)",
    "Atelophobia (2021)",
  ],
  collabs: [
    "DJ NLZ — producer (Mary Jane, Hangover, Ubuntu, Sapatu, F.E.A.R., Atelophobia)",
    "Marlice Baart — co-writer (One Meter Fifty, ISC 2020 winner)",
    "Isaac Bullock — Silk and Fire",
  ],
};

const GIG_PITCH = `Wat we verkopen is geen setlist. We verkopen aliveness —
het gevoel in de zaal wanneer iets onverwachts en moois live gebeurt,
in real time, zonder vangnet. Formations van 6-12 members,
handpicked voor jouw event. Soul, Jazz, Funk, Pop, R&B, Afrobeat, Hip Hop.
Full takeover: sound, lights, music.`;

const posts: MissionPost[] = [
  {
    id: "kw-001",
    date: isoDate(1, 10, 0),
    platform: "instagram",
    topic: "Hard Rock Rising 2026 proof — runner-up van 70 acts.",
    captionPrompt: `${VOICE}\n\nScene: de dag dat Kyakuwa werd verkozen tot runner-up bij Hard Rock Rising 2026 — uit 70 acts. Niet "zo trots" — concreet: welk nummer werd gespeeld, hoe lang de set was, hoe de jury reageerde. De betekenis: dit is geen beginnend act, dit is 15+ jaar live werk dat tot dit punt leidde. ${PROOF}\n\nEindig met een vraag: welke artiest ken je die beter live is dan op plaat?`,
    cta: "Boek Kyakuwa — link in bio",
    hashtags: ["#kyakuwa", "#hardrockrising", "#livemusic", "#amsterdam"],
  },
  {
    id: "kw-002",
    date: isoDate(2, 19, 0),
    platform: "instagram",
    topic: "Mary Jane — 146K+ streams. De hit die niet weggaat.",
    captionPrompt: `${VOICE}\n\nMary Jane. 2020. 146.301+ streams op Spotify en het blijft groeien. Scene: waar schreef Isaac het? Met wie? (DJ NLZ op productie). Wat maakt dit nummer anders dan de rest van de catalog? De betekenis: sommige nummers worden niet oud, ze worden alleen maar meer van jou. Eindig met een vraag: welk nummer uit 2020 draai jij nog steeds?`,
    cta: "Stream Mary Jane — link in bio",
    hashtags: ["#maryjane", "#kyakuwa", "#djnlz", "#spotify"],
  },
  {
    id: "kw-003",
    date: isoDate(4, 10, 0),
    platform: "instagram",
    topic: "Het WILDNOFF verschil: 800+ musici, morgen op jouw podium.",
    captionPrompt: `${VOICE}\n\nDe vraag die we het meest krijgen: "Kunnen jullie morgen spelen?" Het antwoord: ja. ${GIG_PITCH}\n\nScene: een telefoontje om 14:00. Een bedrijfsevenement om 20:00. De drummer is ziek. Binnen 4 uur staat een vervanger op de plank die het repertoire kent. Niet magie — 800+ musici in het netwerk. ${BAND}\n\nEindig met een vraag: heb jij ooit een artiest geboekt die binnen 24 uur beschikbaar was?`,
    cta: "wildnoff.nl — boek nu",
    hashtags: ["#wildnoff", "#livemusic", "#booknow", "#amsterdam"],
  },
  {
    id: "kw-004",
    date: isoDate(6, 19, 0),
    platform: "instagram",
    topic: "Late Night Therapy — de nieuwste single, en waarom het nu uitkomt.",
    captionPrompt: `${VOICE}\n\nLate Night Therapy. 2026. Scene: 2:00 uur 's nachts, de studio, de take die per ongeluk de beste was. Wat het nummer is: niet een anthem, maar een gesprek om 3 uur 's nachts. Voor wie het is: iedereen die ooit wakker lag met te veel in hun hoofd. Eindig met een vraag: welk nummer luister jij om 2 uur 's nachts?`,
    cta: "Stream Late Night Therapy — link in bio",
    hashtags: ["#latenighttherapy", "#kyakuwa", "#newmusic", "#2026"],
  },
  {
    id: "kw-005",
    date: isoDate(8, 10, 0),
    platform: "instagram",
    topic: "Persevere — geschreven voor het moment dat je bijna opgeeft.",
    captionPrompt: `${VOICE}\n\nPersevere. 2026. Scene: Isaac schrijft dit na een gesprek met een muzikant die overwoog te stoppen. Het nummer is geen motivational speech — het is het moment vlak VOÓR de beslissing. De adem inhouden. De stap zetten. ${BAND}\n\nEindig met een vraag: welk nummer hielp jou door een moment waarop je wilde opgeven?`,
    cta: "Stream Persevere — link in bio",
    hashtags: ["#persevere", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-006",
    date: isoDate(10, 19, 0),
    platform: "instagram",
    topic: "Van duo tot 12-koppig: hoe WILDNOFF elke zaal vult.",
    captionPrompt: `${VOICE}\n\nDe zaal bepaalt de band. Niet andersom. ${GIG_PITCH}\n\nScene: een intiem diner voor 40 mensen — duo (Isaac + gitarist). Een festival voor 5.000 — 12-koppige formatie met blazerssectie. Dezelfde songs, andere adem. Het is geen playback, het is geen setlist die je kent — het is aliveness, aangepast aan de ruimte.\n\nEindig met een vraag: welke live-act paste het beste bij de zaal waar jij in stond?`,
    cta: "wildnoff.nl — welke formatie past bij jouw event?",
    hashtags: ["#wildnoff", "#livemusic", "#eventprofs", "#amsterdam"],
  },
  {
    id: "kw-007",
    date: isoDate(12, 10, 0),
    platform: "instagram",
    topic: "Open Jam Sessions — elke 2e zondag in Amsterdam. Gratis. Echt.",
    captionPrompt: `${VOICE}\n\nScene: Café Storing, 2010. 40 musici, 200 muziekliefhebbers. Niemand wist dat dit het begin was van 800+ musici. Nu: elke 2e zondag in Amsterdam. Geen coverband-avond. Geen jamsessie waar iedereen op elkaar wacht. Een ruimte waar een saxofonist uit Suriname een drummer uit Oekraïne ontmoet en ze spelen iets dat nog geen naam heeft.\n\nEindig met een vraag: welke jamsessie veranderde hoe je naar muziek kijkt?`,
    cta: "Volg @kyakuwamusic voor data",
    hashtags: ["#jamsession", "#amsterdam", "#kyakuwa", "#livemusic"],
  },
  {
    id: "kw-008",
    date: isoDate(14, 19, 0),
    platform: "instagram",
    topic: "Silk and Fire — het nummer dat Isaac met zichzelf schreef.",
    captionPrompt: `${VOICE}\n\nSilk and Fire. 2026. Kyakuwa x Isaac Bullock. Scene: hetzelfde persoon, twee namen, één nummer. Wat het is: het contrast tussen wat je toont (silk) en wat je voelt (fire). De betekenis: je hoeft niet één te kiezen. Je kunt beide zijn. Eindig met een vraag: welke twee kanten van jezelf zet jij het liefst in één nummer?`,
    cta: "Stream Silk and Fire — link in bio",
    hashtags: ["#silkandfire", "#kyakuwa", "#isaacbullock", "#newmusic"],
  },
  {
    id: "kw-009",
    date: isoDate(16, 10, 0),
    platform: "instagram",
    topic: "Chasin' — Reggae/Island Pop. De zomer die nooit eindigt.",
    captionPrompt: `${VOICE}\n\nChasin'. 2026. Genre: Reggae / Island Pop. Scene: geschreven in januari, toen het buiten 2 graden was. Het nummer gaat niet over een zomer — het gaat over het achtervolgen van een gevoel dat je ooit had. ${PROOF}\n\nEindig met een vraag: welk nummer brengt je terug naar een zomer die nooit meer terugkomt?`,
    cta: "Stream Chasin' — link in bio",
    hashtags: ["#chasin", "#kyakuwa", "#reggae", "#islandpop"],
  },
  {
    id: "kw-010",
    date: isoDate(18, 19, 0),
    platform: "instagram",
    topic: "Just Perfume — het nummer dat je ruikt voor je het hoort.",
    captionPrompt: `${VOICE}\n\nJust Perfume. 2026. Scene: een herinnering die geen beeld heeft, alleen een geur. Het nummer is geschreven als een geur die blijft hangen in een leeg huis. Niet sad — eerlijk. ${BAND}\n\nEindig met een vraag: welke geur roept het meeste herinneringen op?`,
    cta: "Stream Just Perfume — link in bio",
    hashtags: ["#justperfume", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-011",
    date: isoDate(20, 10, 0),
    platform: "instagram",
    topic: "Path or Walker — kies je pad, of laat het pad jou kiezen?",
    captionPrompt: `${VOICE}\n\nPath or Walker. 2026. Scene: Isaac staat op een kruispunt — letterlijk, in Amsterdam, 3 uur 's nachts. Het nummer is geen advies. Het is de vraag die je jezelf stelt wanneer geen van de twee richtingen verkeerd voelt. ${PROOF}\n\nEindig met een vraag: heb jij ooit een pad gekozen dat niemand begreep?`,
    cta: "Stream Path or Walker — link in bio",
    hashtags: ["#pathorwalker", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-012",
    date: isoDate(22, 19, 0),
    platform: "instagram",
    topic: "Onumya — het Oegandese woord dat geen vertaling heeft.",
    captionPrompt: `${VOICE}\n\nOnumya. 2026. Het woord bestaat, maar de vertaling ontbreekt. Scene: Isaac's moeder die het woord gebruikt voor iets tussen trots en verdriet. Het nummer probeert niet te vertalen — het probeert het gevoel te vangen. ${PROOF}\n\nEindig met een vraag: welk woord uit jouw taal heeft geen directe vertaling?`,
    cta: "Stream Onumya — link in bio",
    hashtags: ["#onumya", "#kyakuwa", "#uganda", "#newmusic"],
  },
  {
    id: "kw-013",
    date: isoDate(24, 10, 0),
    platform: "instagram",
    topic: "The People — wie zijn 'the people' in Kyakuwa's wereld?",
    captionPrompt: `${VOICE}\n\nThe People. 2026. Scene: geen podium, geen studio — een keuken, een bruiloft, een begrafenis. De mensen die nooit op de gastenlijst staan maar altijd aanwezig zijn. Het nummer is voor hen. ${GIG_PITCH}\n\nEindig met een vraag: wie is de persoon in jouw leven die nooit op de foto staat maar altijd er is?`,
    cta: "Stream The People — link in bio",
    hashtags: ["#thepeople", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-014",
    date: isoDate(26, 10, 0),
    platform: "instagram",
    topic: "Smile My Boy — een vader die zijn zoon ziet worden wie hij is.",
    captionPrompt: `${VOICE}\n\nSmile My Boy. 2026. Scene: Isaac kijkt toe terwijl zijn zoon iets doet dat hijzelf nooit durfde. De betekenis: je kind hoeft niet beter te worden dan jij, alleen vollediger dan jij durfde te zijn. Niet sentimenteel — concreet. Eindig met een vraag aan ouders: wat heeft jouw kind jou geleerd?`,
    cta: "Stream Smile My Boy — link in bio",
    hashtags: ["#smilemyboy", "#fatherhood", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-015",
    date: isoDate(28, 10, 0),
    platform: "instagram",
    topic: "Sand in the Wind — vasthouden terwijl alles beweegt.",
    captionPrompt: `${VOICE}\n\nSand in the Wind. 2026. Scene: het strand van Zandvoort, wind die zand in je ogen blaast, en het besef dat je niet kunt vasthouden wat niet van jou is. Het nummer gaat niet over loslaten — het gaat over vasthouden terwijl je weet dat het wegwaait. ${PROOF}\n\nEindig met een vraag: wat heb je vastgehouden dat je beter had kunnen laten gaan?`,
    cta: "Stream Sand in the Wind — link in bio",
    hashtags: ["#sandinthewind", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-016",
    date: isoDate(30, 19, 0),
    platform: "instagram",
    topic: "One Meter Fifty — ISC 2020 winner. Het nummer dat de wet veranderde.",
    captionPrompt: `${VOICE}\n\nOne Meter Fifty. Geschreven door Isaac Bullock en Marlice Baart. Best Social Causes Song 2020 — International Songwriting Competition. Scene: het nummer dat onderdeel werd van een campagne die de wet veranderde. Niet "zo trots" — de harde feiten: welke campagne, welke wet, welke impact. ${PROOF}\n\nEindig met een vraag: welk nummer maakte je bewust van een probleem dat je eerder negeerde?`,
    cta: "Stream One Meter Fifty — link in bio",
    hashtags: ["#onemeterfifty", "#isc", "#kyakuwa", "#socialcauses"],
  },
];

function main() {
  console.log("\n=== MISSION: KYAKUWA + WILDNOFF ===\n");
  console.log(`Echte releases in campagne:`);
  for (const r of RELEASES.latest2026) console.log(`   • ${r} (2026)`);
  console.log(`   • Mary Jane (2020, ${RELEASES.hits[0].streams} streams)`);
  for (const c of RELEASES.catalog) console.log(`   • ${c}`);
  console.log(`\nGig-focust. 800+ musici. 6-12 per formatie. Boekbaar via wildnoff.nl\n`);

  console.log(`Posts (${posts.length}):`);
  for (const post of posts) {
    const date = new Date(post.date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(`   ${date} | ${post.topic}`);
  }

  const outputPath = "/tmp/mission-kyakuwa-wildnoff.json";
  writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`\n✅ Mission opgeslagen naar: ${outputPath}\n`);
}

main();
