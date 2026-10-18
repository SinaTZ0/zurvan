import { describe, expect, it } from "vitest";

import { certificatePath, normalizeCertificateNumber } from "~/lib/certificate";

/*===== Certificate Number =====*/
describe("normalizeCertificateNumber", () => {
  it("accepts the number however it was typed", () => {
    expect(normalizeCertificateNumber("ZC-4F9A21C07B")).toBe("ZC-4F9A21C07B");
    expect(normalizeCertificateNumber("zc 4f9a-21c0 7b")).toBe("ZC-4F9A21C07B");
    expect(normalizeCertificateNumber("4F9A21C07B")).toBe("ZC-4F9A21C07B");
    expect(normalizeCertificateNumber("ZC-۴F۹A۲۱C۰۷B")).toBe("ZC-4F9A21C07B");
  });

  it("refuses anything that isn't a certificate number, including a dog's file number", () => {
    for (const bad of ["", "ZC-", "ZC-123", "ZC-4F9A21C07BB", "ZC-4F9A21C07G", "x"]) {
      expect({ bad, result: normalizeCertificateNumber(bad) }).toEqual({ bad, result: null });
    }
    // «ZD-…» is a dog's file number; its ten characters alone would pass, but with the wrong prefix it is not one.
    expect(normalizeCertificateNumber("ZD-4F9A21C07B")).toBeNull();
  });

  it("builds the verification address", () => {
    expect(certificatePath("ZC-4F9A21C07B")).toBe("/certificate/ZC-4F9A21C07B");
  });
});
