# View Transitions (Page Transition)

Client navigations to another page animate between the old and new page: a short slide when the visitor goes deeper
or comes back, a cross-fade between unrelated pages. TanStack Router wraps the render of a navigation in
[`document.startViewTransition()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
and tags it with
[view transition types](https://developer.mozilla.org/en-US/docs/Web/CSS/:active-view-transition-type), which the
CSS in `app.css` keys on. Browsers without the API navigate as usual, without the animation.

The transition starts after the loaders finish, when the new page is ready to render. It doesn't replace pending UI
for slow loaders.

## Where It's Set

The router's default, in `app/router.tsx`, hands the decision to `pageTransitionTypes` (`app/lib/page-transition.ts`):

```ts
defaultViewTransition: { types: pageTransitionTypes },
```

The router calls `types` with the current location and the next one. It returns `["forward"]`, `["back"]`, `[]` (no
type: the plain fade) or `false` (no transition, the page renders in place).

| Navigation                                                                             | Transition |
| -------------------------------------------------------------------------------------- | ---------- |
| A link or `navigate()` deeper in the URL tree (`/` → `/courses` → `/courses/cgc`)      | Forward    |
| A link or `navigate()` up to an ancestor (`/courses/cgc` → `/courses`, any page → `/`) | Back       |
| A link or `navigate()` anywhere else (`/courses` → `/about`, `/auth` → `/account`)     | Fade       |
| The browser's Back (an earlier history entry)                                          | Back       |
| The browser's Forward (a later history entry)                                          | Forward    |
| A Back the browser already animated (the iOS swipe back)                               | None       |
| Same pathname, new search params (filters, paging)                                     | None       |
| Same pathname, new hash (`hash="faq"`)                                                 | None       |
| Query refetches and invalidation after a mutation                                      | None       |

- **Links follow the URL tree, history follows the history.** A link's direction comes from the two pathnames: `/` is
  every page's ancestor, `/account` is `/account/dogs/1`'s. The browser's Back is always back, even across a link
  that faded, because that is what the button means to the visitor.
- **Telling Back from a link.** The `types` callback doesn't say what started the navigation, so the module notes
  each `popstate` (a capture listener that runs before the router's own) with the history entry's key. A navigation
  that lands on that key is a Back or Forward, and the entries' `__TSR_index` says which. A push or a replace makes a
  new key, so a stale note never matches a later link.
- **Nothing to opt into.** `Link`, `NavLink` and `navigate()` all get the default; don't pass `viewTransition: true`,
  which starts an untyped transition (the plain fade) and skips the direction.
- **Override one navigation** with `viewTransition={false}` on a `Link` or `viewTransition: false` in `navigate()`. An
  explicit value always wins over the default.
- **Refetches never animate.** Query invalidation rerenders through TanStack Query, not the router, and the router's
  own `invalidate()` skips the transition.

## Why Only Pathname Changes

- **In-page changes stay in place.** Filters, search text, and paging change only the search params, so the list
  updates under the visitor's hand instead of the whole page blinking. Hash links on the same page glide with Lenis
  instead.
- **Back/Forward follows the same rule.** Back from a course to the catalogue slides back, and Back through a list's
  pages doesn't animate.

### Browsers Without Transition Types

The `types` function needs view transition types (the router checks
`CSS.supports("selector(:active-view-transition-type(a))")`). A browser that has `startViewTransition()` but not
types ignores the function and fades every navigation that doesn't set its own `viewTransition`, query-only and
hash-only ones included, with no slide. That's the accepted fallback: the fade is short, and those browsers still
navigate correctly.

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

All of it is in `app.css`, under "Page Transition".

- **Short, because the page ignores clicks while it runs.** The fade is 200ms. A slide is the old page leaving in
  220ms and the new one arriving over 380ms after a 100ms gap (`--page-leave`, `--page-enter`, `--page-gap`), both
  shifted by `--page-shift` (1.75rem) and fading.
- **Mirrored for right to left.** The site is RTL, so forward runs leftward: the next page comes in from the left and
  the old one leaves to the right. Back mirrors it.
- **A nudge, not a full-width slide.** The old page has faded out before the new one moves in, so the strip the shift
  uncovers at the edge never shows.
- **Steady chrome.** The phone's floating tab bars (`tab-dock`: the public, account and Admin bars, only one on a page
  at a time) and the Admin's sticky header (`admin-header`) have a `view-transition-name`, so they keep their own
  snapshot and stay put while the page slides under them. The public and account headers scroll with the page and
  have no name: named, they would fly in from wherever the old page had scrolled them.
- `prefers-reduced-motion: reduce` turns the animation off, so navigation is instant.
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
- **The iOS swipe back.** iOS plays its own animation for a swipe back. The `popstate` it fires reports it
  (`PopStateEvent.hasUAVisualTransition`), and the router then skips its own, so it never animates twice. Check it on
  a real device after changing the transition.
