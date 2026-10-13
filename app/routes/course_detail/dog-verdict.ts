import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { IneligibilityKind } from "~/lib/eligibility";
import type { DogEligibility } from "~/orpc/checkout/contract";

/*===== Dog Verdict =====*/
// What a dog says about a course, from `checkout.eligibility` (docs/app-spec.md, F4). The server's messages are written
// about the dog in the third person («لئو اول باید دوره‌ی … را تمام کند»), so the bubble speaks a short first-person line
// chosen by the kind of the first problem, and the server's own message goes under it as the exact reason.

/** The dog's first-person line for the reason it can't take the course. */
const PROBLEM_LINES: Record<IneligibilityKind, string> = {
  "not-for-sale": "این دوره فعلاً فروخته نمی‌شه",
  "not-evaluated": `اول باید ${HEAD_TRAINER.firstName} منو ببینه`,
  prerequisite: "یه قدم مونده تا به این دوره برسم",
  "too-young": "هنوز برای این دوره کوچیکم",
  "too-old": "از این دوره گذشتم",
  "active-enrollment": "همین الان توی این دوره‌م!",
};

const CAN_LINE = "آره، می‌تونم! آماده‌م";

export type DogVerdictProblem = {
  /** The server's Persian reason, as it is. */
  message: string;
  /** Where the customer can go to fix it: the free evaluation, or the prerequisite course. Null when only time helps. */
  way: { label: string; to: string } | null;
};

export type DogVerdict = {
  can: boolean;
  /** The dog's own words, for its chalk bubble. */
  line: string;
  /** Every reason, in the server's order (evaluation, prerequisites, age, active enrollment). Empty when `can`. */
  problems: DogVerdictProblem[];
};

/** Turns one dog's eligibility into the bubble's line, the reasons and the way out of each. */
export function getDogVerdict({ dog, eligible, problems }: DogEligibility): DogVerdict {
  if (eligible) return { can: true, line: CAN_LINE, problems: [] };

  return {
    can: false,
    line: PROBLEM_LINES[problems[0]?.kind ?? "not-for-sale"],
    problems: problems.map((problem) => ({
      message: problem.message,
      way:
        problem.kind === "not-evaluated"
          ? { label: "ارزیابی رایگان", to: `/assessment?dog=${dog.id}` }
          : problem.kind === "prerequisite" && problem.courseSlug
            ? { label: "این دوره را ببین", to: `/courses/${problem.courseSlug}` }
            : null,
    })),
  };
}
