import { cn } from "cn";

import { DogPhoto } from "~/components/dog-photo";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { SpeechBubble } from "~/components/speech-bubble";
import { buttonVariants } from "~/components/ui/button";
import { WithdrawEvaluationButton } from "~/components/withdraw-evaluation-button";
import { describeDog } from "~/lib/dog-format";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";
import { DogCardCourses } from "~/routes/account_home/components/dog-card-courses";

/*===== Dog Card =====*/
/**
 * One dog on the Dashboard: its photo, and its own state as a line it says in a chalk bubble, with the one thing the
 * owner can do next (F2, F3, F6).
 *
 * Desktop is a wide row: the photo at the start, the words at the end, the bubble's tail pointing back at the photo.
 * Phones stack: the photo on top, the bubble overlapping its bottom edge with the tail pointing up at the dog.
 */
export function DogCard({
  dog,
  status,
  activeEnrollments,
}: {
  dog: Dog;
  status: DogStatus;
  activeEnrollments: readonly Enrollment[];
}) {
  const titleId = `dog-card-${dog.id}`;
  const detailPath = `/account/dogs/${dog.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-x-8 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:grid-cols-12 lg:p-6"
    >
      {/*===== Photo =====*/}
      {/* The name is the card's one link; the photo repeats it for pointer users only, so it is out of the tab order
          and the accessibility tree. The photo box stays at least 224px tall (a bubble covers its bottom edge): the no-photo tag is 192px. */}
      <Link
        to={detailPath}
        aria-hidden
        tabIndex={-1}
        className="relative block overflow-hidden rounded-2xl lg:col-span-4 lg:self-start"
      >
        <DogPhoto
          name={dog.name}
          photo={dog.photo}
          microchipNumber={dog.microchipNumber}
          className="aspect-[16/10] min-h-56 w-full lg:aspect-[4/3] motion-safe:[&_img]:transition-transform motion-safe:[&_img]:duration-500 motion-safe:hover:[&_img]:scale-105"
        />
      </Link>

      {/*===== Words =====*/}
      <div className="flex min-w-0 flex-col lg:col-span-8">
        {/*------ Bubble ------*/}
        {/* Phones: pulled up over the photo's bottom edge, its tail pointing up at the dog. */}
        <SpeechBubble
          tail="top-start"
          lgTail="bottom-start"
          className="relative z-10 ms-3 -mt-7 mb-5 max-w-[calc(100%-1.5rem)] self-start sm:max-w-sm lg:order-first lg:ms-0 lg:mt-0 lg:mb-6 lg:max-w-md"
        >
          {status.line}
        </SpeechBubble>

        {/*------ Name ------*/}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id={titleId} className="text-2xl font-extrabold text-balance">
            <Link
              to={detailPath}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <bdi>{dog.name}</bdi>
            </Link>
          </h2>
          {status.badge ? (
            <EvaluationStatusBadge status={status.badge} />
          ) : (
            <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-transparent bg-muted px-2.5 text-xs font-bold whitespace-nowrap text-muted-foreground">
              ارزیابی نشده
            </span>
          )}
        </div>
        <p className="mt-1.5 text-muted-foreground">{describeDog(dog)}</p>

        {status.rejectionReason && (
          <p className="mt-3 max-w-xl border-s-2 border-border ps-3 text-sm text-pretty text-muted-foreground">
            {status.rejectionReason}
          </p>
        )}

        {/*------ The One Action ------*/}
        {/* Never two equal buttons: a dog that only waits for the Admin gets the quiet withdraw button instead. */}
        <div className="mt-5">
          {status.action ? (
            <Link to={status.action.to} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto sm:min-w-52")}>
              {status.action.label}
            </Link>
          ) : status.waitingEvaluation ? (
            <WithdrawEvaluationButton evaluationId={status.waitingEvaluation.id} dogName={dog.name} />
          ) : null}
        </div>

        {/*------ Courses ------*/}
        <DogCardCourses
          dogId={dog.id}
          dogName={dog.name}
          activeEnrollments={activeEnrollments}
          passedCourses={dog.passedCourses}
        />
      </div>
    </article>
  );
}
