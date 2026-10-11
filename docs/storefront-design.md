# Storefront Design

The home page is finished, and it sets the look, voice and patterns for every other public page. This doc writes them
down so the next pages (catalogue, course detail, trainer page, assessment, behavior request) match it without
re-deriving it from the code. For the steps to design a page, see [design-flow.md](design-flow.md); for code
structure, [frontend-guideline.md](frontend-guideline.md).

## What the Site Must Feel Like

- **It sells one person.** Every page should leave the visitor trusting the head trainer (`HEAD_TRAINER` in
  `app/lib/head-trainer.ts`), not an anonymous pool of trainers. Name him; let him speak in the first person where it
  fits (the home page's trainer section is his own sentence, signed).
- **A professional, not a jeweller.** Gold is the accent and the metal, never the mood. The first screen of a page is
  plain slate with flat gold; gold leaf appears further down, on a few chosen things.
- **Private training, one dog.** Never show or imply group classes, seats, a venue or a class schedule.
- **Every road leads to the free assessment.** It is the main action on every public page except where the page has
  its own action (behavior request, booking a dog that already has a record).

## The Home Page

`app/routes/home/`, top to bottom. Each section has `aria-labelledby` pointing at its heading.

| Section                        | Component       | Surface                                | Job                                                                                                                                              |
| ------------------------------ | --------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hero                           | `HomeHero`      | `bg-jet` (plain slate)                 | The promise in two lines, who and where, the free assessment. Scroll pins it: the photo grows to full screen and owners' reviews pop in over it. |
| Trainer (`#trainer`)           | `TrainerIntro`  | page                                   | His photo, his own sentence, his name and role, three facts, "free assessment with Arman".                                                       |
| Browse by problem              | `BrowseSection` | page                                   | Problems in the owner's words ("قلاده را می‌کشد"), each opening in place into its course: summary, highlights, facts, next step.                 |
| Course map (`#courses`)        | `CourseMap`     | `bg-sunken` band with a `glow`         | The whole catalogue on a ruler of the dog's age, then working dogs, sport dogs and behavior modification as three doors.                         |
| How it works (`#how-it-works`) | `HowItWorks`    | `surface-inverse`, the page's one band | Four numbered steps; the last (the dog's record) is the one gold-leaf panel.                                                                     |
| Closing banner                 | `ClosingBanner` | photo card on `surface-inverse`        | The last ask, split by visitor: new dog → free assessment; dog with a record → book its next course.                                             |

The header and footer live in `app/routes/layout_public/` and wrap every public page.

### Where it sends people

These are the URLs the home page, header and footer already link to. They fix the public URL scheme; build the pages
at these paths.

| URL                                       | Page (see [app-phase-one-pages.md](app-phase-one-pages.md))  | Linked from                                                     |
| ----------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| `/assessment`                             | Book a Free Assessment                                       | hero, trainer section, every course row, closing banner, footer |
| `/courses`, `/courses?q=`                 | Course Catalogue (the header search submits `q` here)        | course map, header search, footer                               |
| `/courses/:slug`                          | Course Detail                                                | course rows, course map chips                                   |
| `/courses/working-dogs`, `/courses/sport` | Course Detail for the two advanced tracks (branches as tags) | course map                                                      |
| `/behavior-modification`                  | Behavior Modification Request                                | nav, behavior row, course map, footer                           |
| `/auth`                                   | Login / Register (built)                                     | header                                                          |
| `/account/dogs`                           | Dogs List (built; signed in, see [customer-area-design.md](customer-area-design.md)) | closing banner, "book the next course", Course Detail |
| `/help`, `/help/refunds`, `/privacy`      | Help and FAQ, Cancellation and Refund Rules, Privacy         | footer                                                          |
| `/join/partner`                           | Partner Enquiry                                              | footer                                                          |

The head trainer's page (Trainer Page, `/trainers/:slug`) isn't linked yet; once it exists, the trainer section should
link to it.

## Course Detail

`app/routes/course_detail/`, at `/courses/:slug`, top to bottom. Working and sport dogs (`/courses/working-dogs`,
`/courses/sport`) are course rows and use the same page. The loader reads `course.get` and `course.list`; an unknown
slug renders the route's 404 boundary inside the public layout.

