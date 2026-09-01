import { describe, expect, it } from "vitest";

import type { PermissionMap } from "./permissions.ts";

import { mergePermissions, toPairs } from "./permissions.ts";

describe("mergePermissions", () => {
  it("unions actions across roles and dedupes them", () => {
    const stored = new Map<string, PermissionMap>([
      ["editor", { document: ["read", "update"] }],
      ["viewer", { document: ["read"] }],
    ]);

    expect(mergePermissions(["viewer", "editor"], stored)).toEqual({
      document: ["read", "update"],
    });
  });

  it("sorts actions and keys", () => {
    const stored = new Map<string, PermissionMap>([
      ["admin", { apple: ["create"], zebra: ["write", "delete"] }],
    ]);

    const merged = mergePermissions(["admin"], stored);

    expect(Object.keys(merged)).toEqual(["apple", "zebra"]);
    expect(merged.zebra).toEqual(["delete", "write"]);
  });

  it("ignores roles missing from the store", () => {
    const stored = new Map<string, PermissionMap>([
      ["member", { project: ["read"] }],
    ]);

    expect(mergePermissions(["member", "ghost"], stored)).toEqual({
      project: ["read"],
    });
  });

  it("returns an empty map for no roles", () => {
    const stored = new Map<string, PermissionMap>([
      ["member", { project: ["read"] }],
    ]);

    expect(mergePermissions([], stored)).toEqual({});
  });
});

describe("toPairs", () => {
  it("flattens a permission map into key:action pairs", () => {
    expect(toPairs({ document: ["read", "update"], project: ["read"] })).toEqual(
      new Set(["document:read", "document:update", "project:read"]),
    );
  });

  it("returns an empty set for an empty map", () => {
    expect(toPairs({})).toEqual(new Set());
  });
});
