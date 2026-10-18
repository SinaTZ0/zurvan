import { describe, expect, it } from "vitest";

import { normalizeForSearch } from "~/lib/search";
import type { Course } from "~/orpc/course/contract";

import { matchesQuery } from "./search";

/*===== Search =====*/
// A small course with the fields the search reads; `family` is a real family so its tab label is searchable.
type SearchableCourse = Pick<Course, "title" | "latinName" | "summary" | "family" | "highlights" | "commands">;

const companion: SearchableCourse = {
  title: "سگ همدم ۱",
  latinName: "Companion dog 1",
  summary: "اولین قدم",
  family: "companion",
  highlights: ["کنار پا راه می‌رود"],
  commands: ["اتصال چشمی"],
};

const sport: SearchableCourse = {
  title: "سگ‌های ورزشی",
  latinName: "Sport",
  summary: "آمادگی مسابقه",
  family: "sport",
  highlights: [],
  commands: ["BH", "IGP 1", "IGP 2", "IGP 3", "FH", "WUSV"],
};

describe("course search", () => {
  it("folds Arabic letters, ZWNJ, spaces, digits and case into one form", () => {
    expect(normalizeForSearch("سگ‌ همدم ۱")).toBe(normalizeForSearch("سگهمدم 1"));
    expect(normalizeForSearch("كلاس يك")).toBe("کلاسیک");
    expect(normalizeForSearch("CGC")).toBe("cgc");
  });

  it("finds a course by its Latin name, its Persian title typed either way, or an empty query", () => {
    expect(matchesQuery({ course: companion, query: "companion" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "سگ‌همدم" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "همدم 1" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "  " })).toBe(true);
    expect(matchesQuery({ course: companion, query: "zzz" })).toBe(false);
  });

  it("finds a course by its kind, however the label is typed", () => {
    // «ورزشی» is only in the sport family's label, not in this course's own words.
    expect(matchesQuery({ course: { ...sport, title: "سگ‌ها", summary: "مسابقه" }, query: "ورزشی" })).toBe(true);
    expect(matchesQuery({ course: { ...sport, title: "سگ‌ها", summary: "مسابقه" }, query: "ورزشي" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "سگ همدم" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "ورزشی" })).toBe(false);
  });

  it("finds a sport course by its branches and a course by a result or a curriculum line", () => {
    expect(matchesQuery({ course: sport, query: "igp" })).toBe(true);
    expect(matchesQuery({ course: sport, query: "IGP 3" })).toBe(true);
    expect(matchesQuery({ course: sport, query: "wusv" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "اتصال چشمی" })).toBe(true);
    expect(matchesQuery({ course: companion, query: "کنار پا" })).toBe(true);
  });

  it("never matches across the seam between two fields", () => {
    // The title ends with «همدم ۱» and the summary starts with «اولین»; "1اولین" appears only if they were glued.
    expect(matchesQuery({ course: companion, query: "همدم1اولین" })).toBe(false);
  });
});
