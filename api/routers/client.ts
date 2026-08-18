import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  getClients,
  getClient,
  addClient,
  updateClient,
  deleteClient,
} from "../../db/store";

export const clientRouter = router({
  list: publicProcedure.query(() => {
    return getClients();
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return getClient(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        handle: z.string().min(1),
        tagline: z.string(),
        tier: z.number().default(1),
        status: z.enum(["active", "paused", "archived"]).default("active"),
        bioFull: z.string(),
        bioMedium: z.string(),
        bioShort: z.string(),
        location: z.string(),
        primaryColor: z.string().default("#D97706"),
        secondaryColor: z.string().default("#1E3A5F"),
        accentColor: z.string().default("#F5F5F0"),
        website: z.string().optional(),
        socialLinks: z.record(z.string()).default({}),
        brandHierarchy: z.array(z.any()).default([]),
        namingRules: z.record(z.any()).default({}),
        toneWords: z.array(z.string()).default([]),
        bannedPhrases: z.array(z.string()).default([]),
        contentPillars: z.array(z.any()).default([]),
        storyBank: z.array(z.any()).default([]),
        calendarEntries: z.array(z.any()).default([]),
      })
    )
    .mutation(({ input }) => {
      const now = new Date().toISOString();
      const client = addClient({
        id: `client_${Date.now()}`,
        ...input,
        createdAt: now,
        updatedAt: now,
      });
      return client;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        updates: z.record(z.any()),
      })
    )
    .mutation(({ input }) => {
      return updateClient(input.id, input.updates);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      return deleteClient(input.id);
    }),
});
