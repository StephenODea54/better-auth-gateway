import { ssoClient } from "@better-auth/sso/client";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "@/features/auth/lib/access-control.ts";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      dynamicAccessControl: { enabled: true },
      roles,
    }),
    ssoClient(),
  ],
});
