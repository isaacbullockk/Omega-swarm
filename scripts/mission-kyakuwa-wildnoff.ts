/**
 * MISSION: KYAKUWA + WILDNOFF
 *
 * Doel: een gerichte 30-daagse campagne die Kyakuwa's muziek en WILDNOFF's
 * live-presence samenbrengt. Niet generieke posts — harde feiten, echte data's,
 * en een stem die past bij Isaac's artist persona.
 *
 * Gebruik:
 *   npx tsx scripts/mission-kyakuwa-wildnoff.ts
 *
 * Output: /tmp/mission-kyakuwa-wildnoff.json — direct importeerbaar als
 * scheduled posts in de Autopilot.
 */

import { writeFileSync } from "fs";

interface MissionPost {
  id: string;
  date: string;
  platform: "instagram" | "linkedin";
  type: "release" | "show" | "behind_the_scenes" | "fan_engagement" | "milestone";
  topic: string;
  captionPrompt: string;
  imagePrompt: string;
  cta: string;
  hashtags: string[];
}

function isoDate(daysFromNow: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const IDENTITY = `Kyakuwa = "Accept the Gift" (Oegandees spreekwoord: wat God geeft, aanvaard je met open handen).
Isaac Bullock Kintu. Singer-songwriter. Frontman van WILDNOFF.
Steeds: Paradiso, North Sea Jazz, HaarlemJazz (10 jaar op rij).
ISC award-winning songwriter 2020. War Child themanummer met Lavinia Meijer.
Nooit: em-dashes, buzzwords, humble-brag. Altijd: scene eerst, betekenis daarna, vraag als slot.`;

const VOICE_RULES = `Warm, direct, persoonlijk. Hook op regel 1 — de eerste zin moet scrollen stoppen.
Korte alinea's van 1-3 zinnen. Eindig met een vraag die mensen écht kunnen beantwoorden.
Humble authority: deelt het podium met grote namen als peer, niet als fan.
Engels by default. Dutch alleen als het publiek duidelijk Nederlands-lokaal is.`;

const posts: MissionPost[] = [
  {
    id: "kw-001",
    date: isoDate(1, 10, 0),
    platform: "instagram",
    type: "behind_the_scenes",
    topic: "Waarom Kyakuwa? De betekenis achter de naam.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nSchrijf een post over waarom Isaac de artiestennaam Kyakuwa koos. Begin met de scene: zijn moeder die het spreekwoord zegt. Wat het betekent: niet "a gift from God" maar "Accept the Gift" — een uitnodiging om te ontvangen. Eindig met een vraag over een moment waarop iemand iets voor jou deed zonder er iets voor terug te vragen.`,
    imagePrompt: "Cinematic portrait of a Black musician in his late 20s, warm golden hour light, holding a vintage acoustic guitar, Amsterdam canal houses blurred in background, film grain, 35mm aesthetic, muted earth tones",
    cta: "Link in bio: luister naar Kyakuwa op Spotify",
    hashtags: ["#kyakuwa", "#acceptthegift", "#newmusic", "#amsterdam"],
  },
  {
    id: "kw-002",
    date: isoDate(3, 19, 0),
    platform: "instagram",
    type: "show",
    topic: "WILDNOFF live: de band achter het geluid.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nStel de band voor. Niet als bio, maar als scene: een repetitie, een moment waarop het klikt. Noem elk bandlid bij naam: Jose, Pedro, Joshua, Olivier, Raymond. Wat ze elk toevoegen. Waarom zes mensen op één podium beter zijn dan één. Eindig met een vraag: wie is de meest onderschatte muzikant die je kent?`,
    imagePrompt: "Band of six diverse musicians on a dimly lit rehearsal stage, candid moment, someone laughing mid-jam, warm tungsten lighting, documentary photography style, grainy 16mm film look",
    cta: "wildnoff.nl voor tourdata",
    hashtags: ["#wildnoff", "#livemusic", "#band", "#amsterdam"],
  },
  {
    id: "kw-003",
    date: isoDate(5, 10, 0),
    platform: "instagram",
    type: "release",
    topic: "Track focus: 'Sand in the Wind' — het verhaal achter de song.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nDe song Sand in the Wind. Scene: waar schreef Isaac het? Wat zag hij om zich heen? De betekenis: vasthouden terwijl alles beweegt. Geen cliché over "tijden veranderen" — concreet: een beeld, een moment, een persoon. Eindig met een vraag over iets dat je hebt losgelaten en later terugvond.`,
    imagePrompt: "Close-up of sand slipping through fingers against a dramatic sunset sky, shallow depth of field, warm amber and cool blue contrast, cinematic color grading, poetic melancholy mood",
    cta: "Stream nu via link in bio",
    hashtags: ["#sandinthewind", "#kyakuwa", "#singersongwriter", "#newmusic"],
  },
  {
    id: "kw-004",
    date: isoDate(7, 19, 0),
    platform: "linkedin",
    type: "milestone",
    topic: "Van Accenture-strateeg naar fulltime artiest: het onwaarschijnlijke pad.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nLinkedIn-versie van Isaac's pad. Geen LinkedIn-buzzwords. Concreet: Accenture, Global Inclusion & Diversity Excellence Award 2016, TEDxHilversum, dan de sprong. Wat hij meenam van strategie naar songwriting. De brug: "Ik verbind het ogenschijnlijk onverbonden." Eindig met een vraag over een vaardigheid uit je vorige werk die je nu op een onverwachte manier gebruikt.`,
    imagePrompt: "Split composition: left side corporate office interior with glass walls, right side backstage at a music venue with instruments, same person walking from one to the other, cinematic transition, warm to cool lighting, editorial photography",
    cta: "isaacbullock.org voor het volledige verhaal",
    hashtags: ["#careerpivot", "#musicindustry", "#strategy"],
  },
  {
    id: "kw-005",
    date: isoDate(9, 10, 0),
    platform: "instagram",
    type: "behind_the_scenes",
    topic: "De studio: waar Accept the Gift tot leven kwam.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nScene: de studio sessie voor de EP Accept the Gift. Niet "geweldige sessie met geweldige mensen" — details. Een microfoon die het niet deed. Een take die per ongeluk beter was. De beslissing om Smile My Boy als eerste single te kiezen. Eindig met een vraag over een fout die mooier uitpakte dan het plan.`,
    imagePrompt: "Vintage recording studio interior, analog mixing desk with warm LED meters, microphone in foreground slightly out of focus, coffee cup and handwritten notes visible, moody atmospheric lighting, documentary style",
    cta: "Pre-save Accept the Gift — link in bio",
    hashtags: ["#studiolife", "#acceptthegift", "#behindthemusic"],
  },
  {
    id: "kw-006",
    date: isoDate(11, 19, 0),
    platform: "instagram",
    type: "show",
    topic: "Hard Rock Rising: de show die samenviel met 'Persevere'.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nDe dag dat Persevere uitkwam en WILDNOFF speelde op Hard Rock Rising. Scene: soundcheck, de zaal die langzaam volstroomt, het moment dat de eerste riff valt. De betekenis: persevereren is geen abstract idee, het is wat je doet terwijl je doet. Eindig met een vraag over een moment waarop je bijna opgaf maar doorging.`,
    imagePrompt: "Concert photography: band performing on stage from behind the drummer's perspective, crowd silhouettes with phone flashlights, dramatic stage lighting with red and gold beams, high energy, motion blur on hands",
    cta: "wildnoff.nl — volgende shows",
    hashtags: ["#hardrockrising", "#wildnoff", "#persevere", "#live"],
  },
  {
    id: "kw-007",
    date: isoDate(13, 10, 0),
    platform: "instagram",
    type: "fan_engagement",
    topic: "Q&A: Jullie vragen over Kyakuwa en WILDNOFF beantwoord.",
    captionPrompt: `${IDENTITY}\n\nGeen AI-generatie hier — dit is een oproep. Post een carousel of Reel met de tekst: "Vraag mij alles over Kyakuwa, WILDNOFF, of waarom ik ooit Accenture verliet. Eerlijke antwoorden, geen PR. Beste vraag wint een vrijkaartje voor de volgende show." Eindig met een vraag die direct de volgende post inspireert.`,
    imagePrompt: "Isaac Bullock looking directly at camera, holding a handwritten sign that says "Ask Me Anything", natural window light, casual setting, warm and approachable, shallow depth of field",
    cta: "Reactie = je vraag",
    hashtags: ["#ama", "#kyakuwa", "#wildnoff", "#askmeanything"],
  },
  {
    id: "kw-008",
    date: isoDate(15, 19, 0),
    platform: "instagram",
    type: "release",
    topic: "'Smile My Boy' — een vader die zijn zoon ziet worden wie hij is.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nSmile My Boy. Scene: Isaac kijkt toe terwijl zijn zoon iets doet dat hijzelf nooit durfde. De betekenis: je kind hoeft niet beter te worden dan jij, alleen vollediger dan jij durfde te zijn. Pattern A: scene, betekenis, vraag. Geen sentimenteel gedoe — concreet. Eindig met een vraag aan ouders: wat heeft jouw kind jou geleerd?`,
    imagePrompt: "Father and young son walking away from camera on an empty beach at golden hour, long shadows, small figures against vast sky, contemplative and tender, film photography aesthetic, muted warm palette",
    cta: "Stream Smile My Boy — link in bio",
    hashtags: ["#smilemyboy", "#fatherhood", "#kyakuwa", "#newmusic"],
  },
  {
    id: "kw-009",
    date: isoDate(17, 10, 0),
    platform: "linkedin",
    type: "milestone",
    topic: "ISC 2020 winnaar keert terug: waarom wedstrijden nog steeds matteren.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nLinkedIn-post over het terugkeren naar de International Songwriting Competition. Geen "zo blij om terug te zijn" — de harde waarheid: in 2020 won hij en niemand die hij kende had ooit van de ISC gehoord. Wat het daadwerkelijk veranderde: niet de prijs, maar het bewijs dat een vluchteling met een accent ook een stem kan hebben die jury's raakt. Eindig met een vraag over een erkenning die je carrière veranderde.`,
    imagePrompt: "Award certificate on a simple wooden desk next to a passport and a guitar pick, morning light through blinds casting striped shadows, minimalist composition, symbolic and understated",
    cta: "Luister naar de winnende track",
    hashtags: ["#isc", "#songwriting", "#musicindustry"],
  },
  {
    id: "kw-010",
    date: isoDate(19, 10, 0),
    platform: "instagram",
    type: "show",
    topic: "Countdown: nog één week tot 'Accept the Gift'.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nCountdown-post: 7 dagen tot de EP Accept the Gift. Scene: de laatste master die binnenkomt, het moment dat je realiseert dat het af is. De 5 tracks in volgorde: Smile My Boy, Persevere, Sand in the Wind, Onumya, Path or Walker. Wat elk nummer toevoegt aan het geheel. Geen track-by-track review — het verhaal van de volgorde. Eindig met een vraag: welk nummer van een EP open je altijd eerst?`,
    imagePrompt: "Vinyl record half out of its sleeve on a marble surface, warm overhead light, album cover with abstract earthy design partially visible, nostalgic and anticipatory mood, top-down flat lay photography",
    cta: "Pre-save nu — link in bio",
    hashtags: ["#acceptthegift", "#eprelease", "#countdown", "#kyakuwa"],
  },
  {
    id: "kw-011",
    date: isoDate(21, 10, 0),
    platform: "instagram",
    type: "release",
    topic: "EP RELEASE DAY: 'Accept the Gift' is uit.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nRELEASE DAY POST. Scene: Isaac op de dag dat de EP uitkomt. Niet "zo dankbaar" — concreet: waar is hij, wie is erbij, wat drinkt hij. De betekenis: Accept the Gift is niet alleen de titel, het is wat zijn moeder zei. De 5 tracks als 5 manieren om dat spreekwoord te begrijpen. Credits: noem iedereen die droeg — band, producers, studio. Eindig met een vraag: wat is het laatste cadeau dat je ontving zonder het te verdienen?`,
    imagePrompt: "Celebratory scene: musician sitting on studio couch with band members, champagne bottles and vinyl records on table, warm string lights, candid laughter, documentary photography style, golden warm tones",
    cta: "Stream de volledige EP — link in bio",
    hashtags: ["#acceptthegift", "#eprelease", "#newmusic", "#kyakuwa"],
  },
  {
    id: "kw-012",
    date: isoDate(23, 10, 0),
    platform: "instagram",
    type: "behind_the_scenes",
    topic: "Van studio naar stadium: waarom WILDNOFF live anders is dan de plaat.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nHet verschil tussen WILDNOFF in de studio en WILDNOFF op het podium. Scene: een moment tijdens een live-set waarop iets gebeurt dat nooit op tape kan — een improvisatie, een fout die de beste take wordt, de zaal die een liedje harder meezingt dan de monitors. De betekenis: muziek is pas af als het publiek het overneemt. Eindig met een vraag over een live-versie die beter is dan de studioversie.`,
    imagePrompt: "Wide shot of concert crowd with hands raised, stage lights creating lens flares, silhouetted band members at front of stage, epic live atmosphere, wide angle concert photography, dramatic lighting",
    cta: "wildnoff.nl — boek de band",
    hashtags: ["#wildnoff", "#livemusic", "#concert", "#amsterdam"],
  },
  {
    id: "kw-013",
    date: isoDate(25, 10, 0),
    platform: "instagram",
    type: "fan_engagement",
    topic: "De setlist van jouw dromen: welke 5 Kyakuwa-tracks moeten erop?",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nFan-engagement post. Geen AI-sjabloon — een echte vraag. "Als je één Kyakuwa-setlist mag samenstellen voor een avond in Paradiso — welke 5 tracks en in welke volgorde? De regel: minstens één nummer van Accept the Gift, één nummer dat nooit is uitgebracht, en één cover." Eindig met een vraag die een discussie start over welk nummer nooit live is gespeeld maar zou moeten.`,
    imagePrompt: "Handwritten setlist on crumpled paper taped to a guitar case, stage floor visible, setlist has coffee stains and last-minute changes, intimate behind-the-scenes vibe, warm tungsten lighting",
    cta: "Reactie = jouw setlist",
    hashtags: ["#setlist", "#kyakuwa", "#paradiso", "#dreamsetlist"],
  },
  {
    id: "kw-014",
    date: isoDate(27, 10, 0),
    platform: "instagram",
    type: "milestone",
    topic: "North Sea Jazz flashback: het podium waar alles veranderde.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nFlashback-post: North Sea Jazz. Scene: backstage, vlak voor het optreden. Wat Isaac dacht, wat hij zag, wie erbij was. De betekenis: niet het podium zelf, maar het moment dat hij realiseerde dat hij niet meer hoefde te bewijzen dat hij erbij hoorde. Humble authority: hij hoort erbij. Eindig met een vraag over een moment waarop je wist dat je op de juiste plek stond.`,
    imagePrompt: "Backstage corridor leading to brightly lit stage, musician seen from behind holding guitar, crowd roar visible as light rays, anticipation and gravitas, cinematic depth of field, warm stage light vs cool backstage",
    cta: "Volg voor meer verhalen achter de muziek",
    hashtags: ["#northseajazz", "#kyakuwa", "#flashback", "#live"],
  },
  {
    id: "kw-015",
    date: isoDate(29, 10, 0),
    platform: "instagram",
    type: "behind_the_scenes",
    topic: "Wat komt na Accept the Gift? Een eerlijk vooruitzicht.",
    captionPrompt: `${IDENTITY}\n${VOICE_RULES}\n\nHonest forward-looking post. Niet "grote dingen op komst" — concreet wat er wél is: nieuwe shows, mogelijke samenwerkingen, wat er nog niet zeker is. Isaac's ventures zijn vroeg en hij zegt dat ronduit. Frame als proof-in-motion, nooit oversell. Eindig met een vraag: wat is het volgende project waar je aan werkt dat nog niemand weet?`,
    imagePrompt: "Musician looking out of a tour bus window at passing highway scenery, reflection in glass, contemplative expression, early morning light, road trip documentary style, muted colors with warm highlights",
    cta: "wildnoff.nl + isaacbullock.org",
    hashtags: ["#behindthemusic", "#kyakuwa", "#wildnoff", "#whatnext"],
  },
];

function main() {
  console.log("\n=== MISSION: KYAKUWA + WILDNOFF ===\n");
  console.log(`Campaign duration: ${posts.length} posts over ~30 days`);
  console.log(`Platforms: ${[...new Set(posts.map((p) => p.platform))].join(", ")}`);
  console.log(`Post types: ${[...new Set(posts.map((p) => p.type))].join(", ")}\n`);

  for (const post of posts) {
    const date = new Date(post.date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const icon = post.platform === "instagram" ? "📸" : "💼";
    console.log(`${icon} ${date} | ${post.type.toUpperCase()} | ${post.topic}`);
  }

  const outputPath = "/tmp/mission-kyakuwa-wildnoff.json";
  writeFileSync(outputPath, JSON.stringify(posts, null, 2));
  console.log(`\n✅ Mission opgeslagen naar: ${outputPath}`);
  console.log(`   Importeer dit in de Autopilot als scheduled posts.\n`);

  // Summary stats
  const igCount = posts.filter((p) => p.platform === "instagram").length;
  const liCount = posts.filter((p) => p.platform === "linkedin").length;
  console.log(`Stats:`);
  console.log(`   Instagram: ${igCount} posts`);
  console.log(`   LinkedIn:  ${liCount} posts`);
  console.log(`   Total:     ${posts.length} posts\n`);
}

main();
