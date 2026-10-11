import { cn } from "cn";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatToman } from "~/lib/course-format";
import { BOOKING_BLOCKED_LABEL, BOOKING_BUTTON_LABEL } from "~/routes/account_book/components/booking-receipt";

/*===== Phone Booking Bar =====*/
/**
 * Phones only: once the first part of the form has been reached, the total and the button follow along the bottom
 * edge, so someone deep in the form never scrolls back for the one action. Before that the first screen stays clean.
 * Lives inside the `<form>`, so its button submits it.
 */
export function PhoneBookingBar({
  firstPartRef,
  total,
  pending,
  blocked,
}: {
  firstPartRef: React.RefObject<HTMLElement | null>;
  /** Rial. */
  total: number;
  pending: boolean;
  blocked: boolean;
}) {
  const [reached, setReached] = useState(false);

  useEffect(() => {
    const part = firstPartRef.current;
    if (!part) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      // On screen, or already scrolled past: only "still waiting below the fold" keeps the bar away.
      setReached(entry.isIntersecting || entry.boundingClientRect.top < 0);
    });
    observer.observe(part);
    return () => observer.disconnect();
  }, [firstPartRef]);

  return (
    <div
      // A hidden bar stays out of the tab order and the accessibility tree.
      inert={!reached}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-popover/95 pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-lg backdrop-blur-md lg:hidden",
        "motion-safe:transition-[translate,opacity] motion-safe:duration-300",
        reached ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="site-container flex items-center justify-between gap-4 py-3">
        <p className="min-w-0 leading-snug">
          <span className="block text-xs text-muted-foreground">مبلغ پرداخت</span>
          <span className="block text-lg font-extrabold tabular-nums">{formatToman(total)}</span>
        </p>
        <Button type="submit" size="lg" disabled={pending || blocked} className="shrink-0 px-5">
          {pending && <Spinner data-icon="inline-start" />}
          {blocked ? BOOKING_BLOCKED_LABEL : BOOKING_BUTTON_LABEL}
        </Button>
      </div>
    </div>
  );
}
