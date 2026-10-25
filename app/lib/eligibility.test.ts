import { describe, expect, it } from "vitest";

import type { EarlyAgeException } from "~/lib/early-age-exception";
import { checkEligibility, type EligibilityCourse, qualifiesForEarlyAge } from "~/lib/eligibility";

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

/*===== Early-age Exception =====*/
// The owner's exception (a very young dog that is not of a working breed may skip the evaluation for one of three
// introductory courses) is off until its facts are confirmed. These facts are made up for the test, not the owner's.
describe("the early-age exception", () => {
  const intro: EligibilityCourse = { ...course, slug: "intro-a", minAgeMonths: null };
  const exception: EarlyAgeException = {
    minMonths: 2,
    maxMonths: 3,
    courseSlugs: ["intro-a", "intro-b"],
    workingBreeds: ["ژرمن شپرد", "مالینویز"],
  };
  // 2.5 months old on `today`.
  const puppy = { name: "پشمی", birthDate: "2025-10-15", breed: "پودل" };
  const base = {
    ...allowed,
    isEvaluated: false,
    course: intro,
    prerequisites: [],
    passedCourseIds: new Set<string>(),
    dog: puppy,
  };

  const kinds = (
    overrides: Partial<Parameters<typeof checkEligibility>[0]> = {},
    withException: EarlyAgeException | null = exception,
  ) => checkEligibility({ ...base, earlyAgeException: withException, ...overrides }).map((problem) => problem.kind);

  it("is off by default: every dog needs the evaluation, whatever its age and breed", () => {
    expect(kinds({}, null)).toEqual(["not-evaluated"]);
    expect(checkEligibility({ ...base })).toMatchObject([{ kind: "not-evaluated" }]);
  });

  it("lets a young dog of a non-working breed skip the evaluation for a covered course", () => {
    expect(kinds()).toEqual([]);
  });

  it("applies the age bounds, inclusive in whole months", () => {
    expect(kinds({ dog: { ...puppy, birthDate: "2025-11-01" } })).toEqual([]); // 2 months exactly
    expect(kinds({ dog: { ...puppy, birthDate: "2025-11-02" } })).toEqual(["not-evaluated"]); // 1 month and 30 days
    expect(kinds({ dog: { ...puppy, birthDate: "2025-09-02" } })).toEqual([]); // 3 months and 30 days
    expect(kinds({ dog: { ...puppy, birthDate: "2025-09-01" } })).toEqual(["not-evaluated"]); // 4 months exactly
  });

  it("covers only the courses it names", () => {
    expect(kinds({ course: { ...intro, slug: "intro-b" } })).toEqual([]);
    expect(kinds({ course: { ...intro, slug: "cgc" } })).toEqual(["not-evaluated"]);
  });

  it("never lets a working breed through, however the breed is written (or half written)", () => {
    for (const breed of ["ژرمن شپرد", "ژرمن‌شپرد", "ژرمن  شپرد", "ژرمن شپرد خالص", "مالینویز", "مالینوی"]) {
      expect({ breed, kinds: kinds({ dog: { ...puppy, breed } }) }).toEqual({ breed, kinds: ["not-evaluated"] });
    }
  });

  it("counts a cross as working when either parent is", () => {
    expect(kinds({ dog: { ...puppy, breedSecondary: "مالینویز" } })).toEqual(["not-evaluated"]);
    expect(kinds({ dog: { ...puppy, breedSecondary: "شیتزو" } })).toEqual([]);
  });

  it("fails closed for a dog with no breed written: an unclassified breed is not assumed harmless", () => {
    expect(kinds({ dog: { ...puppy, breed: null } })).toEqual(["not-evaluated"]);
    expect(kinds({ dog: { ...puppy, breed: "   " } })).toEqual(["not-evaluated"]);
    expect(kinds({ dog: { name: "پشمی", birthDate: puppy.birthDate } })).toEqual(["not-evaluated"]);
  });

  it("only replaces the evaluation: every other rule still applies", () => {
    expect(kinds({ hasActiveEnrollment: true })).toEqual(["active-enrollment"]);
    expect(kinds({ course: { ...intro, minAgeMonths: 6 } })).toEqual(["too-young"]);
    expect(kinds({ course: { ...intro, status: "archived" } })).toEqual(["not-for-sale"]);
    const needsFirst = { id: "x", slug: "first", title: "اول" };
    expect(kinds({ prerequisites: [needsFirst] })).toEqual(["prerequisite"]);
  });

  it("answers for the dog and course alone", () => {
    expect(qualifiesForEarlyAge({ dog: puppy, course: { slug: "intro-a" }, exception, today })).toBe(true);
    expect(qualifiesForEarlyAge({ dog: puppy, course: { slug: "intro-a" }, exception: null, today })).toBe(false);
  });
});
