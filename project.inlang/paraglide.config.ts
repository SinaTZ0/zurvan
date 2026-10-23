/*===== Paraglide Compiler Options =====*/
// Read by both the Vite plugin (`vite.config.ts`) and the CLI (`npm run i18n:compile`, which typecheck and postinstall
// run), so the dev server, the build and a fresh clone compile the messages the same way. See
// docs/i18n/english-version-plan.md, "Phase 1 notes".
//
// The output structure is not set here: the Vite plugin writes one module per locale in dev and one per message in a
// build (for tree-shaking). The CLI passes `--output-structure locale-modules` (package.json) so a typecheck run beside
// a dev server writes the same files the server imports, instead of deleting `messages/fa.js` from under it.
export default {
  // Generated, never committed (gitignored): `~/paraglide/messages` and `~/paraglide/runtime`.
  outdir: "./app/paraglide",
  // The URL decides: Persian unprefixed, English under `/en`. Paraglide's default URL pattern does exactly that, so no
  // `urlPatterns` are listed. The cookie and the base locale only answer where the URL can't (the excluded paths
  // below). The pages that stay Persian under `/en` are not a URL pattern: they are redirected and never prefixed by
  // `app/lib/i18n.ts`.
  strategy: ["url", "cookie", "baseLocale"],
  routeStrategies: [
    // `/rpc` has no language in its address: the browser's oRPC link names the page's language in a header, which the
    // server entry's custom strategy reads (`app/server.ts`, `app/orpc/locale.ts`), so `m.server_…()` and the
    // formatters answer in the page's language inside a procedure, zod messages included.
    { match: "/rpc/:path(.*)?", strategy: ["custom-header", "baseLocale"] },
    // Auth, uploads, the gateway's callback and Start's server functions have no language in their address and word
    // no sentence for a page (the callback reads its own `?lang=`).
    { match: "/api/:path(.*)?", exclude: true },
    { match: "/payment/:path(.*)?", exclude: true },
    { match: "/_serverFn/:path(.*)?", exclude: true },
  ],
  // `/en`, never `/en/`, for the English home page (and no trailing slash anywhere, as the router writes them).
  trailingSlash: "never",
  // The generated modules are JavaScript with JSDoc types; declarations let `tsc` read them without `allowJs`.
  emitTsDeclarations: true,
  emitReadme: false,
};
