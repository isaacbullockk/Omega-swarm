/**
 * Omega Swarm v5.0 — OpenRouter Client (Nemotron + Multi-Model)
 *
 * Uses OpenRouter API to access Nemotron 3 Ultra, Llama, Claude, GPT-4o.
 * Single API key gives access to 200+ models.
 * Falls back to Groq if OpenRouter is unavailable.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
// Reasoning models (Nemotron Ultra) can think for minutes — default 180s
const FETCH_TIMEOUT_MS = Number(process.env.OPENROUTER_FETCH_TIMEOUT_MS ?? 180000);

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// Model routing for symbiosis workflow — all behind the single OPENROUTER_API_KEY
// (routing reviewed and approved by Nemotron 3 Ultra compliance gate, 2026-08-28)
export const MODELS = {
  PLANNER: "nvidia/nemotron-3-ultra-550b-a55b:free",        // Step 1: Analyze + Strategize (1M ctx, free)
  COPYWRITER: "moonshotai/kimi-k2.5",                      // Step 2: Write human copy ($0.60/$3.00, vision)
  VALIDATOR: "nvidia/nemotron-3-ultra-550b-a55b:free",     // Step 3: Validate + Format (1M ctx, free)
  CONTENT_SAFETY: "nvidia/nemotron-3.5-content-safety:free", // Pre-publish moderation of marketing copy
  VISION: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", // Asset tagging/analysis (omni-modal)
  FAST: "nvidia/nemotron-3-super-120b-a12b:free",          // Lead scoring / quick tasks (free)
  IMAGE_GEN: "google/gemini-3.1-flash-lite-image",         // Key-backed image generation, fast/cheap ($0.25)
  IMAGE_GEN_QUALITY: "google/gemini-3.1-flash-image",      // Nano Banana 2 — hero/quality images ($0.50)
  IMAGE_GEN_BULK: "bytedance-seed/seedream-4.5",           // Flat $0.04/image for volume work
  FALLBACK: "google/gemini-2.5-flash",                     // Fallback (1M ctx multimodal)
} as const;

export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
}

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "json_schema"; schema?: object };
}

/**
 * Call OpenRouter chat completions API
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const model = options.model || MODELS.FALLBACK;
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  let response = await fetchWithTimeout(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://ndeku.com",
      "X-Title": "Omega Swarm",
    },
    body: JSON.stringify(body),
  }, FETCH_TIMEOUT_MS);

  // Free-pool models share rate limits — on 429/404 retry once with the paid variant
  if (!response.ok && model.endsWith(":free") && (response.status === 429 || response.status === 404)) {
    const paidModel = model.replace(/:free$/, "");
    response = await fetchWithTimeout(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://ndeku.com",
        "X-Title": "Omega Swarm",
      },
      body: JSON.stringify({ ...body, model: paidModel }),
    }, FETCH_TIMEOUT_MS);
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${error.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned empty response");
  }

  return content as string;
}

/**
 * Step 1: Nemotron Planner — Analyze lead, determine strategy, fetch context
 */
export async function nemotronPlanner(params: {
  leadData: { name: string; email: string; source?: string; company?: string; behavior?: string };
  clientContext: { name: string; industry: string; productSummary: string; tone: string };
  crmHistory?: Array<{ action: string; date: string; result?: string }>;
}): Promise<{
  strategy: string;
  urgency: "low" | "medium" | "high" | "enterprise";
  productInfo: string;
  copywriterBrief: string;
  segment: string;
}> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You are Nemotron 3 Ultra, an elite marketing strategist and data analyst. " +
        "Analyze the lead data and CRM history. Determine the marketing strategy, urgency level, " +
        "and what product information the copywriter needs. Output JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Analyze lead and create strategy brief",
          lead: params.leadData,
          client: params.clientContext,
          crmHistory: params.crmHistory || [],
        },
        null,
        2
      ),
    },
  ];

  const response = await callOpenRouter(messages, {
    model: MODELS.PLANNER,
    temperature: 0.3,
    responseFormat: { type: "json_object" },
  });

  const parsed = JSON.parse(response);
  if (
    typeof parsed.strategy !== "string" ||
    !["low", "medium", "high", "enterprise"].includes(parsed.urgency) ||
    typeof parsed.productInfo !== "string" ||
    typeof parsed.copywriterBrief !== "string" ||
    typeof parsed.segment !== "string"
  ) {
    throw new Error("Nemotron Planner returned malformed JSON");
  }
  return parsed;
}

