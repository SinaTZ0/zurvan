import { describe, expect, it } from "vitest";

import { checkEligibility, type EligibilityCourse } from "~/lib/eligibility";

/*===== Eligibility =====*/
// F4: each rule blocks on its own, and a dog that satisfies all of them is allowed. Pure, so no database.

const course: EligibilityCourse = {
  slug: "cgc",
  title: "CGC",
  status: "approved",
  price: 90_000_000,
  minAgeMonths: 6,
  maxAgeMonths: null,
};
const prerequisite = { id: "house", slug: "house-manner", title: "سگ خونگی" };
const dog = { name: "لئو", birthDate: "2025-01-01" };
const today = "2026-01-01";

const allowed = {
  dog,
  isEvaluated: true,
  course,
  prerequisites: [prerequisite],
  passedCourseIds: new Set(["house"]),
  hasActiveEnrollment: false,
  today,
};

function kindsOf(overrides: Partial<Parameters<typeof checkEligibility>[0]>) {
  return checkEligibility({ ...allowed, ...overrides }).map((problem) => problem.kind);
}

describe("eligibility", () => {
  it("allows an evaluated dog of the right age that passed the prerequisites", () => {
    expect(kindsOf({})).toEqual([]);
  });

  it("blocks a dog that is not evaluated", () => {
    expect(kindsOf({ isEvaluated: false })).toEqual(["not-evaluated"]);
  });

  it("counts only passed prerequisites, naming the course to finish first", () => {
    const problems = checkEligibility({ ...allowed, passedCourseIds: new Set() });
    expect(problems).toMatchObject([{ kind: "prerequisite", courseSlug: "house-manner" }]);
  });

  it("blocks a dog outside the age range, inclusive in whole months", () => {
    expect(kindsOf({ dog: { name: "لئو", birthDate: "2025-08-01" } })).toEqual(["too-young"]);
    expect(kindsOf({ dog: { name: "لئو", birthDate: "2025-07-01" } })).toEqual([]);
    expect(kindsOf({ course: { ...course, maxAgeMonths: 7 }, dog: { name: "لئو", birthDate: "2025-01-01" } })).toEqual([
      "too-old",
    ]);
  });

  it("blocks a dog that is already taking the course", () => {
    expect(kindsOf({ hasActiveEnrollment: true })).toEqual(["active-enrollment"]);
  });

  it("blocks an archived, draft or unpriced course, with that reason alone", () => {
    expect(kindsOf({ course: { ...course, status: "archived" }, isEvaluated: false })).toEqual(["not-for-sale"]);
    expect(kindsOf({ course: { ...course, status: "draft" } })).toEqual(["not-for-sale"]);
    expect(kindsOf({ course: { ...course, price: null } })).toEqual(["not-for-sale"]);
  });
});
