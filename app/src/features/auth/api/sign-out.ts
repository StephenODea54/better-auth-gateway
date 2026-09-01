import type { UseMutationOptions } from "@tanstack/react-query";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { authClient } from "@/features/auth/clients/web-client.ts";

interface UseSignOutOptions {
  mutationConfig?: Omit<UseMutationOptions<void, Error>, "mutationFn">;
}

export async function signOut() {
  const { error } = await authClient.signOut();

  if (error) {
    throw new Error(error.message ?? "Could not sign you out. Please try again.");
  }
}

export function useSignOut({ mutationConfig }: UseSignOutOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: async (...args) => {
      await router.invalidate();
      queryClient.clear();
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: signOut,
  });
}
