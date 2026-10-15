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

const META_GRAPH = "https://graph.facebook.com/v25.0";
const TEST_IMAGE_URL = "https://via.placeholder.com/500x500/FF0000/FFFFFF?text=Omega+Swarm+Test";

async function fetchJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
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
    const debugUrl = `${META_GRAPH}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`;
    const debug = await fetchJson(debugUrl);
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
  const meUrl = `${META_GRAPH}/me/accounts?fields=name,id,instagram_business_account&access_token=${token}`;
  const me = await fetchJson(meUrl);

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
  const igUrl = `${META_GRAPH}/${igAccountId}?fields=username&access_token=${token}`;
  const ig = await fetchJson(igUrl);
  if (!ig.ok || ig.data.error) {
    console.error("❌ FAIL: Kan IG account niet lezen:", ig.data.error?.message || ig.data);
    process.exit(1);
  }
  console.log(`   Username: @${ig.data.username} ✅`);

  // ─── Stap 4: Media container aanmaken ───
  console.log("\nStap 4: Media container aanmaken...");
  const caption = "Omega Swarm smoke test — verifying publishing pipeline. #test";
  const containerUrl = `${META_GRAPH}/${igAccountId}/media?image_url=${encodeURIComponent(TEST_IMAGE_URL)}&caption=${encodeURIComponent(caption)}&access_token=${token}`;
  const container = await fetchJson(containerUrl, { method: "POST" });

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
  const publishUrl = `${META_GRAPH}/${igAccountId}/media_publish?creation_id=${creationId}&access_token=${token}`;
  const publish = await fetchJson(publishUrl, { method: "POST" });

  if (!publish.ok || publish.data.error) {
    console.error("❌ FAIL: Publish mislukt:", publish.data.error?.message || publish.data);
    process.exit(1);
  }

  const postId = publish.data.id;
  console.log(`   Post ID: ${postId} ✅`);
  console.log(`\n🎉 SUCCESS: Post is LIVE op Instagram!`);
  console.log(`   Check: https://instagram.com/p/${postId}`);
  console.log(`\n   ⬆️  VERIFICATIE COMPLEET: Token + ID + permissions werken.`);
  console.log(`   De app kan nu daadwerkelijk publiceren.\n`);
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
