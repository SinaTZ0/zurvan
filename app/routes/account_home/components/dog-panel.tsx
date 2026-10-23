import { linkOptions } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowLeftIcon } from "lucide-react";

import { ChalkBubble } from "~/components/chalk-bubble";
import { DogPhoto } from "~/components/dog-photo";
import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { WithdrawEvaluationButton } from "~/components/withdraw-evaluation-button";
import { describeDog } from "~/lib/dog-format";
import type { DogStatus } from "~/lib/dog-status";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";
import { DogRoad } from "~/routes/account_home/components/dog-road";
import { useChanged } from "~/routes/account_home/hooks/use-changed";
import { buildRoad } from "~/routes/account_home/road";
import { m } from "~/paraglide/messages";

/*===== Tape =====*/
// A strip of translucent tape with torn ends, in a paper tone (the About page's): the print's mount is ivory, so the
// home page's ivory tape would vanish on it.
const TAPE =
  "absolute h-5 w-16 bg-[rgb(214_196_150/0.8)] [clip-path:polygon(0_10%,6%_0,12%_12%,18%_0,82%_0,88%_10%,94%_0,100%_12%,100%_88%,94%_100%,88%_90%,82%_100%,18%_100%,12%_88%,6%_100%,0_90%)] md:w-20";

/*===== Dog Panel =====*/
/**
 * One of the customer's dogs on the Dashboard (F2, F3, F6): its photo pinned as a print, its own state as a line it
 * says in a chalk bubble, its name, the one thing to do next, and its road. The panel is the customer's dog's own, so
 * the mascot never stands on it (a drawn dog on a photographed one reads as the same dog twice).
 *
 * From `lg`: the print column at the start (16rem), the words beside it and the road under the words across the rest.
 * Phones stack: the print, its bubble over the print's bottom edge, the words and the action, then the road down the
 * start side, so the dog's name and state come within the first scroll.
 *
 * Motion: the first panel is part of the page's load (its bubble pops after the hero's); later panels rise in as they
 * scroll into view. After a change while the page is open (a withdrawn request, refetched by the button), the bubble
 * pops again with the new line, the badge and the action fade in, and the road's stops that changed turn.
 */