| Section               | Component          | Surface                                | Job                                                                                                                                                                                                 |
| --------------------- | ------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                  | `CourseHero`       | page (plain slate)                     | Breadcrumb, the title in Amiri with its Latin name, the summary, "with Arman, private", the rating, the facts (`Fact`), the price in one sentence, and the next step in flat gold.                  |
| The course card       | `CourseCardBand`   | `surface-inverse`, the page's one band | The owner's own card: a raised card with the page's one gold-leaf strip, listing every command. Its ticks draw in once when it scrolls into view, the page's one orchestrated moment.               |
| Path                  | `CoursePath`       | page                                   | The home page's age ruler cut down to this course's lane, with this course lit; below `xl` a short vertical list. Notes: prerequisite, BMC's age window, the test, the next course, the equal path. |
| Reviews and questions | `CourseDiscussion` | page                                   | Course and trainer averages in a ruled `dl`, then one ruled thread of reviews and questions with Arman's replies. The empty state is the page's one doodle.                                         |
| Price and start       | `CoursePricing`    | `bg-sunken` band with a `glow`         | The closing ask: "Arman sees your dog first", the gold-leaf button, and a price sheet (course, boarding, test, refund policy in plain words).                                                       |
| Phone action bar      | `PhoneActionBar`   | `popover`, fixed to the bottom         | Phones only: the main action follows once the hero's buttons scroll away, and steps aside while the closing buttons are on screen.                                                                  |

The variants follow the course, through `getCourseActions` in the slice:

- **A normal course:** free assessment, with «سگت پرونده دارد؟ مستقیم رزرو کن» as the alternative.
- **Behavior modification:** «درخواست اصلاح رفتار» only. The card lists the problems a request can be about (with a
  plain mark, not a tick); the price comes from Arman after he sees the video; there is no path section.
- **Working and sport dogs:** free assessment only. The card shows the branches as tags; no ruler and no list price.

## Colour and Surfaces

The tokens are in `app/app.css` ("Lacquer & Gold Leaf"). One dark theme; there is no light mode.

- **Base:** a cool blue slate, `--base: #171d24`. Every dark surface is mixed from it, so they share a hue. Never a
  warm or brown black: under gold it reads as mud.
- **Text:** ivory (`foreground`), never white. Secondary text is `muted-foreground`; `faint` is for decoration only.
- **Gold:** `primary` (flat gold) for actions, links, the selected state and hairlines (`border` is a gold hairline).
  `saffron` is the brighter champagne for small bright notes: stars, icons beside a value. `text-saffron-text` labels
  short definition terms.
- **Gold leaf:** `gold-leaf` (fills) and `text-gold-leaf` (large numerals and the logo) are the metal. Use them on a
  few things below the first screen: the default button, one featured panel per page, big step numbers. Never as large
  display text on a first screen, which made the site look like a gold shop.
- **Layers, back to front:** `sunken` (a band that holds a shelf of things), page, `card` + `shadow-sm` (raised),
  `popover` + `shadow-lg` (overlays and cards floating over a photo). `jet` is the header and hero surface, the same
  slate as the page.
- **One `surface-inverse` band per page,** for the section that matters most after the hero. It re-points the text and
  border tokens, so content inside needs no special classes. A gold-leaf panel inside it must reset
  `--foreground`/`--muted-foreground` to ink, as `HowItWorks` does.
- **Light:** the `glow` utility adds a soft pool of light behind a band (aim it with `--glow-at`, size with
  `--glow-w`/`--glow-h`, strength with `--glow-alpha`). A blurred `bg-foreground/6` or `bg-primary/20` behind a photo
  makes it look lit rather than pasted on. Keep glows faint; tinted light on black turns muddy.

## Type

- **Two faces.** `font-display` (Amiri, bold only, so always with `font-bold`) is for the hero headline and section
  `<h2>`s, and nothing else. Everything inside a section, including `<h3>`s, is Vazirmatn. Amiri is what makes the
  site read like a printed card; using it for small text loses that.
- **Sizes.** Storefront headings use the fluid tokens: `text-h2` for section titles, `text-h3`/`text-h4` inside,
  `text-lead` for intro paragraphs. Body text, buttons and inputs stay on Tailwind's static scale.
