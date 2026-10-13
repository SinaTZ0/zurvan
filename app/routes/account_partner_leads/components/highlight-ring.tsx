import { cn } from "cn";
import { useEffect, useState } from "react";

/*===== Highlight Ring =====*/
/**
 * The one moment on this page: a number the partner just added shows a gold ring around its row that fades out over
 * about a second, so his eye finds the new row at the top of the list. It is an overlay fading by `opacity` only; with
 * reduced motion it is not drawn (the row is first in the list and the toast has spoken).
 */
export function HighlightRing() {
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    // One tick so the first paint has the ring at full strength and the transition has something to fade from.
    const timer = window.setTimeout(() => setFaded(true), 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-px hidden rounded-2xl ring-2 ring-primary transition-opacity duration-[1200ms] motion-safe:block",
        faded ? "opacity-0" : "opacity-100",
      )}
    />
  );
}
