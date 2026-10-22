# Mascot Page Playbook

What the courses redesign taught (the catalogue `/courses` and Course Detail `/courses/:slug`, 2026-10-21), written for the next page moved into the mascot look. [storefront-design.md](storefront-design.md) is the look and [design-flow.md](design-flow.md) the steps; this doc is how to get a page from a first build to one the owner approves without three review rounds.

## The Lesson in One Line

**Start rich.** The first build of the catalogue followed a brief that asked for restraint ("calmer than the home page, no plants or brick, one talking dog"), and the user called the result "so bad": black boxes with a lone cut-out in them, flat bands, holes in the grid. Every round after that added the same things back: scenery, light, texture, a second and third appearance of the dog, and motion. The approved pages are as alive as the home page, just less busy. Plan for that richness in the brief, not after the first review.

## What the User Wants on Every Mascot Page

- **No empty stage.** A dog alone on black reads as missing content. Wherever he stands, he gets:
  - scenery behind him, dimmed (`scenery-dim`): the house, hedge, centre, lodge, plants, signpost, bone, flag;
  - a pool of warm light where he stands: `bg-[radial-gradient(ellipse_45%_60%_at_50%_85%,rgb(255_194_26/0.08),transparent)]` (0.07–0.08 alpha, never more);
  - something to stand on or lean over: a `GroundStrip`, a card's top edge, a plate's edge, a wall's coping;
  - often a chalk bubble with a line, and a chalk night sky (`NightSky`) in a tall empty area (it was chosen when every course photo was a night scene; since 2026-10-21 the covers are daylight snapshots, and the night sky stays as the drawn scenes' own).
- **No empty band or cell.** Look at every screenshot for a black area with nothing in it: under a short column beside a tall one, a gap between sections, a grid cell without a card, a strip above the footer. Fill it with something that **means** something (next section), shrink it, or move the dog into it.
- **Texture here and there.** Flat surfaces look dead on this paper.
  - `paper-grain` on panels, plates and cards that paint their own fill.
  - The brick wall (`BRICK` from `app/lib/brick.ts`, layered as ``style={{ backgroundImage: `var(--grain), ${BRICK}` }}`` over `bg-inverse` or `surface-inverse`) for a band the dog looks over or sits on, with a light coping on top: `border-t-2 border-t-foreground/60`.
  - Plates on a wall: a dark `bg-jet paper-grain rounded-3xl` panel hanging on the brick reads as a sign, and keeps text legible.
- **Motion for every change.** Nothing may appear or disappear suddenly. See "Motion" below. The user said "add animations instead of sudden changes, specially for the search button", and was happy once every state change animated.
- **More than one appearance.** storefront-design used to say "one or two appearances" on working pages. The approved Course Detail has the dog four times (on the buy card, peeking over the commands plate, sitting on the closing wall, plus the customer's own dog answering in the list) and props (the finish flag, the lodge). The catalogue has a dog per family. Calm means no running laps and no extra gimmicks, not fewer dogs.

## Scenery That Means Something

The best fills carry information, so they never look like clip art stuck into a hole:

| Where                             | What                                                       | Why it reads                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A course family's stage, the hero | `courseScene(family)` (`app/lib/course-scenes.ts`)         | The place the family's courses happen: house rules → the house, obedience → the centre, companion walks → hedge and signpost, working → the lodge |
| Boarding option                   | The `lodge` on a short path                                | The partner pension                                                                                                                               |
| End of the lane trail             | The gold `flag`, planted where the trail stops             | The finish, as on the home page's steps trail                                                                                                     |
| A list he "knows"                 | The `peek` dog over its top edge                           | The heading is his line («تا آخر دوره اینا رو بلدم»)                                                                                              |
| The closing ask                   | The `sit` dog on the wall, «منم اولش همین‌جوری شروع کردم!» | A graduate who started the same way                                                                                                               |

The same family gets the same scene on every page (the catalogue and Course Detail share `courseScene`), so a place is recognisable.

## Composition Patterns That Worked

- **The dog stands on an edge.** The card's top edge, the plate's top edge, the wall's coping, the ground strip. A dog floating in space looks pasted on; a dog on an edge looks like he lives in the layout. Overlap the edge by a few pixels so the soft feet of the cut-out disappear (`-mb-[3px]`, `translate-y-[3%]`).
- **A bush either side.** Two `plants`, one mirrored (`-scale-x-100`), different sizes, with `lively-sway` and `lively-sway-2` so they don't move in step. The bush on the outer side is smaller, so it doesn't run past a rounded corner.
- **Bundle, don't grid.** Families as grid rows left empty cells and a 6,200px page. One rounded `bg-sunken paper-grain` panel per family (the dog's stage beside its cards), consecutive one-course families paired side by side, and fixed card widths (19rem, 21rem alone) so prices never wrap.
- **A column that's shorter than its neighbour gets a scene, not padding.** On Course Detail the buy card is taller than the words beside it, so the words column is `lg:flex lg:flex-col` and the leftover height is a `flex-1` scene (`PlaceScene`): the pieces sit in a fixed box at the bottom, so extra height only adds sky. Size its minimum for the **shortest** state (a visitor's card), not the one you are looking at, or it pushes the other column down.
- **The whole hero on a path.** A full-width `GroundStrip` under the hero, with the grid `relative z-10` and the strip `-mt-4`, so the card and the scenery stand _in_ the path. Fade both ends of every strip: `[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]`.
- **Scenery as shares of a capped box.** Pieces are placed with `start-[x%] w-[y%]` inside a box, so one scene fits a small row and a wide stage. Cap the box's width (`max-w-[21rem]` in a 9rem-tall hero scene) so the tallest piece (the centre, 491×280) still fits its height.
- **Text clears the dog.** When a dog stands at a block's end corner, give the text above it end padding wider than the dog plus its offset (`pe-32 sm:pe-40` for a `w-24 sm:w-28` dog at `end-4 sm:end-8`). Check the first line of the paragraph, the one that collides.
- **Put the dog where the hole is.** The closing dog first sat on the end side, under the lane column, which already ended low, and left a big hole under the shorter learn column. Moved under the learn column, he fills it.
- **A band that ends the page runs into the footer.** Export `handle: PublicLayoutHandle = { flushFooter: true }` so `main` drops its bottom padding, or the page ends on a dead strip of paper above the footer.