export function DogPanel({
  dog,
  status,
  activeEnrollments,
  index,
}: {
  dog: Dog;
  status: DogStatus;
  activeEnrollments: readonly Enrollment[];
  /** The panel's place in the list: the first is on the page's first screen on a laptop. */
  index: number;
}) {
  const titleId = `dog-panel-${dog.id}`;
  const detailLink = linkOptions({ to: "/account/dogs/$dogId", params: { dogId: dog.id } });
  const changed = useChanged(status.kind);
  const road = buildRoad({ dog, status, activeCount: activeEnrollments.length });

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "rounded-4xl border border-border/60 bg-sunken paper-grain p-4 shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)] sm:p-6 lg:p-8",
        index > 0 && "lively-reveal",
      )}
    >
      <div className="grid gap-y-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-14">
        {/*===== Print and Bubble =====*/}
        <div className="lg:row-span-2 lg:self-center">
          {/* Centred beside a taller words column (a dog with several courses running), so neither end is left empty. */}
          {/*------ Print ------*/}
          {/* The name is the panel's link; the print repeats it for pointer users only, so it is out of the tab order
              and the accessibility tree. A print a little crooked, taped across its top corners; the tilt alternates
              from one dog to the next. The no-photo tag needs 192px of height: both boxes give it more. */}
          <figure
            className={cn("relative px-1 pt-2", index % 2 ? "rotate-1 sm:rotate-[1.5deg]" : "-rotate-1 sm:-rotate-2")}
          >
            <Link
              {...detailLink}
              aria-hidden
              tabIndex={-1}
              className="lively-lift block rounded-sm bg-foreground p-2 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.9)] md:p-2.5"
            >
              <DogPhoto
                name={dog.name}
                photo={dog.photo}
                microchipNumber={dog.microchipNumber}
                priority={index === 0}
                className="aspect-[3/2] min-h-52 w-full lg:aspect-square"
              />
            </Link>
            <span aria-hidden className={`${TAPE} top-0 -right-2 rotate-45 md:-right-3`} />
            <span aria-hidden className={`${TAPE} top-0 -left-2 -rotate-45 md:-left-3`} />
          </figure>

          {/*------ Bubble ------*/}
          {/* Over the print's bottom edge at its end corner, reaching out towards the words on a laptop. Its tail
              (physical right, 2.25rem in) points up into the photo. It pops from that tail. */}
          <div
            className={cn(
              "relative z-10 -mt-6 flex justify-end pe-2 lg:-me-12 lg:pe-0",
              index === 0 ? "ah-first-pop" : "lively-reveal-pop",
            )}
          >
            <ChalkBubble
              key={status.line}
              tail="right"
              tailEdge="top"
              className={cn(
                "max-w-[calc(100%-1rem)] text-pretty [--pop-origin:calc(100%-2.25rem)_0] lg:max-w-[16rem]",
                changed && "answer-pop",
              )}
            >
              {status.line}
            </ChalkBubble>
          </div>
        </div>

        {/*===== Words =====*/}
        {/* From `lg`, the facts at the start and the action at the end of one row, so the panel's top isn't half empty. */}
        <div className="min-w-0 lg:flex lg:items-start lg:justify-between lg:gap-x-8 lg:pt-3">
          <div className="min-w-0">
            {/*------ Name ------*/}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 id={titleId} className="font-display text-3xl leading-tight font-black text-primary lg:text-4xl">
                <Link
                  {...detailLink}
                  className="rounded-sm decoration-2 underline-offset-8 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <bdi>{dog.name}</bdi>
                </Link>
              </h2>
              <span key={status.badge ?? "none"} className={cn("flex", changed && "answer-in")}>
                {status.badge ? (
                  <EvaluationStatusBadge status={status.badge} />
                ) : (
                  <span className="inline-flex h-6 shrink-0 items-center rounded-full border border-transparent bg-muted px-2.5 text-xs font-bold whitespace-nowrap text-muted-foreground">
                    {m.account_home_panel_not_evaluated()}
                  </span>
                )}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">{describeDog(dog)}</p>

            {/*------ Reason ------*/}
            {/* The dog's bubble says «… دلیلش اینه:»; the reason itself is the Admin's words, set apart from the page's. */}
            {status.rejectionReason && (
              <p
                key={status.rejectionReason}
                className={cn(
                  "mt-4 max-w-xl rounded-2xl border border-border bg-card paper-grain px-4 py-3 text-sm text-pretty",
                  changed && "answer-in",
                )}
              >
                <span className="font-bold text-muted-foreground">{m.account_home_panel_reason()}</span>
                {status.rejectionReason}
              </p>
            )}
          </div>

          {/*------ The One Action ------*/}
          {/* Never two equal buttons: a dog that only waits for the Admin gets the quiet withdraw button instead. */}
          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-4 lg:mt-1 lg:shrink-0 lg:flex-col lg:items-end lg:gap-y-3">
            <div key={status.kind} className={cn("w-full sm:w-auto", changed && "answer-in")}>
              {status.action ? (
                <Link
                  {...status.action.link}
                  className={buttonVariants({
                    variant: "solid",
                    size: "lg",
                    className: "w-full sm:w-auto sm:min-w-48",
                  })}
                >
                  {status.action.label}
                </Link>
              ) : status.waitingEvaluation ? (
                <WithdrawEvaluationButton evaluationId={status.waitingEvaluation.id} dogName={dog.name} />
              ) : null}
            </div>

            <Link
              {...detailLink}
              className="group/history inline-flex items-center gap-1.5 rounded-sm text-sm font-bold text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {/* The name sits inside Unicode isolates so an English sentence keeps its order around a Persian name. */}
              <span>{m.account_home_panel_history({ dogName: `\u2068${dog.name}\u2069` })}</span>
              <ArrowLeftIcon
                aria-hidden
                className="size-4 motion-safe:transition-transform ltr:-scale-x-100 motion-safe:group-hover/history:ltr:translate-x-0.5 motion-safe:group-hover/history:rtl:-translate-x-0.5"
              />
            </Link>
          </div>
        </div>

        {/*===== Road =====*/}
        {/* At the panel's foot beside the print's bubble; a short words row leaves the room between them. */}
        <div className="border-t border-border/70 pt-6 lg:col-start-2 lg:self-end lg:border-t-0 lg:pt-0 lg:pb-2">
          <DogRoad
            dogName={dog.name}
            stops={road.stops}
            current={road.current}
            activeEnrollments={activeEnrollments}
            passedCourses={dog.passedCourses}
            changed={changed}
          />
        </div>
      </div>
    </article>
  );
}
