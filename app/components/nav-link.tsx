import type { AnyRouter, LinkComponentProps, RegisteredRouter } from "@tanstack/react-router";

import { Link } from "~/components/link";

/*===== Nav Link =====*/
type NavLinkOwnProps = {
  /** Active only on this exact path, not on the pages below it (React Router's `end`). `/` is always exact. */
  end?: boolean;
  /** A class, or a function of whether the link is the current page. */
  className?: string | ((state: { isActive: boolean }) => string);
};

/**
 * `~/components/link` for navigation: the current page's link gets `aria-current="page"` (and `data-status="active"`),
 * which the nav styles key on, and `className` may be a function of `isActive`. Same types and defaults as `Link`.
 */
export function NavLink<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string = string,
  const TTo extends string | undefined = undefined,
  const TMaskFrom extends string = TFrom,
  const TMaskTo extends string = "",
>({
  end,
  className,
  activeOptions,
  ...props
}: Omit<LinkComponentProps<"a", TRouter, TFrom, TTo, TMaskFrom, TMaskTo>, "className"> & NavLinkOwnProps) {
  const classes =
    typeof className === "function"
      ? {
          activeProps: { className: className({ isActive: true }) },
          inactiveProps: { className: className({ isActive: false }) },
        }
      : { className };

  return (
    // The generic props can't be checked against `Link`'s own generics here; the call site was checked above.
    <Link {...(props as LinkComponentProps<"a">)} {...classes} activeOptions={{ exact: end, ...activeOptions }} />
  );
}