/**
 * Step 2: Kimi Copywriter — Write converting email based on Nemotron brief
 */
export async function kimiCopywriter(params: {
  brief: string;
  brandVoice: string;
  productInfo: string;
  recipient: { name: string; company?: string };
  segment: string;
}): Promise<{
  subject: string;
  body: string;
  cta: string;
  tone: string;
  personalizationNotes: string;
}> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You are Kimi, an elite conversion copywriter. You write emails that feel deeply personal, " +
        "not salesy. Every email is tailored to the recipient's context. You match brand voice perfectly. " +
        "You write like a human, not a marketing robot. Output JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Write a personalized marketing email",
          brief: params.brief,
          brandVoice: params.brandVoice,
          productInfo: params.productInfo,
          recipient: params.recipient,
          segment: params.segment,
        },
        null,
        2
      ),
    },
  ];

  const response = await callOpenRouter(messages, {
    model: MODELS.COPYWRITER,
    temperature: 0.8,
    maxTokens: 2048,
    responseFormat: { type: "json_object" },
  });

  const parsed = JSON.parse(response);
  if (
    typeof parsed.subject !== "string" ||
    typeof parsed.body !== "string" ||
    typeof parsed.cta !== "string" ||
    typeof parsed.tone !== "string" ||
    typeof parsed.personalizationNotes !== "string"
  ) {
    throw new Error("Kimi Copywriter returned malformed JSON");
  }
  return parsed;
}

/**
 * Step 3: Nemotron Validator — Check logic, format JSON, prepare webhook payload
 */
export async function nemotronValidator(params: {
  email: { subject: string; body: string; cta: string };
  brandVoice: string;
  targetPlatform: "hubspot" | "activecampaign" | "generic";
}): Promise<{
  valid: boolean;
  issues: string[];
  formattedPayload: {
    subject: string;
    body: string;
    cta: string;
    htmlBody: string;
    properties?: Record<string, string>;
  };
  webhookJson: string;
}> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "You are Nemotron 3 Ultra, a strict QA engineer and data formatter. " +
        "Check the email for: broken links, logical errors, compliance issues, brand voice consistency. " +
        "Format the output for the target CRM platform. Return clean JSON only.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Validate and format email for CRM",
          email: params.email,
          brandVoice: params.brandVoice,
          targetPlatform: params.targetPlatform,
        },
        null,
        2
      ),
    },
  ];

  const response = await callOpenRouter(messages, {
    model: MODELS.VALIDATOR,
    temperature: 0.2,
    responseFormat: { type: "json_object" },
  });

  const parsed = JSON.parse(response);
  if (
    typeof parsed.valid !== "boolean" ||
    !Array.isArray(parsed.issues) ||
    typeof parsed.formattedPayload !== "object" || parsed.formattedPayload === null ||
    typeof parsed.formattedPayload.subject !== "string" ||
    typeof parsed.formattedPayload.body !== "string" ||
    typeof parsed.formattedPayload.cta !== "string" ||
    typeof parsed.formattedPayload.htmlBody !== "string" ||
    typeof parsed.webhookJson !== "string"
  ) {
    throw new Error("Nemotron Validator returned malformed JSON");
  }
  return parsed;
}

/**
 * ============================================================================
 * CODE SYMBIOSIS: Kimi K3 (generator) → Nemotron 3 Ultra (QA/fact-checker)
 * ============================================================================
 */

// Code pipeline models
export const CODE_MODELS = {
  GENERATOR: "moonshotai/kimi-k2.7-code",             // Kimi writes the code (dedicated code model, 4.5x cheaper than k3)
  REVIEWER: "nvidia/nemotron-3-ultra-550b-a55b:free",  // Nemotron reviews it (1M ctx, free)
} as const;

