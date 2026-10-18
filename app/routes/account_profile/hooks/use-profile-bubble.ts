import { useCallback, useEffect, useRef, useState } from "react";

/*===== Types =====*/
/** The card the person is working in; picks the dog's line. */
export type ProfileFocus = "name" | "sheba" | "password";

/** How long «ثبت شد!» stays before the dog goes back to the line for the card in focus. */
const CELEBRATION_MS = 2800;

/*===== Profile Bubble =====*/
/**
 * What the dog's bubble says: the line for the card the person is in, or «ثبت شد!» for a moment after a save. Focus
 * moving to another card cuts the celebration short, since the dog should answer where the person is now.
 */
export function useProfileBubble() {
  const [focus, setFocusState] = useState<ProfileFocus>("name");
  const [celebrating, setCelebrating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const focusRef = useRef<ProfileFocus>("name");

  const setFocus = useCallback((next: ProfileFocus) => {
    // Every field in a card reports focus; only a move to the other card ends the celebration.
    if (next === focusRef.current) return;
    focusRef.current = next;
    clearTimeout(timer.current);
    setCelebrating(false);
    setFocusState(next);
  }, []);

  const celebrate = useCallback(() => {
    clearTimeout(timer.current);
    setCelebrating(true);
    timer.current = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
  }, []);

  return { focus, celebrating, setFocus, celebrate };
}
