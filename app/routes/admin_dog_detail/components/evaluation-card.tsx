import { CircleCheckIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { evaluationHref } from "~/routes/admin_dog_detail/evaluation-summary";

/*===== Evaluation Card =====*/
/**
 * The dog's evaluation (F3) and the one thing only this page does with it: «ارزیابی شد» for a dog he already knows.
 * An evaluated dog has nothing to press (it is final); an unevaluated one says its courses are closed, and a dog with a
 * waiting request also links to that request's photos and videos.
 */
export function EvaluationCard({
  isEvaluated,
  evaluated,
  waiting,
  onEvaluate,
}: {
  isEvaluated: boolean;
  /** The latest evaluation that was evaluated, for its date and «ثبت دستی». */
  evaluated: AdminEvaluation | null;
  /** The request waiting for an answer. */
  waiting: AdminEvaluation | null;
  onEvaluate: () => void;
}) {
  return (
    <section aria-label="ارزیابی" className="rounded-2xl border border-border bg-card p-4">
      {isEvaluated ? (
        /*------ Evaluated ------*/
        <div className="flex items-start gap-3">
          <CircleCheckIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-bold">ارزیابی شده</p>
            {evaluated?.decidedAt && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatJalaliTimestamp(evaluated.decidedAt)}
                {evaluated.createdByAdmin && " (ثبت دستی)"}
              </p>
            )}
          </div>
        </div>
      ) : (
        /*------ Not Evaluated ------*/
        <div className="flex flex-col gap-3">
          <p className="text-sm text-pretty">هنوز ارزیابی نشده؛ دوره‌هایش بسته است.</p>
          <Button type="button" variant="solid" className="max-sm:w-full sm:w-fit" onClick={onEvaluate}>
            ارزیابی شد
          </Button>
          {waiting && (
            <Link
              to={evaluationHref(waiting.id)}
              className="inline-flex h-10 w-fit items-center rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              دیدن درخواست و عکس‌ها
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
