const openaiKey = process.env.OPENAI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;

function getClient() {
  if (groqKey) return { type: "groq", key: groqKey };
  if (openaiKey) return { type: "openai", key: openaiKey };
  return null;
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

  const systemPrompt = `You are ${agentName}, an expert AI marketing agent. ${agentRole}. Generate high-quality, actionable marketing content. Be specific, creative, and data-driven.${brandVoice ? `\n\nWrite in this brand voice: ${brandVoice.tone}. ${brandVoice.description}` : ""}`;

  const userPrompt = `Campaign Brief:\n- Objective: ${campaignObjective}\n- Budget: ${budget}\n- Timeline: ${timeline}\n\nGenerate your deliverables. Be thorough and specific.`;

  if (client.type === "groq") {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${client.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

export async function generateImage(prompt: string): Promise<string> {
  const client = getClient();
  if (!client || client.type === "groq") {
    // Groq doesn't do images. Return empty.
    return "";
  }
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: client.key });
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  return response.data?.[0]?.url || "";
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
        model: "llama-3.3-70b-versatile",
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
