import { router } from "./trpc";
import { agentRouter } from "./routers/agent";
import { postRouter } from "./routers/post";
import { socialRouter } from "./routers/social";
import { brandVoiceRouter } from "./routers/brandVoice";
import { viralRouter } from "./routers/viral";
import { voiceRouter } from "./routers/voice";
import { bookingRouter } from "./routers/booking";
import { videoRouter } from "./routers/video";
import { contentRouter } from "./routers/content";
import { contentLibraryRouter } from "./routers/contentLibrary";
import { analyticsRouter } from "./routers/analytics";
import { campaignRouter } from "./routers/campaign";
import { clientRouter } from "./routers/client";
import { assetRouter } from "./routers/asset";
import { authRouter } from "./routers/auth";

import { metricsRouter } from "./routers/metrics";

import { gdprRouter } from "./routers/gdpr";

import { leadRouter } from "./routers/lead";

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
  contentLibrary: contentLibraryRouter,
  analytics: analyticsRouter,
  campaign: campaignRouter,
  client: clientRouter,
  asset: assetRouter,
  auth: authRouter,
  metrics: metricsRouter,
  gdpr: gdprRouter,
  lead: leadRouter,
});

export type AppRouter = typeof appRouter;