## Cut-out Edges (Read the Picture First)

Open the cut-out (`public/photo/new-design/<name>.webp`) before placing it. Its geometry decides the classes:

- **`peek`** ends in a flat cut under his chin (about 89% down) with the paws hanging below it. The block's bottom goes on the edge and the dog is sunk by the paws' length, `translate-y-[11%]`, so the chin rests on the edge and the paws hang over it. Bushes beside him are raised by as much (`bottom-[12%]`). Higher, the gap between chin and edge shows as a dark box: on the catalogue it was mistaken for a bad image and re-encoded for nothing.
- **`sit`** has a flat base (haunches and paws): `translate-y-[3%]` on a coping.
- **`flag`**: the pole stands about 72% across (18px in from the right at `w-16`) and the flag flies left, which is "onward" in RTL. Line the pole up with the trail it ends: `start-[calc(1.5rem-18px)]`.
- **`leash`** (home closing) is cut flat at the chest, 84% down.
- Cut-outs are low resolution: at most about 1.3× natural width (10rem / 8rem tall for the course poses).

## Physical vs Logical Sides

Logical utilities (`start`/`end`, `ms`/`me`, `ps`/`pe`) by default. Physical `left`/`right` only where the position is tied to the picture's own geometry rather than the reading direction, and say so in a comment:

