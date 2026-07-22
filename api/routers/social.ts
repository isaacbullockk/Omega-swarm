import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  getSocialAccounts,
  addSocialAccount,
  updateSocialAccount,
  disconnectSocialAccount,
} from "../../db/store";

const BUFFER_API_KEY = process.env.BUFFER_API_KEY;

async function bufferApi(path: string, method = "GET", body?: Record<string, unknown>) {
  const res = await fetch(`https://api.bufferapp.com/1/${path}.json?access_token=${BUFFER_API_KEY}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const socialRouter = router({
  list: publicProcedure.query(async () => {
    return getSocialAccounts();
  }),

  connect: publicProcedure
    .input(
      z.object({
        platform: z.enum(["instagram", "facebook", "youtube"]),
        accountName: z.string().min(1),
        handle: z.string().min(1),
        accessToken: z.string().min(1),
        pageId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = getSocialAccounts().find(
        (a) => a.handle === input.handle && a.platform === input.platform
      );

      if (existing) {
        return updateSocialAccount(existing.id, {
          connected: true,
          accessToken: input.accessToken,
          pageId: input.pageId,
          connectedAt: new Date().toISOString(),
        });
      }

      return addSocialAccount({
        id: `${input.platform}_${Date.now()}`,
        platform: input.platform,
        accountName: input.accountName,
        handle: input.handle,
        connected: true,
        accessToken: input.accessToken,
        pageId: input.pageId,
        connectedAt: new Date().toISOString(),
      });
    }),

  disconnect: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return disconnectSocialAccount(input.id);
    }),

  status: publicProcedure
    .input(z.object({ platform: z.enum(["instagram", "facebook", "youtube"]) }))
    .query(async ({ input }) => {
      const accounts = getSocialAccounts().filter(
        (a) => a.platform === input.platform
      );
      return {
        platform: input.platform,
        total: accounts.length,
        connected: accounts.filter((a) => a.connected).length,
        accounts,
      };
    }),

  // BUFFER: Get connected profiles
  bufferProfiles: publicProcedure.query(async () => {
    if (!BUFFER_API_KEY) return { error: "No Buffer API key", profiles: [] };
    try {
      const data = await bufferApi("profiles/profiles");
      return { profiles: data || [] };
    } catch (e) {
      return { error: "Buffer API failed", profiles: [] };
    }
  }),

  // BUFFER: Create and publish a post
  post: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        profileIds: z.array(z.string()).min(1),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!BUFFER_API_KEY) {
        throw new Error("BUFFER_API_KEY not configured. Add it to Railway environment variables.");
      }

      const body: Record<string, unknown> = {
        text: input.text,
        profile_ids: input.profileIds,
      };

      if (input.scheduledAt) {
        body.scheduled_at = input.scheduledAt;
      }

      try {
        const data = await bufferApi("updates/updates/create", "POST", body);

        if (data && data.success) {
          return {
            success: true,
            postId: data.id,
            text: input.text,
            status: input.scheduledAt ? "scheduled" : "sent",
            url: `https://buffer.com/app/${data.id}`,
          };
        }

        // Return what Buffer gave us even if not "success"
        return {
          success: data && (data.id || data.success),
          postId: data?.id,
          text: input.text,
          status: input.scheduledAt ? "scheduled" : data?.id ? "sent" : "failed",
          bufferResponse: data,
        };
      } catch (e) {
        throw new Error(`Buffer post failed: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }),
});
