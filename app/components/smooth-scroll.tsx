import { ReactLenis } from "lenis/react";

/*===== Scroll Lock Check =====*/
/**
 * True while a modal (dialog, sheet, drawer) has locked the page. Base UI locks it by setting `overflow: hidden` on
 * `<body>` or `<html>`, whichever owns the viewport scroll. Lenis's own `autoToggle` only watches `<html>`, and it
 * scrolls the window programmatically, which `overflow: hidden` doesn't stop, so the page behind a modal would move.
 */
function isPageScrollLocked() {
  return hasLockedOverflow(document.documentElement) || hasLockedOverflow(document.body);
}

function hasLockedOverflow(element: Element) {
  return /hidden|clip/.test(getComputedStyle(element).overflowY);
}

/*===== Smooth Scroll =====*/
/**
 * Eases mouse-wheel scrolling of the page (the "silk" feel in docs/app-identity.md). Touch keeps the device's native
 * scrolling, and Lenis turns smoothing off by itself for `prefers-reduced-motion`.
 *
 * Inner scroll areas (popovers, selects, tables, sheets) scroll natively through `allowNestedScroll`. Mark an element
 * with `data-lenis-prevent` if it still scrolls the page instead of itself.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        // Lower is softer. 0.1 (the default) feels sluggish on long product pages.
        lerp: 0.12,
        allowNestedScroll: true,
        // A link click mid-glide would otherwise keep easing on the next page.
        stopInertiaOnNavigate: true,
        // Hand locked-page wheel events back to the browser, which won't scroll an `overflow: hidden` page.
        virtualScroll: () => !isPageScrollLocked(),
      }}
    >
      {children}
    </ReactLenis>
  );
}
