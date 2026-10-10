# App Identity: Mood, Tone & Theme

Zurvann is a premium online shop for pet training courses, for Persian-speaking pet owners. The same brand will later
live inside the Zurvann super-app, but this is the **website**: people browse and buy on desktop as much as on their
phones, so both are first-class. It's RTL.

## Mood

**Refined and silky: calm, trustworthy and warm.** It should feel like a boutique atelier for pets, not a playful pet
store and not a clinic.

- **Refined**: few colours, lots of whitespace, large photography and confident type. Every screen has one clear
  primary action. Nothing is loud, neon or busy.
- **Silky**: surfaces are soft and continuous, and everything that moves glides in and settles gently. Nothing snaps,
  bounces or flashes. See [Motion](#motion).
- **Trustworthy**: verification is visible everywhere: verified badges on trainers, "تأییدشده" labels, shield notes,
  real ratings with counts.
- **Warm**: real photos of pets and people, the pet's name wherever we know it, and soft rounded shapes.

## Tone (copy)

- **Personal**: use the user's first name ("سلام سارا جان 👋"). Talk about the pet by name, not "your pet" ("دوره‌های
  مناسب لئو"، "پیشرفت لئو").
- **Friendly, then polite**: prompts and greetings are casual ("حیوانت را اضافه کن"). Payment, safety, privacy and
  legal text stays polite and formal ("لطفاً…"، "اطلاعات شما امن و محرمانه است").
- **Reassuring**: before a commitment, say what's protected or verified ("فقط مربیان تأییدشده زروان…"، "تا ۴۸ ساعت قبل
  از شروع، کامل بازپرداخت می‌شود").
- **Concrete**: give numbers, not adjectives ("۳ جای خالی"، "۲ روز تا شروع"، "۴.۹ از ۳۲۸ نظر").
- **Locale**: use Persian digits and Jalali dates. Show prices in toman, shortened as "هزار" or "میلیون".
- **Emoji**: rare, and only in friendly moments (👋 🌿). Never put one in a button or an error.

## Theme

All tokens live in `app/app.css`. Use the Tailwind classes (`bg-primary`, `text-gold-text`, `border-cream-border`…),
never raw hex.

### Colour

**Ivory & Ink with rich gold.** Warm ivory surfaces, deep ink navy for structure and action, and a true gold for value
and highlights. It should read like a luxury house: crisp, quiet and confident.

| Token                      | Light                 | Dark                  | Use                                                                            |
| -------------------------- | --------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `primary`                  | `#1F2940`             | `#D6AD4F`             | Primary buttons, active nav, check badges, focus `ring`                        |
| `primary-foreground`       | `#F6F3EC`             | `#1A2236`             | Text on primary                                                                |
| `foreground`               | `#1B2030`             | `#EFECE5`             | Headings and body text                                                         |
| `muted-foreground`         | `#66625A`             | `#A8A49B`             | Secondary text                                                                 |
| `background`               | `#F8F6F1`             | `#0F1320`             | Page background                                                                |
| `card` / `popover`         | `#FFFFFF`             | `#161B2B`             | Cards, inputs, popovers                                                        |
| `muted` / `secondary`      | `#EFECE5`             | `#1E2436`             | Subtle fills, segmented controls, secondary buttons                            |
| `accent`                   | `#F8F2E4`             | `#1E2436`             | Hover and selected rows                                                        |
| `border`                   | `#E7E3DA`             | ivory at 10%          | Card borders and dividers                                                      |
| `input`                    | `#8C887F`             | ivory at 45%          | Edges of inputs, selects, checkboxes and radios                                |
| `gold`                     | `#D6AD4F`             | `#D6AD4F`             | Accents on ink only (`primary`, dark-mode `hero`): stars, highlights, logo     |
| `gold-deep`                | `#A9842F`             | `#D6AD4F`             | Icons and decoration on light surfaces, never text                             |
| `gold-text`                | `#80621C`             | `#E2BC5C`             | Gold as readable text or links                                                 |
| `faint`                    | `#8C887F`             | `#7A7870`             | Disabled items and decoration, never text. Placeholders use `muted-foreground` |
| `cream` / `cream-border`   | `#F8F2E4` / `#EEDFBF` | `#241F14` / `#3B3220` | Icon boxes, reminders, info notes                                              |
| `mint` / `mint-border`     | `#EEF3EF` / `#D5E1D8` | `#142420` / `#21362E` | Positive or safety notes                                                       |
| `success` / `destructive`  | `#237548` / `#C53B3B` | `#4CBF7C` / `#E5655F` | Status only, used sparingly                                                    |
| `hero` / `hero-foreground` | `#F3EFE6` / `#1B2030` | `#1A2236` / `#F6F3EC` | Hero cards and bands: ivory with ink text by day, ink with ivory text by night |
| `hero-accent`              | `#80621C`             | `#D6AD4F`             | Gold on a hero: the highlight word, stars, a price. Never `gold` directly      |

- **Ink for structure, gold for value.** Gold marks what's precious: the highlight word in a hero line, ratings, a
  price, a thin divider. Keep it off large surfaces and never use more than one gold element per
  card.
- **Which gold where**: `gold` only on ink; on light surfaces use `gold-deep` for icons and `gold-text` for words
  (`gold` on ivory is 1.9:1 and unreadable). On a hero, use `hero-accent`, which switches between the two with the
  theme.
- **Light heroes are ivory, not ink.** A hero is a slightly deeper ivory than the page, with ink text, and its richness
  comes from the photograph, the type and the space. Gold stays in a few details: the highlight word, a hairline, a
  star. No textures or gradients standing in for materials (marble, silk); they look cheap. The ink hero belongs to
  dark mode.
- **Dark is the default theme.** A first visit opens in dark mode whatever the system setting; light is the user's
  choice through the theme toggle, and it's remembered. Dark mode is a night version of the same palette: deep ink
  surfaces and heroes, ivory text, and gold as `primary`. Design and review every page in dark first.
- **The logo** is still the super-app's green-and-gold artwork. It needs an ink-and-gold version; until then, show it
  dark (`brightness-0`) on light surfaces and light (`brightness-0 invert`) on ink.

### Type

- **Font**: Vazirmatn Variable (`@fontsource-variable/vazirmatn`), with Tahoma as fallback.
- **Weights**: 800 for display and headings (`h1`–`h4` get this by default), 700 for buttons and labels, 500 for body
  text (400 reads thin on screen).
- **Fluid scale for marketing type.** Headings on storefront pages grow smoothly with the viewport using `clamp()`, so
  a desktop hero feels editorial without a breakpoint jump:

  | Utility        | 360px → 1440px | Use                                 |
  | -------------- | -------------- | ----------------------------------- |
  | `text-display` | 40 → 72px      | One per page at most: the hero line |
  | `text-h1`      | 30 → 48px      | Page titles                         |
  | `text-h2`      | 24 → 36px      | Section titles                      |
  | `text-h3`      | 20 → 26px      | Card groups, sub-sections           |
  | `text-h4`      | 18 → 20px      | Small headings                      |
  | `text-lead`    | 17 → 20px      | The intro paragraph under a title   |

- **Fixed scale for UI.** Body text, labels, buttons, inputs, tables and everything in the dashboards use Tailwind's
  static sizes (`text-xs`…`text-xl`). Dashboards are dense tools; they shouldn't swell on a wide screen.
- **Minimum sizes**: `text-sm` (14px) for body text and `text-xs` (12px) for captions.
- **Line height**: Persian needs room. `text-xs`, `text-sm` and `text-base` are set to 1.7–1.8, the fluid headings to
  1.3–1.6.
- **No letter-spacing on Persian text.** Tracking breaks the joins between letters. Only Latin text (the logo
  wordmark, codes) may be tracked.
- **Balance** headings with `text-balance` and long paragraphs with `text-pretty`. Keep reading text under about 65
  characters wide (`max-w-prose`).

### Shape & depth

- **Radius**:
  - `rounded-sm` 8px: small controls
  - `rounded-md` 12px: icon boxes
  - `rounded-lg` 14px: buttons and inputs
  - `rounded-xl` 16px: cards
  - `rounded-2xl` 20px or more: images, hero blocks and bands
  - avatars are `rounded-full`
- **Borders over shadows**: cards use a 1px `border`. `shadow-soft` is the only elevation. A card at rest has none;
  it may fade in on hover to show the card lifted.
- **Controls**: buttons are `h-11` (44px) by default and `lg` (56px) for the main action of a page. On phones the main
  action of a flow is full width at the bottom. On desktop buttons size to their label and never stretch across a
  wide column.

### Iconography & imagery

- Line icons (Lucide) with a 1.7 stroke and round caps and joins. They're usually `gold-deep` inside a `cream` rounded
  box.
- Real photos only, never illustrations of pets. Course and trainer photos are large on desktop and set the mood of
  the page. Every image has a fixed aspect ratio, so nothing jumps while it loads (see [media.md](./media.md)).
- People get a round avatar with a check badge when verified.
- The paw is the brand motif. Use it as an accent, not as wallpaper.

## Layout

Desktop and mobile are designed separately; a desktop page is never a stretched phone screen. Write styles mobile
first (base classes, then `md:`/`lg:`), but design both ends deliberately.

### Grid and spacing

- **Reference widths**: design at 390px (phone) and 1440px (desktop), and check 768px and 1024px in between.
- **Breakpoints**: Tailwind's defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). `lg` is where desktop layouts
  begin: side columns, sticky panels, sidebars.
- **Page column**: `site-container` centers the content at most 1280px wide (`max-w-page`) with a side margin that
  grows from 16px to 48px. Full-bleed bands (hero photos, coloured sections) span the window and put their content
  back inside a `site-container`.
- **Fluid spacing**: `px-site` (16 → 48px), `gap-gutter` (16 → 32px) for grids, and `py-section-sm` / `-md` / `-lg`
  (48 → 80, 64 → 112, 88 → 160px) between storefront sections. Inside components, use the static scale (`p-4`,
  `gap-3`).
- **Whitespace is part of the brand.** When in doubt, give a section more room, not more content.

### Shells

| Area                           | Desktop (`lg+`)                                          | Phone                                                 |
| ------------------------------ | -------------------------------------------------------- | ----------------------------------------------------- |
| **Storefront** (public)        | Top header: logo, nav, search, account. Generous footer. | Compact header with logo and account; menu in a sheet |
| **Customer, Trainer, Partner** | Storefront header plus a side nav for the area's pages   | Area nav in a sheet or as tabs at the top of the page |
| **Admin**                      | Sidebar and dense tables, desktop-first                  | Usable but not polished: tables scroll sideways       |

The website has no bottom tab bar; that belongs to the super-app.

### Page patterns

- **Catalogue**: filters in a side column on desktop and in a sheet on phones. Cards in 1 / 2 / 3 columns (`sm` /
  `lg`). Filters live in the URL.
- **Detail** (course, trainer): a large photo or hero band, then content beside a **sticky reservation panel** on
  desktop (upcoming runs, price, seats left, reserve). On phones the panel becomes a sticky bottom bar with the price
  and the main action.
- **Checkout**: the form beside a sticky order summary on desktop; the summary collapses above the form on phones.
- **Lists in the account areas**: tables on desktop, cards on phones.

## Motion

Motion is what makes the site feel silky. It should be noticed only when it's missing.

### Principles

- **Glide, don't snap.** Things start quickly and settle slowly (`ease-silk`). No bounces, no overshoot, no springs.
- **Small distances.** Lifts are 2–4px, reveals travel 12–16px, image zooms stop at 1.03–1.05.
- **Respond instantly.** Hover and press feedback starts on the same frame. Motion never delays an action or blocks
  input.
- **Only `transform` and `opacity`** move. Colour and border fades are fine. Never animate width, height, top or
  margins.
- **Hover is a bonus.** Tailwind's `hover:` only applies on devices that can hover, so nothing important may depend on
  it. Every hover state has a matching `focus-visible` state.

### Tokens

| Token                         | Value                            | Use                                               |
| ----------------------------- | -------------------------------- | ------------------------------------------------- |
| `ease-silk`                   | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for everything. Bare `transition` uses it |
| `ease-silk-in-out`            | `cubic-bezier(0.65, 0, 0.35, 1)` | Things that move away and back (carousels, tabs)  |
| default duration              | 200ms                            | Colour, border, press feedback                    |
| `duration-300`–`duration-500` | 300–500ms                        | Lifts, popovers, sheets                           |
| `duration-700`                | 700ms                            | Image zoom inside a card, scroll reveals          |

### Recipes

| Element             | Hover / interaction                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Primary button      | Background deepens a step; press scales to 0.98. No lift.                                                                          |
| Card (link)         | Lifts 2–4px, `shadow-soft` fades in, border warms toward `cream-border`. Its image zooms to 1.03 over 700ms inside a clipped frame |
| Text link           | An underline grows from the start edge (the right, in RTL)                                                                         |
| Arrow icon          | Nudges 2–4px toward the end of the line (left, in RTL)                                                                             |
| Inputs              | Border and ring fade in on focus, no movement                                                                                      |
| Popovers, sheets    | Fade plus a short slide from their anchor (`tw-animate-css`, already in the shadcn components)                                     |
| Page change         | The 200ms cross-fade from [view-transitions.md](./view-transitions.md)                                                             |
| Storefront sections | Fade in and rise 12–16px once as they scroll into view, children staggered by about 60ms. Never on dashboards                      |
| Page scroll         | Wheel scrolling is eased by Lenis (`app/components/smooth-scroll.tsx`); touch scrolling stays native                               |

Add [Motion](https://motion.dev) when a page first needs scroll reveals, enter/exit or layout animation; CSS covers
everything else.

### Reduced motion

`prefers-reduced-motion: reduce` turns off movement: lifts, zooms, reveals, the page fade and Lenis smoothing. Colour
and opacity changes stay. Put movement behind `motion-safe:` (for example `motion-safe:group-hover:-translate-y-1`).

## Signature patterns

- A **hero band or card** led by a large photo: the home hero, a trainer's header, the next upcoming run. Ivory with
  ink text in light mode, ink in dark mode, gold only in its details.
- A **course card**: photo, title, trainer with a verified badge, rating, the next run's date, seats left and price.
- A **seat meter**: seats left and "remaining to start" shown as a slim bar and a number ("۳ جای خالی").
- A **sticky reservation panel** on course pages (see [Page patterns](#page-patterns)).
- **Cream and mint note boxes** with an icon, for trust, privacy, refunds and tips.
- A **pet chip**: avatar, name with check, then breed and age, shown at the top of checkout and pet pages.
- A **stepper** ("مرحله ۲ از ۴") for multi-step flows.

## Reference screens

These come from the Zurvann super-app mockups, which are phone-only and use the old green palette. Use them for tone,
content and detail only, not for colour or layout.

- [home.png](./references/home.png): hero card, pet chip, reminders and specialist cards.
- [services.png](./references/services.png): service grid, stepper, request form, specialist profile and timeline.
- [auth.png](./references/auth.png): sign-in, verification code, forms, trust notes and segmented choices.

## Accessibility notes

Every colour pair in the palette passes WCAG AA. Keep it that way when adding tokens:

- **Text** needs 4.5:1 against its surface (3:1 from 24px, or 19px bold). `muted-foreground` is 5.6:1 on
  `background` and 5.1:1 on `muted`; `gold-text` is 5.3:1 on `background`. On the light `hero`, `hero-accent` is 5:1
  and `muted-foreground` 5.3:1.
- **Control edges and meaningful icons** need 3:1. `input` is 3.3:1 on `background`; `gold-deep` is 3.2:1.
- **Decoration only**: `faint`, and `gold` on light surfaces, never carry information on their own.
- **Sizes**: 14px for body text, 12px for captions, never smaller.
- Contrast ratios for each token are noted next to it in `app/app.css`.
