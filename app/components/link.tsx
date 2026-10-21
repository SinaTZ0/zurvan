// The one place allowed to import React Router's Link (see .oxlintrc.json).
import { type LinkProps, Link as RouterLink, useLocation, useResolvedPath } from "react-router";

import { useDefaultPrefetch } from "~/hooks/use-default-prefetch";
import { useDefaultViewTransition } from "~/hooks/use-default-view-transition";

/**
 * React Router's `Link` that fades the page when it navigates to another pathname. Pass `viewTransition` to override
 * the default. See docs/view-transitions.md. It also prefetches the target page by default (see `useDefaultPrefetch`);
 * pass `prefetch` to override.
 *
 * A hash link to the current page (`/#courses` on `/`) keeps the scroll position when React Router navigates, so the
 * smooth scroller (see `SmoothScroll`) can glide to the section; otherwise React Router's own instant jump would win.
 */
export function Link({
  to,
  relative,
  viewTransition,
  preventScrollReset,
  prefetch,
  reloadDocument,
  ...props
}: LinkProps & React.RefAttributes<HTMLAnchorElement>) {
  const { pathname } = useLocation();
  const target = useResolvedPath(to, { relative });
  const isSamePageHash = target.pathname === pathname && target.hash !== "";

  return (
    <RouterLink
      to={to}
      relative={relative}
      preventScrollReset={preventScrollReset ?? (isSamePageHash || undefined)}
      viewTransition={useDefaultViewTransition({ to, relative, viewTransition })}
      prefetch={useDefaultPrefetch({ to, relative, prefetch, reloadDocument })}
      reloadDocument={reloadDocument}
      {...props}
    />
  );
}
