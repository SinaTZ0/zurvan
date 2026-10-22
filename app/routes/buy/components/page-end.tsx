import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { STRIP_FADE } from "~/routes/buy/plate";

/*===== Page End =====*/
/**
 * The page ends on a short stretch of path with a bush at either end, running straight into the footer (the route's
 * `staticData` sets `flushFooter`), so the last plate isn't followed by a dead strip of paper. Its height also keeps the
 * floating cart bar off the last row when the page is scrolled to the end.
 */
export function PageEnd() {
  return (
    <div aria-hidden className="relative mx-auto mt-6 h-20 max-w-6xl lg:mt-8">
      {/* Physical sides: a picture, not reading order. */}
      <MascotCut
        name="plants"
        className="lively-sway absolute bottom-5 left-[6%] w-14 translate-y-[6%] lg:bottom-7 lg:w-20"
      />
      <MascotCut
        name="plants"
        className="lively-sway-2 absolute right-[6%] bottom-5 w-11 translate-y-[6%] -scale-x-100 lg:bottom-7 lg:w-16"
      />
      <GroundStrip className={cn("absolute inset-x-0 bottom-0 h-7 lg:h-9", STRIP_FADE)} />
    </div>
  );
}
