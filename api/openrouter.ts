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
