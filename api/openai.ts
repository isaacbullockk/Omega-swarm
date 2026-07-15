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
    const brandVoiceNote = brandVoice ? `\n\nBrand Voice: ${brandVoice.tone}. ${brandVoice.description}` : "";
    return `[SIMULATED] ${agentName} output for: "${campaignObjective}"\n\nThis is a simulated response. Add OPENAI_API_KEY to your .env file to get real AI-generated content.\n\n${agentRole}\nBudget: ${budget} | Timeline: ${timeline}${brandVoiceNote}`;
  }

  let systemPrompt = `You are ${agentName}, an expert AI marketing agent. ${agentRole}. 
Generate high-quality, actionable marketing content based on the campaign brief.
Be specific, creative, and data-driven. Format your response with clear sections and bullet points.`;

  if (brandVoice) {
    systemPrompt += `\n\nWrite in this brand voice: ${brandVoice.tone}. ${brandVoice.description}`;
  }

  const userPrompt = `Campaign Brief:
- Objective: ${campaignObjective}
- Budget: ${budget}
- Timeline: ${timeline}

Generate your deliverables now. Be thorough and specific.`;

  try {
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
  } catch (error) {
    console.error(`OpenAI error for ${agentName}:`, error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
