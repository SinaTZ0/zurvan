import { cn } from "cn";
import { useEffect, useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import type { Course } from "~/orpc/course/contract";
import { BuyButton } from "~/routes/course_detail/components/buy-card";
import type { BuyCardState } from "~/routes/course_detail/components/use-buy-card";

/*===== Phone Action Bar =====*/
/**
 * Phones only: once the buy card has scrolled off the top, the price and the same main action follow along the bottom
 * edge, so a visitor reading what the course teaches can buy without scrolling back. It steps aside while the card is
 * on screen, so the same ask is never in view twice. Desktop has the room to keep the page calm without it.
 *
 * It draws the card's own state, so the two can't disagree. The two states that need the dog list (nothing picked,
 * or a dog that can't buy) send the visitor up to the card instead of showing a dead button.
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

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Only "scrolled past": above the viewport, not still waiting below it.
      setCardPassed(!entry!.isIntersecting && entry!.boundingClientRect.top < 0);
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, [cardRef]);

  const needsTheList = buy.action.kind === "pick" || buy.action.kind === "blocked";

  return (
    <div
      // Hidden bars stay out of the tab order and the accessibility tree.
      inert={!cardPassed}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-popover/95 pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg backdrop-blur-md lg:hidden",
        "motion-safe:transition-[translate,opacity] motion-safe:duration-300",
        cardPassed ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="site-container flex items-center justify-between gap-4 py-3">
        <p className="min-w-0 leading-snug">
          <span className="block truncate text-sm font-extrabold">{course.title}</span>
          <span className="block text-sm font-bold text-primary">
            {course.price !== null ? formatToman(course.price) : "بعد از ارزیابی"}
          </span>
        </p>
        {needsTheList ? (
          <Link to="#buy-card" className={buttonVariants({ variant: "solid", className: "shrink-0" })}>
            {buy.action.kind === "pick" ? "انتخاب سگ" : "دلیلش را ببین"}
          </Link>
        ) : (
          <BuyButton buy={buy} size="default" className="shrink-0" />
        )}
      </div>
    </div>
  );
}
