export interface VocabularyGroup {
  actions: string[];
  key: string;
}

export function toPairs(permission: Record<string, string[]>) {
  return new Set(
    Object.entries(permission).flatMap(([key, actions]) => actions.map(action => `${key}:${action}`)),
  );
}
