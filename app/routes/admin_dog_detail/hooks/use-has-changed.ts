import { useState } from "react";

/*===== Has Changed =====*/
/**
 * Whether `value` has changed since the component mounted: false on the first render (the server's, then hydration),
 * true from the first render that brings a different value. The page has no load moment, so an answer motion keys off
 * this and never plays on load. The caller keys the animated element by the value, so every later change replays it.
 *
 * React's "adjust state while rendering" pattern: no effect, so the motion starts in the same paint as the new value.
 */
export function useHasChanged<T>(value: T): boolean {
  const [shown, setShown] = useState(value);
  const [changed, setChanged] = useState(false);
  if (!Object.is(value, shown)) {
    setShown(value);
    setChanged(true);
  }
  return changed;
}
