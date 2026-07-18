import { createTRPCReact, httpLink } from "@trpc/react-query";
import type { AppRouter } from "../../api/router";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
    }),
  ],
});
