import { useEffect, type RefObject } from "react";

/*===== Constants =====*/
/** Where the preview column sticks: under the 64px header with a little air (`xl:top-24`). */
const STICKY_TOP_PX = 96;
/** The room it keeps under its end when it is taller than the window. */
const BOTTOM_GAP_PX = 24;
/** The two-column layout starts at `xl`. */
const TWO_COLUMNS = "(min-width: 80rem)";

/*===== Sticky Column =====*/
/**
 * Copied from the course form (slices never share). Keeps a sticky column usable when it is taller than the window. A plain `top` would pin its top under the header and
 * hide its end (the facts under the card) until the page ran out; instead, a tall column scrolls with the page
 * until its end is in view and sticks there. A column that fits keeps the class's `top`.
 *
 * It only writes the element's inline `top`, measured again whenever the column or the window changes size.
 */
export function useStickyColumn(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const twoColumns = window.matchMedia(TWO_COLUMNS);

    function update() {
      if (!element) return;
      const height = element.offsetHeight;
      const fits = height <= window.innerHeight - STICKY_TOP_PX - BOTTOM_GAP_PX;
      element.style.top = !twoColumns.matches || fits ? "" : `${window.innerHeight - height - BOTTOM_GAP_PX}px`;
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    twoColumns.addEventListener("change", update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      twoColumns.removeEventListener("change", update);
    };
  }, [ref]);
}
