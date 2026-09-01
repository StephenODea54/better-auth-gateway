import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/features/auth/clients/server-client.ts";
import { isSuperAdmin } from "@/features/auth/lib/super-admin.ts";

export const getSession = createServerFn().handler(async () => {
  const session = await auth.api.getSession({ headers: getRequest().headers });

  if (!session) {
    return null;
  }

  return { ...session, isSuperAdmin: isSuperAdmin(session.user.role) };
});
