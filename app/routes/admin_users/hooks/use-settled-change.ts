import { useState } from "react";

/*===== Use Settled Change =====*/
/**
 * A value as the row last showed it, and how many times it has changed since the row mounted, so a change can be
 * answered on screen and a first render never is.
 *
 * While `hold` is true (the person's dialog is open over the row) a change waits: a renamed person stays open in the
 * dialog, and the answer would otherwise play under its backdrop. It lands the moment the dialog closes. Derived during
 * render, so the element that carries the answer has it on its very first frame; key that element by `changes`.
 */
export function useSettledChange<Value>({ value, hold }: { value: Value; hold: boolean }) {
  const [settled, setSettled] = useState({ shown: value, changes: 0 });
  if (!hold && value !== settled.shown) {
    const next = { shown: value, changes: settled.changes + 1 };
    setSettled(next);
    return next;
  }
  return settled;
}
