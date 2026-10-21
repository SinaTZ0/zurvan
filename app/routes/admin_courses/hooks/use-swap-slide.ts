import { useCallback, useLayoutEffect, useRef, useState } from "react";

/*===== Constants =====*/
/** The slide's length and curve: `ease-silk` from app.css, short enough that two quick moves don't queue up. */
const SLIDE_MS = 260;
const SLIDE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/*===== Types =====*/
type First = {
  /** Each row's top before the order changed, by key. Empty under reduced motion. */
  tops: Map<string, number>;
  lifted: string | null;
  focus: (() => void) | null;
};

/*===== Swap Slide =====*/
/**
 * The shelf's FLIP: when the order changes, every row that changed place slides from where it stood to where it now is,
 * instead of jumping.
 *
 * The caller calls `capture` right before it changes the order (a press on an arrow, or the order going back after a
 * failed write): it measures each row's top, and the layout effect that runs once the new order is in the DOM measures
 * again and plays the difference back as a `translateY` (Web Animations, transform only). `lifted` is the row he moved:
 * it is drawn above the other while they pass (`liftedKey`), so the two never read as text over text.
 *
 * The effect runs after every commit but does nothing unless a capture is waiting, so the caller must change the order
 * in the same update as `capture` (one event, batched). Under reduced motion nothing is measured or played: the rows
 * simply reorder.
 *
 * `focus` runs once the new order is in the DOM: React moves one of the two rows' nodes to swap them, and a moved node
 * loses focus, so the caller puts it back on the arrow he pressed.
 */
export function useSwapSlide() {
  const rowsRef = useRef(new Map<string, HTMLElement>());
  const firstRef = useRef<First | null>(null);
  const [liftedKey, setLiftedKey] = useState<string | null>(null);

  /*------ Row Refs ------*/
  /** A callback ref per row, by its key. */
  const rowRef = useCallback(
    (key: string) => (node: HTMLElement | null) => {
      if (node) rowsRef.current.set(key, node);
      else rowsRef.current.delete(key);
    },
    [],
  );

  /*------ First ------*/
  const capture = useCallback(({ lifted, focus }: { lifted: string | null; focus?: () => void }) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tops = new Map<string, number>();
    if (!reduced) for (const [key, node] of rowsRef.current) tops.set(key, node.getBoundingClientRect().top);
    firstRef.current = { tops, lifted: reduced ? null : lifted, focus: focus ?? null };
    setLiftedKey(reduced ? null : lifted);
  }, []);

  /*------ Last, Invert, Play ------*/
  // No dependency list: it has to see the commit that carries the new order, whatever changed with it.
  useLayoutEffect(() => {
    const first = firstRef.current;
    if (!first) return;
    firstRef.current = null;
    first.focus?.();

    const animations: Animation[] = [];
    for (const [key, node] of rowsRef.current) {
      const top = first.tops.get(key);
      if (top === undefined) continue;
      const delta = top - node.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) continue;
      animations.push(
        node.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], {
          duration: SLIDE_MS,
          easing: SLIDE_EASING,
        }),
      );
    }

    // The lift ends with the slide; a newer slide that started meanwhile keeps its own row lifted.
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() =>
      setLiftedKey((current) => (current === first.lifted ? null : current)),
    );
  });

  return { rowRef, capture, liftedKey };
}
