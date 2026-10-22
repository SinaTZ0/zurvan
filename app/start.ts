import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";
import { getRequestHeaders, getRequestUrl, setCookie } from "@tanstack/react-start/server";

import { referralCookie } from "~/lib/referral.server";

/*===== Referral Code =====*/
// A partner's link opens the home page with `?ref=<code>`, and the sign-in page can carry it on. The cookie is set on
// the server's response to the page request itself, not in those pages' loaders: loaders also run in the browser.
const REFERRAL_LANDINGS = new Set(["/", "/auth"]);

const rememberReferral = createMiddleware().server(async ({ next }) => {
  const url = getRequestUrl();
  if (REFERRAL_LANDINGS.has(url.pathname)) {
    const cookie = referralCookie({ requestUrl: url.href, headers: getRequestHeaders() });
    // `setCookie` appends; setting the `set-cookie` header directly would drop Better Auth's cookies.
    if (cookie) setCookie(cookie.name, cookie.value, cookie.options);
  }
  return next();
});

/*===== Start =====*/
// A custom start.ts turns off Start's automatic CSRF check for server functions, so it is registered here. oRPC and
// Better Auth answer through server routes, which keep their own checks.
const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, rememberReferral],
}));
