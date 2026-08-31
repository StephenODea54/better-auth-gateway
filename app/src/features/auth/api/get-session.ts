import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/features/auth/clients/server-client.ts";

export const getSession = createServerFn().handler(async () =>
  auth.api.getSession({ headers: getRequest().headers }),
);
