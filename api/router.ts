import { router } from "./trpc";
import { agentRouter } from "./routers/agent";
import { brandVoiceRouter } from "./routers/brandVoice";
import { socialRouter } from "./routers/social";
import { viralRouter } from "./routers/viral";
import { contentLibraryRouter } from "./routers/contentLibrary";

export const appRouter = router({
  agent: agentRouter,
  brandVoice: brandVoiceRouter,
  social: socialRouter,
  viral: viralRouter,
  contentLibrary: contentLibraryRouter,
});

export type AppRouter = typeof appRouter;
