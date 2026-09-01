import type { UseMutationOptions } from "@tanstack/react-query";

import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/features/auth/clients/web-client.ts";

interface UseSignInOptions {
  mutationConfig?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">;
}

export async function signIn(providerId: string) {
  const { error } = await authClient.signIn.sso({
    callbackURL: "/dashboard",
    providerId,
    providerType: "saml",
  });

  if (error) {
    throw new Error(error.message ?? "Unable to reach your identity provider. Please try again.");
  }
}

export function useSignIn({ mutationConfig }: UseSignInOptions = {}) {
  return useMutation({
    ...mutationConfig,
    mutationFn: signIn,
  });
}
