import { describe, expect, it } from "vitest";

import { rialToToman, sumStanding, tomanToRial } from "~/lib/refund-format";

/*===== Refund Math =====*/
describe("tomanToRial", () => {
  it("reads Toman however it is typed and gives Rial", () => {
    expect(tomanToRial("350000")).toBe(3_500_000);
    expect(tomanToRial("۳۵۰٬۰۰۰")).toBe(3_500_000);
    expect(tomanToRial("350,000")).toBe(3_500_000);
    expect(tomanToRial(" ۱ ۲۵۰ ۰۰۰ ")).toBe(12_500_000);
  });

  it("refuses anything that isn't a positive whole number of Toman", () => {
    for (const bad of ["", "0", "-5", "1.5", "350.000", "abc", "12a", "٫٫"]) {
      expect({ bad, rial: tomanToRial(bad) }).toEqual({ bad, rial: null });
    }
  });
});

describe("sums", () => {
  it("counts the refunds that stand and not the cancelled ones", () => {
    expect(
      sumStanding([
        { amount: 100, status: "pending" },
        { amount: 200, status: "paid" },
        { amount: 400, status: "cancelled" },
      ]),
    ).toBe(300);
    expect(rialToToman(12_345)).toBe(1234);
  });
});
