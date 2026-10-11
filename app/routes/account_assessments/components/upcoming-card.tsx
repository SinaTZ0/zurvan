import { Link } from "~/components/link";
import { formatSlotTime } from "~/lib/tehran-time";
import { MEETING_PLACE_KIND_LABELS, TRAINING_GOAL_LABELS } from "~/orpc/assessment/constants";
import type { Assessment } from "~/orpc/assessment/contract";
import { AssessmentDogMark } from "~/routes/account_assessments/components/assessment-dog";
import { splitSlotDay, trainerShortName } from "~/routes/account_assessments/components/assessment-people";
import { Stamp } from "~/components/stamp";
import { CancelAssessment } from "~/routes/account_assessments/components/cancel-assessment";

/*===== Upcoming Card =====*/
/**
 * A booked assessment shaped like the slip it is: the time block on the sunken plate at the start, the details beside
 * it, and the one way out (cancel) at the end. The time is what the eye lands on, then the dog, then cancel.
 *
 * `stamped` is the assessment the customer has just booked; its card carries the stamp.
 */
export function UpcomingCard({ assessment, stamped }: { assessment: Assessment; stamped: boolean }) {
  const { weekday, date } = splitSlotDay(assessment.startsAt);
  const placeKind = MEETING_PLACE_KIND_LABELS[assessment.placeKind];

  return (
    <li className="relative">
      {stamped && <Stamp lines={["رزرو", "شد"]} />}
      <article
        aria-labelledby={`upcoming-${assessment.id}`}
        className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border sm:flex-row"
      >
        {/*------ Time Block ------*/}
        <div className="flex flex-col justify-center gap-0.5 bg-sunken px-6 py-5 sm:w-44 sm:shrink-0">
          <p className="text-sm text-muted-foreground">{weekday}</p>
          <p id={`upcoming-${assessment.id}`} className="text-3xl leading-tight font-extrabold tabular-nums">
            {formatSlotTime(assessment.startsAt)}
          </p>
          <p className="font-bold">{date}</p>
          {stamped && <p className="sr-only">تازه رزرو شد</p>}
        </div>

        {/*------ Details ------*/}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <AssessmentDogMark dog={assessment.dog} />
            <div className="min-w-0 flex-1">
              <Link
                to={`/account/dogs/${assessment.dog.id}`}
                className="rounded-sm font-bold underline-offset-4 hover:underline"
              >
                {assessment.dog.name}
              </Link>
              <p className="text-sm text-muted-foreground">با {trainerShortName(assessment.trainer)}</p>
            </div>
          </div>

          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">کجا</dt>
              <dd className="mt-0.5 font-bold text-pretty">
                {placeKind}
                {assessment.place && <span className="font-normal text-muted-foreground">، {assessment.place}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">هدف</dt>
              <dd className="mt-0.5 font-bold">{TRAINING_GOAL_LABELS[assessment.trainingGoal]}</dd>
            </div>
          </dl>

          {assessment.customerNote && (
            <details className="group text-sm">
              <summary className="w-fit cursor-pointer rounded-sm font-bold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                یادداشت تو
              </summary>
              {/* The customer's own words, line breaks included. */}
              <p className="mt-2 border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">
                {assessment.customerNote}
              </p>
            </details>
          )}

          {/*------ Cancel ------*/}
          <div className="mt-auto flex sm:justify-end">
            {assessment.canCancel ? (
              <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
                <CancelAssessment assessment={assessment} />
              </div>
            ) : (
              // Booked but started: it can't be cancelled any more, and the trainer records how it went.
              <p className="text-sm text-muted-foreground">وقتش رسیده؛ بعد از دیدار، نتیجه همین‌جا می‌آید.</p>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
