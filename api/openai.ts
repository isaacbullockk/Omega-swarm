const openaiKey = process.env.OPENAI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;

function getClient() {
  if (groqKey) return { type: "groq", key: groqKey };
  if (openaiKey) return { type: "openai", key: openaiKey };
  return null;
}

/**
 * Build a system prompt that respects the agent's identity.
 * For Vision (Creative Director), we use the raw role directly — no generic wrapper —
 * because the persona is carefully crafted to be Jobs + Godin + guru.
 * For other agents, we wrap with a light generic intro.
 */
function buildSystemPrompt(agentName: string, agentRole: string, brandVoice?: { tone: string; description: string } | null): string {
  const isVision = agentName === "Vision";

  let prompt: string;
  if (isVision) {
    // Vision gets the raw, unadulterated persona. No generic wrapper.
    prompt = agentRole;
  } else {
    prompt = `You are ${agentName}, an expert AI marketing agent. ${agentRole}. Generate high-quality, actionable marketing content. Be specific, creative, and data-driven.`;
  }

  if (brandVoice) {
    prompt += `\n\nWrite in this brand voice: ${brandVoice.tone}. ${brandVoice.description}`;
  }

  return prompt;
}

/**
 * Build a chat system prompt. Same logic — Vision gets the raw persona.
 */
function buildChatSystemPrompt(agentName: string, agentRole: string, brandVoice?: { tone: string; description: string } | null): string {
  const isVision = agentName === "Vision";

  let prompt: string;
  if (isVision) {
    prompt = `${agentRole}\n\nYou are currently in a real-time chat with a user in a marketing agency platform. Respond conversationally — concise, punchy, and with conviction. Ask the hard questions. Push back on mediocrity. Reveal, don't explain.`;
  } else {
    prompt = `You are ${agentName}, an expert AI marketing agent. ${agentRole}. You are chatting with a user in a marketing agency platform. Respond conversationally, helpfully, and concisely. Be friendly and professional.`;
  }

  if (brandVoice) {
    prompt += `\n\nWrite in this brand voice: ${brandVoice.tone}. ${brandVoice.description}`;
  }

  return prompt;
}

export async function generateWithAgent(
  agentName: string,
  agentRole: string,
  campaignObjective: string,
  budget: string,
  timeline: string,
  brandVoice?: { tone: string; description: string } | null
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("No AI key set. Add GROQ_API_KEY or OPENAI_API_KEY to Railway Variables.");
  }

  const systemPrompt = buildSystemPrompt(agentName, agentRole, brandVoice);

  const userPrompt = `Campaign Brief:
- Objective: ${campaignObjective}
- Budget: ${budget}
- Timeline: ${timeline}

Generate your deliverables. Be thorough and specific.`;

  if (client.type === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq error: ${res.status} ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response from Groq";
  }

  // OpenAI fallback
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: client.key });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });
  return response.choices[0]?.message?.content || "No response";
}

export async function generateImage(prompt: string, provider?: "pollinations" | "openai"): Promise<string> {
  // Premium: OpenAI DALL-E 3 — fast (~5s), high quality, costs ~$0.04/image
  if (provider === "openai" && openaiKey) {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: openaiKey });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    return response.data[0]?.url || "";
  }

  // Free fallback: Pollinations.ai — slow (~15-30s), no API key
  // Use a small random seed (0-999999) — Pollinations chokes on Date.now() seeds > 1 billion
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
}

export async function generateCaption(topic: string, brandVoice?: string): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("No AI key set. Add GROQ_API_KEY or OPENAI_API_KEY to Railway Variables.");
  }

  const systemPrompt = `You are a social media expert. Write an engaging Instagram caption. ${brandVoice || ""} Include relevant hashtags. Keep it under 2,200 characters.`;

  if (client.type === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Write an Instagram caption about: ${topic}` },
        ],
        temperature: 0.9,
        max_tokens: 1500,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq error: ${res.status} ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response";
  }

  // OpenAI fallback
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: client.key });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write an Instagram caption about: ${topic}` },
    ],
    temperature: 0.9,
    max_tokens: 1500,
  });
  return response.choices[0]?.message?.content || "No response";
}

export async function chatWithAgent(
  agentName: string,
  agentRole: string,
  userMessage: string,
  brandVoice?: { tone: string; description: string } | null
): Promise<string> {
  const client = getClient();
  if (!client) {
    throw new Error("No AI key set. Add GROQ_API_KEY or OPENAI_API_KEY to Railway Variables.");
  }

  const systemPrompt = buildChatSystemPrompt(agentName, agentRole, brandVoice);
  const userPrompt = userMessage;

  if (client.type === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq error: ${res.status} ${err}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No response from Groq";
  }

  // OpenAI fallback
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: client.key });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 1500,
  });
  return response.choices[0]?.message?.content || "No response";
}
