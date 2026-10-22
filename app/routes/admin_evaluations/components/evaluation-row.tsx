import { cn } from "cn";

import { DogThumb } from "~/components/dog-thumb";
import { CustomerContact } from "~/components/customer-contact";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { AnswerStamp } from "~/routes/admin_evaluations/components/answer-stamp";
import { PrintStrip } from "~/routes/admin_evaluations/components/print-strip";
import { describeWaiting } from "~/routes/admin_evaluations/dates";
import { useChanged } from "~/routes/admin_evaluations/hooks/use-changed";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";
import type { AdminEvaluationsSearch } from "~/routes/admin_evaluations/search-params";

/*===== Phone =====*/
/** `09123456789` as «۰۹۱۲ ۳۴۵ ۶۷۸۹», easier to read off a phone's row; any other shape is shown as it is. */
function formatPhone(phoneNumber: string): string {
  const grouped = /^09\d{9}$/.test(phoneNumber)
    ? `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`
    : phoneNumber;
  return toPersianDigits(grouped);
}

/*===== Types =====*/
/** How an answered row is leaving, once its exit has started. */
export type RowExit = { kind: AnswerKind; fold: boolean };

/*===== Evaluation Row =====*/
/**
 * One request in the queue's plate. The dog's name is a stretched link that opens the drawer; the phone link and the
 * answer buttons sit above it (`relative z-10`) so they stay clickable.
 *
 * One element serves every size, in grid areas so the tab order is the same everywhere (name, phone, buttons):
 * - **Phones:** the dog and the chip on the first line, the customer's name and number under the dog's name (plain
 *   text: the whole row opens the drawer, which has the call pill), the print strip and how long it has waited under
 *   that. No answer buttons: they live in the drawer's footer.
 * - **`lg` to `xl`** (the rail leaves the content about 700px): the dog, the customer, the prints and the chip, then a
 *   second line with the date and the answers.
 * - **From `xl`:** one line in fixed tracks, so he reads down a column: the dog, the customer, the prints, the date,
 *   the chip, the answers (or the day it was answered).
 *
 * A waiting row carries the short gold notch on its start edge. Leaving (page-motion.tsx): `leaving` marks a row he just
 * answered, kept for its exit, inert at once; once `exit` is set its answer is stamped where he pressed it (over the
 * buttons, or over the chip on a phone), and with `exit.fold` the row folds away.
 */
