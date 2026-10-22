# Search Params (URL State)

URL state uses TanStack Router's own typed search params: a schema on the route (`validateSearch`), read with
`Route.useSearch()` and written with `navigate({ search })` or a `Link`'s `search` prop. The URL stays the source of
truth, so a page can be shared, bookmarked, reloaded, and rendered on the server in the same state. Prefer URL state
for any view state a user would expect to survive a reload or a shared link: filters, search text, sorting,
pagination, the active tab, the selected item, and open detail panels.

The app used nuqs until the move to TanStack Start. Its TanStack Router adapter doesn't cover Start, and the router's
own params are typed end to end, links included (decision 3 in
[`tanstack-start-migration-plan.md`](./tanstack-start/tanstack-start-migration-plan.md)). See the table in
[`jotai.md`](./jotai.md#what-goes-where) for what belongs in the URL and what doesn't.

## Loader Deps vs. UI-only Params

A loader doesn't see the search params unless the route lists them in `loaderDeps`. A param in `loaderDeps` reruns
the loader when it changes; a param left out only rerenders the page.

| Param                                                           | Where it goes       |
| --------------------------------------------------------------- | ------------------- |
| Picks what the server sends (a page of a server-paged list)     | `loaderDeps`        |
| Filters, searches, or pages a list the loader already has whole | Not in `loaderDeps` |
| UI-only (an open dialog or drawer, the active view)             | Not in `loaderDeps` |

Most lists here are small, so the loader fetches the whole list once and the component filters, counts, and pages it
(`admin_dogs`, `admin_users`, `account_partner_leads`, `course_catalogue`). Changing a filter then never waits for
the server. Only two routes have loader deps: `admin_sms` (the API pages the outbox, so `kind` and `page` pick the
page to fetch) and `buy` (`dog` picks whose courses to load).

A param the loader needs but that isn't in `loaderDeps` leaves the page showing the old data. A param in `loaderDeps`
that didn't need to be there costs a loader run, which is cheap when its queries are cached. When the loader doesn't
read it, keep it out.

## Defining the Schema

Each route that uses URL state has a `search-params.ts` in its slice that exports a Zod schema (a one-field schema may
sit in the route module, like `buy`'s). The route passes it to `validateSearch`, since Zod 4 implements Standard
Schema, and every read is typed from it.

- **Make every field `.optional()` with `.catch(undefined)`.** Anyone can type a URL, and a schema that throws sends
  the page to its `errorComponent`. With `.catch`, `?state=foo` simply means "no state".
- **Apply defaults where the value is read**, not in the schema (`search.page ?? 1`). Links and navigations leave a
  value out when it equals its default, so `/admin/dogs` and `/admin/dogs?page=1` are never two URLs for one page.
- **Use `z.enum`** for fixed options, with English values. Keep keys short, English, and stable, because they become
  part of shared links. User-entered text, such as Persian search terms, is encoded automatically.
- **Values are JSON-parsed.** `?page=2` arrives as the number `2`, so numeric params are `z.number()`. A digits-only
  text arrives as a number too when a plain form sent it, which is why the catalogue's `q` accepts both and turns the
  number back into text.
- **Name the export** `<name>SearchSchema` (`adminDogsSearchSchema`, `smsSearchSchema`), and keep the param's options
  and page size next to it.

```ts
// app/routes/admin_dogs/search-params.ts
import { z } from "zod";

/*===== Constants =====*/
export const PAGE_SIZE = 20;
export const DOG_STATE_FILTERS = ["all", "none", "evaluated"] as const;
export type DogStateFilter = (typeof DOG_STATE_FILTERS)[number];

/** The filter an absent `?state=` means; links leave it out of the URL. */
export const DEFAULT_DOG_STATE_FILTER = "all" satisfies DogStateFilter;

/*===== Search Schema =====*/
export const adminDogsSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  state: z.enum(DOG_STATE_FILTERS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});
```

The schema checks types, not business rules: `?page=-3` parses as `-3`. Clamp where it's read (a page past the end
shows the last one), or redirect in the loader when the URL itself should change (`admin_sms` sends a page past the
end to the last page).

## Wiring the Route

```ts
export const Route = createFileRoute("/admin/sms")({
  validateSearch: smsSearchSchema,
  loaderDeps: ({ search }) => ({ kind: search.kind, page: search.page ?? 1 }),
  loader: ({ context: { queryClient }, deps: { kind, page } }) =>
    queryClient.ensureQueryData(listQuery({ kind, page })),
  // ...
});
```

The loader reads `deps`, never the raw URL. A route with only UI-only params adds `validateSearch` and nothing else.

## Reading and Writing in Components

- **Read** with `Route.useSearch()` in the route module. Another component in the slice uses
  `useSearch({ from: "/admin/dogs" })`. A shell component that only sometimes sits over the route passes
  `shouldThrow: false` (the header's course search reads the catalogue's `q` that way).
- **Write** with `const navigate = useNavigate({ from: Route.fullPath })`, then `navigate({ search })`. Pass a
  function of the previous params so the others are kept.
- **Remove a value** by setting it to `undefined`. That's also how a value goes back to its default.
- **Reset dependent params in the same update.** Changing a filter or the search text sets `page: undefined`, so the
  user isn't left on a page that no longer exists.
- **Keep the scroll.** The router scrolls to the top on every navigation by default, so a change that stays on the
  page passes `resetScroll: false`.

```tsx
const search = Route.useSearch();
const state = search.state ?? DEFAULT_DOG_STATE_FILTER;
const navigate = useNavigate({ from: Route.fullPath });

function showState(next: DogStateFilter) {
  void navigate({
    search: (prev) => ({ ...prev, state: next === DEFAULT_DOG_STATE_FILTER ? undefined : next, page: undefined }),
    replace: true,
    resetScroll: false,
  });
}
```

### Text Inputs

The list should follow every key, but the URL and the history shouldn't. `useSearchText` (`~/hooks/use-search-text`)
keeps the box's text in state, filters by it at once, and commits it to the URL with a `replace` navigation once
typing has paused. A `q` that changes from elsewhere (Back, a link) becomes the text again. The Admin's Dogs and Users
lists use it:

```tsx
const searchText = useSearchText({
  urlText: search.q ?? "",
  delayMs: 300,
  commit: (text) =>
    void navigate({
      search: (prev) => ({ ...prev, q: text === "" ? undefined : text, page: undefined }),
      replace: true,
      resetScroll: false,
    }),
});
```

This is the one deliberate copy of URL state into React state, and the URL still wins whenever it changes on its own.

### Pending UI

A UI-only param changes the page at once, so there's nothing to wait for. A loader-dep param waits for its loader:
dim the list with `useRouterState`, scoped to changes that stay on this page so that leaving for another page doesn't
flash it.

```tsx
const pending = useRouterState({
  select: (state) => state.status === "pending" && state.location.pathname === state.resolvedLocation?.pathname,
});
```

## History

Use `replace: true` for typing and toggling filters: they aren't places to go Back to. Leave it off (push) only when
the user would expect the Back button to undo the change: moving between pages of results, or opening a dialog that
Back should close (the Admin's Users page pushes `?user=`).

## Building Links

Links and redirects take the same typed `search`, so a wrong key or value is a type error. Don't concatenate query
strings by hand.

```tsx
<Link to="/buy" search={{ dog: dog.id }} resetScroll={false}>
  …
</Link>;

throw redirect({ to: "/admin/sms", search: { kind, page: current === 1 ? undefined : current } });
```

Link data kept in a list or a prop is built with `linkOptions({ to, search })` from `@tanstack/react-router`, so it is
checked where it's written and spread onto the `Link` later.

`Link` here is the app wrapper from `~/components/link`. A link that keeps the current pathname and only changes the
query doesn't preload, and the router's page fade skips it (see [`view-transitions.md`](./view-transitions.md)).

## Forms Without JavaScript

A filter that must work before hydration is a plain `<form method="get" action="/courses">` with field names that
match the schema's keys. The server renders the result through the same `validateSearch`. The header's course search
works this way and takes over with `navigate()` once hydrated.

## Where Code Lives

- `search-params.ts` lives in its route's slice. Move the schema to `app/lib/` only when a second route reads the
  same params (`app/lib/catalogue-search-params.ts` is shared by the catalogue and the header's search). Never import
  from another route's slice.
- Shared components in `app/components/` don't read or write the URL. They take values and callbacks through props
  (`AdminFilterPills`, `Pagination`), so they stay reusable and easy to preview in Storybook.

## Don'ts

- Don't read params from `window.location.search` or `useLocation()`'s `searchStr` when the route has a schema for
  them. Only the schema's output is typed and cleaned.
- Don't put secrets, tokens, or personal data in the URL. It ends up in history, logs, and shared links.
- Don't put large objects in the URL, even though the router would serialize them. Store an id and load the rest.
- Don't copy URL state into `useState` or atoms (`useSearchText` above is the one exception). Read it where it's
  needed.

## Testing

A component that reads the URL with `useSearch` needs a router around it. Prefer passing the values in through props,
which keeps it testable without one. When a story does need the router, render it as the only route of an in-memory
router (`createMemoryHistory`, as in `app/routes/rules/rules.stories.tsx`). Don't test Zod or the router's parsing.