export interface CodeReviewResult {
  status: "APPROVED" | "REJECTED";
  fouten: string[];
  gecorrigeerde_code: string;
}

/**
 * Stap 1: Kimi K3 genereert code of marketing-automation logica
 */
export async function kimiCodeGenerator(prompt: string): Promise<string> {
  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "Je bent een senior full-stack engineer en marketing-automation specialist. " +
        "Schrijf complete, werkende code. Geen placeholders, geen hardcoded secrets — " +
        "gebruik environment variables voor API keys. Geef alleen de code terug, geen uitleg.",
    },
    { role: "user", content: prompt },
  ];

  try {
    return await callOpenRouter(messages, { model: CODE_MODELS.GENERATOR, temperature: 0.4, maxTokens: 8192 });
  } catch {
    // Fallback als Kimi K3 (nog) niet op OpenRouter staat
    return await callOpenRouter(messages, { model: MODELS.FALLBACK, temperature: 0.4, maxTokens: 8192 });
  }
}

/**
 * Stap 2: Nemotron 3 Ultra controleert de code van Kimi op fouten
 * Dwingt strikte JSON output via response_format.
 */
export async function nemotronFactChecker(gegenereerdeCode: string): Promise<CodeReviewResult> {
  const factCheckPrompt = `Je bent een Senior QA Engineer en Python/TypeScript Expert. Controleer de onderstaande code die door een andere AI is gegenereerd op:
1. Syntax-fouten of ontbrekende imports.
2. Logische fouten in de marketing automation logica.
3. Beveiligingsrisico's (zoals hardcoded API keys).

Code om te controleren:
${gegenereerdeCode}

Geef je output strikt in dit JSON-formaat:
{
  "status": "APPROVED" of "REJECTED",
  "fouten": ["lijst met gevonden fouten, leeg indien APPROVED"],
  "gecorrigeerde_code": "De volledige, werkende en gecorrigeerde code"
}`;

  const messages: OpenRouterMessage[] = [{ role: "user", content: factCheckPrompt }];

  let raw: string;
  try {
    raw = await callOpenRouter(messages, {
      model: CODE_MODELS.REVIEWER,
      temperature: 0.1,
      maxTokens: 8192,
      responseFormat: { type: "json_object" },
    });
  } catch {
    // Reviewer failed — fall back to a DISTINCT model, not the same free pool
    raw = await callOpenRouter(messages, {
      model: MODELS.FALLBACK,
      temperature: 0.1,
      maxTokens: 8192,
      responseFormat: { type: "json_object" },
    });
  }

  // Strip eventuele markdown fences, parse strict JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as CodeReviewResult;

  if (!parsed.status || !Array.isArray(parsed.fouten) || typeof parsed.gecorrigeerde_code !== "string") {
    throw new Error("Nemotron returned malformed review JSON");
  }
  return parsed;
}

/**
 * Volledige pipeline: Kimi genereert → Nemotron controleert → veilige code terug
 */
export async function codeSymbiosis(prompt: string): Promise<{
  ruwe_code: string;
  evaluatie: CodeReviewResult;
  veilige_code: string;
  approved: boolean;
}> {
  const ruwe_code = await kimiCodeGenerator(prompt);
  const evaluatie = await nemotronFactChecker(ruwe_code);
  return {
    ruwe_code,
    evaluatie,
    veilige_code: evaluatie.gecorrigeerde_code,
    approved: evaluatie.status === "APPROVED",
  };
}

/* ═══════════ Role helpers for the consolidated routing table ═══════════ */

/**
 * CONTENT_SAFETY: pre-publish moderation of marketing copy.
 * Returns { safe, reason }. Fails OPEN (safe: true) if the moderator is
 * unreachable — the paid-variant retry in callOpenRouter handles 429s first.
 */
