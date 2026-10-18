import { describe, expect, it } from "vitest";

import { describeWhenFree, normalizeWhenFree } from "~/lib/when-free-format";

describe("normalizeWhenFree", () => {
  it("puts the days and times in the order of the week and of the day, once each", () => {
    expect(
      normalizeWhenFree({
        days: ["wednesday", "saturday", "wednesday", "monday"],
        periods: ["evening", "morning", "evening"],
      }),
    ).toEqual({ days: ["saturday", "monday", "wednesday"], periods: ["morning", "evening"] });
  });

  it("drops what isn't a day or a time of day", () => {
    expect(normalizeWhenFree({ days: ["someday", "friday", ""], periods: ["midnight"] })).toEqual({
      days: ["friday"],
      periods: [],
    });
  });
});

describe("describeWhenFree", () => {
  it("says the days and then the times, in Persian", () => {
    expect(describeWhenFree({ days: ["monday", "saturday"], periods: ["evening", "morning"] })).toBe(
      "شنبه، دوشنبه · صبح، عصر و شب",
    );
  });

  it("reads either list on its own", () => {
    expect(describeWhenFree({ days: ["friday"], periods: [] })).toBe("جمعه");
    expect(describeWhenFree({ days: [], periods: ["afternoon"] })).toBe("بعدازظهر");
  });

  it("says nothing when they said nothing", () => {
    expect(describeWhenFree({ days: [], periods: [] })).toBeNull();
    expect(describeWhenFree({ days: ["someday"], periods: ["midnight"] })).toBeNull();
  });
});
