import { cn } from "cn";
import { useState } from "react";

/*===== Pop Text =====*/
/**
 * A worked-out number in the live sentence, which pops (`answer-pop`, app.css) when it changes after the first render,
 * and only then: the page has no load moment, so the server's render and hydration show it still. The span is keyed by
 * its text, so every later change remounts it and plays the pop again. Built like the Overview's `PopNumber`, for text
 * («۱٬۰۰۰٬۰۰۰ تومان», «۶ام»), since slices don't share. Reduced motion: `answer-pop` is off, the new value is simply
 * there.
 */
export function PopText({ text }: { text: string }) {
  /*------ Changed Since Mount ------*/
  // React's "adjust state while rendering" pattern: no effect, so the pop starts in the same paint as the new value.
  const [shown, setShown] = useState(text);
  const [changed, setChanged] = useState(false);
  if (text !== shown) {
    setShown(text);
    setChanged(true);
  }

  return (
    <span key={text} className={cn("inline-block font-bold [--pop-origin:50%_70%]", changed && "answer-pop")}>
      {text}
    </span>
  );
}
