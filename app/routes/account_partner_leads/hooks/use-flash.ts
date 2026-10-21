import { useCallback, useEffect, useRef, useState } from "react";

/** How long the submit button says «ثبت شد» before its label goes back. */
const FLASH_MS = 2000;

/*===== Flash =====*/
/**
 * A short "it worked" moment: `flash()` turns `on` for two seconds. A new flash restarts the clock, and the timer is
 * cleared when the page changes, so a late timeout can't touch an unmounted form.
 */
export function useFlash() {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), FLASH_MS);
  }, []);

  return { on, flash };
}
