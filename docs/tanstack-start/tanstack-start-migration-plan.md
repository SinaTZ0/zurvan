# Migration Plan: React Router v8 → TanStack Start

How this repo moves from React Router v8 (Framework Mode) to TanStack Start v1. Why we're doing it is in
[`why-tanstack-start.md`](./why-tanstack-start.md). This plan was written on 2026-10-22 against `@tanstack/react-start`
1.169, `@tanstack/react-router-ssr-query` 1.167 and `@tanstack/virtual-file-routes` 1.162. Re-check the
[RC → v1 migration notes](https://tanstack.com/start/latest/docs/framework/react/migrate-from-release-candidate)
before starting; Start moves fast and blog posts lag behind it.

## Goal and Scope

- Same app, same URLs, same look, same behavior for visitors. No feature or design changes ride along.
- The data layer stays: oRPC procedures (contract, middleware, `requireUserMiddleware` / `requireRoleMiddleware`),
  Drizzle, Better Auth, TanStack Query, Jotai.
- What changes: the router, the route modules, how pages get data (TanStack Query in isomorphic loaders), page guards,
  search params, the server entry and build, and the docs that describe them.

## Where the Repo Stands (inventory, 2026-10-22)

| Area                     | Today                                                                                                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes (`app/routes.ts`) | 45 entries, 43 module files + `app/root.tsx`. Layouts: `layout_public` (pathless, 14 children), `account` (9), `admin` (13), plus `auth`.                                                                           |
| Resource routes          | 5: `api_auth` (Better Auth), `rpc` (oRPC handler), `api_evaluation_videos` (POST upload), `api_evaluation_video` (GET Range stream, HEAD, DELETE), `payment_callback` (gateway redirect).                           |
| Shared modules           | `account_dog_form` serves `dogs/new` + `dogs/:dogId/edit`; `admin_course_form` serves `courses/new` + `courses/:slug/edit` (custom route ids).                                                                      |
| Params                   | `*` (404), `api/auth/*`, `rpc/*`, optional `logbook/:fileNumber?`, dynamic `:slug`, `:number`, `:dogId`, `:id`.                                                                                                     |
| Route exports            | `loader` 40, `meta` 36, `ErrorBoundary` 30, `middleware` 10 (all `requireSession`), `handle` 8 (`flushFooter`), `headers` 3 (Cache-Control), `action` 4 (resource routes only). No `clientLoader`.                  |
| Loader data              | Arrives as `loaderData` via `Route.ComponentProps` (44 files import `./+types`). 28 loaders call `createServerClient(request)`.                                                                                     |
| Server-only in loaders   | `auth.server` (layout_public, course_detail, logbook, auth), `env.server` (auth, admin_sms, admin_partners, account_partner), `referral.server` (home, auth), `dog-file.server`, `certificate.server`, `qr.server`. |
| Refresh after writes     | `useMutation` (oRPC) then `useRevalidator().revalidate()` in 18 files (`app/hooks/use-admin-action.ts` for Admin). `invalidateQueries` in 4.                                                                        |
| Pending UI               | `useNavigation` in 12 files.                                                                                                                                                                                        |
| Search params            | nuqs (`nuqs/adapters/react-router/v8`, `shallow: false` globally) in 11 files, 10 `search-params.ts` definitions, `createLoader` in 2 loaders, `createSerializer` in 3.                                             |
| Navigation helpers       | `Link`/`NavLink` wrappers (119 + 6 importers) with view-transition and prefetch defaults; Lenis smooth scroll relies on `preventScrollReset` for same-page hashes.                                                  |
| Tooling                  | `react-router dev/build/typegen`, `react-router-serve` in Dockerfile and Playwright, Storybook filters `react-router*` Vite plugins, 1 story uses `createRoutesStub`, 6 Playwright smoke tests.                     |
| Versions                 | Vite 8 (Start requires ≥ 8), React 19.2, TanStack Query 5.104, Node 24, `"type": "module"`.                                                                                                                         |

## Decisions Before Starting

The owner decided all of these on 2026-10-22.

1. **Where the work happens (decided).** Everything happens on the `tanstack-start` branch, created from `main`,
   Phase A included. This is the owner's explicit exception to CLAUDE.md's "commit on `main`". Phase A commits still
   run on React Router. The B0 spike runs in a git worktree (`../zurvan-spike`) on its own branch,
   `tanstack-start-spike` (a second exception the owner approved), which stays unmerged until B1 decides whether to
   build on it. Nothing is merged into `main` or pushed until the owner says so.
2. **Freshness policy (decided).** Who made the change decides how it reaches the screen:
   - **Changes the visitor makes** (adds a dog, fills the cart, an Admin marks an enrollment done): the mutation
     invalidates the query keys it changed (`orpc.x.key()`), so the next render refetches. No `staleTime` is involved.
   - **Default `staleTime`: 5 minutes** (set on the `QueryClient`). It covers changes made by someone else, like a
     course the Admin adds: a visitor can see it up to 5 minutes late.
   - **30 seconds where the other side's changes should show fast** (an Admin's list of evaluation requests that
     customers add to; a customer's dog status that the Admin sets), set on those queries' options.
   - **Refetch on focus** stays on (Query's default). It only refetches data that's already stale, so it mostly helps
     the 30-second queries.
   - Router `defaultPreloadStaleTime: 0`, so Query's `staleTime` decides whether a preload or a click refetches.
3. **Search params (decided).** nuqs's TanStack Router adapter is "experimental and does not yet cover TanStack Start"
   ([nuqs docs](https://nuqs.dev/docs/adapters#tanstack-router)). **Decision:** replace nuqs with TanStack
   Router's own typed search params (`validateSearch` with Zod/Standard Schema, `Route.useSearch()`,
   `navigate({ search })`). Filters that are UI-only today (`shallow: true`) simply stay out of `loaderDeps`.
4. **Production server (decided).** The documented Node path is Nitro (`nitro/vite`, `node .output/server/index.mjs`),
   and Nitro v3 is still beta. The alternative is Start's own build output served by `srvx` (static client files + the
   server's `fetch` export); the docs only spell that out for Rsbuild. **Decision:** try Nitro in the B0 spike, fall
   back to `srvx` if the build or Docker image misbehaves. Result: see B0.
5. **Two refinements of Phase A (decided).**
   - **One `session.get` procedure** serves both A1 (the viewer on public pages) and A2 (page guards). It returns
     anonymous / unnamed / active and revokes a blocked account's sessions wherever it's read, so a blocked user is
     simply signed out everywhere.
   - **A public `site.config` procedure** (`{ origin, showcase }`) gives pages the values they used to read from
     `env.server` (the site origin for links, showcase mode), instead of adding those fields to each page's own
     procedure. Links and QR codes that need the origin (partner link, dog file card, certificate cards) are still built
     inside their own procedures.

## Phase A: Prepare on React Router (on `tanstack-start`)

Each step is a normal commit; the app keeps running on React Router. The goal is a codebase where every page loader is
"call procedures, shape the result", so Phase B is mostly mechanical.

### A1. Move server-only work out of page loaders

A TanStack loader runs in the browser on navigation, so it can't import `*.server` code. Move each into an oRPC
procedure (or into an existing procedure's output):

| Route                                    | Server-only use today                                   | Becomes                                                                   |
| ---------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `layout_public`                          | `auth.server` getSession for the header, `roleHomePath` | a `viewer` procedure (signed in?, role, name, role home)                  |
| `course_detail`, `logbook`               | `auth.server` to classify the viewer                    | the same `viewer` procedure                                               |
| `auth`                                   | `env.server`, `auth.server`, `referral.server`          | procedure for the page's config; referral cookie handled server-side (A3) |
| `home`                                   | `referral.server`                                       | A3                                                                        |
| `admin_sms`, `admin_partners`            | `env.server`                                            | the values the page needs, returned by the page's procedure               |
| `account_partner`                        | `env.server`, `qr.server`                               | procedure returns the link and QR data                                    |
| `account_dog_detail`, `admin_dog_detail` | `certificate.server`, `dog-file.server`                 | fields added to the dog-detail procedures                                 |

Also move the types that components import from `.server` files (`account_dog_detail/components/{certificates-section,
certificate-card,file-card}.tsx`, `account_partner/components/shop-card.tsx`) into shared, non-server modules. Start's
import protection denies `*.server.*` in the client build; whether a type-only import passes is unconfirmed.

**Done (2026-10-22).** The `viewer` became `session.get` (decision 5), which also replaced the getSession calls in
`course_detail`, `logbook` and `auth`; `site.config` gives `auth` showcase mode and `admin_sms` / `admin_partners` the
origin. `roleHomePath` moved to `app/lib/role-home.ts`, `Qr` and its schema to `app/lib/qr.ts`. `partner.getMine`,
`certificate.listMine`, `dog.get` and `dog.admin.get` return their link and QR (`app/lib/referral-card.server.ts`,
`certificate.server.ts`, `dog-file.server.ts`). Page loaders now import no `*.server` module except
`createServerClient`, `session-guard.server` and, until A3, `referral.server`. One behavior change: a blocked customer
on a course page reads as a visitor instead of hitting an error.

### A2. One session procedure for page guards

Add a procedure that returns the session state a guard needs (signed in, has a name, role, blocked) and revokes a
blocked account's sessions on the server. Make `requireSession` call it. In Phase B the same call moves into
`beforeLoad`, and the redirect logic is the only thing that changes.

**Done (2026-10-22).** `requireSession` asks `session.get` (from A1) and puts its `active` user (`SessionUser`: id,
role, first and last name, phone) in `sessionContext`, which no longer holds a Better-Auth session. The `.data` URL
normalization stays until B4.

### A3. Referral cookie without `createCookie`

`app/lib/referral.server.ts` uses React Router's `createCookie`, and `home`/`auth` set it with
`data(..., { headers: { "Set-Cookie" } })`. Rewrite it to plain cookie serialize/parse so it works with Start's
`setCookie` / `getCookie` (`@tanstack/react-start/server`) or a request middleware. Keep
`app/lib/auth.server.test.ts` passing.

**Done (2026-10-22).** `referral.server.ts` uses the `cookie` package: `referralCookie({ requestUrl, headers })`
returns `{ name, value, options }` (the shape of Start's `setCookie`), `serializeReferralCookie` makes the header for
React Router, and `readReferralCode` is synchronous. The value keeps `createCookie`'s encoding (the JSON string in
base64), so cookies already in browsers still read; a test checks that. The cookie is now set by a root `middleware`
in `app/root.tsx` on `/` and `/auth` (and their `.data` URLs), not in those loaders; the home page has no loader any
more. In B1 the middleware becomes a Start request middleware. Small difference: a signed-in person opening
`/auth?ref=…` now gets the cookie with the redirect (it was dropped before); signup ignores it for them.

### A4. Small cleanups that help both

- Fix the stale comment in `app/root.tsx` ("Loader data seeds most queries": nothing seeds queries today).
- `account_home/components/home-hero.tsx` reads `useRouteLoaderData("routes/layout_account/layout-account")`; pass the
  value down or read it from a query instead of a hardcoded route id.
- `certificate/components/certificate-hero.tsx` imports `../+types/certificate`; give it its own props type.

## Phase B: Switch to Start (branch `tanstack-start`; B0 in the `tanstack-start-spike` worktree)

### B0. Spike: prove the risky parts first

Scaffold Start next to the existing code with one public page, one guarded page, `/rpc/*` and `/api/auth/*`, then
answer these before converting anything else:

- [ ] `tanstackStart({ srcDirectory: "app", router: { virtualRouteConfig: "./app/routes.ts" } })` builds with our
      flat slices (the `router` key is in the Start plugin schema; the docs only show it for the plain router plugin).
- [ ] Production build runs in Docker (decision 4) behind Caddy.
- [ ] `notFound()` during SSR returns HTTP 404 (the e2e smoke test checks `/rules` → 404; unconfirmed in the docs).
- [ ] Import protection with our `*.server.ts` files, and the `.server` type-only imports if any remain.
- [ ] Lenis + hash links: Start scrolls to hashes itself (`defaultHashScrollIntoView`); make sure it doesn't fight
      Lenis.
- [ ] View transitions with `defaultViewTransition` / per-link `viewTransition`, and back/forward behavior compared
      with today's ([`view-transitions.md`](../view-transitions.md)).
- [ ] Preloaded data is used on click: one request per page, none at hydration.

### B1. App shell

- Packages: add `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-router-ssr-query`,
  `@tanstack/virtual-file-routes`, `@vitejs/plugin-react` (after `tanstackStart()` in `plugins`), and `nitro` if
  chosen. Remove `react-router`, `@react-router/{dev,node,serve}`, `isbot`.
- `app/router.tsx`: `getRouter()` creates the `QueryClient` per call, `createRouter({ routeTree, context: { queryClient },
defaultPreload: "viewport", defaultPreloadStaleTime: 0, scrollRestoration: true })`, and
  `setupRouterSsrQueryIntegration({ router, queryClient })`. The integration provides `QueryClientProvider`; drop
  ours from the root.
- `app/routes.ts`: rewrite with `@tanstack/virtual-file-routes` (`rootRoute`, `layout`, `route`, `index`) and the same
  files. Paths become `$slug`, `$dogId`, `$number`, `$id`; `logbook/{-$fileNumber}`; the 404 is a `$` splat.
- `__root` (from `app/root.tsx`): the `<html lang="fa" dir="rtl" className="dark">` shell with `<HeadContent />` and
  `<Scripts />`; providers Jotai → Direction → Tooltip → SmoothScroll + Toaster. `createRootRouteWithContext<{
queryClient: QueryClient }>()`. Root `errorComponent` / `notFoundComponent` render `RootErrorPage`.
- Server-function CSRF: if we add `app/start.ts` for global middleware, register `createCsrfMiddleware` ourselves.

### B2. Server routes

Each becomes `createFileRoute(...)({ server: { handlers } })`:

- `rpc/$` → `ANY`: `rpcHandler.handle(request, { prefix: "/rpc", context: { headers: request.headers } })`, 404 when
  unmatched.
- `api/auth/$` → `GET`/`POST`: Better Auth's `handler(request)`. Add `tanstackStartCookies()` (from
  `better-auth/tanstack-start`) as the last Better Auth plugin.
- `api/evaluation-videos` → `POST` upload; `api/evaluation-videos/$id` → `GET` (Range/206/416), `HEAD`, `DELETE`.
  They already return plain `Response`s; keep their `Cache-Control`.
- `payment/callback` → `GET` that redirects (a `Response` with `Location`, or `redirect()`).

### B3. One oRPC client for both sides

Replace `app/orpc/client.ts` + `app/orpc/server-client.server.ts` with the
[oRPC TanStack Start pattern](https://orpc.dev/docs/adapters/tanstack-start):

```ts
const getORPCClient = createIsomorphicFn()
  .server(() => createRouterClient(router, { context: async () => ({ headers: getRequestHeaders() }) }))
  .client((): RouterClient<typeof router> => createORPCClient(new RPCLink({ url: "/rpc" })));
```

The server branch shares one client across requests; per-request data must come through the `context` function (as
above), never module state. Keep `orpc = createTanstackQueryUtils(client)` for `queryOptions()` / `mutationOptions()`
/ `.key()`.

### B4. Page guards

`requireSession({ roles })` (10 route middlewares) becomes a `beforeLoad` on `layout_account`, `layout_admin` and the
8 guarded pages. It calls the A2 session procedure, then `throw redirect({ to: "/auth", search: { redirectTo } })`,
or redirects to the role's home. The `.data` URL normalization in `signInRedirect` goes away (`location.href` is the
real page). `sessionContext` becomes the object `beforeLoad` returns, which children read from `context`.

### B5. Pages

Convert per area, one commit per batch: storefront (14 + `auth`), account (9), Admin (13). For each route module:

| React Router                                                 | TanStack Start                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `export async function loader({ request, params })`          | `loader: ({ context, params, deps }) => context.queryClient.ensureQueryData(orpc.x.y.queryOptions(...))` |
| `loaderData` from `Route.ComponentProps`                     | `useSuspenseQuery(orpc.x.y.queryOptions(...))` (same options as the loader), or `Route.useLoaderData()`  |
| `meta`                                                       | `head: ({ loaderData }) => ({ meta: [...] })`                                                            |
| `ErrorBoundary` + `isRouteErrorResponse(404)`                | `errorComponent` + `notFoundComponent`                                                                   |
| `throw data(null, { status: 404 })`                          | `throw notFound()`                                                                                       |
| `redirect("/x")`                                             | `throw redirect({ to: "/x" })`                                                                           |
| `headers` (Cache-Control on `buy`, `certificate`, `logbook`) | route `headers` option (SSR response)                                                                    |
| `handle: { flushFooter }`                                    | `staticData` (typed via module augmentation), read with `useMatches()`                                   |
| `useRevalidator().revalidate()` after a mutation             | `queryClient.invalidateQueries({ queryKey: orpc.x.key() })` in the mutation's `onSuccess`                |
| `useNavigation().state`                                      | `useRouterState({ select: (s) => s.status === "pending" })`                                              |
| `useParams`, `useLocation`, `useNavigate`, `useMatches`      | the `@tanstack/react-router` equivalents (typed with `from`)                                             |
| `reloadDocument` retry links                                 | `<a href>` or `reloadDocument` on TanStack `Link`                                                        |
| one module, two route ids                                    | two thin route files importing a shared component and query options                                      |

`app/hooks/use-admin-action.ts` centralizes the Admin refresh, so most Admin pages change in one place.

### B6. Search params

Each `search-params.ts` becomes a schema for `validateSearch`; components use `Route.useSearch()` and
`navigate({ search: (prev) => ({ ...prev, page: 2 }) })`. Params that drive the loader go in `loaderDeps`; UI-only
filters don't, so changing them doesn't refetch (today's `shallow: true`). `createSerializer` links become typed
`<Link to search>`. `header-search.tsx` keeps a plain GET `<form action="/courses">` so it works before hydration.

### B7. Links, view transitions, prefetch

- `Link`/`NavLink` wrappers keep their rules on TanStack's `Link`: `preload` = `"viewport"` (storefront, account),
  `"intent"` (Admin), `false` for same-pathname and `reloadDocument` links; `viewTransition` only when the pathname
  changes; same-page hash links don't reset scroll (`resetScroll: false`) so Lenis can glide.
- Update `.oxlintrc.json`'s restricted import to `@tanstack/react-router`'s `Link`.
- Delete `app/hooks/use-default-prefetch.ts`'s React Router note; the "data isn't reused" caveat no longer applies.

### B8. Tooling and deploy

- `package.json` scripts: `dev: vite dev`, `build: vite build`, `start` per decision 4, `typecheck: tsc` (the route
  tree is generated by the plugin).
- `tsconfig.json`: drop `.react-router/types` from `include` and `rootDirs`; keep `~/*`. Don't enable
  `verbatimModuleSyntax` (the docs warn it can leak server bundles into the client).
- `.gitignore` / `.oxlintrc.json` ignores: `.react-router/`, `build/` → the generated route tree and `.output/`.
- Dockerfile: copy the new output, new `CMD`. `compose.yaml` comment about `react-router-serve` serving assets.
- Playwright `webServer` command. Storybook: filter Start's Vite plugins in `.storybook/main.ts`; replace the
  `createRoutesStub` decorator in `app/routes/rules/rules.stories.tsx` with a memory-history router.

### B9. Docs and agent instructions

- `CLAUDE.md`: the framework line and the "Route Module Slices (Framework Mode)" section (keep flat slices; describe
  `createFileRoute` options instead of route exports and `./+types`).
- `docs/frontend-guideline.md`, `docs/nuqs.md` (retire or rewrite as search params), `docs/view-transitions.md`,
  `docs/jotai.md`, `docs/media.md`, `docs/orpc.md`, `docs/mascot-page-playbook.md` (dev command),
  `docs/run-with-docker.fa.md` (log line), `README.md` (still the React Router template).
- `.agents/skills/react-router/` and `.agents/skills/orpc/references/react-router.md`: replace with TanStack Start
  equivalents (user's call).
- `docs/tanstack-start/why-tanstack-start.md`: move "What ships now" into history.

### B10. Verify, then merge

- `npm run lint`, `npm run typecheck`, `npm run build`, the Vitest suite once, and `npm run test:e2e` (adapt the 6
  smoke tests: sign-in redirect, `/rules` 404, `logbook` `no-store`, sign-up → cart → buy).
- Screenshots of every page at 390 and 1440, compared with `main`.
- By hand: sign in and out, blocked account, wrong-role redirects, cart → payment → callback, evaluation video upload
  and playback (Range), an Admin action refreshing its list, search filters and pagination, hash links on the home
  page, page fade, RTL.
- Network check: a preloaded page renders without a data request; nothing is fetched twice at hydration.
- Merge to `main`, deploy, and keep the previous image to roll back to.

## Watch Out For

- **Stale API names.** `.validator()` is current (`.inputValidator()` was the RC name; Better Auth's TanStack page
  still shows it). `getRouter()` not `createRouter` export; `getRequest` not `getWebRequest`; `nitro/vite` not
  `@tanstack/nitro-v2-vite-plugin`; server routes are `server.handlers` on `createFileRoute`.
- **Cookies.** `setResponseHeader("set-cookie", ...)` replaces every outgoing cookie; use `setCookie` or
  `appendResponseHeader`.
- **Per-request state.** Create the `QueryClient` inside `getRouter()`, and pass request headers to oRPC through its
  context function. A module-level client on the server leaks one user's data to another.
- **`useQuery` doesn't run during SSR.** Page data must use `useSuspenseQuery` (or `Route.useLoaderData()`), or the
  server renders an empty page.
