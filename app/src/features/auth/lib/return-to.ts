export function resolveReturnTo(returnTo: null | string, origin: string) {
  if (!returnTo) {
    return origin;
  }

  try {
    return new URL(returnTo).origin === origin ? returnTo : origin;
  }
  catch {
    return origin;
  }
}
