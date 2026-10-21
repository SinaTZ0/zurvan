import { useEffect, useRef, useState } from "react";

/*===== Use In View =====*/
/**
 * Flips to `true` once the element has come a fair way into the screen, and stays so. A one-off motion that should play
 * in time (not scrubbed by the scroll), such as the medals swinging when the band shows, hangs on it. Before the
 * browser runs the effect (the server render) it is `false`, so nothing waits on it to be visible.
 */
export function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView]);

  return { ref, inView };
}
