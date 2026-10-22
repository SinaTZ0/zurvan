// oxlint-disable eslint/no-underscore-dangle -- TanStack's own history state names (`__TSR_key`, `__TSR_index`).
import type { ParsedLocation } from "@tanstack/react-router";

/*===== Page Transition =====*/
// Which way a page change moves, for the slide in app.css (docs/view-transitions.md). The router asks once per
// navigation, after the loaders, with the page on screen (`fromLocation`) and the one about to render (`toLocation`).

type Direction = "forward" | "back" | "lateral";

/*------ History Pops ------*/
// The router's types callback can't tell Back/Forward from a link, so the popstate event is noted here: the entry it
// landed on (its key; a push or a replace makes a new key, so a stale note never matches a later link) and whether the
// browser already animated it (the iOS swipe back). A capture listener on window runs before the router's own.
let lastPop: { key: string | undefined; animatedByBrowser: boolean } | null = null;

if (typeof window !== "undefined") {
  window.addEventListener(
    "popstate",
    (event) => {
      const state = event.state as { __TSR_key?: string; key?: string } | null;
      lastPop = {
        key: state?.__TSR_key ?? state?.key,
        // Chrome and Safari only; elsewhere undefined, which counts as not animated.
        animatedByBrowser:
          (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition === true,
      };
    },
    { capture: true },
  );
}

/*------ Hierarchy ------*/
function segments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

/** True when `ancestor` is a strict path ancestor of `pathname` (`/` is everyone's, `/account` is `/account/dogs/1`'s). */
function isAncestor({ ancestor, pathname }: { ancestor: string; pathname: string }) {
  const up = segments(ancestor);
  const down = segments(pathname);
  return up.length < down.length && up.every((segment, i) => segment === down[i]);
}

/**
 * A link's direction from the URL tree: deeper is forward, up to an ancestor is back, anything else (a sibling, another
 * section, signing in or out) is lateral.
 */
function linkDirection({ from, to }: { from: string; to: string }): Direction {
  if (isAncestor({ ancestor: from, pathname: to })) return "forward";
  if (isAncestor({ ancestor: to, pathname: from })) return "back";
  return "lateral";
}

/*===== Router Option =====*/
/**
 * The `types` of the router's `defaultViewTransition`. A pathname change starts a transition typed `forward`, `back` or
 * neither (the plain fade); a search-only or hash-only change, and a Back the browser already animated, render in
 * place.
 *
 * - **Back/Forward** follow the history: an earlier entry is `back`, a later one `forward`, whatever the URLs.
 * - **Links and `navigate()`** follow the URL tree (`linkDirection`).
 */
export function pageTransitionTypes({
  fromLocation,
  toLocation,
  pathChanged,
}: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): Array<string> | false {
  const pop = lastPop;
  lastPop = null;
  if (!pathChanged || !fromLocation) return false;

  const isPop = pop !== null && pop.key !== undefined && pop.key === historyKey(toLocation);
  if (isPop && pop.animatedByBrowser) return false;

  const direction = isPop
    ? toLocation.state.__TSR_index < fromLocation.state.__TSR_index
      ? "back"
      : "forward"
    : linkDirection({ from: fromLocation.pathname, to: toLocation.pathname });
  return direction === "lateral" ? [] : [direction];
}

function historyKey(location: ParsedLocation) {
  return location.state.__TSR_key ?? location.state.key;
}
