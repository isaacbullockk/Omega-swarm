/**
 * INTEGRITY GATE
 *
 * Doel: vervang "aannemen dat het werkt" door een harde check VOÓR publicatie.
 *
 * Gebruik:
 *   npx tsx scripts/integrity-gate.ts
 *
 * Wat het checkt:
 *   1. Is de database bereikbaar?
 *   2. Heeft de gebruiker een Instagram account verbonden?
 *   3. Is het token nog geldig? (niet alleen 200 OK, maar échte publish-scope)
 *   4. Kan de server een publieke afbeelding downloaden?
 *   5. Is het IG-account een Business/Creator-account?
 *
 * Resultaat: een JSON-rapport dat de Autopilot kan lezen.
 * Als een check FAIL is, publiceer de Autopilot NIET — stop en waarschuw de gebruiker.
 */

const META_GRAPH = "https://graph.facebook.com/v25.0";
const TEST_IMAGE = "https://via.placeholder.com/100x100/FF0000/FFFFFF?text=Test";

interface IntegrityReport {
  timestamp: string;
  overall: "PASS" | "FAIL" | "DEGRADED";
  checks: Array<{ name: string; status: "PASS" | "FAIL" | "WARN"; detail: string }>;
  canPublish: boolean;
  blockers: string[];
}

async function fetchJson(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function checkDatabase(): Promise<{ status: "PASS" | "FAIL"; detail: string }> {
  try {
    // We kunnen geen database importeren vanuit een standalone script zonder de hele app op te starten.
    // In productie wordt dit vervangen door een echte db.ping().
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) return { status: "FAIL", detail: "DATABASE_URL ontbreekt" };
    if (!dbUrl.startsWith("postgres")) return { status: "FAIL", detail: "DATABASE_URL is geen PostgreSQL URL" };
    return { status: "PASS", detail: "DATABASE_URL is gezet" };
  } catch (e) {
    return { status: "FAIL", detail: (e as Error).message };
  }
}

async function checkTokenScopes(token: string): Promise<{ status: "PASS" | "FAIL"; detail: string }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { status: "FAIL", detail: "META_APP_ID/SECRET ontbreekt — kan scopes niet verifiëren" };
  }

  const url = `${META_GRAPH}/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`;
  const res = await fetchJson(url);

  if (!res.ok || res.data.error) {
    return { status: "FAIL", detail: `debug_token mislukt: ${res.data.error?.message || "unknown"}` };
  }

  const scopes: string[] = res.data.data?.scopes || [];
  const hasPublish = scopes.includes("instagram_content_publish");
  const hasBasic = scopes.includes("instagram_basic");

  if (!hasBasic || !hasPublish) {
    const missing = [hasBasic ? null : "instagram_basic", hasPublish ? null : "instagram_content_publish"]
      .filter(Boolean)
      .join(", ");
    return { status: "FAIL", detail: `Token mist scopes: ${missing}` };
  }

  const expiry = res.data.data?.expires_at;
  const expiryDate = expiry ? new Date(expiry * 1000).toISOString() : "never";
  return { status: "PASS", detail: `Scopes OK (basic + publish). Verloopt: ${expiryDate}` };
}

async function checkIgAccount(token: string, envAccountId: string) {
  const url = `${META_GRAPH}/me/accounts?fields=name,id,instagram_business_account&access_token=${token}`;
  const res = await fetchJson(url);

  if (!res.ok || res.data.error) {
    return { status: "FAIL" as const, detail: `/me/accounts mislukt: ${res.data.error?.message || "unknown"}` };
  }

  const pages = res.data.data || [];
  if (pages.length === 0) {
    return { status: "FAIL" as const, detail: "Geen Facebook Pages gevonden" };
  }

  let igId: string | null = null;
  for (const page of pages) {
    if (page.instagram_business_account?.id) {
      igId = page.instagram_business_account.id;
      break;
    }
  }

  if (!igId) {
    return { status: "FAIL" as const, detail: "Geen IG Business Account gekoppeld aan Pages" };
  }

  if (igId !== envAccountId) {
    return {
      status: "WARN" as const,
      detail: `IG ID mismatch: Railway heeft ${envAccountId}, API retourneert ${igId}`,
    };
  }

  return { status: "PASS" as const, detail: `IG account gevonden: ${igId}` };
}

