import { useState } from "react";

/*===== Use Changed =====*/
/**
 * Whether `value` differs from what it was on the first render. A part that should answer a change (the evaluation's
 * status after «پس گرفتن درخواست», which refetches the page's queries) animates only then, never on the page's first load.
 */
export function useChanged<T>(value: T): boolean {
  const [first] = useState(value);
  return value !== first;
}
