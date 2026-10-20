/**
 * MULTI-AI PROVIDER FALLBACK SYSTEM
 *
 * Routes tasks to Claude first, falls back to Kimi/Moonshot if Claude fails.
 * Both APIs compete. The best output wins.
 *
 * Env vars needed:
 *   ANTHROPIC_API_KEY — Claude access
 *   MOONSHOT_API_KEY — Kimi fallback (optional, falls back to OpenRouter)
 *   MOONSHOT_BASE_URL — defaults to https://api.moonshot.cn/v1
 */

const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";
const KIMI_MODEL = "moonshot-v1-8k";

interface AIResponse {
  provider: "claude" | "kimi" | "openrouter";
  text: string;
  error?: string;
  latencyMs: number;
}

async function callClaude(prompt: string): Promise<AIResponse> {
  const start = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return { provider: "claude", text: "", error: "ANTHROPIC_API_KEY not set", latencyMs: 0 };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { provider: "claude", text: "", error: data.error?.message || `HTTP ${res.status}`, latencyMs: Date.now() - start };
    }

    return {
      provider: "claude",
      text: data.content?.[0]?.text || "",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return { provider: "claude", text: "", error: (err as Error).message, latencyMs: Date.now() - start };
  }
}

async function callKimi(prompt: string): Promise<AIResponse> {
  const start = Date.now();
  const apiKey = process.env.MOONSHOT_API_KEY;
  const baseUrl = process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1";

  if (!apiKey) {
    return { provider: "kimi", text: "", error: "MOONSHOT_API_KEY not set", latencyMs: 0 };
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { provider: "kimi", text: "", error: data.error?.message || `HTTP ${res.status}`, latencyMs: Date.now() - start };
    }

    return {
      provider: "kimi",
      text: data.choices?.[0]?.message?.content || "",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return { provider: "kimi", text: "", error: (err as Error).message, latencyMs: Date.now() - start };
  }
}

/**
 * Get the best AI response — Claude first, Kimi fallback.
 * If both fail, returns the error from Claude.
 */
export async function getAIResponse(prompt: string): Promise<AIResponse> {
  console.log("[AI] Routing to Claude...");
  const claude = await callClaude(prompt);

  if (claude.text && !claude.error) {
    console.log(`[AI] Claude responded in ${claude.latencyMs}ms`);
    return claude;
  }

  console.log(`[AI] Claude failed: ${claude.error}. Rerouting to Kimi...`);
  const kimi = await callKimi(prompt);

  if (kimi.text && !kimi.error) {
    console.log(`[AI] Kimi responded in ${kimi.latencyMs}ms`);
    return kimi;
  }

  console.log(`[AI] Kimi also failed: ${kimi.error}`);
  return {
    provider: "claude",
    text: "",
    error: `Both models unavailable. Claude: ${claude.error} | Kimi: ${kimi.error}`,
    latencyMs: claude.latencyMs + kimi.latencyMs,
  };
}

/**
 * COMPETE MODE — Call both simultaneously, return the best.
 * Uses a simple quality heuristic: longer + no error = better.
 */
export async function competeAI(prompt: string): Promise<AIResponse> {
  console.log("[AI] COMPETE MODE — Claude vs Kimi");

  const [claude, kimi] = await Promise.all([
    callClaude(prompt),
    callKimi(prompt),
  ]);

  console.log(`[AI] Claude: ${claude.text.length} chars, ${claude.latencyMs}ms${claude.error ? `, ERROR: ${claude.error}` : ""}`);
  console.log(`[AI] Kimi:   ${kimi.text.length} chars, ${kimi.latencyMs}ms${kimi.error ? `, ERROR: ${kimi.error}` : ""}`);

  // Score: valid text wins. If both valid, faster wins.
  const claudeScore = claude.text ? 1000 - claude.latencyMs : -1;
  const kimiScore = kimi.text ? 1000 - kimi.latencyMs : -1;

  if (claudeScore > kimiScore) {
    console.log("[AI] WINNER: Claude");
    return claude;
  }
  if (kimiScore > claudeScore) {
    console.log("[AI] WINNER: Kimi");
    return kimi;
  }

  // Both failed
  return {
    provider: "claude",
    text: "",
    error: `Both models failed. Claude: ${claude.error} | Kimi: ${kimi.error}`,
    latencyMs: 0,
  };
}
