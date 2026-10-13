import { describe, expect, it } from "vitest";

import { normalizeForSearch } from "~/lib/search";

import { matchesQuery } from "./search";

/*===== Search =====*/
describe("course search", () => {
  it("folds Arabic letters, ZWNJ, spaces, digits and case into one form", () => {
    expect(normalizeForSearch("سگ‌ همدم ۱")).toBe(normalizeForSearch("سگهمدم 1"));
    expect(normalizeForSearch("كلاس يك")).toBe("کلاسیک");
    expect(normalizeForSearch("CGC")).toBe("cgc");
  });

  it("finds a course by its Latin name, its Persian title typed either way, or an empty query", () => {
    const course = { title: "سگ همدم ۱", latinName: "Companion dog 1", summary: "اولین قدم" };

    expect(matchesQuery({ course, query: "companion" })).toBe(true);
    expect(matchesQuery({ course, query: "سگ‌همدم" })).toBe(true);
    expect(matchesQuery({ course, query: "همدم 1" })).toBe(true);
    expect(matchesQuery({ course, query: "  " })).toBe(true);
    expect(matchesQuery({ course, query: "zzz" })).toBe(false);
  });
});
