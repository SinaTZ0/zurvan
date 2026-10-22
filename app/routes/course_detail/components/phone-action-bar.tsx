import { cn } from "cn";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useHydrated } from "~/hooks/use-hydrated";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { TAB_BAR_DOCK_ID } from "~/lib/tab-bar-dock";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";
import { BuyButton } from "~/routes/course_detail/components/buy-card";
import type { BuyCardState } from "~/routes/course_detail/components/use-buy-card";

/*===== Phone Action Bar =====*/
/**
 * Phones only: once the buy card has scrolled off the top, the price and the same main action dock on top of the tab
 * bar (portalled into the element the bar leaves for it), so a visitor reading what the course teaches can buy without
 * scrolling back. It steps aside while the card is on screen, so the same ask is never in view twice. Desktop has no
 * tab bar, hence no dock, and renders nothing.
 *
 * It draws the card's own state, so the two can't disagree. The two states that need the dog list (nothing picked,
 * or a dog that can't buy) send the visitor up to the card instead of showing a dead button.
 *
 * While open it carries `data-dock-open`, which squares the tab bar's top corners; its own top corners and surface
 * match the bar's, so the two read as one object. Closed, it collapses to no height (grid rows 0fr), so it takes no space.
 */
export function PhoneActionBar({
  course,
  buy,
  cardRef,
}: {
  course: Course;
  buy: BuyCardState;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [cardPassed, setCardPassed] = useState(false);
  // The dock lives in the layout and doesn't exist on the server, so the portal opens only after mount.
  const hydrated = useHydrated();
  const dock = hydrated ? document.getElementById(TAB_BAR_DOCK_ID) : null;

  useEffect(() => {
    // A scroll listener rather than an IntersectionObserver: a jump from above the card to far below it (a restored
    // scroll position, an anchor) never intersects it, so the observer would report nothing and the strip would stay shut.
    function check() {
      const card = cardRef.current;
      if (!card) return;
      // Only "scrolled past": the card's bottom is above the viewport, not still waiting below it.
      setCardPassed(card.getBoundingClientRect().bottom < 0);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [cardRef]);

  if (!dock) return null;

  const needsTheList = buy.action.kind === "pick" || buy.action.kind === "blocked";

  return createPortal(
    <div
      // Hidden bars stay out of the tab order and the accessibility tree.
      inert={!cardPassed}
      data-dock-open={cardPassed ? "" : undefined}
      className={cn(
        "grid rounded-t-[1.6rem] bg-card/90 backdrop-blur-md",
        "motion-safe:transition-[grid-template-rows] motion-safe:duration-200",
        cardPassed ? "grid-rows-[1fr] border border-b-0 border-foreground/15" : "grid-rows-[0fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <p className="min-w-0 leading-snug">
            <span className="block truncate text-sm font-extrabold">{course.title}</span>
            <span className="block text-sm font-bold text-primary">
              {course.price !== null ? formatToman(course.price) : m.shared_course_after_evaluation()}
            </span>
          </p>
          {needsTheList ? (
            <Link to="." hash="buy-card" className={buttonVariants({ variant: "solid", className: "shrink-0" })}>
              {buy.action.kind === "pick" ? m.course_detail_bar_pick() : m.course_detail_bar_reason()}
            </Link>
          ) : (
            <BuyButton buy={buy} size="default" className="shrink-0" />
          )}
        </div>
      </div>
    </div>,
    dock,
  );
}
