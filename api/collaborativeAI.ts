import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai"; // Moonshot AI uses the OpenAI-compatible SDK structure

// 1. Initialize Claude (Anthropic)
const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 2. Initialize Kimi (Moonshot AI)
const kimi = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: "https://moonshot.cn",
});

/**
 * Executes a collaborative AI workflow where Claude and Kimi process a task sequentially.
 * @param userPrompt The initial request or prompt from your user.
 * @returns The final, optimized response after both AIs collaborate.
 */
export async function collaborativeAiWorkflow(userPrompt: string): Promise<string | null> {
  try {
    // STEP 1: Claude takes the first turn to draft the response
    const claudeResponse = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract Claude's textual output safely
    const claudeDraft = claudeResponse.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    if (!claudeDraft) {
      throw new Error("Claude failed to generate a draft response.");
    }

    // STEP 2: Kimi takes Claude's draft and optimizes it
    const kimiResponse = await kimi.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content:
            "You are an expert review agent. Look at the draft provided below. Your job is to double-check it for errors, refine the formatting, make it highly scannable, and provide the absolute best final version.",
        },
        {
          role: "user",
          content: `Here is the initial draft from Claude. Please review, correct, and optimize it:\n\n${claudeDraft}`,
        },
      ],
      temperature: 0.3, // Keeps Kimi focused on optimization rather than rewriting completely
    });

    // Return Kimi's optimized final response
    return kimiResponse.choices[0].message.content;
  } catch (error) {
    console.error("Collaborative AI Pipeline Error:", error);
    throw error;
  }
}