- **Persian needs room.** Tall line heights (the tokens already carry them; Amiri headlines need about 1.25–1.35),
  never negative letter spacing. `text-balance` on headings, `text-pretty` on paragraphs.
- **Numbers** in Persian digits through `formatNumberFa`. Latin names (`CGC`, `IGP 1–3`) go in `<bdi>` or a
  `dir="ltr"` span; so do phone numbers.
- **The brand** is the `BrandLogo` component: the gold dog mark, «آموزش» and a stencil «K9». The stencil face is for
  the brand's K9 only (the footer's huge outline K9 is the logo, not a heading style).

## Actions

- **One main action per view, one quieter alternative.** Never two equal buttons side by side.
- **Button variants:** `default` is gold leaf, the main action below the first screen. `solid` is flat gold, used on
  the first screen. `ghost`/`outline` with a visible border for the alternative. `size="lg"` (56px) for page-level
  actions.
- **Wording** is an imperative to "you": «ارزیابی رایگان رزرو کن», «دوره‌ها را ببین», «جزئیات دوره». Say what
  happens, not "click here".
- **The action depends on the course:** a normal course offers the free assessment plus its details; behavior
  modification offers «درخواست اصلاح رفتار» instead. The same rule applies on course pages (see Course Detail in
  [app-phase-one-pages.md](app-phase-one-pages.md)).

## Voice and Copy

- Informal singular "you": «سگت», «خانه‌ی خودت», «اگر بخواهی». Warm and plain, short sentences.
- Problems are written in the owner's words, not the catalogue's: «تنها که می‌ماند، پارس می‌کند», not «اضطراب جدایی».
  Course names come second.
- Numbers from the course cards are approximate and say so: «حدوداً ۵ جلسه». Use `describeAge`, `describeSessions`
  and `describePlace` (and `describePrerequisites`) from `app/lib/course-format.ts` so every page words them the same way.
- Never write that every dog should take CGC or almost every dog BMC. That rule lives in the trainer's
  recommendations.
- No prices on the home page or in the course map. Prices belong on Course Detail and checkout.
- Say "private" and "at your home or outside" often; mention boarding once per page as an option.
- Say "free assessment" wherever a new visitor might wonder how to start.

## Layout

- Content sits in `site-container` (1280px plus the fluid side margin). Bands go full width and put their content back
  in one.
- Sections are separated by `pt-section-md` or, for bands, `py-section-md`. Anchored sections carry `scroll-mt-8`,
  which matches Lenis's anchor offset.
- Desktop splits are asymmetric: 5/7 or 7/5 columns with a wide gap (`gap-x-16`), not centred halves.
- **Desktop and phone are designed separately.** The home page's examples: the course preview photo becomes a
  thumbnail in each row on phones; the age ruler becomes plain lists below `xl` with the age written on each course;
  the reviews pile becomes a zig-zag column.
- Radii: 1.75rem (`rounded-3xl`) for photos and panels, `rounded-4xl` for a full banner, `rounded-xl`/`rounded-full`
  for chips and tags.
- Information comes in short definition lists with hairlines (`dl` with `divide-y`) or icon + label + value facts, not
  stat tiles.

## Imagery

- Real photos of a person with their dog, outdoors or at home, warm and happy. The hero photo is a WebP sized for the
  screen (about 80 KB); every image has its intrinsic `width`/`height`, `loading="lazy"` unless it is the first thing on
  screen (then `fetchPriority="high"`).
