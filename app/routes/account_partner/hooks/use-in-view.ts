import { useEffect, useRef, useState } from "react";

/*===== Use In View =====*/
/**
 * Plays a plate's entrance in time (not scrubbed by the scroll) once it has come a fair way into the screen. On mount
 * the element is marked `data-view="armed"` (page-motion.tsx hides what will arrive), and `data-view="seen"` once it
 * shows, which starts the entrance; `seen` also turns true for parts that only exist after that (a dog's bubble).
 *
 * The attribute is set on the element directly, not through React, so the server render (and a browser that never
 * runs the effect) has no attribute and shows the finished plate. Reduced motion hides nothing (the CSS is inside
 * `prefers-reduced-motion: no-preference`).
 */
export function useInView<T extends HTMLElement>({ threshold = 0.3 }: { threshold?: number } = {}) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.dataset.view = "armed";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        element.dataset.view = "seen";
        setSeen(true);
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, seen };
}
