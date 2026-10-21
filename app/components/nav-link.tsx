// The one place allowed to import React Router's NavLink (see .oxlintrc.json).
import { type NavLinkProps, NavLink as RouterNavLink } from "react-router";

import { useDefaultPrefetch } from "~/hooks/use-default-prefetch";
import { useDefaultViewTransition } from "~/hooks/use-default-view-transition";

/**
 * React Router's `NavLink` that fades the page when it navigates to another pathname. Pass `viewTransition` to
 * override the default. The `isTransitioning` render-prop state works as usual. See docs/view-transitions.md. It also
 * prefetches the target page by default (see `useDefaultPrefetch`); pass `prefetch` to override.
 */
export function NavLink({
  to,
  relative,
  viewTransition,
  prefetch,
  reloadDocument,
  ...props
}: NavLinkProps & React.RefAttributes<HTMLAnchorElement>) {
  return (
    <RouterNavLink
      to={to}
      relative={relative}
      viewTransition={useDefaultViewTransition({ to, relative, viewTransition })}
      prefetch={useDefaultPrefetch({ to, relative, prefetch, reloadDocument })}
      reloadDocument={reloadDocument}
      {...props}
    />
  );
}
