import type { QueryClient } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";

import {
  createRootRouteWithContext,
} from "@tanstack/react-router";

import { RootLayout } from "@/components/layouts/root-layout";
import { RouteError } from "@/components/layouts/route-error.tsx";
import { RouteNotFound } from "@/components/layouts/route-not-found.tsx";
import { getBranding } from "@/config/branding.ts";
import { getSession } from "@/features/auth/api/get-session.ts";

import appCss from "../styles/index.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => ({ session: await getSession() }),
  errorComponent: (props: ErrorComponentProps) => (
    <main className="flex min-h-svh flex-col justify-center p-6">
      <RouteError {...props} />
    </main>
  ),
  head: ({ loaderData }) => ({
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
        title: loaderData?.appName ?? "Auth Gateway",
      },
    ],
  }),
  loader: () => getBranding(),
  notFoundComponent: () => (
    <main className="flex min-h-svh flex-col justify-center p-6">
      <RouteNotFound />
    </main>
  ),
  shellComponent: RootLayout,
  staleTime: Number.POSITIVE_INFINITY,
});