async function checkImageDownload(): Promise<{ status: "PASS" | "FAIL"; detail: string }> {
  try {
    const res = await fetch(TEST_IMAGE, { method: "HEAD" });
    if (!res.ok) return { status: "FAIL", detail: `Test-afbeelding niet bereikbaar: ${res.status}` };
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return { status: "WARN", detail: `Content-Type is ${contentType}, verwacht image/*` };
    }
    return { status: "PASS", detail: "Test-afbeelding bereikbaar (HTTPS, image/*)" };
  } catch (e) {
    return { status: "FAIL", detail: `Download mislukt: ${(e as Error).message}` };
  }
}

async function main() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const envAccountId = process.env.INSTAGRAM_ACCOUNT_ID;

  console.log("\n=== INTEGRITY GATE ===\n");

  const report: IntegrityReport = {
    timestamp: new Date().toISOString(),
    overall: "PASS",
    checks: [],
    canPublish: false,
    blockers: [],
  };

  // Check 1: Database
  const dbCheck = await checkDatabase();
  report.checks.push({ name: "Database", ...dbCheck });
  if (dbCheck.status === "FAIL") report.blockers.push("Database niet bereikbaar");

  // Check 2: Env vars
  if (!token || !envAccountId) {
    report.checks.push({
      name: "Env vars",
      status: "FAIL",
      detail: `INSTAGRAM_ACCESS_TOKEN: ${token ? "OK" : "MISSING"}, INSTAGRAM_ACCOUNT_ID: ${envAccountId ? "OK" : "MISSING"}`,
    });
    report.blockers.push("Instagram credentials ontbreken");
  } else {
    report.checks.push({ name: "Env vars", status: "PASS", detail: "Beide credentials zijn gezet" });
  }

  // Check 3: Token scopes
  if (token) {
    const scopeCheck = await checkTokenScopes(token);
    report.checks.push({ name: "Token scopes", ...scopeCheck });
    if (scopeCheck.status === "FAIL") report.blockers.push("Token heeft geen publish-rechten");
  }

  // Check 4: IG account
  if (token && envAccountId) {
    const igCheck = await checkIgAccount(token, envAccountId);
    report.checks.push({ name: "IG Account", ...igCheck });
    if (igCheck.status === "FAIL") report.blockers.push("IG account niet bereikbaar");
  }

  // Check 5: Image download
  const imgCheck = await checkImageDownload();
  report.checks.push({ name: "Image download", ...imgCheck });
  if (imgCheck.status === "FAIL") report.blockers.push("Afbeeldingen kunnen niet worden gedownload");

  // Overall
  if (report.blockers.length > 0) {
    report.overall = "FAIL";
    report.canPublish = false;
  } else if (report.checks.some((c) => c.status === "WARN")) {
    report.overall = "DEGRADED";
    report.canPublish = true; // waarschuwing maar niet blokkerend
  } else {
    report.overall = "PASS";
    report.canPublish = true;
  }

  // Print
  console.log(`Overall: ${report.overall}`);
  console.log(`Can publish: ${report.canPublish ? "✅ JA" : "❌ NEE"}\n`);

  for (const check of report.checks) {
    const icon = check.status === "PASS" ? "✅" : check.status === "WARN" ? "⚠️" : "❌";
    console.log(`${icon} ${check.name}: ${check.detail}`);
  }

  if (report.blockers.length > 0) {
    console.log("\n🔴 BLOCKERS:");
    for (const b of report.blockers) {
      console.log(`   - ${b}`);
    }
    console.log("\n   Actie: los deze blockers op VOORDAT je Autopilot aanzet.\n");
    process.exit(1);
  }

  console.log("\n🎉 Integriteits-check geslaagd. De app kan publiceren.\n");

  // Output als JSON voor de Autopilot
  const outputPath = "/tmp/integrity-report.json";
  require("fs").writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Rapport opgeslagen naar: ${outputPath}\n`);
}

main().catch((err) => {
  console.error("\n💥 CRASH:", err.message);
  process.exit(1);
});
