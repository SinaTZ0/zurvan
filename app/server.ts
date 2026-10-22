import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { persianOnlyRedirect } from "~/lib/i18n";
import { localeFromHeaders, LOCALE_STRATEGY } from "~/orpc/locale";
import { defineCustomServerStrategy } from "~/paraglide/runtime";
import { paraglideMiddleware } from "~/paraglide/server";

/*===== The API's Language =====*/
// `/rpc` requests take their language from the `x-locale` header the browser's client sends (the route strategy in
// `project.inlang/paraglide.config.ts`), so inside a procedure `getLocale()` is the page's language, as it is during a
// server render.
defineCustomServerStrategy(LOCALE_STRATEGY, {
  getLocale: (request) => (request ? localeFromHeaders(request.headers) : undefined),
});

/*===== Server Entry =====*/
// Start's own handler, wrapped by Paraglide's middleware, which gives every request its language (from the address)
// for the message functions on the server. The handler gets the original request: the router's `rewrite`
// (`app/router.tsx`) strips `/en` itself, so `getRequestUrl()` in `app/start.ts` still sees the address as typed.
export default createServerEntry({
  fetch(request) {
    /*------ Persian-only Pages ------*/
    // `/en/admin/...` and `/en/rules`, the pages without English, answer with their Persian address.
    const persian = persianOnlyRedirect(new URL(request.url));
    if (persian) return new Response(null, { status: 307, headers: { Location: persian } });

    return paraglideMiddleware(request, () => handler.fetch(request));
  },
});
