import { type RelativeRoutingType, type To, useLocation, useResolvedPath } from "react-router";

type UseDefaultViewTransitionOptions = {
  to: To;
  relative?: RelativeRoutingType;
  /** An explicit choice from the call site, which always wins over the default. */
  viewTransition?: boolean;
};

/**
 * Decides whether a link navigation runs inside a view transition (the page fade).
 *
 * By default only navigations that change the pathname fade. Links that change just the query or hash stay instant,
 * like nuqs updates. React Router also replays a transition on back/forward for every pair of pathnames that once
 * used one, so a single same-pathname fade (`/orders` → `/orders?page=2`) would make every later history step between
 * that page's nuqs entries fade too.
 *
 * @returns The `viewTransition` value to pass to React Router's `Link` or `NavLink`.
 */
export function useDefaultViewTransition({ to, relative, viewTransition }: UseDefaultViewTransitionOptions) {
  const { pathname: currentPathname } = useLocation();
  // Search-only ("?page=2") and hash-only ("#x") targets resolve to the current pathname.
  const { pathname: targetPathname } = useResolvedPath(to, { relative });

  return viewTransition ?? targetPathname !== currentPathname;
}
