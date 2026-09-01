import { describe, expect, it } from "vitest";

import {
  includesSuperAdminMarker,
  isSuperAdmin,
  splitRoles,
  withoutSuperAdminRole,
  withSuperAdminRole,
} from "./super-admin.ts";

describe("isSuperAdmin", () => {
  it("finds admin inside a comma-separated role string", () => {
    expect(isSuperAdmin("user,admin")).toBe(true);
    expect(isSuperAdmin("admin")).toBe(true);
  });

  it("is false for null, undefined and empty", () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin(undefined)).toBe(false);
    expect(isSuperAdmin("")).toBe(false);
  });

  it("does not match roles that merely contain admin", () => {
    expect(isSuperAdmin("administrator")).toBe(false);
  });
});

describe("includesSuperAdminMarker", () => {
  it("finds the marker in a CSV string with spaces", () => {
    expect(includesSuperAdminMarker("owner, gateway-admin")).toBe(true);
    expect(includesSuperAdminMarker("owner,member")).toBe(false);
  });

  it("accepts array input", () => {
    expect(includesSuperAdminMarker(["owner", "gateway-admin"])).toBe(true);
    expect(includesSuperAdminMarker(["owner"])).toBe(false);
  });

  it("is false for null", () => {
    expect(includesSuperAdminMarker(null)).toBe(false);
  });
});

describe("withSuperAdminRole", () => {
  it("adds the admin role", () => {
    expect(withSuperAdminRole("user")).toEqual(["user", "admin"]);
  });

  it("dedupes when admin is already present", () => {
    expect(withSuperAdminRole("user,admin")).toEqual(["user", "admin"]);
  });
});

describe("withoutSuperAdminRole", () => {
  it("removes the admin role", () => {
    expect(withoutSuperAdminRole("user,admin")).toEqual(["user"]);
  });

  it("falls back to the default role when nothing remains", () => {
    expect(withoutSuperAdminRole("admin")).toEqual(["user"]);
    expect(withoutSuperAdminRole(null)).toEqual(["user"]);
  });
});

describe("splitRoles", () => {
  it("trims each role and drops empties", () => {
    expect(splitRoles(" owner , member ,, ")).toEqual(["owner", "member"]);
  });

  it("returns an empty array for null and undefined", () => {
    expect(splitRoles(null)).toEqual([]);
    expect(splitRoles(undefined)).toEqual([]);
  });
});
