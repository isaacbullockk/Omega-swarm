import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { generateCaption, generateImage } from "../openai";
import { addContentPost, updateContentPost, deleteContentPost, getContentPosts, addAnalyticsEvent } from "../../db/store";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

async function postToInstagram(caption: string, imageUrl: string): Promise<{
  success: boolean;
  postId?: string;
  permalink?: string;
  error?: string;
}> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return { success: false, error: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID not set" };
  }

  const apiBase = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}`;

  try {
    const createUrl = `${apiBase}/media?` + new URLSearchParams({
      caption,
      image_url: imageUrl,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }).toString();

    const createRes = await fetch(createUrl, { method: "POST" });
    const createData = await createRes.json();

    if (createData.error) {
      return { success: false, error: `Instagram create failed: ${createData.error.message}` };
    }

    const creationId = createData.id;
    if (!creationId) {
      return { success: false, error: "No creation ID returned from Instagram" };
    }

    const publishUrl = `${apiBase}/media_publish?` + new URLSearchParams({
      creation_id: creationId,
      access_token: INSTAGRAM_ACCESS_TOKEN,
    }).toString();

    const publishRes = await fetch(publishUrl, { method: "POST" });
    const publishData = await publishRes.json();

    if (publishData.error) {
      return { success: false, error: `Instagram publish failed: ${publishData.error.message}` };
    }

    return {
      success: true,
      postId: publishData.id,
      permalink: `https://instagram.com/p/${publishData.id}`,
    };
  } catch (e) {
    return { success: false, error: `Instagram API error: ${e instanceof Error ? e.message : "Unknown"}` };
  }
}

async function getInstagramAccount() {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
    return { connected: false, error: "Token or Account ID not set" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=username,media_count&access_token=${INSTAGRAM_ACCESS_TOKEN}`
    );
    const data = await res.json();

    if (data.error) {
      return { connected: false, error: data.error.message };
    }

    return {
      connected: true,
      username: data.username,
      accountId: INSTAGRAM_ACCOUNT_ID,
      mediaCount: data.media_count,
    };
  } catch (e) {
    return { connected: false, error: `API error: ${e instanceof Error ? e.message : "Unknown"}` };
  }
}

export const postRouter = router({
  instagramStatus: publicProcedure.query(async () => {
    return getInstagramAccount();
  }),

  exchangeToken: publicProcedure
    .input(z.object({ shortToken: z.string() }))
    .mutation(async ({ input }) => {
      const appId = "2068258280743434";
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        return { error: "META_APP_SECRET not set in Railway. Add it to exchange tokens." };
      }
      try {
        const res = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${input.shortToken}`
        );
        const data = await res.json();
        if (data.error) {
          return { error: data.error.message };
        }
        return {
          longToken: data.access_token,
          expiresIn: data.expires_in,
          note: "Paste this longToken into Railway INSTAGRAM_ACCESS_TOKEN variable",
        };
      } catch (e) {
        return { error: `Exchange failed: ${e instanceof Error ? e.message : "Unknown"}` };
      }
    }),

  // Create and publish a post — returns in ~1s, image URL is ready immediately
  create: publicProcedure
    .input(z.object({
      topic: z.string().min(1),
      brandVoice: z.string().optional(),
      imageProvider: z.enum(["pollinations", "openai"]).optional().default("pollinations"),
    }))
    .mutation(async ({ input }) => {
      const id = `post_${Date.now()}`;

      // 1. Generate caption with AI (Groq — fast, ~1s)
      let caption: string;
      try {
        caption = await generateCaption(input.topic, input.brandVoice);
      } catch (e) {
        throw new Error(`AI caption failed: ${e instanceof Error ? e.message : "Unknown"}`);
      }

      // 2. Build image URL immediately
      let imageUrl: string | undefined;
      if (input.imageProvider === "openai") {
        try {
          imageUrl = await generateImage(
            `Instagram post: ${input.topic}. Professional marketing visual.`,
            "openai"
          );
        } catch (e) {
          console.log("DALL-E image failed:", e);
        }
      } else {
        const encoded = encodeURIComponent(`Instagram post: ${input.topic}. Professional marketing visual.`);
        imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      }

      // 3. Create and persist post
      const post = addContentPost({
        id,
        title: input.topic,
        caption,
        type: "social",
        status: "published",
        date: new Date().toISOString().split("T")[0],
        account: "@kyakuwamusic",
        imageUrl,
        instagramPostId: undefined,
        likes: 0,
        comments: 0,
        views: 0,
        createdAt: new Date().toISOString(),
      });

      // 4. Log analytics event
      addAnalyticsEvent({
        id: `evt_${Date.now()}`,
        type: "post_created",
        title: "New post created",
        description: `Created "${input.topic}" with AI caption`,
        agentColor: "#F59E0B",
        agentName: "Pulse",
        timestamp: new Date().toISOString(),
      });

      // 5. Post to Instagram in background
      if (INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID && imageUrl) {
        postToInstagram(caption, imageUrl)
          .then(result => {
            if (result.success) {
              updateContentPost(id, { instagramPostId: result.postId });
              addAnalyticsEvent({
                id: `evt_${Date.now()}`,
                type: "instagram_published",
                title: "Posted to Instagram",
                description: `Post "${input.topic}" published to Instagram`,
                agentColor: "#EC4899",
                agentName: "Pulse",
                timestamp: new Date().toISOString(),
              });
            }
          })
          .catch(err => console.log("Instagram post failed:", err));
      }

      return post;
    }),

  // List all posts
  list: publicProcedure.query(() => {
    return getContentPosts();
  }),

  // Delete a post
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      deleteContentPost(input.id);
      return { success: true };
    }),
});
