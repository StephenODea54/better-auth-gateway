import { describe, expect, it } from "vitest";

import { slugify } from "./slugify.ts";

describe("slugify", () => {
  it("lowercases the input", () => {
    expect(slugify("MyApp")).toBe("myapp");
  });

  it("collapses runs of non-alphanumerics into one hyphen", () => {
    expect(slugify("hello   world & friends")).toBe("hello-world-friends");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--Already Hyphenated--")).toBe("already-hyphenated");
  });

  it("truncates to 48 characters", () => {
    expect(slugify("a".repeat(60))).toBe("a".repeat(48));
    expect(slugify("a".repeat(60)).length).toBe(48);
  });

  it("returns an empty string for all-symbol input", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });
});
