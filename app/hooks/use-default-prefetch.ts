import { type PrefetchBehavior, type RelativeRoutingType, type To, useLocation, useResolvedPath } from "react-router";

type UseDefaultPrefetchOptions = {
  to: To;
  relative?: RelativeRoutingType;
  /** An explicit choice from the call site, which always wins over the default. */
  prefetch?: PrefetchBehavior;
  /** A full document load can't use what was prefetched. */
  reloadDocument?: boolean;
};

/**
 * Decides when a link prefetches its page, so the page's code is ready before the click.
 *
 * - Storefront and account: `viewport`, so every page linked from what's on screen is ready before it's clicked.
 * - Admin: `intent` (hover or focus). Its pages are long lists of links, and prefetching every visible row would fire
 *   a request per row.
 * - Links that stay on the current pathname (query or hash only, like filter pills) and `reloadDocument` links don't
 *   prefetch: there's no new code to load.
 *
 * React Router prefetches the loader data too, but the `.data` responses carry no cache headers, so the browser
 * doesn't reuse it: the click fetches the data again, which keeps it fresh. Only the JS and CSS are reused.
 *
 * @returns The `prefetch` value to pass to React Router's `Link` or `NavLink`.
 */
export function useDefaultPrefetch({ to, relative, prefetch, reloadDocument }: UseDefaultPrefetchOptions) {
  const { pathname: currentPathname } = useLocation();
  const { pathname: targetPathname } = useResolvedPath(to, { relative });

  if (prefetch) return prefetch;
  if (reloadDocument || targetPathname === currentPathname) return "none";
  const inAdmin = currentPathname === "/admin" || currentPathname.startsWith("/admin/");
  return inAdmin ? "intent" : "viewport";
}
