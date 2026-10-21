import { useState } from "react";

/*===== Use Changed =====*/
/**
 * True once `value` has changed since the component mounted, so an answer (a status that moved under a row or in the
 * drawer) can be stamped, and a first render never is. Derived during render, not in an effect, so the element that
 * carries the stamp has it on its very first frame. Key that element by the value so every later change replays it.
 */
export function useChanged<Value>(value: Value): boolean {
  const [shown, setShown] = useState(value);
  const [changed, setChanged] = useState(false);
  if (value !== shown) {
    setShown(value);
    setChanged(true);
  }
  return changed;
}
