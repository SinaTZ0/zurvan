import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { NightSky } from "~/components/night-sky";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { FADED_ENDS, PLATE, WARM_LIGHT } from "~/routes/account_cart/column";

/*===== Stage Plate =====*/
/**
 * One wide plate that stands in for the bags when there are none to show (an empty cart, a review that couldn't be
 * read): the words and the ways on at the start, and at the end a small scene on a strip of path under the night sky,
 * with a pool of warm light (`stage`: the pieces, placed by the caller with physical sides, standing on the strip's
 * middle at `bottom-[0.9rem] lg:bottom-[1.2rem]`). Phones put the scene on top.
 *
 * It rises in (`answer-in`), so a cart emptied by its last «برداشتن» doesn't snap to it.
 */
export function StagePlate({
  titleId,
  title,
  stage,
  children,
}: {
  titleId: string;
  title: string;
  stage: React.ReactNode;
  /** The plain words and the buttons. */
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={titleId} className={cn(PLATE, "answer-in overflow-hidden px-5 pt-5 sm:px-8 lg:px-10")}>
      <div className="grid gap-y-4 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        {/*===== Scene =====*/}
        <div aria-hidden className="relative h-52 lg:order-2 lg:col-span-5 lg:h-[20rem]">
          <div className={cn("absolute inset-0", WARM_LIGHT)} />
          <NightSky className="inset-x-[10%] top-2 h-16 lg:top-6 lg:h-24" />
          <GroundStrip className={cn("absolute -inset-x-4 bottom-0 h-7 lg:h-9", FADED_ENDS)} />
          {stage}
        </div>

        {/*===== Words =====*/}
        <div className="pb-8 lg:order-1 lg:col-span-7 lg:self-center lg:py-10">
          <h2 id={titleId} className={cn(DISPLAY_HEADING, "text-h2 text-balance")}>
            {title}
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}
