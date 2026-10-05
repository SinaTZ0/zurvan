# View Transitions (Page Fade)

Client navigations to another page fade between the old and new page. This uses React Router's `viewTransition`
option, which wraps the final render of a navigation in
[`document.startViewTransition()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition). The
browser's default view transition is a cross-fade of the whole page, so no keyframes are needed. Browsers without the
API navigate as usual, without the fade.

The fade starts after the loaders finish, when the new page is ready to render. It doesn't replace pending UI for slow
loaders.

## Using It

Import `Link` and `NavLink` from the app wrappers, not from `react-router`. A lint rule enforces this.

```tsx
import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";

<Link to="/orders">سفارش‌ها</Link>;
```

| Navigation                                   | Fades? |
| -------------------------------------------- | ------ |
| To another pathname (`/` → `/orders`)        | Yes    |
| Same pathname, new query (`"?page=2"`)       | No     |
| Same pathname, new hash (`"#details"`)       | No     |
| nuqs updates (shallow or not)                | No     |
| Back/Forward between pages that faded before | Yes    |
| `<Form>` and `navigate()` without the option | No     |

- **Override per link** with `viewTransition={false}` or `viewTransition`. An explicit value always wins over the
  default.
- **`<Form>` and `useNavigate`** are not wrapped. Pass the option yourself when the result is another page:
  `navigate("/orders/42", { viewTransition: true })`, `<Form viewTransition>`. Leave it off for submissions that
  stay on the same page.

## Why Only Pathname Changes

- **nuqs never fades.** Its React Router adapter navigates without `viewTransition`, so filters, search text, and
  pagination update in place. Links that only change the query match that.
- **Back/Forward replays by pathname.** React Router remembers every pair of pathnames that used a transition (in
  `sessionStorage`) and fades again when the user goes back or forward between them. One fading link from `/orders`
  to `/orders?page=2` would make every later Back/Forward between that page's nuqs history entries fade too.

## Styling

- The duration lives in `app.css`. It is kept short because the page ignores clicks while the fade runs.
- `prefers-reduced-motion: reduce` turns the animation off, so navigation is instant.
- Fixed elements (header, toasts) are part of the page snapshot. When they look the same on both pages, the default
  blend keeps them visually steady.
- To morph a specific element between pages later, give it the same `view-transition-name` on both pages. Set the
  name only while that link is transitioning, with `useViewTransitionState(to)` or the `isTransitioning` state from
  `NavLink`'s render props. A name must be unique on the page at any moment.

## Don'ts

- Don't wrap `<Outlet>` in React's `<ViewTransition>`. It animates every update inside a React transition, and React
  Router and nuqs run their updates as transitions, so every filter change and revalidation would fade.
- Don't call `document.startViewTransition()` yourself around navigations. React Router already starts one, and
  starting a second transition skips the first.
- Don't add `@view-transition { navigation: auto; }`. It only affects full page loads between documents, not client
  navigations.

## PWA Notes

- A service worker doesn't affect view transitions. It works on the network layer (documents, assets, and loader
  data requests), and the fade is in-page rendering. An installed PWA uses the same browser engine, so the fade works
  the same way.
- **Test the iOS swipe-back gesture on a real device.** iOS plays its own animation for a swipe back, and React
  Router then replays the fade, which can look like a double animation. If it shows up, skip the fade when the
  browser already animated, which `PopStateEvent.hasUAVisualTransition` reports.
