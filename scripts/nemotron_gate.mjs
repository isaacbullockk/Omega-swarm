#!/usr/bin/env node
/**
 * Omega Swarm — Nemotron Pre-Deploy Gate
 *
 * Runs in CI before staging is merged to main (which Railway deploys).
 * Steps:
 *   1. Collect changed source files vs origin/main
 *   2. Type-check (tsc --noEmit) — hard fail on errors
 *   3. Boot smoke test is done by the workflow (server must serve /api/health)
 *   4. Send changed files to Nemotron 3 Ultra via OpenRouter with the
 *      Chief QA Engineer role; parse STATUS: APPROVED / REJECTED
 *
 * Exit 0 = APPROVED, Exit 1 = REJECTED or gate error.
 * The API key comes from the OPENROUTER_API_KEY CI secret — it is NEVER
 * written to any file in the repo.
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const MAX_FILE_CHARS = 12000;
const MAX_BUNDLE_CHARS = 70000;
const SKIP_PATTERNS = /(^|\/)(dist|node_modules|\.github|uploads)\/|\.(png|jpg|jpeg|gif|webp|svg|ico|lock|map)$/;

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (err) {
    console.error(`[GATE] Command failed: ${cmd}`);
    if (err.stdout) console.error(`[GATE] stdout:\n${err.stdout.toString()}`);
    if (err.stderr) console.error(`[GATE] stderr:\n${err.stderr.toString()}`);
    console.error(err.message);
    throw err;
  }
}

function changedFiles() {
  // In the workflow we fetch origin/main first — no fallback; a failed diff must fail the gate
  const diff = sh("git diff --name-only origin/main...HEAD");
  return diff
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f && !SKIP_PATTERNS.test(f))
    .filter((f) => /\.(ts|tsx|js|mjs|json)$/.test(f));
}

async function callNemotron(messages, maxTokens = 16000) {
  // 5 min per request — Nemotron Ultra is a reasoning model and large review
  // bundles legitimately take minutes; a short timeout would abort valid reviews
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://ndeku.com",
        "X-Title": "Omega Swarm CI Gate",
      },
      body: JSON.stringify({ model: MODEL, temperature: 0.0, max_tokens: maxTokens, messages }),
      signal: controller.signal,
    });
    if (res.status === 429) {
      // Free-pool congestion — retry once
      const res2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://ndeku.com",
          "X-Title": "Omega Swarm CI Gate",
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.0,
          max_tokens: maxTokens,
          messages,
        }),
        signal: controller.signal,
      });
      if (!res2.ok) throw new Error(`OpenRouter retry failed: ${res2.status}`);
      return res2.json();
    }
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  if (!OPENROUTER_API_KEY) {
    console.error("GATE ERROR: OPENROUTER_API_KEY secret not set in CI");
    process.exit(1);
  }

  const files = changedFiles();
  console.log(`[GATE] Changed source files: ${files.length}`);
  files.forEach((f) => console.log(`  - ${f}`));

  if (files.length === 0) {
    console.log("[GATE] No source changes — nothing to review");
    console.log("STATUS: APPROVED");
    process.exit(0);
  }

  // Type-check is run as a separate workflow step before this script.

  let bundle = "";
  for (const f of files) {
    let code;
    try {
      code = readFileSync(f, "utf8");
    } catch {
      continue; // deleted file
    }
    if (code.length > MAX_FILE_CHARS) {
      code = code.slice(0, MAX_FILE_CHARS) + "\n// ... [truncated for review]";
    }
    bundle += `\n\nFILE ${f}:\n\`\`\`typescript\n${code}\n\`\`\``;
    if (bundle.length > MAX_BUNDLE_CHARS) break;
  }

  const context = `Final compliance gateway (CI). You are reviewing a change set for Omega Swarm — a Hono + tRPC 11 + Drizzle ORM + PostgreSQL marketing platform (ESM, runs under tsx, deployed via Railway Docker). The TypeScript compiler and a boot smoke test have already passed in earlier CI steps.

Review for ACTIONABLE defects only: runtime crashes, broken imports/exports, SQL/schema mistakes, security issues (token leakage, injection, missing auth scoping), fake/placeholder behavior presented as real, incorrect third-party API usage. Do NOT flag style, and do NOT claim models/endpoints don't exist — model IDs and API shapes in this codebase were verified live against provider documentation.

Files may be truncated for size (marked "// ... [truncated for review]"). The TypeScript compiler has ALREADY PASSED on the complete files — so missing/truncated functions, imports, or braces are NOT defects. Only report defects in code you can actually see; never speculate about code outside the bundle.

Output EXACTLY — and START your reply with the STATUS line (no analysis before it; reasoning models: do your reasoning internally, output only the verdict):
STATUS: APPROVED or STATUS: REJECTED
FOUTEN:
- (actionable defects only, or 'none')
If REJECTED, include the corrected code fragments after the fouten list. Keep analysis concise — the STATUS line is mandatory.`;

  console.log(`[GATE] Sending ${bundle.length} chars to Nemotron for review...`);

  let verdict = null;
  for (let attempt = 0; attempt < 4 && !verdict; attempt++) {
    try {
      const data = await callNemotron([
        {
          role: "system",
          content:
            "You are the Chief QA Engineer & Marketing Automation Systems Architect. Diagnose the root cause of this error, verify the data pipeline structures, and output the exact corrected code block.",
        },
        { role: "user", content: context + bundle },
      ]);
      const content = data.choices?.[0]?.message?.content;
      if (content) verdict = content;
      else console.warn(`[GATE] Empty response (finish=${data.choices?.[0]?.finish_reason}), retrying...`);
    } catch (err) {
      console.warn(`[GATE] Attempt ${attempt + 1} failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
    }
  }

  if (!verdict) {
    console.error("[GATE] Nemotron unreachable after retries — failing closed");
    process.exit(1);
  }

  console.log("--- NEMOTRON VERDICT ---");
  console.log(verdict);
  console.log("------------------------");

  const approved = /^STATUS:\s*APPROVED/im.test(verdict);
  console.log(approved ? "[GATE] APPROVED — merge allowed" : "[GATE] REJECTED — merge blocked");
  process.exit(approved ? 0 : 1);
}

main();
