/**
 * Omega Swarm v5.0 — OpenRouter Client (Nemotron + Multi-Model)
 *
 * Uses OpenRouter API to access Nemotron 3 Ultra, Llama, Claude, GPT-4o.
 * Single API key gives access to 200+ models.
 * Falls back to Groq if OpenRouter is unavailable.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Model routing for symbiosis workflow
export const MODELS = {
  PLANNER: "nvidia/llama-3.1-nemotron-ultra-v1",      // Step 1: Analyze + Strategize
  COPYWRITER: "meta-llama/llama-4-maverick",           // Step 2: Write human copy
  VALIDATOR: "nvidia/llama-3.1-nemotron-70b-instruct", // Step 3: Validate + Format
  FALLBACK: "google/gemini-2.5-pro-preview",           // Fallback
} as const;

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://ndeku.com",
      "X-Title": "Omega Swarm",
    },
    body: JSON.stringify(body),
  });

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

  return JSON.parse(response);
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

  return JSON.parse(response);
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

  return JSON.parse(response);
}

/**
 * ============================================================================
 * CODE SYMBIOSIS: Kimi K3 (generator) → Nemotron 3 Ultra (QA/fact-checker)
 * ============================================================================
 */

// Code pipeline models
export const CODE_MODELS = {
  GENERATOR: "moonshotai/kimi-k3",                    // Kimi writes the code
  REVIEWER: "nvidia/nemotron-3-ultra-550b-a55b",      // Nemotron reviews it
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
    raw = await callOpenRouter(messages, {
      model: MODELS.VALIDATOR,
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
