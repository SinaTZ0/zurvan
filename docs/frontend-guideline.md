# Frontend Guideline (TanStack Start)

The frontend is organized by route. Each route slice owns everything that only it uses, and code moves to a shared
location only when a second consumer needs it. The UI is in Persian and right-to-left.

## Structure

```text
app/
  root.tsx                  # root route: document shell, global providers, last error and 404 screens
  router.tsx                # getRouter(): a QueryClient per request, router defaults, staticData types
  routes.ts                 # virtual route tree: maps URLs to the files in routes/
  routeTree.gen.ts          # generated from routes.ts by Start's Vite plugin (committed, not linted or formatted)
  start.ts                  # request middleware (referral cookie, CSRF check for server functions)
  app.css                   # global styles and theme tokens
  routes/
    <slice>/                # one flat folder per route
      <slice-name>.tsx      # route module: `export const Route = createFileRoute(...)({...})` and its page
      components/           # components used only by this route
      hooks/                # hooks used only by this route
      queries.ts            # query options shared by this route's loader and components
      search-params.ts      # this route's search-param schema
      atoms.ts              # Jotai atoms used only by this route
      schema.ts             # form schemas owned by this route
    rpc/rpc.ts              # a server route (`server: { handlers }`, no page); also api_auth/, payment_callback/, ...
  components/               # UI shared by multiple routes (including the Link and NavLink wrappers)
  hooks/                    # hooks shared by multiple routes
  atoms/                    # Jotai atoms shared by multiple routes
  lib/                      # shared helpers (browser-safe, or *.server.ts)
  orpc/client.ts            # the one typed API client, for loaders and components (see backend guideline)
```

Not every slice needs every file. Start with the route module alone and split it out as it grows.

## Route Slices

- **Flat, not nested.** URL hierarchy does not imply folder nesting: use `dashboard_user/`, never `dashboard/user/`.
  Nesting of layouts is expressed in `routes.ts` (`layout()`, and `route()` with children), not in the file tree.
- **Colocate.** The route module, its `Route` options (`beforeLoad`, `validateSearch`, `loaderDeps`, `loader`,
  `head`, `headers`, `staticData`, `errorComponent`, `notFoundComponent`), and its private components, hooks,
  queries, and schemas all live in its slice.
- **Promote only when shared.** Move code to `app/components/`, `app/hooks/`, or `app/lib/` only when multiple routes
  use it or it clearly belongs to a broader domain. Never import from another route's slice; promote instead.
- **Types come from the route.** `createFileRoute("<id>")` types the route's params, search, context, and loader data,
  and the generated tree types every link. Don't hand-write them. The id string (`"/_public/courses/$slug"`,
  `"/account/dogs/$dogId/edit"`) is written by the generator; keep it exactly.
- **One page under two URLs** is two thin route files over a shared module in the same slice
  (`account_dog_form/account-dog-new.tsx` and `account-dog-edit.tsx` over `account-dog-form.tsx`). Each file has its
  own guard, loader, and title.

## Route Module

```tsx
export const Route = createFileRoute("/_public/courses/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const course = await orNotFound(
      queryClient.ensureQueryData(orpc.course.get.queryOptions({ input: { slug: params.slug } })),
    );
    return { title: course.title, summary: course.summary };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.title} | آموزش K9` }] : [{ title: "دوره پیدا نشد | آموزش K9" }],
  }),
  staticData: { flushFooter: true },
  component: CourseDetailPage,
  notFoundComponent: () => <CourseError missing />,
  errorComponent: () => <CourseError missing={false} />,
});

