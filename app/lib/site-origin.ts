import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { env } from "~/env.server";
import { resolvePublicOrigin } from "~/lib/public-origin";

/*===== Site Origin =====*/
/**
 * The site's public origin (`https://…`), for the absolute addresses a page's `<head>` names (canonical, `hreflang`,
 * `og:url`). On the server it is the configured one (`BETTER_AUTH_URL`, or the IP address when that is how the visitor
 * came); in the browser, the page's own. Start's build drops the server branch, and the env import with it.
 */
export const siteOrigin = createIsomorphicFn()
  .server(() => resolvePublicOrigin(new Headers(getRequestHeaders()), env.BETTER_AUTH_URL, env.HTTP_IP))
  .client(() => window.location.origin);
