# Why We're Moving to TanStack Start

This repo is moving from React Router v8 (Framework Mode) to TanStack Start. The reason is data loading: in React
Router a page's data can't be prepared ahead of a click and then reused, while in TanStack Start that's the default.
This doc explains the problem, what we tried inside React Router, and why TanStack Start's model fits an app whose data
layer is already oRPC + TanStack Query.

The project-independent version, for other repos, is
[`tanstack-start-vs-react-router-data.md`](./tanstack-start-vs-react-router-data.md). The migration steps for this repo
are in [`tanstack-start-migration-plan.md`](./tanstack-start-migration-plan.md).

## The Short Version

- In React Router, a `loader` always runs on the server. Every navigation fetches `/<page>.data` and runs the loaders
  again. Nothing on the client keeps loader data between visits.
- React Router's `<Link prefetch>` only adds `<link>` tags. The page's **code** is preloaded and reused. Its **data** is
  downloaded through the browser's HTTP cache, which only reuses it when the response has `Cache-Control` headers.
  Without them the browser throws the prefetched data away and the click fetches it again, so every prefetched page
  costs one loader run for nothing. With them, data can be stale after a form submit.
- TanStack Router (which Start is built on) runs the target route's loader when it preloads, keeps the result in an
  in-memory cache, and uses it on the click. Freshness is an explicit, per-query setting, and mutations invalidate the
  cache. With TanStack Query in the loaders, prefetched data lands in the same Query cache the components read.

## How React Router Loads Data

| What                          | Where it runs | When                                                       |
| ----------------------------- | ------------- | ---------------------------------------------------------- |
| `loader`                      | Server only   | First visit (inside the HTML), then every navigation       |
| `clientLoader`                | Browser only  | Navigations; on the first visit only with `hydrate = true` |
| `clientLoader.hydrate = true` | Browser       | Also on hydration; the server renders `HydrateFallback`    |

Walkthrough with pages A and B:

1. Open A by URL: the server runs A's `loader` and puts the data in the HTML.
2. Click to B: the browser requests `/B.data`; the server runs B's `loader`. A's data is dropped.
3. Go back to A: the browser requests `/A.data` again and the server runs A's `loader` again. Nothing is reused.

That's always fresh, but every navigation waits for a server round trip.

## React Router's Prefetch and Why It Doesn't Cover Data

`<Link prefetch="intent" | "viewport" | "render">` renders `<PrefetchPageLinks>`, which adds tags next to the link:

| Part of the page | Tag                                          | Where it's kept                                     |
| ---------------- | -------------------------------------------- | --------------------------------------------------- |
| Route JS         | `<link rel="modulepreload">`                 | Compiled in memory for the page; reused             |
| Route CSS        | `<link rel="prefetch" as="style">`           | HTTP cache (built assets are `immutable`); reused   |
| Loader data      | `<link rel="prefetch" as="fetch">` (`.data`) | HTTP cache; reused only with `Cache-Control` header |

Nothing is rendered and no route code runs; the browser only downloads files. What we measured in this repo
(production build, Chromium):

