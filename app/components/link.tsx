// The one place allowed to import React Router's Link (see .oxlintrc.json).
import { type LinkProps, Link as RouterLink } from "react-router";

import { useDefaultViewTransition } from "~/hooks/use-default-view-transition";

/**
 * React Router's `Link` that fades the page when it navigates to another pathname. Pass `viewTransition` to override
 * the default. See docs/view-transitions.md.
 */
export function Link({ to, relative, viewTransition, ...props }: LinkProps & React.RefAttributes<HTMLAnchorElement>) {
  return (
    <RouterLink
      to={to}
      relative={relative}
      viewTransition={useDefaultViewTransition({ to, relative, viewTransition })}
      {...props}
    />
  );
}
