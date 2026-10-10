# Design Flow

Follow these steps in order for every new page.

1. **Purpose**: In one sentence, say what the user comes to this page to do. Example: "Pick a time slot and confirm a booking."
2. **App context**: Read [app-identity.md](./app-identity.md). Decide which tone this page needs (friendly or formal) and which signature patterns it uses. Don't create a new mood, tone or theme for one page.
3. **Page brief**:
   - `role`: where the page sits in the flow (entry, list, detail, form, settings…) and where the user goes next.
   - `structure`: the sections from top to bottom, with what each one contains. Include the empty, loading and error states.
   - `design`: the layout and visual hierarchy, i.e. what the eye should land on first, second and third. Describe the desktop (1440px) and phone (390px) layouts separately, using the shells and page patterns in app-identity. Include one distinctive idea that makes this page memorable, not just a generic template.
   - `style`: density, emphasis and how colour is used on this page, within the app theme.
   - `motion`: which elements respond to hover and focus, and whether sections reveal on scroll, using the recipes in app-identity.
4. **Components**: Design the page first, then pick components. Shadcn is a toolkit, not a limit. Use it for standard controls like buttons, inputs, dialogs and menus. Build custom pieces wherever the design calls for something more distinctive. Never let the component list flatten the design.
5. **Styling**:
   - **Base styles** (`components/ui`): change these only for app-wide `mood`, `tone` and `theme`. A change here affects every page. If a component you use doesn't match app-identity yet, update its base style first, in its own commit, then build the page. Add or update its story, and check it in light, dark and side by side (`npm run storybook`).
   - **Sizes**: check the page at 390, 768, 1024 and 1440px, and with reduced motion turned on.
   - **Variants**: if a page-specific look will be reused, make it a variant. One-off creative styling is fine; keep it local to the page.
   - **RTL**: the app is right-to-left. Use logical utilities (`ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`), never `left`/`right`.
6. **Accessibility**: keep `WCAG 2.2 AA` in mind.
