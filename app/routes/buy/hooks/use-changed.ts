import { useState } from "react";

/*===== Use Changed =====*/
/**
 * Whether `key` has changed since it was first known: false on the first render (the page opens still), true from the
 * first render with a different key on (another dog picked, a course added). The keyed parts that read it remount on
 * the change, so their one-shot `answer-*` animation plays then and only then.
 *
 * A `null` key is "not known yet" (before hydration, when the browser-only cart still reads empty): the first real key
 * after it counts as the starting value, not as a change, so a cart read from storage doesn't pop on load.
 *
 * State adjusted during render, React's pattern for deriving from a changing prop (as the catalogue's list arrival).
 */
export function useChanged(key: string | null): boolean {
  const [seen, setSeen] = useState({ key, changed: false });
  if (seen.key !== key) {
    const changed = seen.key !== null && key !== null;
    setSeen({ key, changed });
    return changed;
  }
  return seen.changed;
}