- Persian `alt` text describes the scene. Decorative copies (a thumbnail that repeats a row's title) get `alt=""`.
- Photos under text get a dark gradient from the text side only, so the dogs stay visible.
- The **doodles** (`app/components/doodles.tsx`: the marching frieze of people and dogs, the side scenes, the review doodles) are
  the brand's hand. They appear in the hero and once more above "how it works". Use them as a light accent, at most once
  per page outside the home page.

## Motion

- Hovers and focus change colour, or nudge an arrow toward the reading direction. Use bare `transition` utilities
  (they carry `ease-silk`) and only animate `transform` and `opacity`, behind `motion-safe:`.
- **One orchestrated moment per page at most.** The home page's is the hero's scroll scene (photo grows, reviews pop
  in, the marker swipes behind «وقت»). Other pages should be calmer: a reveal, a cross-fade, an accordion opening.
- Reduced motion always gets an equivalent without movement (the hero cuts instead of zooming).
- Page scrolling is eased by Lenis; same-page `#hash` links glide to their section.

## Reuse

These were built for the home page and are what the next pages will need. Following the "promote only when shared"
rule, move each one when its second consumer arrives, not before. `SectionHeading`, `Fact`, `Stars` and the doodles
were promoted to `app/components/` for Course Detail.

| Piece                                                                       | Where now                                 | Next consumer                     | Promote to                                        |
| --------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------- | ------------------------------------------------- |
| Course data (working and sport dogs are rows)                               | the database; `course.list`, `course.get` | Catalogue, Course Detail, booking | already shared (loaders read the oRPC procedures) |
| `describeAge`, `describeSessions`, `describePlace`, `describePrerequisites` | `app/lib/course-format.ts`                | Catalogue, Course Detail, booking | already shared                                    |
| `SectionHeading`                                                            | `app/components/section-heading.tsx`      | any storefront page               | already shared                                    |
| `Stars` (rating, optional `size`)                                           | `app/components/stars.tsx`                | Course Detail, Trainer Page       | already shared                                    |
| `ReviewCard`, the `Review` type                                             | `routes/home/components/`, `reviews.ts`   | Course Detail, Trainer Page       | `app/components/` (data from the Review entity)   |
| `Fact` (icon, label, value)                                                 | `app/components/fact.tsx`                 | Course Detail                     | already shared                                    |
| `DoodleFrieze` and figures                                                  | `app/components/doodles.tsx`              | empty states, the trainer page    | already shared                                    |
| Problems → course mapping                                                   | `routes/home/problems.ts`                 | home only                         | stays                                             |

## Loose Ends on Course Detail

- **Sample data:** the reviews, questions and replies (`app/routes/course_detail/discussion.ts`) until the Review and
  Comment entities exist; the course prices and cover photos in the seed. Several covers are 300 px demo images and look
  soft at the hero's size.
- **Cover shape:** the hero shows the cover at 4:5 on desktop and 16:10 on phones, but [media.md](media.md) plans a 21:9
  `hero` variant for this page. Change the variant when course uploads are built.
- **Links to unbuilt pages:** «سگت پرونده دارد؟» and «رزرو تست» go to the Dogs List (`/account/dogs`) until booking exists;
  «سؤالت را بپرس» goes to `/auth` until comments can be posted; the breadcrumb and 404 page link to `/courses`. The
  trainer line doesn't link anywhere until the Trainer Page exists.
- **One trainer:** the hero, the replies and the copy name the head trainer, because there is no Owner Trainer on a
  course yet. When assistants can own courses, show the owner trainer instead.

## Loose Ends on the Home Page

Known gaps, left on purpose until the page or data behind them exists:

- **The catalogue** is seeded with `npm run db:seed` (after `npm run db:push`). Its prices and cover photos are
  placeholders until the owner sends the real ones.
- **Sample data:** the head trainer's name, years and photo; the reviews; the course and problem photos
  (`public/demo/`, `public/photo/`); the footer phone number. They are placeholders until the owner sends the real
  ones.
- **Links to unbuilt pages** return 404 today: everything in the table above except `/auth`, `/account/dogs` and the course pages (`/courses/:slug`).
- **`/join/partner`** is linked from the footer, but partners can't sign up themselves; the Admin creates them. The
  pages list now has it as Partner Enquiry, an information page with the center's phone number.
- **The base-colour picker** in the header (`BaseColorPicker`, and the inline script in `root.tsx` that repaints its
  choice before hydration) is a design aid for the owner. Remove both before launch.
- **Leftover assets:** about half of `public/demo/` and `public/photo/` is unused, left from earlier versions (cat
  photos, the old pool of trainer portraits, the deal photos, `doodle-frieze.png`, `logo-h-light.png`). Delete them
  when the real photos arrive.
- **The closing banner's buttons** are hand-rolled (`h-13`, `rounded-2xl`) rather than `buttonVariants`; align them if
  the button sizes change.
- **Some `app.css` comments** still describe the earlier green-black base (the `glow` utility, `--accent`,
  `--inverse`); the base is now slate.
