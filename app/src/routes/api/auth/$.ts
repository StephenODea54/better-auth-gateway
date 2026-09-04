import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/config/env.ts";
import { auth } from "@/features/auth/clients/server-client.ts";
import { isTrustedOrigin } from "@/features/auth/lib/trusted-origins.ts";
import { corsHeaders, withCorsHeaders } from "@/lib/cors.ts";

const METHODS = "GET, POST, OPTIONS";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const origin = request.headers.get("origin");

        if (!origin || origin === new URL(env.BETTER_AUTH_URL).origin) {
          return auth.handler(request);
        }

        if (!await isTrustedOrigin(origin)) {
          return new Response(null, { status: 403 });
        }

        if (request.method === "OPTIONS") {
          return new Response(null, { headers: corsHeaders(origin, METHODS), status: 204 });
        }

        return withCorsHeaders(await auth.handler(request), origin, METHODS);
      },
    },
  },
});