export function EvaluationRow({
  evaluation,
  search,
  leaving,
  exit,
  rise,
  quietChip,
  onAnswer,
}: {
  evaluation: AdminEvaluation;
  /** The page's search with this request's drawer open; a real link, so it works for a new tab and before hydration. */
  search: AdminEvaluationsSearch;
  leaving: boolean;
  exit: RowExit | null;
  /** The row's delay (seconds) in a list that just arrived under a new filter, or null when it didn't. */
  rise: number | null;
  /**
   * The «در انتظار» view: every row is waiting, so the gold chip would only repeat the filter. It keeps its place (the
   * columns line up, and the phone's stamp lands where it was) but isn't drawn.
   */
  quietChip: boolean;
  onAnswer: (kind: AnswerKind) => void;
}) {
  const { dog, customer, status } = evaluation;
  const requested = status === "requested";
  const rejecting = exit?.kind === "reject";
  // A status that moved under the row (in «همه», or a conflict) is pressed in; a first render never is.
  const statusChanged = useChanged(status);

  return (
    <li
      inert={leaving}
      data-evaluation={evaluation.id}
      style={rise !== null ? ({ "--answer-delay": `${rise}s` } as React.CSSProperties) : undefined}
      className={cn(
        // A grid of one row, so the fold can collapse it from `1fr` to `0fr`.
        "grid grid-rows-[1fr]",
        rise !== null && "answer-in",
        exit && ["ev-leaving", exit.fold && "ev-fold"],
      )}
    >
      <div className={cn("min-h-0", exit && "overflow-hidden")}>
        <div
          className={cn(
            "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3.5 transition-colors hover:bg-foreground/[0.025] sm:px-5",
            "[grid-template-areas:'dog_chip'_'media_date']",
            "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13.5rem_7rem] lg:gap-x-4 lg:gap-y-2 lg:[grid-template-areas:'dog_who_media_chip'_'date_date_end_end']",
            "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_13.5rem_6.5rem_7rem_10.75rem] xl:gap-y-0 xl:px-6 xl:[grid-template-areas:'dog_who_media_date_chip_end']",
          )}
        >
          {/*------ Notch ------*/}
          {/* The mark on a waiting row, as the rail marks its current page, so the queue reads at a glance. */}
          {requested && (
            <span
              aria-hidden
              className={cn(
                "absolute start-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-e-full bg-primary",
                exit && "ev-out",
              )}
            />
          )}

          {/*===== Dog =====*/}
          <div className={cn("flex min-w-0 items-center gap-3 [grid-area:dog]", rejecting && "ev-dim")}>
            <DogThumb name={dog.name} photo={dog.photo} className="size-11 text-base" />
            <div className="min-w-0">
              {/* A click opens the drawer in place: a search-only change (a history entry, so Back closes it) that
                  keeps the scroll and doesn't refetch the list. */}
              <Link
                to="/admin/evaluations"
                search={search}
                resetScroll={false}
                className="block truncate rounded-sm text-sm font-bold outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
              >
                <bdi>{dog.name}</bdi>
              </Link>
              {/* Phones: who to call, as text (the drawer has the pill). The number comes first, so a long name is
                  what gets cut. */}
              <p className="mt-0.5 truncate text-xs text-muted-foreground lg:hidden">
                {customer.phoneNumber && (
                  <>
                    <bdi dir="ltr" className="tabular-nums">
                      {formatPhone(customer.phoneNumber)}
                    </bdi>{" "}
                  </>
                )}
                {customer.name}
              </p>
            </div>
          </div>

          {/*===== Customer =====*/}
          <div className={cn("hidden min-w-0 [grid-area:who] lg:block", rejecting && "ev-dim")}>
            <CustomerContact name={customer.name} phoneNumber={customer.phoneNumber} className="relative z-10" />
          </div>

          {/*===== Prints =====*/}
          <div className={cn("min-w-0 [grid-area:media]", rejecting && "ev-dim")}>
            <PrintStrip photos={evaluation.photos} videos={evaluation.videos} />
          </div>

          {/*===== Date =====*/}
          <div className="text-end text-xs [grid-area:date] lg:text-start">
            {/* Phones: one short line, how long it has waited (or the day it came in). */}
            <p className="whitespace-nowrap text-muted-foreground lg:hidden">
              {requested ? describeWaiting(evaluation.createdAt) : formatJalaliTimestamp(evaluation.createdAt)}
            </p>
            <p className="hidden items-baseline gap-2 lg:flex xl:block">
              <span className="whitespace-nowrap tabular-nums">{formatJalaliTimestamp(evaluation.createdAt)}</span>
              {evaluation.createdByAdmin ? (
                <span className="block whitespace-nowrap text-muted-foreground xl:mt-0.5">ثبت‌شده توسط مدیر</span>
              ) : (
                requested && (
                  <span className="block whitespace-nowrap text-muted-foreground xl:mt-0.5">
                    {describeWaiting(evaluation.createdAt)}
                  </span>
                )
              )}
            </p>
          </div>

          {/*===== Status =====*/}
          <div className="relative flex justify-end [grid-area:chip] xl:justify-start">
            <EvaluationStatusBadge
              key={status}
              status={status}
              className={cn(statusChanged && "ev-chip-stamp", exit && "ev-out", quietChip && requested && "invisible")}
            />
            {/*------ Phone Stamp ------*/}
            {exit && (
              <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center lg:hidden">
                <AnswerStamp kind={exit.kind} size="sm" />
              </span>
            )}
          </div>

          {/*===== Answers or Outcome =====*/}
          <div className="relative hidden items-center justify-end [grid-area:end] lg:flex">
            {requested ? (
              <>
                <div className={cn("relative z-10 flex items-center gap-2", exit && "ev-out")}>
                  <Button type="button" variant="solid" size="sm" className="px-4" onClick={() => onAnswer("evaluate")}>
                    ارزیابی شد
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-foreground/15 bg-transparent px-4 text-destructive dark:bg-transparent"
                    onClick={() => onAnswer("reject")}
                  >
                    رد
                  </Button>
                </div>

                {/*------ Stamp ------*/}
                {/* Pressed where the buttons were: the answer he chose, in the stamp's ink. */}
                {exit && (
                  <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                    <AnswerStamp kind={exit.kind} />
                  </span>
                )}
              </>
            ) : (
              <AnsweredOn evaluation={evaluation} />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/*===== Answered On =====*/
/** The day an answered request was closed, where the buttons stand on a waiting one (the chip already says how). */
function AnsweredOn({ evaluation }: { evaluation: AdminEvaluation }) {
  if (!evaluation.decidedAt) return null;

  return (
    <p className="text-xs whitespace-nowrap text-muted-foreground">
      {evaluation.status === "withdrawn" ? "پس گرفت" : "جواب"}{" "}
      <span className="tabular-nums">{formatJalaliTimestamp(evaluation.decidedAt)}</span>
    </p>
  );
}
