import { useEffect, useRef, useState } from "react";

const DURATION_MS = 300;

/**
 * An amount that counts to its new value in 300 ms when `target` changes (the total of a receipt, when a discount or
 * the wallet takes a line off). Reduced motion, and the first render, show the value as it is. Always ends exactly on
 * `target`: the number on screen is the number that moves.
 */
export function useCountingAmount(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = reduced ? 1 : Math.min((now - start) / DURATION_MS, 1);
      // Ease-out, close to the page's `ease-silk`.
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = progress === 1 ? target : Math.round(from + (target - from) * eased);
      shownRef.current = value;
      setShown(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}
