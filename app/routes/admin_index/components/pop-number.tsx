import { cn } from "cn";
import { useState } from "react";

import { formatNumberFa } from "~/lib/digits";

/*===== Pop Number =====*/
/**
 * A number that pops (`answer-pop`, app.css) when a revalidation brings a different value, and only then: the page has
 * no load moment, so the first render (the server's, then hydration) shows it still. The span is keyed by the value, so
 * every later change remounts it and plays the pop again. Reduced motion: `answer-pop` is off, the new value is simply
 * there.
 */
export function PopNumber({
  value,
  children,
  className,
}: {
  value: number;
  /** What to show, when it isn't the plain number (an amount in Toman). */
  children?: React.ReactNode;
  className?: string;
}) {
  /*------ Changed Since Mount ------*/
  // React's "adjust state while rendering" pattern: no effect, so the pop starts in the same paint as the new value.
  const [shown, setShown] = useState(value);
  const [changed, setChanged] = useState(false);
  if (value !== shown) {
    setShown(value);
    setChanged(true);
  }

  return (
    <span key={value} className={cn("inline-block [--pop-origin:50%_60%]", changed && "answer-pop", className)}>
      {children ?? formatNumberFa(value)}
    </span>
  );
}
