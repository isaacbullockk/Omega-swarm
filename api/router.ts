import { router } from "./trpc";
import { agentRouter } from "./routers/agent";
import { brandVoiceRouter } from "./routers/brandVoice";
import { socialRouter } from "./routers/social";
import { viralRouter } from "./routers/viral";
import { contentLibraryRouter } from "./routers/contentLibrary";
import { voiceRouter } from "./routers/voice";
import { postRouter } from "./routers/post";

export const appRouter = router({
  agent: agentRouter,
  brandVoice: brandVoiceRouter,
  social: socialRouter,
  viral: viralRouter,
  contentLibrary: contentLibraryRouter,
  voice: voiceRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
