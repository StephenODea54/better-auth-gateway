import { APIError } from "better-auth/api";

import { setEventError } from "@/lib/wide-event.ts";

export function toFriendlyError(error: unknown, fallback: string) {
  setEventError(error);

  return error instanceof APIError ? new Error(error.message) : new Error(fallback);
}
