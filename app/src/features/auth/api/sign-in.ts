import type { UseMutationOptions } from "@tanstack/react-query";

import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/features/auth/clients/web-client.ts";

interface UseSignInOptions {
  mutationConfig?: Omit<UseMutationOptions<void, Error>, "mutationFn">;
}

export async function signIn() {
  const { error } = await authClient.signIn.sso({
    callbackURL: "/dashboard",
    providerId: "okta",
    providerType: "saml",
  });

  if (error) {
    throw new Error(error.message ?? "Unable to reach Okta. Please try again.");
  }
}

export function useSignIn({ mutationConfig }: UseSignInOptions = {}) {
  return useMutation({
    ...mutationConfig,
    mutationFn: signIn,
  });
}
