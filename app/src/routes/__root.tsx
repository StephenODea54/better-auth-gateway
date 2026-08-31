import type { QueryClient } from "@tanstack/react-query";

import {
  createRootRouteWithContext,
} from "@tanstack/react-router";

import { RootLayout } from "@/components/layouts/root-layout";
import { getSession } from "@/features/auth/api/get-session.ts";

import appCss from "../styles/index.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => ({ session: await getSession() }),
  errorComponent: () => <div>Oops! Something went wrong</div>,
  head: () => ({
    links: [
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
    meta: [
      {
        charSet: "utf-8",
      },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  notFoundComponent: () => <div>Oops! Nothing found here</div>,
  shellComponent: RootLayout,
});
