import { formatNumberFa } from "~/lib/digits";
import { ageInMonths } from "~/lib/dog-format";
import type { EarlyAgeException } from "~/lib/early-age-exception";
import { normalizeForSearch } from "~/lib/search";

/*===== Eligibility =====*/
// docs/app-spec.md, F4: the one place that decides whether a dog may buy a course. The Course Detail page, the cart,
// «پرداخت» and the payment callback all call it, so a new rule plugs in here and nowhere else. Pure and browser-safe:
// the caller reads the facts, this judges them.

/** Why a dog can't buy a course, as a value a page can pick the way out from. */
export const INELIGIBILITY_KINDS = [
  /** Archived, still a draft, or without a price (working and sport dogs, F8). */
  "not-for-sale",
  "not-evaluated",
  "prerequisite",
  "too-young",
  "too-old",
  "active-enrollment",
] as const;

export type IneligibilityKind = (typeof INELIGIBILITY_KINDS)[number];

export type Ineligibility = {
  kind: IneligibilityKind;
  /** Persian, for the page as it is. */
  message: string;
  /** For `prerequisite`: the course to finish first. */
  courseSlug: string | null;
};

export type EligibilityCourse = {
  slug: string;
  title: string;
  status: string;
  /** Rial. Null when the course isn't sold online. */
  price: number | null;
  minAgeMonths: number | null;
  maxAgeMonths: number | null;
};

/*===== Early-age Exception =====*/
/**
 * Whether the owner's early-age exception lets this dog skip the evaluation **for this course**. It fails closed: with no
 * exception configured, a course it doesn't cover, an age outside its bounds, a dog with no breed written or one that
 * matches a working breed, it does not apply. It only ever replaces the evaluation; every other rule still applies.
 */
export function qualifiesForEarlyAge({
  dog,
  course,
  exception,
  today,
}: {
  dog: { birthDate: string; breed?: string | null };
  course: { slug: string };
  exception: EarlyAgeException | null;
  today: string;
}): boolean {
  if (!exception || !exception.courseSlugs.includes(course.slug)) return false;

  const age = ageInMonths({ birthDate: dog.birthDate, today });
  if (age < exception.minMonths || age > exception.maxMonths) return false;

  const breed = normalizeForSearch(dog.breed ?? "");
  if (breed === "") return false;
  return !exception.workingBreeds.some((working) => {
    const folded = normalizeForSearch(working);
    return folded !== "" && (breed.includes(folded) || folded.includes(breed));
  });
}

/**
 * Checks one dog against one course and returns every reason it can't buy it; an empty list means it can.
 *
 * - A course that isn't on sale returns that reason alone: nothing else matters.
 * - The evaluation is required, unless the owner's early-age exception covers this dog and course
 *   ({@link qualifiesForEarlyAge}); the exception is off until the owner confirms its facts.
 * - A prerequisite counts only when the dog has **passed** it (`passedCourseIds`): bought or in the cart is not enough.
 * - The age range is inclusive in whole months: a 6–7 month range takes a dog of 7 months and 20 days.
 */
export function checkEligibility({
  dog,
  isEvaluated,
  course,
  prerequisites,
  passedCourseIds,
  hasActiveEnrollment,
  today,
  earlyAgeException = null,
}: {
  dog: { name: string; birthDate: string; breed?: string | null };
  isEvaluated: boolean;
  course: EligibilityCourse;
  prerequisites: { id: string; slug: string; title: string }[];
  passedCourseIds: ReadonlySet<string>;
  /** The dog has an `active` enrollment in this very course. */
  hasActiveEnrollment: boolean;
  /** `YYYY-MM-DD` in Tehran: age is checked on the day of purchase. */
  today: string;
  /** The early-age exception in force; `null` (the default, and the registry's value today) means every dog needs the evaluation. */
  earlyAgeException?: EarlyAgeException | null;
}): Ineligibility[] {
  if (course.status !== "approved" || course.price === null || course.price <= 0) {
    return [{ kind: "not-for-sale", message: "این دوره فعلاً فروخته نمی‌شود.", courseSlug: null }];
  }

  const problems: Ineligibility[] = [];

  /*------ Evaluation ------*/
  if (!isEvaluated && !qualifiesForEarlyAge({ dog, course, exception: earlyAgeException, today })) {
    problems.push({
      kind: "not-evaluated",
      message: `${dog.name} هنوز ارزیابی نشده. اول باید ارزیابی رایگان انجام شود.`,
      courseSlug: null,
    });
  }

  /*------ Prerequisites ------*/
  for (const required of prerequisites) {
    if (passedCourseIds.has(required.id)) continue;
    problems.push({
      kind: "prerequisite",
      message: `${dog.name} اول باید دوره‌ی ${required.title} را تمام کند.`,
      courseSlug: required.slug,
    });
  }

  /*------ Age ------*/
  const age = ageInMonths({ birthDate: dog.birthDate, today });
  if (course.minAgeMonths !== null && age < course.minAgeMonths) {
    problems.push({
      kind: "too-young",
      message: `حداقل سن این دوره ${formatNumberFa(course.minAgeMonths)} ماه است.`,
      courseSlug: null,
    });
  }
  if (course.maxAgeMonths !== null && age > course.maxAgeMonths) {
    problems.push({
      kind: "too-old",
      message: `حداکثر سن این دوره ${formatNumberFa(course.maxAgeMonths)} ماه است.`,
      courseSlug: null,
    });
  }

  /*------ Already Taking It ------*/
  if (hasActiveEnrollment) {
    problems.push({
      kind: "active-enrollment",
      message: `${dog.name} همین حالا این دوره را می‌گذراند.`,
      courseSlug: null,
    });
  }

  return problems;
}