- JS and CSS were reused: clicking a prefetched link needed no new JS.
- The `.data` response was fetched twice: once by the prefetch, once by the click. Our `.data` responses carry no
  `Cache-Control`, so the browser can't reuse the prefetched copy. A known issue, see
  [Fix double data request when prefetching in Remix](https://collectednotes.com/sergiodxa/fix-double-data-request-when-prefetching-in-remix).
- Routes with a `clientLoader` are left out of the data prefetch entirely (`hasClientLoader` in
  `PrefetchPageLinksImpl`), and a `<link>` can't run a `clientLoader`, so prefetch never fills a client cache.
- `<PrefetchPageLinks>` used directly behaves the same; there's no option for code-only.
- With lazy route discovery (the default), links rendered right after a client navigation prefetched before their route
  was known, matched the `*` route, and preloaded the 404 page's code. `routeDiscovery: { mode: "initial" }` fixes it.

### What we considered inside React Router

| Option                                                                                                 | Why not                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cache-Control` on `.data` responses                                                                   | React Router re-fetches the same `.data` URL after a form submit. A cached response shows old data (e.g. a cart that doesn't update).                                                                           |
| Cache only prefetch responses (`Sec-Purpose: prefetch` → `private, max-age=10` in `handleDataRequest`) | Narrows the window but doesn't close it: any request for that URL within `max-age` gets the cached copy, including a click right after a mutation.                                                              |
| Custom code-only prefetch (preload route modules from the manifest)                                    | Works, but re-implements prefetching on `UNSAFE_FrameworkContext` / `UNSAFE_DataRouterContext`, which can break on any upgrade.                                                                                 |
| `clientLoader` + TanStack Query (`ensureQueryData`)                                                    | Prefetch never runs it, so data still isn't prefetched. Needs custom wiring (`useFetcher().load()` on viewport), a `clientLoader` per route, a browser-wide `QueryClient`, and invalidation for every mutation. |

### What ships now (until the migration)

Native `prefetch="viewport"` (storefront, account) and `"intent"` (Admin) through the `Link`/`NavLink` wrappers, with
`routeDiscovery: { mode: "initial" }`. Code is ready before the click; data is fetched fresh on the click; each visible
link costs one wasted loader run. See `app/hooks/use-default-prefetch.ts`.

## How TanStack Start Loads Data

Sources: [Preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading),
[Data Loading](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading).

- **Isomorphic loaders.** A route's `loader` runs on the server for the first request (SSR) and in the browser for
  navigations and preloads. Server-only work (database, secrets, session) sits behind an RPC: a `createServerFn`, or
  in this repo, an oRPC procedure. The loader code itself must be safe to run in the browser.
- **Preloading runs the loader.** `defaultPreload: "intent" | "viewport" | "render"` loads the route's chunk, runs
  `beforeLoad` and `loader`, and caches the result. A click while the preload is fresh uses it; a click while it's in
  flight joins it instead of starting a second request.
- **An in-memory cache with explicit freshness.** `staleTime` (default `0`: show cached, revalidate in the background),
  `preloadStaleTime` (default 30 s), `gcTime` / `preloadGcTime` (default 5 min). `router.invalidate()` marks data
  stale after a mutation.
- **TanStack Query as the cache.** Loaders call `queryClient.ensureQueryData(...)`, components read with
  `useSuspenseQuery`. The docs recommend `defaultPreloadStaleTime: 0` so the router always calls the loader and Query's
  `staleTime` decides. `@tanstack/react-router-ssr-query` moves the server's Query cache to the browser on the first
  visit, so nothing is fetched twice at hydration.

The A → B → A walkthrough in TanStack Start: A's data is in the Query cache from the first visit. Hovering or seeing the
link to A on page B preloads it again if it's stale. The click renders immediately from the cache; if the data is past
its `staleTime`, Query refetches in the background and the page updates.

## Why It's Better for This App

- **Prefetching includes data.** The click after a preload doesn't wait on the server at all, which is the whole point
  of prefetching. React Router only gets there with HTTP cache headers, which we can't use safely.
- **Freshness becomes a decision per query, not a side effect.** A visitor's own changes show at once through key
  invalidation; changes made by someone else follow a `staleTime` (5 min by default, 30 s where they should show fast).
  React Router only offers "always refetch" or "trust the HTTP cache".
- **One cache instead of two.** Today pages read loader data, writes go through oRPC's `useMutation`, and then
  `useRevalidator().revalidate()` re-runs every loader on the page (18 files do this). In Start, loaders fill the Query
  cache, and a mutation invalidates just the keys it changed.
- **Our data layer already matches.** Procedures live in oRPC with auth middleware, and no page uses a React Router
  action (the 4 actions in the app are resource routes: Better Auth, oRPC, video upload/delete). Loaders mostly call
  `createServerClient(request).<procedure>()`, which maps directly to an isomorphic oRPC client.
- **Type-safe routing and search params.** Typed `to`/`params`/`search` on every link, and `validateSearch` per route.

## What It Costs

- **Loaders must be browser-safe.** Any loader importing `*.server` code (session, env, DB, storage) needs that work
  moved behind a procedure or server function first.
- **Page guards move.** React Router route middleware (`requireSession`) becomes `beforeLoad` + `redirect()`. The
  security boundary (oRPC's `requireUserMiddleware` / `requireRoleMiddleware`) doesn't change.
- **Invalidation discipline.** A cache means every mutation must invalidate the queries it affects. Forgetting one
  shows stale data until its `staleTime` runs out.
- **Route definitions change shape.** Even with a code-based route config (virtual file routes), each route file uses
  `createFileRoute(...)`, path params are `$slug` not `:slug`, and the catch-all is `$`.
- **Search params.** nuqs's TanStack Router adapter doesn't cover Start yet, so URL state moves to TanStack Router's
  own typed search params.
- **A young framework.** Start reached v1 recently. Blog posts written against the beta and RC use renamed APIs (for
  example `.inputValidator()`, which v1 renamed back to `.validator()`); follow the current docs.

## Rules for Agents After the Migration

- Read data in loaders through oRPC's `queryOptions()` with `queryClient.ensureQueryData`; read it in components with
  `useSuspenseQuery` on the same options. Don't fetch in components with ad-hoc keys.
- Never import server-only modules into a route file's loader or component; put that work in an oRPC procedure.
- Every mutation invalidates the query keys it changes (oRPC's `.key()` helpers), or calls `router.invalidate()`.
- Follow the freshness policy in the migration plan (decision 2): a visitor's own changes reach the screen through
  key invalidation; `staleTime` only covers changes made by someone else (5 min by default, 30 s for the queries where
  the other side's changes should show fast).
- `useQuery` doesn't run during SSR; page data uses `useSuspenseQuery` or `Route.useLoaderData()`.
