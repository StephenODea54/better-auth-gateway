import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { RouteError } from "./components/layouts/route-error.tsx";
import { RouteNotFound } from "./components/layouts/route-not-found.tsx";
import { queryConfig } from "./lib/react-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({ defaultOptions: queryConfig });

  const router = createTanStackRouter({
    context: { queryClient },
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: RouteNotFound,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({ queryClient, router });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }

  interface StaticDataRouteOption {
    section?: string;
    title?: string;
  }
}
