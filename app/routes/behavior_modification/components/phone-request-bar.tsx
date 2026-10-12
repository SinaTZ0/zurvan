import { cn } from "cn";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

/*===== Phone Request Bar =====*/
/**
 * Phones only: once part 1 has been reached, the send button follows the bottom edge, so a person deep in the form never
 * scrolls back for the one action. Before that the first screen stays clean. Lives inside the `<form>`, so its button
 * submits it.
 */
export function PhoneRequestBar({
  firstPartRef,
  summary,
  pending,
  uploading,
  disabled,
}: {
  firstPartRef: React.RefObject<HTMLElement | null>;
  /** One short line on what is ready, e.g. «سگ: لئو». */
  summary: string;
  pending: boolean;
  uploading: boolean;
  disabled: boolean;
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
      <div className="site-container flex items-center justify-between gap-3 py-3">
        <p className="min-w-0 truncate text-sm font-bold">{summary}</p>
        <Button type="submit" size="lg" disabled={disabled} className="shrink-0 px-5">
          {pending && <Spinner data-icon="inline-start" />}
          {uploading ? "ویدیو در حال بارگذاری است" : "درخواست را بفرست"}
        </Button>
      </div>
    </div>
  );
}
