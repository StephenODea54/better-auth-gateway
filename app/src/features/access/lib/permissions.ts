export interface VocabularyGroup {
  actions: string[];
  key: string;
}

export function mergePermissions(
  roleNames: string[],
  stored: Map<string, Record<string, string[]>>,
) {
  const merged: Record<string, Set<string>> = {};

  for (const name of roleNames) {
    for (const [key, actions] of Object.entries(stored.get(name) ?? {})) {
      merged[key] = new Set([...(merged[key] ?? []), ...actions]);
    }
  }

  return Object.fromEntries(
    Object.entries(merged)
      .map(([key, actions]) => [key, [...actions].sort()] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function toPairs(permission: Record<string, string[]>) {
  return new Set(
    Object.entries(permission).flatMap(([key, actions]) => actions.map(action => `${key}:${action}`)),
  );
}
