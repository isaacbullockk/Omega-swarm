# Trigger Redeploy 7

Debug deployment to expose the underlying error message in `post.create`.

- Updated catch block in `api/routers/post.ts` to include `msg` in the thrown TRPCError.
- Bumped `CACHE_BUST` to force a fresh Docker build.
