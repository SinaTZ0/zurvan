// The one place allowed to import TanStack Router's Link (see .oxlintrc.json).
import { type LinkComponent, Link as RouterLink, useLocation, useRouter } from "@tanstack/react-router";

/*===== Link =====*/
/**
 * TanStack Router's `Link`, fully typed (`to` is a route path, with `params`, `search` and `hash` as their own props),
 * with the site's defaults. Any prop the call site passes wins.
 *
 * - **Preload:** `viewport` on the storefront and account, so every page linked from what's on screen is ready before
 *   it's clicked, data included (the query cache keeps it for the click). Under `/admin` it is `intent` (hover or
 *   focus): its pages are long lists of links, and preloading every visible row would fire a request per row. Links
 *   that stay on the current pathname (query or hash only, like filter pills) and `reloadDocument` links don't preload.
 * - **Same-page hash links** (`hash="courses"` on the page that has it) neither reset the scroll nor jump to the
 *   element, so the smooth scroller (`SmoothScroll`) can glide there.
 * - **The page fade** is the router's default (`defaultViewTransition` in `app/router.tsx`): only when the pathname
 *   changes. See docs/view-transitions.md.
 */
export const Link: LinkComponent<"a"> = (props) => {
  const router = useRouter();
  const currentPathname = useLocation({ select: (location) => location.pathname });
  // Where the link goes, resolved the way the router will (params filled in, relative paths resolved).
  const target = router.buildLocation(props as Parameters<typeof router.buildLocation>[0]);
  const samePathname = target.pathname === currentPathname;
  const samePageHash = samePathname && target.hash !== "";
  const inAdmin = currentPathname === "/admin" || currentPathname.startsWith("/admin/");

  return (
    <RouterLink
      preload={props.reloadDocument || samePathname ? false : inAdmin ? "intent" : "viewport"}
      resetScroll={samePageHash ? false : undefined}
      hashScrollIntoView={samePageHash ? false : undefined}
      {...props}
    />
  );
};
