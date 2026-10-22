import { useState } from "react";

/*===== Use Changed =====*/
/**
 * Whether `key` has changed since the component mounted: false on the first render (the page opens still), true from
 * the first render with a different key on (the dogs read again after «پس گرفتن درخواست», say). The keyed parts that read
 * it remount on the change, so their one-shot `answer-*` animation plays then and only then.
 *
 * State adjusted during render, React's pattern for deriving from a changing prop (as the catalogue's list arrival).
 */
export function useChanged(key: string): boolean {
  const [seen, setSeen] = useState({ key, changed: false });
  if (seen.key !== key) {
    setSeen({ key, changed: true });
    return true;
  }
  return seen.changed;
}
