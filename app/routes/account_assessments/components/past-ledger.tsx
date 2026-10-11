import { AssessmentStatusBadge } from "~/components/assessment-status-badge";
import { Link } from "~/components/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { formatSlotDay } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";
import { AssessmentDogMark } from "~/routes/account_assessments/components/assessment-dog";
import { trainerShortName } from "~/routes/account_assessments/components/assessment-people";

/** What the row says when it didn't happen: who ended it, and why when the trainer did. */
function endingLine(assessment: Assessment): string | null {
  const trainer = trainerShortName(assessment.trainer);
  if (assessment.status === "cancelled") {
    if (assessment.cancelledBy === "trainer") {
      return assessment.cancellationReason
        ? `${trainer} این وقت را لغو کرد: «${assessment.cancellationReason}»`
        : `${trainer} این وقت را لغو کرد.`;
    }
    return assessment.cancellationReason ? `تو لغو کردی: «${assessment.cancellationReason}»` : "تو لغو کردی.";
  }
  if (assessment.status === "no-show") return "سر وقت نرسیدیم.";
  return null;
}

/*===== Past Ledger =====*/
/**
 * Everything that is over, newest first, as a ruled ledger: date, dog and status on one line. A completed row opens in
 * place to what the trainer said; a no-show or a cancellation shows how it ended and offers another time.
 */
export function PastLedger({ assessments }: { assessments: Assessment[] }) {
  return (
    <Accordion className="divide-y border-y">
      {assessments.map((assessment) =>
        assessment.status === "completed" ? (
          <CompletedRow key={assessment.id} assessment={assessment} />
        ) : (
          <EndedRow key={assessment.id} assessment={assessment} />
        ),
      )}
    </Accordion>
  );
}

/*===== Row Line =====*/
/** The line every past row shares, so the columns align whether or not the row opens. */
function RowLine({ assessment }: { assessment: Assessment }) {
  return (
    <>
      <span className="w-28 shrink-0 text-sm font-bold text-muted-foreground max-sm:w-full sm:w-32">
        {formatSlotDay(assessment.startsAt)}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <AssessmentDogMark dog={assessment.dog} />
        <span className="truncate text-base font-bold">{assessment.dog.name}</span>
      </span>
      <AssessmentStatusBadge status={assessment.status} />
    </>
  );
}

/*===== Completed Row =====*/
function CompletedRow({ assessment }: { assessment: Assessment }) {
  const trainer = trainerShortName(assessment.trainer);

  return (
    <AccordionItem value={assessment.id} className="border-b-0">
      <AccordionTrigger className="items-center gap-4 rounded-none px-1 py-3 text-base font-normal hover:bg-primary/5 hover:no-underline max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 max-sm:pe-8 sm:px-3 [&_[data-slot=accordion-trigger-icon]]:max-sm:absolute [&_[data-slot=accordion-trigger-icon]]:max-sm:end-2 [&_[data-slot=accordion-trigger-icon]]:max-sm:top-5 [&_[data-slot=accordion-trigger-icon]]:sm:ms-2">
        <RowLine assessment={assessment} />
      </AccordionTrigger>
      <AccordionContent className="px-1 pb-5 sm:px-3 sm:ps-[9.75rem]">
        <div className="flex flex-col gap-5 pt-2 text-base">
          {/*------ Notes ------*/}
          {assessment.trainerNotes && (
            <figure>
              <blockquote className="border-s-2 border-primary/50 ps-4 leading-relaxed text-pretty whitespace-pre-line">
                {assessment.trainerNotes}
              </blockquote>
              <figcaption className="mt-2 ps-4 text-sm text-muted-foreground">— {trainer}</figcaption>
            </figure>
          )}

          {/*------ Recommendations ------*/}
          {assessment.recommendations.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-bold text-muted-foreground">
                دوره‌هایی که پیشنهاد می‌کنم، به این ترتیب
              </h3>
              <ol className="flex flex-col gap-1.5">
                {assessment.recommendations.map((course, index) => (
                  <li key={course.slug} className="flex items-baseline gap-3">
                    <span aria-hidden className="w-5 shrink-0 text-end font-extrabold text-primary tabular-nums">
                      {formatNumberFa(index + 1)}
                    </span>
                    <Link
                      to={`/courses/${course.slug}`}
                      className="rounded-sm font-bold underline-offset-4 hover:text-primary hover:underline"
                    >
                      {course.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-muted-foreground">{trainer} این بار دوره‌ای پیشنهاد نکرد.</p>
          )}

          <Link
            to={`/account/dogs/${assessment.dog.id}`}
            className="w-fit rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            پرونده‌ی {assessment.dog.name}
          </Link>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/*===== Ended Row =====*/
/** A no-show or a cancellation: nothing to open, but a way to try again. */
function EndedRow({ assessment }: { assessment: Assessment }) {
  const ending = endingLine(assessment);

  return (
    <div className="flex flex-col gap-2 px-1 py-3 sm:px-3">
      <div className="flex items-center gap-4 max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 sm:pe-10">
        <RowLine assessment={assessment} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:ps-36">
        {ending && <p className="text-sm text-pretty text-muted-foreground">{ending}</p>}
        <Link
          to={`/assessment?dog=${assessment.dog.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "text-primary hover:text-primary" })}
        >
          یک وقت دیگر رزرو کن
          <span className="sr-only"> برای {assessment.dog.name}</span>
        </Link>
      </div>
    </div>
  );
}
