import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";
import type { Evaluation } from "~/orpc/evaluation/contract";
import type { EvaluationStatus } from "~/orpc/evaluation/constants";

/*===== Dog Status =====*/
// Where a dog stands in the customer's eyes (docs/app-spec.md, F2/F3/F6), worked out once so the Dashboard's cards and
// Dog Detail's header say the same thing: the words the dog speaks in its bubble, the one thing to do next, and which
// evaluation (if any) is still waiting. Browser-safe.

export type DogStatusKind = "unseen" | "rejected" | "waiting" | "evaluated" | "training";

export type DogStatus = {
  kind: DogStatusKind;
  /** The dog's own words, for its chalk bubble. */
  line: string;
  /** The badge to show beside the name; null for a dog nobody has evaluated or answered yet. */
  badge: EvaluationStatus | null;
  /** The page's one main action for this dog; null while it only waits for the Admin. */
  action: { label: string; to: string } | null;
  /** The request waiting for the Admin's answer, so «پس گرفتن درخواست» knows which one. */
  waitingEvaluation: Evaluation | null;
  /** The Admin's reason, for a dog whose latest request was rejected. */
  rejectionReason: string | null;
};

/**
 * @param evaluations This dog's evaluations, newest first (as `evaluation.listMine` returns them). Other dogs' are ignored.
 * @param enrollments This dog's enrollments; other dogs' are ignored.
 */
export function getDogStatus({
  dog,
  evaluations,
  enrollments,
}: {
  dog: Dog;
  evaluations: readonly Evaluation[];
  enrollments: readonly Enrollment[];
}): DogStatus {
  const own = evaluations.filter((evaluation) => evaluation.dog.id === dog.id);
  const waitingEvaluation = own.find((evaluation) => evaluation.status === "requested") ?? null;
  const trainer = HEAD_TRAINER.firstName;
  const coursesAction = { label: "دوره‌ها را ببین", to: "/courses" };
  const evaluationAction = (label: string) => ({ label, to: `/assessment?dog=${dog.id}` });

  /*------ Evaluated ------*/
  // The dog's own flag first: it is also set for a dog the Admin marked evaluated with no request.
  if (dog.isEvaluated) {
    const training = enrollments.some((enrollment) => enrollment.dog.id === dog.id && enrollment.status === "active");
    return {
      kind: training ? "training" : "evaluated",
      line: training ? `${trainer} برای هماهنگی زنگ می‌زنه` : "ارزیابی شدم! دوره‌هام باز شدن",
      badge: "evaluated",
      action: coursesAction,
      waitingEvaluation: null,
      rejectionReason: null,
    };
  }

  /*------ Waiting ------*/
  if (waitingEvaluation) {
    return {
      kind: "waiting",
      line: `منتظر زنگ ${trainer} هستم`,
      badge: "requested",
      action: null,
      waitingEvaluation,
      rejectionReason: null,
    };
  }

  /*------ Rejected, or Never Asked ------*/
  const latest = own[0];
  if (latest?.status === "rejected") {
    return {
      kind: "rejected",
      line: `${trainer} جواب داد؛ دلیلش اینه:`,
      badge: "rejected",
      action: evaluationAction("ارزیابی دوباره"),
      waitingEvaluation: null,
      rejectionReason: latest.rejectionReason,
    };
  }

  return {
    kind: "unseen",
    line: `هنوز ${trainer} منو ندیده`,
    badge: null,
    action: evaluationAction("ارزیابی رایگان"),
    waitingEvaluation: null,
    rejectionReason: null,
  };
}
