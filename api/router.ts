import { router } from "./trpc.ts";
import { agentRouter } from "./routers/agent.ts";
import { brandVoiceRouter } from "./routers/brandVoice.ts";
import { socialRouter } from "./routers/social.ts";
import { viralRouter } from "./routers/viral.ts";
import { contentLibraryRouter } from "./routers/contentLibrary.ts";

export const appRouter = router({
  agent: agentRouter,
  brandVoice: brandVoiceRouter,
  social: socialRouter,
  viral: viralRouter,
  contentLibrary: contentLibraryRouter,
});

export type AppRouter = typeof appRouter;
