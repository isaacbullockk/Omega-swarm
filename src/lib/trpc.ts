import { createTRPCReact, httpBatchLink, loggerLink } from "@trpc/react-query";
import type { AppRouter } from "../../api/router";

export const trpc = createTRPCReact<AppRouter>();

export const TRPCProvider = trpc.Provider;

const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";

export const trpcClient = trpc.createClient({
  links: [
    ...(isDev
      ? [
          loggerLink({
            console: {
              log: (...args) => console.log(...args),
              error: (...args) => console.error(...args),
              group: (...args) => console.group(...args),
              groupCollapsed: (...args) => console.groupCollapsed(...args),
              groupEnd: () => console.groupEnd(),
            },
          }),
        ]
      : []),
    httpBatchLink({
      url: "/api/trpc",
      headers() {
        const token = typeof window !== "undefined" ? localStorage.getItem("omega_swarm_token") : null;
        return {
          "x-trpc-source": "react-client",
          ...(token ? { "x-session-token": token } : {}),
        };
      },
      maxURLLength: 2083,
    }),
  ],
});
