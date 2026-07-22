import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey
  ? new OpenAI({ apiKey })
  : null;

export async function generateWithAgent(
  agentName: string,
  agentRole: string,
  campaignObjective: string,
  budget: string,
  timeline: string,
  brandVoice?: { tone: string; description: string } | null
): Promise<string> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY not set in Railway Variables.");
  }

  let systemPrompt = `You are ${agentName}, an expert AI marketing agent. ${agentRole}.
Generate high-quality, actionable marketing content. Be specific, creative, and data-driven.`;

  if (brandVoice) {
    systemPrompt += `\n\nWrite in this brand voice: ${brandVoice.tone}. ${brandVoice.description}`;
  }

  const userPrompt = `Campaign Brief:
- Objective: ${campaignObjective}
- Budget: ${budget}
- Timeline: ${timeline}

Generate your deliverables. Be thorough and specific.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "No response generated.";
}

export async function generateImage(prompt: string): Promise<string> {
  if (!openai) throw new Error("OPENAI_API_KEY not set.");
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  return response.data[0]?.url || "";
}

export async function generateCaption(topic: string, brandVoice?: string): Promise<string> {
  if (!openai) throw new Error("OPENAI_API_KEY not set.");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a social media expert. Write an engaging Instagram caption. ${brandVoice || ""} Include relevant hashtags. Keep it under 2,200 characters.` },
      { role: "user", content: `Write an Instagram caption about: ${topic}` },
    ],
    temperature: 0.9,
    max_tokens: 1500,
  });
  return response.choices[0]?.message?.content || "";
}