/*===== Page =====*/
function CourseDetailPage() {
  const { slug } = Route.useParams();
  const { data: course } = useSuspenseQuery(orpc.course.get.queryOptions({ input: { slug } }));
  // ...
}
```

- **No `export default`.** The page is a plain function in the file, passed as `component`.
- **`head`** sets the title and description. `loaderData` is undefined when the loader threw (a 404 or an error), so
  keep a fallback title.
- **`headers`** sets the server response's headers. Pages that show someone's own data send `Cache-Control: no-store`
  (`buy`, `logbook`, `certificate`).
- **`staticData`** is what a page tells the shell around it: `flushFooter` and `hideBottomTabs`, declared in
  `app/router.tsx`. The layouts read it with `useMatches()`.
- **Errors.** `notFoundComponent` is the 404 look and `errorComponent` the failure look, both rendered inside the
  shell so the header and a way on stay on screen. The root's are the last resort. A retry is a plain `<a href>` to
  the current URL, so the server renders the page again from scratch.

## Data and the Server Boundary

- **Loaders ensure, components read.** The loader calls `context.queryClient.ensureQueryData(...)` for every procedure
  the page shows, in parallel with `Promise.all`. The component reads the same data with `useSuspenseQuery` and the
  **same** query options. The server render is then complete, the browser takes over the cache without refetching,
  and invalidating a key after a mutation refreshes the screen. Keep the options in one helper (`queries.ts` or the
  top of the module) so the loader and the component can't drift.
- **The loader returns only what `head` needs** (or a derived flag). Data that can change after a mutation is read
  from the query, never through `Route.useLoaderData()`.
- **Conditional reads** (only for a customer, only when something exists) are ensured in the loader under the same
  condition and read with `useQuery({ ...options, enabled })` (see `course_detail`). `useQuery` doesn't run during the
  server render, so anything the page must render on the server is a suspense read.
- **Loaders run on both sides:** on the server for the first request, and in the browser on navigations and
  preloads. Never import a `*.server.ts` module at runtime from a route module or component; Start's import
  protection fails the build if you do. `import type` is fine.
- **One API client.** `~/orpc/client` calls procedures in-process on the server and over HTTP in the browser. Never
  call the API with a hand-written `fetch`. `orNotFound(...)` (`~/lib/not-found`) turns a procedure's `NOT_FOUND`
  into the router's `notFound()`, which renders `notFoundComponent` with a real 404 status.
- The frontend may import browser-safe backend files (contracts, `constants.ts`, `*.errors.ts`) for types and shared
  option values, never services, repositories, or `*.server.ts` files.

### Freshness

Who made a change decides how it reaches the screen (decision 2 in
[`tanstack-start-migration-plan.md`](./tanstack-start/tanstack-start-migration-plan.md)):

- **The visitor's own changes** invalidate the keys they changed, in the mutation's `onSuccess`:
  `queryClient.invalidateQueries({ queryKey: orpc.<domain>.key() })` for each domain the change touches. Admin
  buttons go through `useAdminAction` (`~/hooks/use-admin-action`), which invalidates every API query (`orpc.key()`),
  since an Admin action can change any count on screen.
- **Someone else's changes** arrive within the default `staleTime` of 5 minutes (set in `app/router.tsx`). The
  queries where the other side's changes should show fast pass `staleTime: 30_000` in their options: the Admin's
  evaluation requests and a customer's dog status. Refetch on window focus stays on and refreshes stale queries.
- **Session changes** (signing in or out, giving a name) call `await refreshSession(queryClient)`
  (`~/lib/session-guard`) before navigating on, or the next guard sees the cached answer.

## Guards

- A guarded layout or page has a `beforeLoad` that calls `requireSession` with the roles it lets in:

  ```ts
  beforeLoad: ({ context, location }) =>
    requireSession({ queryClient: context.queryClient, location, roles: ["customer", "partner"] }),
  ```

  It sends a signed-out visitor to `/auth?redirectTo=<this page>` and a wrong role to that role's home.

- What it returns (`{ user }`) lands in the route context. The layout and the pages below read it with
  `Route.useRouteContext()`, or `useRouteContext({ from: "/account" })` in a component, instead of asking again.
- A page narrower than its layout (the partner's pages under `/account`) adds its own `beforeLoad`.
- The page guard is never the only check: every oRPC procedure checks the role again.

## State

- Server data belongs to TanStack Query, filled by the loaders. Shareable view state belongs in URL search params,
  and form input belongs to the form.
- Local state uses `useState` and props. Use Jotai only for client state shared across distant parts of the tree.
- See [`jotai.md`](./jotai.md) for how to define, place, and use atoms.
- URL state goes through the router's typed search params, with one schema per route (`validateSearch`). See
  [`search-params.md`](./search-params.md).

## Navigation

- Import `Link` from `~/components/link` and `NavLink` from `~/components/nav-link`, not from
  `@tanstack/react-router`; a lint rule blocks the direct import. See [`view-transitions.md`](./view-transitions.md).
- **Links are typed.** `to` is a route path, with `params`, `search`, and `hash` as their own props:
  `to="/courses/$slug" params={{ slug }}`, `to="/help" hash="faq"`, `to="/courses" search={{ q }}`. A typo, a missing
  param, or a wrong search value is a compile error. The same goes for `navigate()` and `redirect()`.
- **Link data in lists and props** (menus, tabs, cards) keeps the check: build it with `linkOptions(...)` from
  `@tanstack/react-router`, or type a param-free path as `StaticRoutePath` (`~/lib/route-path`). A plain `string`
  would pass unchecked.
- External links, `tel:`, `mailto:`, and downloads stay plain `<a href>`.
- **Preload.** The `Link` wrapper preloads on `viewport` on the storefront and account pages and on `intent` in the
  Admin area; links that keep the current pathname or reload the document don't preload. A preload runs the target's
  `beforeLoad` and loader, and the query cache keeps the data, so the click usually renders with no request. Pass
  `preload` to override one link.
- **The page fade** is the router's default for every navigation that changes the pathname, Back and Forward
  included. There is nothing to pass.
- **Pending UI.** For a navigation that waits on a loader, read
  `useRouterState({ select: (state) => state.status === "pending" })`, and scope it to the current pathname when only
  a change to this page should dim it (see `course_catalogue`).

## Forms

- Each form has its own schema in its route's `schema.ts`, written for user experience (messages, when to validate).
  Do not derive it from backend validation, even when the rules currently match; update both explicitly when a
  requirement changes.
- Forms submit through an oRPC mutation, then invalidate what changed (see Freshness).
- Shared option lists (select values, limits) are imported from the feature's browser-safe constants.
- The server is the final authority. Show its per-field messages next to the matching field and its general errors in
  a form-level message.
- Disable submission while pending and keep the user's input after a failure.

## Components

- One component per file. File names are kebab-case; component names are PascalCase.
- Components receive data through props. Reading queries and running mutations belong to the route module or its
  hooks, which keeps components easy to reuse and preview.
- Shared components are documented with Storybook stories. Stories are maintained UI documentation; keep them in sync
  with the component. A story whose component renders links needs a router: render it as the only route of an
  in-memory router (`app/routes/rules/rules.stories.tsx`).
- Handle every state a user can see: loading, empty, error, and success.

## Persian, RTL, and Accessibility

- The document is `lang="fa"` and `dir="rtl"`. All user-facing text is Persian; code identifiers and developer
  diagnostics stay in English.
- Use logical directions, never physical ones: Tailwind `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`
  instead of `ml-`, `pl-`, `left-`, `text-left`. Mirror directional icons.
- Format numbers and dates with `Intl` and the `fa-IR` locale. Inputs that accept numbers must accept Persian and
  Arabic digits.
- Use semantic elements and native controls first. Every input has a label, every action is keyboard-reachable, and
  errors are announced to assistive technology.

## Styling

- Style with Tailwind utilities. Put design tokens (colors, fonts, spacing scale) in `app.css` instead of hard-coding
  values in components.
- Extract a component when a pattern repeats, not a utility class.
- The look (colour, surface layers, elevation, type, motion) is defined by the tokens in `app/app.css`; design new
  pages with [`design-flow.md`](./design-flow.md) and the `frontend-design` skill. Every page follows
  [`storefront-design.md`](./storefront-design.md), which records what the home page settled. Pages still in the old
  look are listed in [`legacy-pages.md`](./legacy-pages.md): read it before changing one.
- `font-display` (Estedad, heavy) is for the hero headline and section titles, `font-hand` (Marhey) for the dog's
  speech bubbles only. Everything else is Vazirmatn. Gold is flat: see the storefront doc for where it goes.
- Storefront headings and section spacing use the fluid `clamp()` tokens (`text-h1`, `px-site`, `py-section-md`,
  `site-container`). Component internals and dashboards use Tailwind's static scale.
- Animate only `transform` and `opacity`, and put movement behind `motion-safe:`. Bare `transition` utilities already
  use the app's easing and duration.
- Page scrolling is eased by Lenis (`~/components/smooth-scroll`). Inner scroll areas scroll natively; if one scrolls
  the page instead, add `data-lenis-prevent` to it. Scroll the page with `useLenis()` from `lenis/react`, not
  `window.scrollTo`, so the two don't fight.

## Testing

- Cover consequential user flows (forms, critical navigation) with Playwright smoke tests.
- Do not test styling, markup structure, or library behavior. Use Storybook for visual and accessibility review.

## Adding a Route

1. **Register** the route in `routes.ts` and create its flat slice folder and module. The dev server (or a build)
   regenerates `routeTree.gen.ts` and writes the route's id into `createFileRoute`.
2. **Guard** it with `beforeLoad` and `requireSession` unless its layout already lets in exactly the right roles.
3. **Load** render-critical data: query options in `queries.ts`, `ensureQueryData` in the `loader`,
   `useSuspenseQuery` in the page. Add `validateSearch` for URL state, and `loaderDeps` if the loader reads it.
4. **Head and errors**: `head` with a title, and `notFoundComponent` / `errorComponent` inside the shell.
5. **Build** the UI from shared components plus slice-private ones.
6. **Forms**: add `schema.ts`, submit through an oRPC mutation, show the server's field errors, and invalidate what
   changed.
7. **Promote** anything a second route now needs.
8. **Test** the flow with Playwright if it is consequential.

## Code Conventions

General code conventions (imports without barrel files, object parameters, section dividers, comments, JSDoc) are
defined in `CLAUDE.md` and apply to frontend code as well.
