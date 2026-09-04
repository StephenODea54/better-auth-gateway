import { describe, expect, it } from "vitest";

import { resolveReturnTo } from "./return-to.ts";

const origin = "https://billing.acme.com";

describe("resolveReturnTo", () => {
  it("falls back to the origin when nothing was asked for", () => {
    expect(resolveReturnTo(null, origin)).toBe(origin);
    expect(resolveReturnTo("", origin)).toBe(origin);
  });

  it("keeps deep links on the registered origin", () => {
    expect(resolveReturnTo("https://billing.acme.com/invoices/42?tab=paid", origin))
      .toBe("https://billing.acme.com/invoices/42?tab=paid");
  });

  it("rejects other origins", () => {
    expect(resolveReturnTo("https://evil.example.com/", origin)).toBe(origin);
    expect(resolveReturnTo("http://billing.acme.com/", origin)).toBe(origin);
    expect(resolveReturnTo("https://billing.acme.com.evil.example.com/", origin)).toBe(origin);
  });

  it("rejects things that are not URLs", () => {
    expect(resolveReturnTo("/invoices", origin)).toBe(origin);
    expect(resolveReturnTo("javascript:alert(1)", origin)).toBe(origin);
  });
});
