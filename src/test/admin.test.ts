import { describe, expect, it } from "vitest";
import { assertAdminAccess, assertOtherAccount, safeEvidenceLink } from "@/lib/admin";
describe("Administrator permissions", () => {
  it("only allows active administrators", () => {
    expect(() => assertAdminAccess(true, true)).not.toThrow();
    expect(() => assertAdminAccess(false, true)).toThrow();
    expect(() => assertAdminAccess(true, false)).toThrow();
  });
  it("prevents changing or deleting one's own account", () => {
    expect(() => assertOtherAccount("admin", "admin")).toThrow();
    expect(() => assertOtherAccount("admin", "other")).not.toThrow();
  });
  it("rejects executable and insecure evidence links", () => {
    expect(safeEvidenceLink("javascript:alert(1)")).toBe(false);
    expect(safeEvidenceLink("https://example.com/video")).toBe(true);
  });
});