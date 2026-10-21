import { useEffect, useState } from "react";

/*===== Debounced =====*/
/**
 * `value` once it has stopped changing for `ms`. The tag engraves the name when the person pauses, not on every
 * keystroke, so the stamp lands once per word instead of flickering.
 */
export function useDebounced<T>({ value, ms }: { value: T; ms: number }): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);

  return settled;
}
