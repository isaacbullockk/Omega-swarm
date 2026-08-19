/**
 * Omega Swarm v5.0 — Voice Router (PostgreSQL + Auth)
 *
 * AI voice generation endpoints use rateLimitedProcedure (10 req/min).
 * List operations use authedProcedure. Data is filtered by user_id.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure, rateLimitedProcedure } from "../trpc";
import { db, isPostgresAvailable } from "../../db/connection";

/* ─── Zod Schemas ─── */

const generateSpeechSchema = z.object({
  text: z.string().min(1, "Text is required"),
  voiceId: z.string().min(1, "Voice ID is required"),
  stability: z.number().min(0).max(1).optional(),
});

export const voiceRouter = router({
  /* ─── List available voices (placeholder) ─── */
  listVoices: authedProcedure.query(async () => {
    // Placeholder: integrate with ElevenLabs or similar provider
    return [
      { id: "alloy", name: "Alloy", description: "Neutral, balanced" },
      { id: "echo", name: "Echo", description: "Warm, approachable" },
      { id: "fable", name: "Fable", description: "British, refined" },
      { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
      { id: "nova", name: "Nova", description: "Energetic, bright" },
      { id: "shimmer", name: "Shimmer", description: "Clear, optimistic" },
    ];
  }),

  /* ─── Generate speech (rate limited) ─── */
  generateSpeech: rateLimitedProcedure
    .input(generateSpeechSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Placeholder: integrate with ElevenLabs or similar provider
        // For now, return a structured response with a placeholder URL
        const id = `audio_${Date.now()}`;

        return {
          id,
          userId: ctx.user.id,
          text: input.text,
          voiceId: input.voiceId,
          stability: input.stability ?? 0.5,
          status: "completed" as const,
          url: null as string | null,
          duration: "0:12",
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        console.error("[Voice] Generate error:", (err as Error).message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate speech",
        });
      }
    }),

  /* ─── List speech generations for the authenticated user ─── */
  listGenerations: authedProcedure.query(async ({ ctx }) => {
    if (!isPostgresAvailable()) return [];
    // Placeholder: when voice generation is stored in DB, query here
    // For now, return empty as generations are not persisted yet
    return [];
  }),
});