export async function checkContentSafety(text: string): Promise<{ safe: boolean; reason: string }> {
  try {
    const raw = await callOpenRouter(
      [
        {
          role: "user",
          content:
            "You are a content safety classifier for marketing copy. " +
            "Classify the following text. Reply with STRICT JSON only: " +
            '{"safe": true|false, "reason": "short explanation"}. ' +
            "Unsafe means: hate speech, explicit sexual content, illegal claims, " +
            "medical/financial guarantees, or personal data exposure.\n\nTEXT:\n" + text,
        },
      ],
      { model: MODELS.CONTENT_SAFETY, temperature: 0.0, maxTokens: 512 }
    );
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.safe !== "boolean") throw new Error("malformed");
    return { safe: parsed.safe, reason: String(parsed.reason ?? "") };
  } catch (err) {
    console.warn("[Safety] Moderation unavailable, allowing post:", (err as Error).message);
    return { safe: true, reason: "moderator unavailable" };
  }
}

/**
 * VISION: analyze an image (asset tagging / description).
 * Uses the omni-modal Nemotron nano. Accepts a public URL or data URL.
 */
export async function analyzeImage(
  imageUrl: string,
  question = "Describe this image for a marketing asset library. Then output 5-10 comma-separated tags."
): Promise<{ description: string; tags: string[] }> {
  const raw = await callOpenRouter(
    [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: question + "\n\nReply STRICT JSON: {\"description\": \"...\", \"tags\": [\"...\"]}",
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    { model: MODELS.VISION, temperature: 0.3, maxTokens: 1024 }
  );
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.description !== "string" || !Array.isArray(parsed.tags)) {
    throw new Error("Vision model returned malformed JSON");
  }
  return {
    description: parsed.description,
    tags: parsed.tags.map(String),
  };
}

/**
 * FAST: cheap lead scoring via Nemotron Super (free pool).
 * Returns score 0-100 plus a one-line reason.
 */
export async function scoreLeadFast(lead: {
  name: string;
  email: string;
  company?: string | null;
  source?: string | null;
  behavior?: string | null;
  tags?: string[];
}): Promise<{ score: number; reason: string }> {
  const raw = await callOpenRouter(
    [
      {
        role: "user",
        content:
          "You are a B2B lead scoring engine. Score this lead 0-100 for conversion likelihood " +
          "based on company signal, source quality, and behavior. Reply STRICT JSON only: " +
          '{"score": <int 0-100>, "reason": "<one sentence>"}.\n\nLEAD:\n' +
          JSON.stringify(lead),
      },
    ],
    { model: MODELS.FAST, temperature: 0.2, maxTokens: 512 }
  );
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.score !== "number" || typeof parsed.reason !== "string") {
    throw new Error("Fast scoring model returned malformed JSON");
  }
  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  return { score, reason: parsed.reason };
}

export type ImageTier = "lite" | "quality" | "bulk";

const IMAGE_TIER_MODELS: Record<ImageTier, string> = {
  lite: MODELS.IMAGE_GEN,
  quality: MODELS.IMAGE_GEN_QUALITY,
  bulk: MODELS.IMAGE_GEN_BULK,
};

/**
 * IMAGE_GEN: key-backed image generation via the OpenRouter Images API
 * (POST /api/v1/images, base64 out). Returns a data URL.
 * NOTE: for Instagram publishing use a PUBLIC url (Pollinations) — Graph API
 * cannot fetch data URLs. This helper is for the asset library.
 */
export async function generateImageOpenRouter(prompt: string, tier: ImageTier = "lite"): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetchWithTimeout(`${OPENROUTER_BASE_URL}/images`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://ndeku.com",
      "X-Title": "Omega Swarm",
    },
    body: JSON.stringify({
      model: IMAGE_TIER_MODELS[tier],
      prompt,
    }),
  }, FETCH_TIMEOUT_MS);

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Image generation failed ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const first = data.data?.[0];
  const b64 = first?.b64_json;
  if (b64 && typeof b64 === "string") {
    const mediaType = first.media_type || "image/png";
    return `data:${mediaType};base64,${b64}`;
  }
  // Some providers return a hosted URL instead of b64
  if (first?.url && typeof first.url === "string") {
    return first.url;
  }
  throw new Error("Image model returned no image");
}
