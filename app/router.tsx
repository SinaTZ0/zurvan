import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "~/routeTree.gen";

/*===== Route Static Data =====*/
// What a page tells the shell around it, read with `useMatches()`.
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    /**
     * Drops the gap above the footer, for a page whose last band runs into it (the closing brick bands on the public
     * and account shells).
     */
    flushFooter?: boolean;
    /** Hides the account's floating tab bar on a focused step, so the step's own action bar has the screen's bottom. */
    hideBottomTabs?: boolean;
  }
}

/*===== Router =====*/
/**
 * A new router, and a new QueryClient, per call: Start calls this once per SSR request, so a module-level client would
 * share one visitor's cached data with the next.
 */
export function getRouter() {
  const queryClient = new QueryClient({
    // The freshness policy (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2): 5 minutes for changes
    // someone else makes; a visitor's own changes arrive through key invalidation.
    defaultOptions: { queries: { staleTime: 5 * 60_000 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Every page linked from what's on screen is loaded before it's clicked; `~/components/link` narrows this.
    defaultPreload: "viewport",
    // Query's staleTime decides whether a preload or a click fetches.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    // The page fade, for every navigation that changes the pathname, Back and Forward included (a link's own
    // `viewTransition` wins). Query-only and hash-only changes stay instant. Browsers without view transition types
    // fade every navigation that doesn't set its own. See docs/view-transitions.md.
    defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? [] : false) },
  });

  // Also provides the `QueryClientProvider`, and streams the queries a server render filled to the browser.
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
