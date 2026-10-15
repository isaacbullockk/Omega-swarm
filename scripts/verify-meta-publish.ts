/**
 * META PUBLISH SMOKE TEST
 *
 * Doel: verifieer of Isaac's token DAADWERKELIJK kan publiceren naar Instagram.
 * Geen abstracties. Geen aannames. Directe Meta API calls.
 *
 * Gebruik:
 *   npx tsx scripts/verify-meta-publish.ts
 *
 * Wat het doet:
 *   1. Leest INSTAGRAM_ACCESS_TOKEN uit env
 *   2. Checkt /debug_token voor scopes (instagram_content_publish?)
 *   3. Resolveert het IG Business Account ID via /me/accounts
 *   4. Probeert een media container aan te maken (/me/media)
 *   5. Probeert de container te publiceren (/me/media_publish)
 *   6. Rapporteert PASS of FAIL per stap
 */

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v20.0";
const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const TEST_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/500px-PNG_transparency_demonstration_1.png";

const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url: string, opts?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const envAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

  console.log("\n=== META PUBLISH SMOKE TEST ===\n");

  if (!token) {
    console.error("❌ FAIL: INSTAGRAM_ACCESS_TOKEN ontbreekt in environment");
    process.exit(1);
  }

  if (!envAccountId) {
    console.error("❌ FAIL: INSTAGRAM_ACCOUNT_ID ontbreekt in environment");
    process.exit(1);
  }

  // ─── Stap 1: Token scopes check via debug_token ───
  console.log("Stap 1: Token scopes check...");
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    console.warn("⚠️  META_APP_ID of META_APP_SECRET ontbreekt — debug_token kan niet (non-fatal)");
  } else {
    const debugBody = new URLSearchParams({
      input_token: token,
      access_token: `${appId}|${appSecret}`,
    });
    const debug = await fetchJson(`${META_GRAPH}/debug_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: debugBody.toString(),
    });
    if (!debug.ok || debug.data.error) {
      console.error("❌ FAIL: debug_token mislukt:", debug.data.error?.message || debug.data);
    } else {
      const scopes: string[] = debug.data.data?.scopes || [];
      const hasPublish = scopes.includes("instagram_content_publish");
      const hasBasic = scopes.includes("instagram_basic");
      console.log(`   Scopes: ${scopes.join(", ") || "(none)"}`);
      console.log(`   instagram_basic: ${hasBasic ? "✅" : "❌"}`);
      console.log(`   instagram_content_publish: ${hasPublish ? "✅" : "❌"}`);
      if (!hasPublish) {
        console.error("\n❌ FAIL: Token mist 'instagram_content_publish'. Posten is ONMOGELIJK.");
        console.error("   Ga naar Meta Business Settings > Systeemgebruiker > Token genereren");
        console.error("   en selecteer de juiste permissions.");
        process.exit(1);
      }
    }
  }

  // ─── Stap 2: Resolve IG Business Account ───
  console.log("\nStap 2: IG Business Account resolutie...");
  const me = await fetchJson(`${META_GRAPH}/me/accounts?fields=name,id,instagram_business_account`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: token }).toString(),
  });

  if (!me.ok || me.data.error) {
    console.error("❌ FAIL: /me/accounts mislukt:", me.data.error?.message || me.data);
    process.exit(1);
  }

  const pages = me.data.data || [];
  if (pages.length === 0) {
    console.error("❌ FAIL: Geen Facebook Pages gevonden voor dit token.");
    console.error("   Koppel je IG Business account aan een Facebook Page.");
    process.exit(1);
  }

  let igAccountId: string | null = null;
  for (const page of pages) {
    const ig = page.instagram_business_account;
    if (ig && ig.id) {
      igAccountId = ig.id;
      console.log(`   Page: ${page.name} (${page.id})`);
      console.log(`   IG Business Account: ${igAccountId}`);
      break;
    }
  }

  if (!igAccountId) {
    console.error("❌ FAIL: Geen instagram_business_account gevonden op je Pages.");
    console.error("   Zorg dat je IG-profiel een Business/Creator-account is en gekoppeld aan een Page.");
    process.exit(1);
  }

  if (igAccountId !== envAccountId) {
    console.warn(`⚠️  MISMATCH: Railway INSTAGRAM_ACCOUNT_ID (${envAccountId}) ≠ gevonden IG ID (${igAccountId})`);
    console.warn("   Update Railway met het juiste ID: " + igAccountId);
  } else {
    console.log(`   ✅ IG Account ID match`);
  }

  // ─── Stap 3: IG account verify ───
  console.log("\nStap 3: IG account verificatie...");
  const ig = await fetchJson(`${META_GRAPH}/${igAccountId}?fields=username`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: token }).toString(),
  });
  if (!ig.ok || ig.data.error) {
    console.error("❌ FAIL: Kan IG account niet lezen:", ig.data.error?.message || ig.data);
    process.exit(1);
  }
  console.log(`   Username: @${ig.data.username} ✅`);

  // ─── Stap 4: Media container aanmaken ───
  console.log("\nStap 4: Media container aanmaken...");
  const caption = "Omega Swarm smoke test — verifying publishing pipeline. #test";
  const containerBody = new URLSearchParams({
    image_url: TEST_IMAGE_URL,
    caption,
    access_token: token,
  });
  const container = await fetchJson(`${META_GRAPH}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerBody.toString(),
  });

  if (!container.ok || container.data.error) {
    console.error("❌ FAIL: Container creatie mislukt:", container.data.error?.message || container.data);
    console.error("   Dit betekent: je token kan GEEN media uploaden.");
    if (container.data.error?.code === 10) {
      console.error("   Error 10 = Permission denied. Token mist instagram_content_publish.");
    }
    if (container.data.error?.code === 2207007) {
      console.error("   Error 2207007 = Media download mislukt (URL niet publiek/bereikbaar).");
    }
    process.exit(1);
  }

  const creationId = container.data.id;
  console.log(`   Container ID: ${creationId} ✅`);

  // ─── Stap 5: Publish ───
  console.log("\nStap 5: Container publiceren...");
  const publishBody = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });
  const publish = await fetchJson(`${META_GRAPH}/${igAccountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishBody.toString(),
  });

  if (!publish.ok || publish.data.error) {
    console.error("❌ FAIL: Publish mislukt:", publish.data.error?.message || publish.data);
    process.exit(1);
  }

  const mediaId = publish.data.id;
  console.log(`   Media ID: ${mediaId} ✅`);

  // ─── Stap 6: Permalink ophalen (media_id ≠ shortcode) ───
  console.log("\nStap 6: Permalink ophalen...");
  const permalinkRes = await fetchJson(`${META_GRAPH}/${mediaId}?fields=permalink,shortcode`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: token }).toString(),
  });

  let postUrl = `https://instagram.com/p/${mediaId}`;
  if (permalinkRes.ok && permalinkRes.data.permalink) {
    postUrl = permalinkRes.data.permalink;
  } else if (permalinkRes.ok && permalinkRes.data.shortcode) {
    postUrl = `https://instagram.com/p/${permalinkRes.data.shortcode}/`;
  }

  console.log(`\n🎉 SUCCESS: Post is LIVE op Instagram!`);
  console.log(`   Check: ${postUrl}`);
  console.log(`\n   ⬆️  VERIFICATIE COMPLEET: Token + ID + permissions werken.`);
  console.log(`   De app kan nu daadwerkelijk publiceren.\n`);
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
