import { cn } from "cn";

import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { daysSince } from "~/routes/admin_evaluations/dates";
import { EvaluationMediaStrip } from "~/routes/admin_evaluations/components/evaluation-media-strip";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";

/*===== Helpers =====*/
/** «امروز» / «دیروز» / «N روز پیش», under the date of a request still waiting. */
function describeWaiting(createdAt: Date): string {
  const days = daysSince({ moment: createdAt });
  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${formatNumberFa(days)} روز پیش`;
}

/*===== Evaluation Row =====*/
/**
 * One evaluation in the list. The dog's name is a stretched link that opens the drawer; the phone link and the answer
 * buttons sit above it (`relative z-10`) so they stay clickable.
 *
 * One element serves every size. On phones it is a stacked card (dog and status, customer and date, thumbnails) with no
 * answer buttons: those live in the drawer's footer. From `lg` (when the rail leaves the content about 740px) the card
 * stays stacked but gains the phone link and the answer buttons; from `xl` it is one line, as the brief's `lg+` layout.
 * Grid areas keep the tab order the same everywhere: name, phone, buttons.
 */
export function EvaluationRow({
  evaluation,
  href,
  onOpen,
  onAnswer,
}: {
  evaluation: AdminEvaluation;
  /** The drawer's URL, so the link works for a new tab and before hydration. */
  href: string;
  onOpen: () => void;
  onAnswer: (kind: AnswerKind) => void;
}) {
  const { dog, customer, status } = evaluation;
  const requested = status === "requested";

  return (
    <li
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40",
        "[grid-template-areas:'dog_end'_'who_date'_'media_media']",
        "xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_6rem_17rem] xl:[grid-template-areas:'dog_who_media_date_end']",
      )}
    >
      {requested && (
        // The mark on a waiting row, so the queue reads at a glance among answered ones.
        <span aria-hidden className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-primary" />
      )}

      {/*===== Dog =====*/}
      <div className="flex min-w-0 items-center gap-3 [grid-area:dog]">
        <DogThumb name={dog.name} photo={dog.photo} className="size-12 xl:size-11" />
        <Link
          to={href}
          onClick={(event) => {
            // A plain click opens the drawer in place (a shallow URL change, no loader run); a new-tab click keeps
            // the browser's own behaviour.
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onOpen();
          }}
          className="min-w-0 truncate rounded-sm font-bold outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {dog.name}
        </Link>
      </div>

      {/*===== Customer =====*/}
      <div className="min-w-0 [grid-area:who]">
        <span className="block truncate text-sm text-muted-foreground lg:hidden">{customer.name}</span>
        <CustomerContact
          name={customer.name}
          phoneNumber={customer.phoneNumber}
          className="relative z-10 hidden lg:flex"
        />
      </div>

      {/*===== Photos and Videos =====*/}
      <div className="[grid-area:media]">
        <EvaluationMediaStrip photos={evaluation.photos} videos={evaluation.videos} />
      </div>

      {/*===== Date =====*/}
      <div className="text-end text-xs [grid-area:date] xl:text-start">
        <p className="text-sm tabular-nums xl:text-xs">{formatJalaliTimestamp(evaluation.createdAt)}</p>
        {evaluation.createdByAdmin ? (
          <p className="mt-0.5 text-muted-foreground">ثبت‌شده توسط مدیر</p>
        ) : (
          requested && <p className="mt-0.5 text-muted-foreground">{describeWaiting(evaluation.createdAt)}</p>
        )}
      </div>

      {/*===== Status and Answers =====*/}
      <div className="flex items-center justify-end gap-3 [grid-area:end] xl:justify-between">
        <EvaluationStatusBadge status={status} />
        {requested && (
          <div className="relative z-10 hidden items-center gap-2 lg:flex">
            <Button type="button" variant="solid" size="sm" onClick={() => onAnswer("evaluate")}>
              ارزیابی شد
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onAnswer("reject")}>
              رد
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
