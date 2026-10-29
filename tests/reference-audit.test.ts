import { describe, expect, it } from "vitest";
import fs from "node:fs";
import audit from "../docs/reference-audit.json";
import { validateReferenceAudit } from "../src/lib/reference-audit";
const today = new Date(audit.checkedAt + "T19:00:00Z");
const check = (value: unknown) =>
  validateReferenceAudit(value, { today, fileExists: (p) => fs.existsSync(p) });
describe("dated primary-source comparison contract", () => {
  it("links every capability to both providers, local evidence and a next acceptance gate", () => {
    expect(check(audit)).toEqual([]);
    expect(audit.capabilities).toHaveLength(8);
  });
  it("rejects stale, future and impossible review dates", () => {
    for (const date of [
      new Date(today.getTime() - 31 * 86400000).toISOString().slice(0, 10),
      new Date(today.getTime() + 86400000).toISOString().slice(0, 10),
      "2026-02-30",
      "invalid",
    ])
      expect(check({ ...audit, checkedAt: date }).length).toBeGreaterThan(0);
  });
  it("allows the last freshness day but rejects the next day", () => {
    expect(
      validateReferenceAudit(audit, {
        today: new Date(today.getTime() + 30 * 86400000),
      }),
    ).toEqual([]);
    expect(
      validateReferenceAudit(audit, {
        today: new Date(today.getTime() + 31 * 86400000),
      }).some((e) => e.includes("stale")),
    ).toBe(true);
  });
  it("rejects missing, mismatched and unverified provider evidence", () => {
    const value = structuredClone(audit);
    value.capabilities[0].references.oneprep.source = "cb-bank";
    expect(check(value).some((e) => e.includes("mismatched"))).toBe(true);
    value.sources[0].verification = "tested-authenticated-app";
    expect(check(value).some((e) => e.includes("overclaimed"))).toBe(true);
  });
  it("accepts only primary HTTPS source hosts, not lookalikes or credentials", () => {
    for (const url of [
      "http://www.oneprep.com/",
      "https://oneprep.com.evil.test/",
      "https://user:pass@oneprep.com/",
      "https://example.com/",
    ]) {
      const value = structuredClone(audit);
      value.sources[3].url = url;
      expect(check(value).some((e) => e.includes("HTTPS"))).toBe(true);
    }
  });
  it("rejects duplicates, unsupported completed claims and superiority assertions", () => {
    const value = structuredClone(audit);
    value.capabilities.push(value.capabilities[0]);
    expect(check(value).some((e) => e.includes("Duplicate"))).toBe(true);
    expect(check({ ...audit, superiorityClaim: true }).length).toBeGreaterThan(
      0,
    );
    value.capabilities[0].aptmark.status = "complete";
    expect(check(value).some((e) => e.includes("release gates"))).toBe(true);
  });
  it("requires existing repository-relative evidence and substantial next acceptance criteria", () => {
    for (const file of ["/tmp/file", "../README.md", "missing-evidence.ts"]) {
      const value = structuredClone(audit);
      value.capabilities[0].aptmark.evidence = [file];
      expect(check(value).some((e) => e.includes("path"))).toBe(true);
    }
    const value = structuredClone(audit);
    value.capabilities[0].nextAcceptance = "done";
    expect(check(value).some((e) => e.includes("acceptance"))).toBe(true);
  });
  it("rejects malformed data without treating it as a passing audit", () => {
    for (const value of [
      null,
      {},
      [],
      { ...audit, sources: [null], capabilities: [null] },
    ])
      expect(check(value).length).toBeGreaterThan(0);
  });
});
