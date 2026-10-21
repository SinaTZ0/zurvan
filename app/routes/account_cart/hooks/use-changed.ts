import { useState } from "react";

/*===== Use Changed =====*/
/**
 * Whether `key` has changed since the component mounted: false on the first render (the page opens still), true from
 * the first render with a different key on. The keyed parts that read it remount on the change, so their one-shot
 * `answer-*` animation plays then and only then (the Dashboard's hook, copied into the slice).
 */
export function useChanged(key: string): boolean {
  const [seen, setSeen] = useState({ key, changed: false });
  if (seen.key !== key) {
    setSeen({ key, changed: true });
    return true;
  }
  return seen.changed;
}
