import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/features/auth/clients/server-client.ts";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      ANY: ({ request }) => auth.handler(request),
    },
  },
});
