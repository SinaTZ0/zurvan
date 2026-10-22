# View Transitions (Page Fade)

Client navigations to another page fade between the old and new page. TanStack Router wraps the render of a
navigation in
[`document.startViewTransition()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
when the navigation asks for a view transition. The browser's default view transition is a cross-fade of the whole
page, so no keyframes are needed. Browsers without the API navigate as usual, without the fade.

The fade starts after the loaders finish, when the new page is ready to render. It doesn't replace pending UI for slow
loaders.

## Where It's Set

The fade is the router's default, in `app/router.tsx`:

```ts
defaultViewTransition: { types: ({ pathChanged }) => (pathChanged ? [] : false) },
```

The router calls `types` with the change from the current location to the next one. Returning a list (empty here,
since no CSS keys on a type) starts the transition, and `false` skips it. So every navigation that changes the
pathname fades, whatever started it, and everything else renders in place.

| Navigation                                                    | Fades? |
| ------------------------------------------------------------- | ------ |
| A link or `navigate()` to another pathname (`/` → `/courses`) | Yes    |
| Back/Forward to another pathname                              | Yes    |
| Same pathname, new search params (filters, paging)            | No     |
| Same pathname, new hash (`hash="faq"`)                        | No     |
| Query refetches and invalidation after a mutation             | No     |

- **Nothing to opt into.** `Link`, `NavLink` and `navigate()` all get the default. A few `navigate()` calls still pass
  `viewTransition: true` from before the move; on a pathname change it does the same thing.
- **Override one navigation** with `viewTransition={false}` on a `Link` or `viewTransition: false` in `navigate()`. An
  explicit value always wins over the default.
- **Refetches never fade.** Query invalidation rerenders through TanStack Query, not the router, and the router's own
  `invalidate()` skips the transition.

## Why Only Pathname Changes

- **In-page changes stay in place.** Filters, search text, and paging change only the search params, so the list
  updates under the visitor's hand instead of the whole page blinking. Hash links on the same page glide with Lenis
  instead.
- **Back/Forward follows the same rule.** The default applies to history navigations too, so Back from a course to
  the catalogue fades, and Back through a list's pages doesn't.

### Browsers Without Transition Types

The `types` function needs view transition types (the router checks
`CSS.supports("selector(:active-view-transition-type(a))")`). A browser that has `startViewTransition()` but not
types ignores the function and fades every navigation that doesn't set its own `viewTransition`, query-only and
hash-only ones included. That's the accepted fallback: the fade is short, and those browsers still navigate
correctly.

## The Link Wrapper

Import `Link` and `NavLink` from the app wrappers (`~/components/link`, `~/components/nav-link`), not from
`@tanstack/react-router`. A lint rule (`.oxlintrc.json`) enforces this. The fade doesn't need them, but the wrappers
add two defaults on top of TanStack's `Link`, and any prop the call site passes wins:

- **Preload by area.** `viewport` on the storefront and account pages, so every page linked from what's on screen is
  loaded before it's clicked, data included: the router's `defaultPreloadStaleTime: 0` leaves the decision to
  TanStack Query, whose cache keeps the preloaded data for the click. Under `/admin` it's `intent` (hover or focus),
  because its pages are long lists of links and preloading every visible row would send a request per row. Links that
  stay on the current pathname and `reloadDocument` links don't preload.
- **Same-page hash links leave the scroll to Lenis.** A link to a section of the page it's on (`hash="courses"` on the
  home page) sets `resetScroll={false}` and `hashScrollIntoView={false}`, so the router jumps neither to the top nor
  to the element, and the smooth scroller (`~/components/smooth-scroll`, its `anchors` option) glides there. A hash
  link to another page lands on the section with the router's own `scrollIntoView`, which respects the section's
  `scroll-mt`.

`NavLink` is `Link` for navigation: the current page's link gets `aria-current="page"`, `className` may be a function
of `isActive`, and `end` makes it active only on the exact path.

```tsx
import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";

<Link to="/courses/$slug" params={{ slug }}>
  …
</Link>;
<NavLink to="/account" end className={({ isActive }) => (isActive ? "text-primary" : "")}>
  …
</NavLink>;
```

## Styling

- The duration lives in `app.css` (`::view-transition-*(root)`). It is kept short because the page ignores clicks
  while the fade runs.
- `prefers-reduced-motion: reduce` turns the animation off, so navigation is instant.
- Fixed elements (header, toasts) are part of the page snapshot. When they look the same on both pages, the default
  blend keeps them visually steady.
- To morph a specific element between pages later, give it the same `view-transition-name` on both pages. A name must
  be unique on the page at any moment, so set it only on the one element that moves.

## Don'ts

- Don't wrap `<Outlet>` in React's `<ViewTransition>`. It animates on React's own triggers (transitions, Suspense
  reveals), not on the router's rule, so filter changes and refetches would fade.
- Don't call `document.startViewTransition()` yourself around navigations. The router already starts one, and
  starting a second transition skips the first.
- Don't add `@view-transition { navigation: auto; }`. It only affects full page loads between documents, not client
  navigations.

## PWA Notes

- A service worker doesn't affect view transitions. It works on the network layer (documents, assets, and API
  requests), and the fade is in-page rendering. An installed PWA uses the same browser engine, so the fade works the
  same way.
- **Test the iOS swipe-back gesture on a real device.** iOS plays its own animation for a swipe back, and the router
  then fades as well, because Back to another pathname fades. That can look like a double animation. If it shows up,
  skip the fade when the browser already animated, which `PopStateEvent.hasUAVisualTransition` reports.
