import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";
import { evaluationHref } from "~/routes/admin_dog_detail/evaluation-summary";

/*===== Evaluations Section =====*/
/**
 * The dog's evaluations (F3), newest first: status, when it was asked, when it was answered, and why it was rejected.
 * A waiting request, or one with photos or videos, links to its drawer on the Evaluations page, where the answers are.
 */
export function EvaluationsSection({ evaluations }: { evaluations: AdminEvaluation[] }) {
  // A copy is sorted (the loader's array stays as it is); `toSorted` isn't in this project's TS lib.
  // oxlint-disable-next-line unicorn/no-array-sort
  const newestFirst = [...evaluations].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <DetailSection id="evaluations" title="ارزیابی‌ها">
      {newestFirst.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          درخواستی ندارد
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {newestFirst.map((evaluation) => {
            const hasMedia = evaluation.photos.length > 0 || evaluation.videos.length > 0;
            return (
              <li
                key={evaluation.id}
                className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <EvaluationStatusBadge status={evaluation.status} />
                    <span className="text-sm">{formatJalaliTimestamp(evaluation.createdAt)}</span>
                    {evaluation.createdByAdmin && <span className="text-xs text-muted-foreground">ثبت دستی</span>}
                  </div>
                  {evaluation.decidedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      جواب · {formatJalaliTimestamp(evaluation.decidedAt)}
                    </p>
                  )}
                  {evaluation.status === "rejected" && evaluation.rejectionReason && (
                    <p className="mt-1 text-sm text-pretty whitespace-pre-line text-muted-foreground" dir="auto">
                      {evaluation.rejectionReason}
                    </p>
                  )}
                </div>

                {(evaluation.status === "requested" || hasMedia) && (
                  <Link
                    to={evaluationHref(evaluation.id)}
                    className="inline-flex h-10 w-fit shrink-0 items-center rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {hasMedia ? "دیدن عکس‌ها" : "دیدن درخواست"}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DetailSection>
  );
}
