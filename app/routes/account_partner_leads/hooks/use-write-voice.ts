import { useCallback, useEffect, useRef, useState } from "react";

/*===== Types =====*/
/** What the writing dog says: that he's listening (while the form has focus), or that the number went in. */
export type WriteLine = "listen" | "saved";

export type WriteVoice = {
  /** What he says now; null while he is quiet. */
  line: WriteLine | null;
  /** What he said last, kept while his bubble fades out; null until he first speaks, so nothing flashes on load. */
  last: WriteLine | null;
  /** Counts every new line, so the bubble is keyed by it and pops again. */
  take: number;
};

/** How long «ثبت شد!» stays before he goes back to listening (or quiet, if the form lost focus meanwhile). */
const SAVED_MS = 2800;

/*===== Write Voice =====*/
/**
 * When the form's dog speaks. He's quiet until the partner is in the form (the field or its button): then «بگو،
 * یادداشتش می‌کنم!»; leaving the form hushes him. A number that went in makes him say «ثبت شد!» once, whatever the
 * focus, then he goes back to listening if the cursor is still in the form (the form puts it back in the field).
 *
 * `enter` and `leave` are for the form wrapper's focus and blur; `leave` gets the element focus is moving to, so moving
 * between the field and the button changes nothing.
 */
export function useWriteVoice() {
  const [voice, setVoice] = useState<WriteVoice>({ line: null, last: null, take: 0 });
  // Read by the timer without waiting for a render; focus events come in bursts.
  const focused = useRef(false);
  const savedUntil = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  /*------ Speak ------*/
  const speak = useCallback((line: WriteLine | null) => {
    setVoice((current) =>
      current.line === line
        ? current
        : { line, last: line ?? current.last, take: line ? current.take + 1 : current.take },
    );
  }, []);

  /*------ Focus ------*/
  const enter = useCallback(() => {
    focused.current = true;
    // «ثبت شد!» keeps the word until its moment is over.
    if (Date.now() >= savedUntil.current) speak("listen");
  }, [speak]);

  const leave = useCallback(
    ({ to, within }: { to: Node | null; within: HTMLElement }) => {
      if (to && within.contains(to)) return;
      focused.current = false;
      if (Date.now() >= savedUntil.current) speak(null);
    },
    [speak],
  );

  /*------ Saved ------*/
  const celebrate = useCallback(() => {
    clearTimeout(timer.current);
    savedUntil.current = Date.now() + SAVED_MS;
    // A new take even if he was already saying it, so two numbers in a row pop twice.
    setVoice((current) => ({ line: "saved", last: "saved", take: current.take + 1 }));
    timer.current = setTimeout(() => speak(focused.current ? "listen" : null), SAVED_MS);
  }, [speak]);

  return { voice, enter, leave, celebrate };
}
