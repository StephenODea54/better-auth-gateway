import { createServerFn } from "@tanstack/react-start";

import { env } from "@/config/env.ts";

export const getBranding = createServerFn().handler(() => ({
  appName: env.APP_NAME,
  ssoProviderId: env.SSO_PROVIDER_ID,
  ssoProviderName: env.SSO_PROVIDER_NAME,
}));
