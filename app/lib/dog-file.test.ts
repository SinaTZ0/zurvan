import { describe, expect, it } from "vitest";

import { logbookPath, normalizeFileNumber } from "~/lib/dog-file";

/*===== File Number =====*/
describe("normalizeFileNumber", () => {
  it("accepts the number however it was typed", () => {
    expect(normalizeFileNumber("ZD-4F9A21C07B")).toBe("ZD-4F9A21C07B");
    expect(normalizeFileNumber("zd-4f9a21c07b")).toBe("ZD-4F9A21C07B");
    expect(normalizeFileNumber(" zd 4f9a 21c0 7b ")).toBe("ZD-4F9A21C07B");
    expect(normalizeFileNumber("4F9A21C07B")).toBe("ZD-4F9A21C07B");
    // Persian digits and a zero-width joiner from a Persian keyboard.
    expect(normalizeFileNumber("ZD-۴F۹A۲۱C۰۷B")).toBe("ZD-4F9A21C07B");
    expect(normalizeFileNumber("ZD-4F9A‌21C07B")).toBe("ZD-4F9A21C07B");
  });

  it("refuses anything that isn't a file number", () => {
    for (const bad of ["", "ZD-", "ZD-123", "ZD-4F9A21C07", "ZD-4F9A21C07BB", "ZD-4F9A21C07G", "k9", "../etc/passwd"]) {
      expect({ bad, result: normalizeFileNumber(bad) }).toEqual({ bad, result: null });
    }
  });
});

describe("logbookPath", () => {
  it("is the public record's address", () => {
    expect(logbookPath("ZD-4F9A21C07B")).toBe("/logbook/ZD-4F9A21C07B");
  });
});
