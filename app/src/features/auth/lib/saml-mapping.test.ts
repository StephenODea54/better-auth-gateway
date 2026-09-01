import { describe, expect, it } from "vitest";

import { buildSamlMapping } from "./saml-mapping.ts";

describe("buildSamlMapping", () => {
  it("falls back to default attribute names", () => {
    expect(buildSamlMapping({})).toEqual({
      email: "email",
      name: "displayName",
    });
  });

  it("passes custom attribute names through", () => {
    expect(buildSamlMapping({
      email: "mail",
      firstName: "givenName",
      lastName: "surname",
      name: "cn",
    })).toEqual({
      email: "mail",
      firstName: "givenName",
      lastName: "surname",
      name: "cn",
    });
  });

  it("treats whitespace-only values as unset", () => {
    expect(buildSamlMapping({
      email: "  ",
      firstName: " ",
      lastName: "\t",
      name: "   ",
    })).toEqual({
      email: "email",
      name: "displayName",
    });
  });

  it("omits firstName and lastName when blank", () => {
    const mapping = buildSamlMapping({ email: "mail" });

    expect(mapping).not.toHaveProperty("firstName");
    expect(mapping).not.toHaveProperty("lastName");
  });

  it("includes firstName and lastName when set", () => {
    const mapping = buildSamlMapping({ firstName: "first", lastName: "last" });

    expect(mapping.firstName).toBe("first");
    expect(mapping.lastName).toBe("last");
  });
});
