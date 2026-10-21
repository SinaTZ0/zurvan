import { cn } from "cn";
import { useState } from "react";

import { formatNumberFa } from "~/lib/digits";

/*===== Pop Number =====*/
/**
 * A number that pops (`answer-pop`, app.css) when it changes after the first render, and only then: the page has no load
 * moment, so the server's render and hydration show it still. The span is keyed by the value, so every later change
 * remounts it and plays the pop again. Copied from the Overview's (`admin_index`), since slices don't share. A
 * position pops while its row slides, so the new number is seen arriving with it. Reduced motion: `answer-pop` is off,
 * the new value is simply there.
 */
export function PopNumber({ value, className }: { value: number; className?: string }) {
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
      {formatNumberFa(value)}
    </span>
  );
}
