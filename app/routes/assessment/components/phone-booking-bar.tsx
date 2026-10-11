import { cn } from "cn";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { AvailableSlot } from "~/orpc/assessment/contract";

/*===== Phone Booking Bar =====*/
/**
 * Phones only: once the first part of the form has been reached, the chosen time and the booking button follow along
 * the bottom edge, so a visitor deep in the diary never scrolls back for the one action. Before that the first
 * screen stays clean. Lives inside the `<form>`, so its button submits it.
 */
export function PhoneBookingBar({
  firstPartRef,
  slot,
  pending,
  blocked,
}: {
  firstPartRef: React.RefObject<HTMLElement | null>;
  slot: AvailableSlot | null;
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
          {slot ? (
            <>
              <span className="block text-xs text-muted-foreground">{formatSlotDay(slot.startsAt)}</span>
              <span className="block text-xl font-extrabold tabular-nums">{formatSlotTime(slot.startsAt)}</span>
            </>
          ) : (
            <span className="block text-sm text-muted-foreground">هنوز وقتی انتخاب نکرده‌ای</span>
          )}
        </p>
        <Button type="submit" size="lg" disabled={pending || blocked} className="shrink-0 px-6">
          {pending && <Spinner data-icon="inline-start" />}
          ارزیابی را رزرو کن
        </Button>
      </div>
    </div>
  );
}
