import { cn } from "cn";
import { useState } from "react";

import { formatNumberFa } from "~/lib/digits";

/*===== Result Line =====*/
/**
 * How many dogs the search found, under the field: «۲ سگ پیدا شد». It speaks only while he is searching, and its line
 * keeps its height when silent, so the pills and the register don't jump on the first key.
 *
 * The number pops (the shared `answer-pop`) when it changes, and only then: it is tracked even while the line is
 * silent, so the first key pops it only if that key changed the count. It is a polite live region, so a screen reader
 * hears the count as he types.
 */
export function ResultLine({ searching, count }: { searching: boolean; count: number }) {
  /*------ Changed Since Mount ------*/
  // React's "adjust state while rendering" pattern, so the pop starts in the same paint as the new number.
  const [shown, setShown] = useState(count);
  const [changed, setChanged] = useState(false);
  if (count !== shown) {
    setShown(count);
    setChanged(true);
  }

  return (
    <output className="block min-h-5 text-sm leading-5 text-muted-foreground">
      {searching &&
        (count === 0 ? (
          // The register's empty plate says it on screen; the live region still tells a screen reader.
          <span className="sr-only">سگی پیدا نشد</span>
        ) : (
          <>
            <span
              key={count}
              className={cn(
                "inline-block font-bold text-foreground tabular-nums [--pop-origin:50%_60%]",
                changed && "answer-pop",
              )}
            >
              {formatNumberFa(count)}
            </span>{" "}
            سگ پیدا شد
          </>
        ))}
    </output>
  );
}
