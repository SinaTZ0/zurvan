import type { AdminEvaluation } from "~/orpc/evaluation/contract";

/*===== Evaluation Summary =====*/
/**
 * What the evaluation card and the stamp need from the dog's evaluations: the request waiting for an answer (a dog has
 * at most one) and the latest one that was evaluated (its decision date; «ثبت دستی» when the Admin recorded it himself).
 */
export function summarizeEvaluations(evaluations: AdminEvaluation[]) {
  const waiting = evaluations.find((evaluation) => evaluation.status === "requested") ?? null;
  // The latest decision: a dog can have more than one evaluated row only through odd data, but the date must be the newest.
  const evaluated = evaluations
    .filter((evaluation) => evaluation.status === "evaluated")
    .reduce<AdminEvaluation | null>(
      (latest, evaluation) =>
        latest === null || (evaluation.decidedAt?.getTime() ?? 0) > (latest.decidedAt?.getTime() ?? 0)
          ? evaluation
          : latest,
      null,
    );

  return { waiting, evaluated };
}

/*===== Link =====*/
/**
 * Where an evaluation opens in the Admin's Evaluations page (its drawer, `?evaluation=<id>`). Built here because that
 * page's serializer lives in its own slice; the status filter is left out, since the drawer finds the id in the whole
 * list whatever the filter is.
 */
export function evaluationHref(evaluationId: string): string {
  return `/admin/evaluations?evaluation=${encodeURIComponent(evaluationId)}`;
}
