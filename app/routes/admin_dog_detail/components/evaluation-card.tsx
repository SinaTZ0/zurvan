import { cn } from "cn";
import { CircleCheckIcon, HourglassIcon, ShieldQuestionIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { ADMIN_PLATE } from "~/lib/admin-plate";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { evaluationHref } from "~/routes/admin_dog_detail/evaluation-summary";
import { useHasChanged } from "~/routes/admin_dog_detail/hooks/use-has-changed";
import { INK_LINK } from "~/routes/admin_dog_detail/surfaces";

/*===== Evaluation Card =====*/
/**
 * The dog's evaluation (F3) and the one thing only this page does with it: «ارزیابی شد» for a dog he already knows,
 * the page's gold button while the dog isn't evaluated. An evaluated dog has nothing to press (it is final). An
 * unevaluated one says, once for the whole ladder, that its courses are closed; a dog with a waiting request also links
 * to that request's photos and videos. The card rises in on its new side when the dog is evaluated here.
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
  const answered = useHasChanged(isEvaluated);

  return (
    <section
      key={String(isEvaluated)}
      aria-label="ارزیابی"
      className={cn(ADMIN_PLATE, "p-4 sm:p-5", answered && "answer-in")}
    >
      {isEvaluated ? (
        /*------ Evaluated ------*/
        <div className="flex items-start gap-3">
          <CircleCheckIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-sm font-bold">ارزیابی شده؛ دوره‌هاش بازه</p>
            {evaluated?.decidedAt && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatJalaliTimestamp(evaluated.decidedAt)}
                {evaluated.createdByAdmin && "، ثبت دستی"}
              </p>
            )}
          </div>
        </div>
      ) : (
        /*------ Not Evaluated ------*/
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            {waiting ? (
              <HourglassIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-5 shrink-0 text-foreground/70" />
            ) : (
              <ShieldQuestionIcon
                aria-hidden
                strokeWidth={1.8}
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-pretty">
                {waiting ? "درخواست ارزیابی داده و منتظر جوابه" : "هنوز ارزیابی نشده"}
              </p>
              <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                {waiting
                  ? `از ${formatJalaliTimestamp(waiting.createdAt)}؛ تا ارزیابی نشه، دوره‌هاش بسته‌ست.`
                  : "تا ارزیابی نشه، دوره‌هاش بسته‌ست."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 xl:flex-col xl:items-stretch">
            <Button
              type="button"
              variant="solid"
              className="h-11 w-full sm:w-fit sm:px-6 xl:w-full"
              onClick={onEvaluate}
            >
              ارزیابی شد
            </Button>
            {waiting && (
              <Link to={evaluationHref(waiting.id)} className={cn(INK_LINK, "max-sm:self-center xl:self-center")}>
                دیدن درخواست و عکس‌ها
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
