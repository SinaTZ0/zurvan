import { cn } from "cn";
import { useEffect, useRef } from "react";

import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { Button, buttonVariants } from "~/components/ui/button";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatDate, formatNumber, formatTimestamp } from "~/lib/locale-format";
import { EVALUATION_PERIOD_LABELS, EVALUATION_WEEKDAY_LABELS } from "~/orpc/evaluation/constants";
import type { Evaluation } from "~/orpc/evaluation/contract";
import { m } from "~/paraglide/messages";
import { EdgeDog } from "~/routes/assessment/components/edge-dog";
import { NextRoad } from "~/routes/assessment/components/next-road";
import { TapedPrint } from "~/routes/assessment/components/taped-print";

/*===== Perforation =====*/
// The receipt's torn-off top: a row of half-round notches cut by a mask, one per 1.1rem tile. The shadow sits on the
// wrapper as a drop shadow, so it follows the notches instead of being cut by them.
const PERFORATED =
  "[mask-image:radial-gradient(circle_at_50%_0,transparent_0.34rem,black_0.38rem)] [mask-size:1.1rem_100%] [mask-repeat:repeat-x] [mask-position:center_top]";

/*===== Request Receipt =====*/
/**
 * Replaces the form's plates in place once the request is in (it rises in, `answer-in`): a receipt with a perforated
 * top, the dog's photo as a small taped print beside its name, what was sent (from the returned evaluation, so it says
 * what the server stored), the gold seal stamped on its end corner and the `stamp` dog on its top edge, who stamped it:
 * the seal lands (scale and a small turn to rest) as his paw presses. Then what happens from here as a three-stop road,
 * and the ways on. Withdrawing a request is not here: it lives on the dog's page (F3).
 *
 * On arrival the page is brought to it: to the top on a laptop (the heading, the road walking on and the receipt all fit
 * the first screen), to the receipt itself on a phone. Focus moves to its heading, so a screen reader starts there.
 */
export function RequestReceipt({
  evaluation,
  anotherDogRequestable,
  onAnotherDog,
}: {
  evaluation: Evaluation;
  /** Another dog of theirs can still ask for an evaluation. */
  anotherDogRequestable: boolean;
  onAnotherDog: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { dog } = evaluation;
  const photoCount = evaluation.photos.length;
  const videoCount = evaluation.videos.length;

  /*------ Bring It Into View ------*/
  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (window.matchMedia("(min-width: 64rem)").matches) window.scrollTo({ top: 0, behavior });
    else sectionRef.current?.scrollIntoView({ behavior, block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  /*------ Summary ------*/
  const join = m.assessment_receipt_join();
  const rows = [
    { term: m.assessment_receipt_dog(), detail: dog.name },
    {
      term: m.assessment_receipt_earliest(),
      detail: evaluation.earliestDate ? formatDate(evaluation.earliestDate) : "—",
    },
    {
      term: m.assessment_receipt_days(),
      detail: evaluation.availableDays.map((day) => EVALUATION_WEEKDAY_LABELS[day]).join(join),
    },
    {
      term: m.assessment_receipt_periods(),
      detail: evaluation.availablePeriods.map((period) => EVALUATION_PERIOD_LABELS[period]).join(join),
    },
    ...(photoCount + videoCount > 0
      ? [
          {
            term: m.assessment_receipt_files(),
            detail: [
              photoCount > 0 &&
                (photoCount === 1
                  ? m.assessment_receipt_photos_one({ count: formatNumber(photoCount) })
                  : m.assessment_receipt_photos_other({ count: formatNumber(photoCount) })),
              videoCount > 0 &&
                (videoCount === 1
                  ? m.assessment_receipt_videos_one({ count: formatNumber(videoCount) })
                  : m.assessment_receipt_videos_other({ count: formatNumber(videoCount) })),
            ]
              .filter(Boolean)
              .join(join),
          },
        ]
      : []),
  ];

  return (
    <section
      ref={sectionRef}
      aria-labelledby="receipt-title"
      className="answer-in scroll-mt-24 pt-[7.5rem] sm:pt-[9.5rem]"
    >
      {/*===== Receipt =====*/}
      <div className="relative">
        {/*------ The Stamp Dog ------*/}
        {/* On the top edge at the end corner, his stamp and sheet in front of him (his right), over the seal. */}
        <div aria-hidden className="pointer-events-none absolute end-3 bottom-[calc(100%-4px)] z-10 sm:end-8">
          <EdgeDog name="stamp" motionClassName="as-press" className="w-[6.5rem] sm:w-[8.5rem]" />
        </div>

        <div className="drop-shadow-[0_20px_26px_rgb(0_0_0/0.6)]">
          <div
            className={cn(
              "relative rounded-b-4xl bg-card paper-grain px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8",
              PERFORATED,
            )}
          >
            {/*------ Seal ------*/}
            <MascotCut
              name="seal-disc"
              className="as-seal absolute end-[3.25rem] top-5 w-16 -rotate-12 sm:end-[5.5rem] sm:w-[5.5rem]"
            />

            {/*------ Head ------*/}
            <div className="flex items-center gap-4 pe-20 sm:gap-5 sm:pe-36">
              <TapedPrint name={dog.name} photo={dog.photo} size="md" tilt="rotate-2" className="hidden sm:block" />
              <TapedPrint name={dog.name} photo={dog.photo} tilt="rotate-2" className="sm:hidden" />
              <div className="min-w-0">
                <h2
                  id="receipt-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-sm font-bold text-muted-foreground outline-none"
                >
                  {m.assessment_receipt_title()}
                </h2>
                <p className={cn(DISPLAY_HEADING, "mt-1 truncate text-3xl text-primary sm:text-4xl")}>
                  <bdi>{dog.name}</bdi>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {m.assessment_receipt_sent_at({ when: formatTimestamp(evaluation.createdAt) })}
                </p>
              </div>
            </div>

            {/*------ What Was Sent ------*/}
            <dl className="mt-7 grid gap-x-8 gap-y-4 border-t border-dashed border-foreground/20 pt-6 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.term}>
                  <dt className="text-sm text-muted-foreground">{row.term}</dt>
                  <dd className="mt-0.5 font-bold text-pretty">{row.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/*===== What Happens From Here =====*/}
      <h2 className={cn(DISPLAY_HEADING, "mt-14 text-h3")}>{m.assessment_receipt_next_title()}</h2>
      <div className="mt-6">
        <NextRoad />
      </div>

      {/*===== Ways On =====*/}
      <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-7">
        <Link to="/account" className={buttonVariants({ variant: "solid", size: "lg", className: "sm:min-w-56" })}>
          {m.assessment_receipt_go_dogs()}
        </Link>
        {anotherDogRequestable && (
          <Button
            type="button"
            variant="link"
            onClick={onAnotherDog}
            className="h-auto self-center rounded-sm p-0 text-sm sm:self-auto"
          >
            {m.assessment_receipt_another()}
          </Button>
        )}
      </div>
    </section>
  );
}