- a `ChalkBubble`'s `tail` is physical, so the bubble beside a dog uses physical sides too (`left-[86%]` / `right-[86%]`);
- plants around a dog pinned to a physical corner (the card's left corner in RTL).

## Motion

The motion system, all in `app/app.css` and all off under `prefers-reduced-motion`:

- **Idle loops** (`lively-breathe`, `lively-float` for the frisbee catcher, `lively-sway`/`lively-sway-2` for plants and the flag): long and small.
- **Scroll reveals** (`lively-reveal`, `lively-reveal-pop` for bubbles on the way down): scroll-driven where supported.
- **Answers** to the visitor's actions (`answer-in` rises and fades in, `answer-pop` pops a bubble from its tail): they run once on mount, so the changed part gets a new `key` to replay. `--answer-delay` staggers a list (60ms per item, capped at 4); `--pop-origin` sets the tail's corner (`1.75rem_100%` for a bottom-left tail).
- **One load moment per page**, in the slice as an inline `<style>`: the catalogue dog climbs over the wall; Course Detail's card bubble pops at 0.4s.

Patterns:

- **Rising from behind an edge**: animate `transform` with a `clip-path` that moves with him, so nothing shows below the edge until he is up (`inset(-30% -30% 101% -30%)` → `inset(-30% -30% 8% -30%)` → `inset(-30% -30% -10% -30%)`). On load (`cc-peek`) or scroll-driven (`cd-peek`, `animation-timeline: view()` inside `@supports`). Put the idle loop on an inner element, or list it second so it wins once it starts.
- **Animate only after an action, not on load.** Keep `{ key, changed }` in state and adjust it during render (`if (arrival.key !== listKey) setArrival({ key: listKey, changed: true })`): the first render is still, later lists arrive.
- **Opening and closing are one motion.** Keep the panel mounted: grid rows `0fr` → `1fr`, the content lifting and fading inside, `inert` while closed. Use `flushSync` to lift `inert` before moving focus in. Two icons in one grid cell turn into each other (`scale-50 rotate-90 opacity-0`).
- **Chalk lines draw themselves** on scroll: `clip-path: inset(0 0 100% 0)` → `inset(0)` with `animation-range: entry 30% cover 55%`.
- Keyframes animate `transform`, which composes with Tailwind's separate `translate`/`rotate`/`scale` properties, so a mirrored cut-out stays mirrored.

## Pitfalls Hit Along the Way

- **An absolutely positioned `<svg>` ignores `top` + `bottom`.** It keeps its default 150px height. The lane trail's segments were all 150px whatever the gap (hidden under the markers until one ran past the last stop). Set the height: `h-[calc(100%+1.5rem)]`.
- **`justify-end` / stretch changes with the viewer's state.** A visitor's buy card is ~200px shorter than a signed-in customer's with two dogs. Screenshot both (and a no-price course, `working-dogs`) before judging a layout.
- **Tailwind needs literal class names.** Per-breakpoint sets (the catalogue's `STAGE_FROM`) are written out whole for each breakpoint.
- **A changed requirement in the brief beats the old doc line.** storefront-design's "one or two appearances" and "build still, add motion after review" were written before the user saw the pages; the user's later words win, and the doc gets updated.
- **Copy:** the dog's lines describe his picture and how he feels, never a result the course achieves, never an order, never that every dog takes CGC or BMC. Short, spoken Persian. The site's own voice (reasons, prices, errors) stays outside his bubble.
- **Errors aren't only the dog's.** Why a dog can't buy shows in plain words under the disabled button, in red with an icon (`BuyProblems`); his bubble is flavour on top.
- **Search belongs in the header** (`header-search.tsx`), not as a big field on the page.

## Reviewing Your Own Screenshots

Do this before the user sees anything:

1. Serve on your own port (`npx vite dev --port 5191 --strictPort`; never touch 5173), stop it after with `kill $(lsof -t -iTCP:5191 -sTCP:LISTEN)`.
2. Shoot full pages at 1440 and 390, scrolling through first so scroll-driven reveals have run, then back to the top with `animations: "disabled"`. Signed in: Playwright `storageState` files of the demo accounts (`.tmp-claude/state-<phone>.json`). Tools: `.tmp-claude/tools/shot-detail-full.mjs`, `shot-phone.mjs` (four phone screens into one sheet), `crop.mjs` (sharp; `setContent` with `file://` images doesn't work).
3. A full-page phone shot shows the fixed tab bar in the middle of the page: that's the screenshot, not a bug. Use viewport-sized shots for phones.
4. Go over each shot asking: where is it black and empty? Where does a dog float? Does any text run under a cut-out? Does anything wrap that shouldn't (prices)? Is there horizontal scroll (`document.documentElement.scrollWidth`)?
5. Measure instead of guessing: `getBoundingClientRect` of the suspect elements, `elementsFromPoint` to find what paints a box, a red background to see a gap, rAF-sampled heights to check a transition.
6. Few screenshots: a sheet per state, crops at full scale for detail.

## Checklist for the Next Page

- [ ] Check [legacy-pages.md](legacy-pages.md) for the page's verdict.
- [ ] Brief: where each dog stands, on what edge, what he says, and what scenery means something there.
- [ ] Every dog: an edge to stand on, scenery or bushes, warm light, an idle loop.
- [ ] Every surface that paints a fill: `paper-grain`; one brick or `surface-inverse` band at most.
- [ ] No empty cells, bands or column bottoms, in every viewer state, at 1440 and 390.
- [ ] Every state change animates; one load moment; reduced motion shows the finished page.
- [ ] The page's last band and the footer: `flushFooter` if it's a full-bleed band.
- [ ] `npm run lint`, `npm run typecheck`, then screenshots and your own critique, then the user.
