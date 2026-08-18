import { router } from "./trpc";
import { agentRouter } from "./routers/agent";
import { postRouter } from "./routers/post";
import { socialRouter } from "./routers/social";
import { brandVoiceRouter } from "./routers/brandVoice";
import { viralRouter } from "./routers/viral";
import { voiceRouter } from "./routers/voice";
import { bookingRouter } from "./routers/booking";
import { videoRouter } from "./routers/video";
import { contentRouter, analyticsRouter } from "./routers/content";
import { clientRouter } from "./routers/client";
import { assetRouter } from "./routers/asset";

export const appRouter = router({
  agent: agentRouter,
  post: postRouter,
  social: socialRouter,
  brandVoice: brandVoiceRouter,
  viral: viralRouter,
  voice: voiceRouter,
  booking: bookingRouter,
  video: videoRouter,
  content: contentRouter,
  analytics: analyticsRouter,
  client: clientRouter,
  asset: assetRouter,
  // contentLibrary router deprecated — use content.list instead
});

export type AppRouter = typeof appRouter;
