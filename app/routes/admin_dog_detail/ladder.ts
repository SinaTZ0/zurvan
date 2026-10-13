import type { AdminDog } from "~/orpc/dog/contract";

/*===== Types =====*/
/** What a rung needs from `checkout.admin.dogEligibility`; structural, so this file knows nothing of the contract. */
type EligibilityRow = {
  course: { slug: string; title: string };
  eligible: boolean;
  problems: { kind: string; message: string }[];
};

/**
 * Where a dog stands on one course:
 * - `passed-enrollment`: finished on the site; final, it can't be taken off.
 * - `passed-admin`: marked by hand; one click takes it off.
 * - `open`: not passed, and the dog can buy it.
 * - `locked`: not passed, and something stands in the way (`problems`).
 */
export type RungState = "passed-enrollment" | "passed-admin" | "open" | "locked";

export type Rung = {
  slug: string;
  title: string;
  state: RungState;
  /** The API's Persian reasons, as they are, without «not evaluated» (see `buildLadder`). Empty unless `locked`. */
  problems: string[];
};

/** The kind of ineligibility that every course shares while the dog is not evaluated. */
const NOT_EVALUATED = "not-evaluated";

/*===== Build the Ladder =====*/
/**
 * The dog's courses as rungs: every approved course in the catalogue's order (the order `dogEligibility` returns,
 * which reads as the road the dog walks), then any passed course that is not on that list (one that was archived since)
 * so a course the dog passed is never missing from the page.
 */
export function buildLadder({
  eligibility,
  passedCourses,
}: {
  eligibility: EligibilityRow[];
  passedCourses: AdminDog["passedCourses"];
}): Rung[] {
  const passedBySlug = new Map(passedCourses.map((passed) => [passed.slug, passed]));

  /*------ Approved Courses ------*/
  const rungs = eligibility.map<Rung>(({ course, eligible, problems }) => {
    const passed = passedBySlug.get(course.slug);
    // Passed wins over whatever the verdict says: a passed course may still be "ineligible" for other reasons.
    if (passed) {
      return {
        slug: course.slug,
        title: course.title,
        state: passed.source === "enrollment" ? "passed-enrollment" : "passed-admin",
        problems: [],
      };
    }
    return {
      slug: course.slug,
      title: course.title,
      state: eligible ? "open" : "locked",
      // «هنوز ارزیابی نشده» would repeat on every rung of a dog that isn't evaluated; the evaluation card already says it
      // once, so a rung that is locked for that reason alone shows no reasons and the rung says «بعد از ارزیابی».
      problems: eligible
        ? []
        : problems.filter((problem) => problem.kind !== NOT_EVALUATED).map((problem) => problem.message),
    };
  });

  /*------ Passed But Not Approved ------*/
  const listed = new Set(eligibility.map(({ course }) => course.slug));
  for (const passed of passedCourses) {
    if (listed.has(passed.slug)) continue;
    rungs.push({
      slug: passed.slug,
      title: passed.title,
      state: passed.source === "enrollment" ? "passed-enrollment" : "passed-admin",
      problems: [],
    });
  }

  return rungs;
}
