# Plan: An English Version of the Site

How the public pages get an English version beside the Persian one. Written on 2026-10-22 against TanStack Start
1.169 and Paraglide JS 2. Re-check both libraries' current docs before Phase 1; the integration below follows
Paraglide's TanStack Start guide and TanStack Router's i18n guide.

## Goal and Scope

- A visitor can read every public page in English at `/en/...`; Persian stays where it is, at `/...`, unchanged.
- **In scope:** pages anyone can open without signing in, and the public shell around them.
- **Added on 2026-10-23 (Phase 4):** sign-in and every signed-in customer and partner page (`/auth`, `/assessment`,
  `/buy`, `/account/*`).
- **Out of scope for now:** the Admin (stays Persian; only the owner uses it), SMS texts, and `/rules` (a 404 until the
  owner approves its wording; it gets English when it is published).
- Persian is the base language and the binding one: where the two differ (the privacy text above all), Persian wins.

| Slice                                | Page                                   | Persian strings (approx.) |
| ------------------------------------ | -------------------------------------- | ------------------------- |
| `layout_public`                      | Header, footer, tab bar, «بیشتر» sheet | 98                        |
| `home`                               | `/`                                    | 189                       |
| `course_catalogue`                   | `/courses`                             | 118                       |
| `course_detail`                      | `/courses/$slug`                       | 184                       |
| `help`                               | `/help`                                | 389                       |
| `about`                              | `/about`                               | 39                        |
| `contact`                            | `/contact`                             | 32                        |
| `privacy`                            | `/privacy`                             | 247                       |
| `logbook`                            | `/logbook/{-$fileNumber}`              | 86                        |
| `certificate`                        | `/certificate/$number`                 | 38                        |
| `join_partner`                       | `/join/partner`                        | 84                        |
| `not_found`                          | 404 inside the shell                   | 6                         |
| Shared (`app/components`, `app/lib`) | Pieces the pages above use             | (counted in Phase 1)      |

Course titles, summaries and the rest of a course's text live in the database, so the catalogue and course pages also
need English course content (Phase 1, step 9).

## Decisions

The owner decided 1–5 on 2026-10-22; 6 is settled in Phase 1.

1. **Who the English site is for.** Sign-in is by Iranian mobile number and payment goes through an Iranian gateway,
   so the realistic reader is a foreigner living in Iran. That is why only the public pages are translated for now.
2. **Who writes and approves the English copy (decided).** The agents: the Sonnet page agents draft it in the
   glossary's voice, and the Phase 3 copy review is the approval. No separate owner sign-off. The English privacy text
   says that the Persian version is binding.
3. **The English wordmark (decided): Zurvann**, with the double "n". The English header and footer show «Zurvann» with
   an English descriptor (worded in the glossary), and the English pages' titles use Zurvann. The Persian site keeps
   «زروان» (and, since 2026-10-23, no longer آموزش K9).
4. **Links to pages that are still Persian (decided).** «ورود», «ارزیابی رایگان» and «خرید دوره» lead to sign-in and
   signed-in pages: on the English site they open the Persian page, and the link carries a small "in Persian" note.
5. **English course content (decided).** Written by the agents in Phase 1 (step 9), from
   [zurvan-courses.md](../zurvan-courses.md). A course without English text shows its Persian text on the English page.
6. **Latin typefaces.** Estedad (display) and Marhey (chalk hand) are Persian faces. The English pages need Latin faces
   in the same spirit, chosen in Phase 1 and shown as screenshots before settling.

## How It Works

- **Library: Paraglide JS 2** (inlang). Each message is a typed function (`m.home_hero_title()`), so a missing
  English string fails the type check instead of rendering blank, and only the messages a page uses are bundled.
- **Messages:** `fa` (base) and `en`. Every user-facing string on an in-scope page moves into the message files,
  Persian included; the Persian text is copied, never reworded.
- **One message file per slice and language** (`messages/<slice>/fa.json`, `messages/<slice>/en.json`), keys prefixed
  with the slice (`home_…`, `help_…`, `shared_…`), so the Phase 2 agents never edit the same file.
- **URLs:** Persian unprefixed, English under `/en`. Locale strategy: URL, then cookie, then `fa`. TanStack Router's
  `rewrite` option (Paraglide's `deLocalizeUrl` / `localizeUrl`) adds and strips the prefix, so `app/routes.ts`, the
  slices and every `Link` stay as they are. Only the in-scope paths localize; `/en/auth`, `/en/account/*`,
  `/en/admin/*` and the other Persian-only paths redirect to their Persian address.
- **Direction:** `<html lang dir>` and Base UI's `DirectionProvider` follow the locale (`rtl` for `fa`, `ltr` for
  `en`). Layout uses logical classes (`ms-`, `pe-`, `start-`, `text-start`), so it mirrors on its own.
- **Formatting:** one place for digits, dates and money that reads the locale. Persian: Persian digits, Jalali dates
  (as today). English: Latin digits, Gregorian dates via `Intl`, prices as `1,200,000 Toman`.
- **Server sentences:** some procedures return text a public page shows (the buy card's reasons from
  `checkout.dogCourses`, form errors on contact and «همکاری با زروان»). The oRPC context learns the request's locale and
  those sentences come from the same messages.
- **SEO:** each page's `head()` gives a title and description per language, `<link rel="alternate" hreflang>` for
  `fa`, `en` and `x-default` (Persian), a canonical URL, and `og:locale`. Pages that are never indexed (certificate,
  logbook) stay so in both languages.

## Phase 1: Foundation and the Pilot Page

**Who:** one agent, Opus 5.5 at high effort. It runs alone; nothing else edits the repo while it works.

1. **Install and wire Paraglide.** `project.inlang` settings, the Vite plugin, the server middleware around Start's
   handler, the router `rewrite`, the locale strategy and the per-path exclusions above. Confirm that the message-format
   plugin loads several files per language (a `pathPattern` array) with distinct keys; if it doesn't, add a small
   script that merges the slice files before compiling. Decide whether the generated output is committed, and make sure
   `npm run typecheck`, `npm run lint` and `npm run build` work on a fresh clone either way.
2. **Locale in the shell.** `app/root.tsx` sets `lang`, `dir` and `DirectionProvider` from the locale. Check what else
   reads the direction: Embla carousels, the page transition's slide direction (`app/lib/page-transition.ts`), Lenis.
3. **Referral codes.** `REFERRAL_LANDINGS` in `app/start.ts` also covers `/en`.
4. **Formatters.** Locale-aware digits, dates and prices next to `app/lib/digits.ts` and `app/lib/jalali.ts`; Persian
   output unchanged.
5. **oRPC locale.** The locale in the procedure context, and the server sentences the public pages show moved into
   messages (`checkout.dogCourses` reasons, contact and partner form errors).
6. **Direction sweep.** Across the in-scope slices and the shared pieces they use: physical classes (`ml-`, `pr-`,
   `left-`, `text-right`, …) to logical ones, `rtl:` variants reviewed, and arrows and chevrons that point "forward" or
   "back" flipped by direction. About 230 physical classes, 47 `rtl:` variants and 57 directional icons exist in the
   whole app; only the in-scope ones change.
7. **Shared pieces.** Every string in `app/components` and `app/lib` that an in-scope page shows moves into
   `messages/shared/` (`ChalkBubble`, `CourseCard`, `course-families.ts`, `head-trainer.ts`, `contact.ts`,
   `not-found-page.tsx`, `root-error-page.tsx`, …). Phase 2 agents never edit these files.
8. **Language switcher.** «English» / «فارسی» in the header, the footer and the «بیشتر» sheet; it keeps the current page.
   On a Persian-only page it isn't shown.
9. **English course content.** Nullable English columns on `course` (title, summary, highlights, commands, cover alt;
   `latinName` already exists). The agent writes the English for the current courses into the seed from
   [zurvan-courses.md](../zurvan-courses.md) and the glossary's terms, applied with `npx drizzle-kit push --force`. Course procedures return the
   locale's text with Persian as the fallback; the Admin course form gets the English inputs (the form itself stays
   Persian); the catalogue search also matches the English title.
10. **Latin typefaces.** Pick display and hand faces for English with the `frontend-design` skill, against
    [storefront-design.md](../storefront-design.md); show screenshots before settling.
11. **Pilot: the public shell and Home** in both languages, end to end. Home is the reference page, so its English sets
    the voice.
12. **The glossary.** `docs/i18n/english-glossary.md`: the brand names (Zurvann and its English descriptor), the head trainer's name in Latin script, the
    mascot's English voice with Home's bubbles as examples, and the fixed terms (ارزیابی رایگان, دوره, پرونده, گواهی,
    سبد, همکار, the course families, Toman, …). Phase 2 copies these, never invents its own.
13. **SEO** for the shell and Home: titles, `hreflang`, canonical, `og:locale`.

**Done when:**

- Persian Home and shell look exactly as before (screenshots at 390 and 1440 before and after, compared).
- `/en` renders Home in English, left to right, with the Latin faces, at 390 and 1440, without horizontal scroll.
- `/en/account` and `/en/auth` redirect to the Persian pages; `/en/courses` still shows Persian until Phase 2.
- Lint, typecheck and build pass. The coordinator and the user review it before Phase 2 starts.

### Phase 1 Notes

What Phase 2 needs to know about the foundation, as built on 2026-10-22.

- **Message files.** `messages/<slice>/fa.json` and `en.json`; every in-scope slice already has its pair (only
  `$schema` in them) and is listed in `project.inlang/settings.json`'s `pathPattern` array, which the message-format
  plugin loads as one set per language, so no merge script exists. Keys are `<slice>_<area>_<what>` in snake case
  (`home_step_call_title`, `layout_public_nav_courses`); `shared_…` (in `messages/shared/`) holds what
  `app/components` and `app/lib` show and `server_…` the procedures' sentences. A new slice is a new folder plus a
  `pathPattern` line. `npm run lint` runs `scripts/i18n-check.mjs`: every key in both files, the slice prefix, no
  empty value, and no English placeholder the Persian lacks (English may drop one, as `layout_public_footer_area` does).
- **Calling a message.** `import { m } from "~/paraglide/messages"`, then `m.home_hero_bubble()` or
  `m.home_step_call_title({ trainer: HEAD_TRAINER.firstName })`, in components and in `head()`. Never inline text;
  the Persian is copied exactly from the old JSX, ZWNJ (`‌`) included. A plural is two keys chosen in code
  (`shared_course_sessions_one` / `_other`). A line break inside a bubble is `\n` in both files. The trainer's and the
  center's words come from `HEAD_TRAINER` and `CENTER` (`~/lib/head-trainer`, `~/lib/contact`), whose getters already
  answer in the page's language. `getLocale()` (`~/paraglide/runtime`) and `isEnglish()` (`~/lib/i18n`) give the
  language where a component must branch; that should be rare.
- **The generated code** is in `app/paraglide/`, gitignored. The Vite plugin (dev and build) compiles it, and so do
  `npm run typecheck` and `postinstall` (`npm run i18n:compile`), so a fresh clone works. Its options are in
  `project.inlang/paraglide.config.ts`.
- **Formatters.** `formatNumber`, `formatDigits`, `formatDate`, `formatTimestamp` and `formatMonthYear` in
  `~/lib/locale-format`, and `formatToman`, `formatTomanShort`, `describeAge`, `describeSessions`, `describePlace` in
  `~/lib/course-format`, read the page's language: Persian digits and Jalali dates as before, Latin digits and
  Gregorian dates in English. In a public slice they replace `formatNumberFa`, `toPersianDigits` and the Jalali
  helpers.
- **Direction.** `<html lang dir>`, Base UI's `DirectionProvider` and the page transition's slide follow the language.
  Use logical classes for text and layout; flip forward/back arrows and chevrons with `ltr:-scale-x-100`. An
  English-only fix uses an `ltr:` variant (Home's closing has `max-md:ltr:pb-[19.5rem]`), which can't move a Persian
  pixel.
- **Links to Persian-only pages** (`/auth`, `/assessment`, `/buy`, `/account/*`, `/admin/*`, `/rules`): link as
  before (`<Link to="/auth">`). The router never prefixes them and `~/components/link` reloads the document for them.
  Put `<InPersianNote />` (`~/components/in-persian-note`) inside the link after its words; an icon-only link gets
  `aria-label={withInPersian(label)}`. Their `/en/...` addresses answer 307 to the Persian ones (`app/server.ts`).
- **SEO.** `head: () => pageHead({ path: "/about", title: m.about_meta_title(), description: m.about_meta_description() })`
  (`~/lib/seo`) gives the title, description, canonical, `hreflang` (`fa`, `en`, `x-default` → Persian) and
  `og:locale`. Certificate and logbook add their own `robots: noindex` as today. English titles are `Zurvann | …`.
- **Server sentences.** Procedures get `context.locale` (the browser's oRPC link sends the page's language in the
  `x-locale` header; a server render passes it directly). Course procedures return `title`, `summary`, `highlights`,
  `commands` and `coverAlt` in the page's language, falling back to Persian per field; `latinName` is the same in both.
- **Checking a page under `/en`.** Run your own server (`node node_modules/vite/bin/vite.js dev --port <yours>
--strictPort`, never 5173), open `/en/<path>`, and check `document.documentElement.lang`/`dir`, the Latin faces,
  no horizontal scroll at 390 and 1440, the "in Persian" notes, and the language switch (it keeps the page and its
  query). Take the Persian screenshots before you edit and diff them after: they must match (the switch is in
  the shell and already in the "before" shots).
- **Faces (decision 6).** `:root:lang(en)` swaps `--display-face` to **Gabarito** (`@fontsource-variable/gabarito`), a
  heavy geometric sans with Estedad's open, friendly shapes. The hand stays **Marhey**, whose own Latin is drawn in the
  same bouncy hand, so the dog keeps one voice; body text stays **Vazirmatn**, whose Latin is drawn to sit with it.
  Candidates compared in `.tmp-claude/i18n-phase1/typeface-candidates.png` (not committed).

**Deviations from the steps above, and why:**

- **Step 5:** neither `/contact` nor `/join/partner` has a form (storefront-design.md), so no form errors moved. The
  partner messages in `app/orpc/partner/` serve the signed-in partner pages and stay Persian.
- **Step 6:** the sweep is done for the shell, Home and the shared pieces. The Phase 2 slices still hold about 180
  physical classes, most of them scenery placed by hand (`left-[18%]` on a bush). Each Phase 2 agent sweeps its own
  slice, since only it screenshots that page in English: text and layout to logical classes, scenery left physical
  unless the English screenshot shows it wrong. Swapping `left-` for `end-` (and `right-` for `start-`, `ml-` for
  `me-`, `pr-` for `ps-`, `text-right` for `text-start`) is pixel-identical in Persian. Composed scenes that keep their
  physical sides on purpose (Home's runner lane, the 404 and error scenes, chalk-bubble tails) stay as they are.
- **Step 8:** the switch is the one visible change to the Persian pages: «English» in the desktop header's row, the
  footer's bottom line and the «بیشتر» sheet. Persian Home also differs by 3 pixels at the end of the «بیشتر درباره‌ی
  طلا» underline: Chrome paints the underline of one text node (the message) slightly longer than of the two the old
  JSX made. The glyphs and the layout are identical.
- **SEO:** `pageHead` also gives the Persian pages `og:title`, `og:description`, `og:url` and `og:site_name`; nothing
  visible.

## Phase 2: The Remaining Pages

**Who:** one Sonnet 5.5 agent per batch, at medium effort, all running at once, launched by the coordinator after
Phase 1 is approved. Batch A runs at high effort, since it touches the buy card's signed-in states and the server's
reasons.

| Batch | Slices                                                | Notes                                                                                   |
| ----- | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| A     | `course_catalogue`, `course_detail`                   | Course text from the database; the buy card for visitors and signed-in customers.       |
| B     | `help`                                                | The largest copy; FAQ anchors (`#how-buying-works`, …) stay the same in both languages. |
| C     | `privacy`, `about`, `contact`                         | Privacy states that the Persian text is binding.                                        |
| D     | `logbook`, `certificate`, `join_partner`, `not_found` | Certificate and logbook stay unindexed.                                                 |

**Each agent's brief** (the coordinator also writes it to `.tmp-claude/i18n-page-agent-rules.md`):

- Read this plan, the glossary, [storefront-design.md](../storefront-design.md) and the slice's row in
  [legacy-pages.md](../legacy-pages.md).
- Move every string in its slices into `messages/<slice>/fa.json` and `en.json`. Copy the Persian exactly; write the
  English in the glossary's voice; no new hard-coded text.
- Edit only its own slices and their message files. Never `app/routes.ts`, `app/components`, `app/lib`, `app/orpc`,
  the schema or the seed; if it needs a shared change, it stops and says so.
- Its own dev server port (never touch 5173), its own demo accounts, no re-seeding, no commits.
- Screenshots at 390 and 1440 for `fa` and `en` of every layout-changing state; the Persian ones must match the page
  before the change. Run `npm run lint`.
- Report: what changed, the screenshots' paths, and any English it wasn't sure of.

## Phase 4: Sign-in and the Signed-in Pages

Added on 2026-10-23, when the owner asked for English on every page except the Admin. It runs before Phase 3, so the
copy review and the final checks cover everything at once.

| Slice                                            | Page                                  | Persian lines (approx.) |
| ------------------------------------------------ | ------------------------------------- | ----------------------- |
| `layout_account`                                 | The account shell and its navigation  | 25                      |
| `auth`                                           | `/auth`                               | 71                      |
| `assessment`                                     | `/assessment` (free evaluation)       | 152                     |
| `buy`                                            | `/buy`                                | 82                      |
| `account_home`                                   | `/account`                            | 64                      |
| `account_dog_form`                               | New and edit dog                      | 172                     |
| `account_dog_detail`                             | A dog's page                          | 123                     |
| `account_cart`                                   | The cart                              | 125                     |
| `account_purchases`                              | Purchases                             | 56                      |
| `account_profile`                                | Account settings                      | 85                      |
| `account_partner`, `account_partner_leads`       | The partner's pages                   | 64, 87                  |
| Shared (`app/components`, `app/lib`, `app/orpc`) | Pieces and server sentences they show | (counted in step 4a)    |

**4a. Foundation (one agent, Opus 5.5 at high effort, alone).** After Phase 2 is finished.

1. `PERSIAN_ONLY_PREFIXES` (`app/lib/i18n.ts`) keeps only `/admin` and `/rules`. Sign-in, the payment gateway's return
   (`payment_callback`) and every redirect after them keep the visitor's language.
2. `layout_account` in both languages, with the language switch, as the public shell has it.
3. Shared strings these pages show move to `messages/shared/` (dog thumbnails and verdicts, eligibility, account links,
   the sign-out hook, …).
4. Server sentences these pages show move to `messages/server/`: sign-in and OTP errors, the evaluation request,
   checkout and the cart, dogs, the profile, the partner's procedures. Validation messages that reach a form too.
5. **Dates people type.** The dog's birth date and the evaluation's free times are entered in Jalali today. In English
   they are entered and shown in Gregorian; what is stored doesn't change.
6. `InPersianNote` comes off every link whose target now has English; it stays only for `/rules`.
7. The glossary gains the signed-in terms (the evaluation's states, enrollment, the cart, purchases, refunds, the
   partner's leads and commission, the profile's fields).
8. A short "Phase 4 notes" section here for the page agents, as Phase 1 did.

**Done when:** `/en/auth` and `/en/account` render in English shells (page bodies may still be Persian); signing in
from `/en/...` returns to English; the Persian shell and public pages are unchanged; lint, typecheck and build pass.

**4b. Pages (Sonnet 5.5, all at once, same rules as Phase 2).**

| Batch | Slices                                                 | Notes                                                                                    |
| ----- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| E     | `auth`, `buy`                                          | Sign-in by phone and code; the purchase's summary and the gateway's handoff.             |
| F     | `assessment`, `account_home`                           | The evaluation request with its free-time fields; the account's home road.               |
| G     | `account_dog_form`, `account_dog_detail`               | The dog form's fields and validation; the dog's page, its logbook and certificate cards. |
| H     | `account_cart`, `account_purchases`, `account_profile` | Money and dates in both languages; refunds as the ledger records them.                   |
| I     | `account_partner`, `account_partner_leads`             | Commission, IBAN, leads; the partner's QR and link.                                      |

SMS stays Persian (see Later): the sign-in code and the Admin's notices arrive in Persian even on the English site.

### Phase 4 Notes

What 4a built on 2026-10-23, and what it left (the coordinator stopped it at its context budget; the open steps are
listed last and in `.tmp-claude/i18n-phase4a/handoff.md`).

- **Persian-only pages** are now only `/admin` and `/rules` (`app/lib/i18n.ts`). `/en/auth`, `/en/assessment`,
  `/en/buy` and `/en/account/...` render in English shells; the guard's redirect to sign-in, sign-out and
  `navigate({ href: redirectTo })` keep the language through the router's `rewrite`. A `redirect({ href })` skips the
  rewrite, so it goes through `localizedPath({ path })` (`~/lib/i18n`; done in `auth.tsx`). The gateway's return
  carries `?lang=en` (`PAYMENT_LOCALE_PARAM`, `checkout.pay`) and `payment_callback` sends an English customer to
  `/en/account/cart`. Better Auth (phone and code) makes no redirects. The `PARAGLIDE_LOCALE` cookie is in the strategy
  but nothing writes it, so nothing depends on it. `/en/auth?ref=` remembers a partner's code like `/auth?ref=`.
- **Server sentences:** `/rpc` now takes its language from the `x-locale` header as Paraglide's own (a custom
  strategy, `app/server.ts`), so inside a procedure `m.server_…()`, `formatNumber` and the `CENTER`/`HEAD_TRAINER`
  getters answer in the page's language without passing `locale`. A zod message is written
  `{ error: () => m.server_…() }`, never a string built at import. An SMS built inside a customer's request must not
  use a language-aware helper (SMS stays Persian).
- **Never evaluate a message at module level** (a constant, a JSX element, a spread of a getter object): it freezes
  the language the module first loaded in and mismatches on hydration. That was the `/help` console error (the phone
  link in `faq-data.tsx`, now a component). Still to fix in their slices: `account_dog_form/schema.ts`
  (`LOCKED_FIELD_NOTE`), `assessment/guide.ts`, `assessment/components/header-road.tsx`, `account_partner_leads/stages.ts`.
- **Account shell:** `layout_account` is in both languages (`messages/layout_account/`), with the language switch
  (now `~/components/language-switch`) in the wide header and the footer's links. Its navigation says "My dogs",
  "Cart", "Purchases" and, in the person menu, "Account settings", as Help's answers name them; the partner's are "My
  partnership" and "Numbers and customers" ("Customers" on the tab).
- **Shared labels done:** the status and option maps (`EVALUATION_STATUS_LABELS`, weekdays, periods,
  `PAYMENT_STATUS_LABELS`, `DOG_SEX_LABELS`, `VACCINATION_STATUS_LABELS`, `ENROLLMENT_STATUS_LABELS`,
  `REFUND_STATUS_LABELS`) are getters over `shared_…` messages; use them as before, while rendering.
- **Message files:** every Phase 4 slice has its empty pair registered (`messages/<slice>/{fa,en}.json`); page agents
  don't edit `project.inlang/settings.json`.
- **Testing under `/en`:** sign in as usual (`node .tmp-claude/tools/make-states.mjs <port> <phone>`, code 12345; the
  session cookie serves both languages), then open `/en/account/...`. Demo accounts: Sara 09120000004, Ali
  09120000005, Maryam 09120000006, partners 09120000003 and 09120000007.
- **Batches:** E `auth`, `buy`; F `assessment`, `account_home`; G `account_dog_form`, `account_dog_detail`; H
  `account_cart`, `account_purchases`, `account_profile`; I `account_partner`, `account_partner_leads`.

- **Server sentences, done (step 4):** every sentence and zod message a customer or partner page can get from
  `app/orpc/{dog,evaluation,checkout,cart,partner,password,media}` is a `server_…` message (`messages/server/`), called
  when the failure happens, so it answers in the page's language: dog form fields, the locked fields, the evaluation
  request, the cart and «پرداخت» (whose cart items also carry the course's English title), photo and video refusals,
  the new password, and the partner's IBAN and leads. `describeApiFailure` (`~/lib/api-error`) words its own lines in
  the page's language too. A page shows these as before (`data.errors`, `data.fields`); it needs no code of its own.
  A dog's or course's name inside an English sentence is wrapped in Unicode isolates (U+2068 … U+2069), so «⁨پسته⁩
  hasn't been evaluated yet.» keeps its order. `POST /api/evaluation-videos` answers in the language of the `x-locale`
  header (`runInLocale`, `~/orpc/locale`); without the header it is Persian. Admin-only sentences (`user`, the
  Admin's new partner, rejecting an evaluation, `course`, `setting`) and every SMS stay Persian.

- **Shared pieces done (step 3):** `withdraw-evaluation-button`, `copy-link-button`, `video-player`, `dog-photo`,
  `password-input` and `rules-tick` (which keeps its "in Persian" note: `/rules` stays Persian) speak `shared_…`; so do
  `describeDog`/`describeWeight`, `getDogStatus`, `describeWhenFree`, `describeDeposit`/`describeBalance`,
  `formatFileSize` and the demo accounts' notes, read when called. The demo accounts' names stay Persian (they are
  the seeded accounts' own). `describeBalance` is lower case in English ("the remaining …"): put it inside a sentence.
- **Dates people type (step 5):** `entryCalendar()` in `~/lib/date-entry` is the calendar of the page's language:
  Jalali in Persian, Gregorian in English. It gives `months` (names, index 0 = month 1), `fromIso`, `toIso`,
  `isValid`, `monthLength({ year, month })` (31 until both are numbers), `today()`, `dayLabel` and `yearLabel`. The form
  keeps day, month and year as picked (in that order in both languages); the schema turns them into the same
  Gregorian `YYYY-MM-DD` as today. Call it while rendering and inside `superRefine`/`transform`/defaults, never at
  module level. In the dog form (`birth-date-field.tsx`, `schema.ts`, `print-mount.tsx`) and the evaluation request
  (`when-free-fields.tsx`, `schema.ts`) replace `isoToJalali`/`jalaliToIso`/`isValidJalali`/`jalaliMonthLength`/
  `JALALI_MONTHS` and the digit helpers with it:

  ```ts
  const calendar = entryCalendar();
  const thisYear = calendar.today().year;
  const dayCount = calendar.monthLength({ year: Number(year), month: Number(month) });
  // options: calendar.months.map((name, i) => <option value={i + 1}>{name}</option>), calendar.dayLabel(d), calendar.yearLabel(y)
  // schema: calendar.isValid(parts) ? calendar.toIso(parts) : issue; defaults: calendar.fromIso(dog.birthDate)
  ```

  Shown dates (`locked-fields.tsx`, `request-receipt.tsx`) use `formatDate`/`formatTimestamp` from `~/lib/locale-format`.

- **"In Persian" notes (step 6):** off every link to sign-in, the evaluation request, buying and the account. They stay
  on the rules link and on the «بیشتر» sheet's panel link when it goes to `/admin`. The course page's phone buy bar
  fits at 390 in English ("Social Dog", "9,000,000 Toman", "Sign in and add to cart") with no change.
- **Glossary (step 7):** "Signed-in pages" in `english-glossary.md`.

### Phase 4b Notes

All five batches finished on 2026-10-23, after a restart: the first run (five agents, five dev servers and five
browsers at once) ran the machine out of memory. The rerun used three agents sharing one dev server.

- Every customer and partner page reads in English under `/en`; the only Persian left on them is user data (names,
  breeds, notes), which is wrapped in `<bdi>` or `dir="auto"`.
- On the English pages the edge-standing mascots mirror with the page and their bubbles open towards the text
  (`tail="end"` and `ltr:` placement); `ChalkBubble`'s `tail` takes `start`/`end` as well as `left`/`right`.
- The owner's certificate and logbook lists (`certificate.listMine`, `logbook.list`) now name the course in the page's
  language; the Admin's lists stay Persian.
- `npm run i18n:compile` (typecheck, postinstall) writes `--output-structure locale-modules`, the layout the dev
  server uses, so a typecheck beside a running dev server no longer breaks it. `npm run build` still writes one
  module per message (for tree-shaking), so restart a running dev server after a build.

## Phase 3: Review and Finish

**Who:** the coordinator, with an Opus 5.5 copy reviewer and a Haiku agent reading the screenshots.

- One read of all the English together for a single voice and the glossary's terms. This is the copy's approval
  (decision 2): the reviewer fixes what it finds rather than listing it.
- Screenshots of every page in both languages read against the briefs; DOM checks for overflow and console errors.
- Lint, typecheck, build, and the existing Playwright smoke tests.
- Docs: CLAUDE.md (user-facing content is Persian, with English for the public pages), storefront-design.md (the
  English voice and faces), frontend-guideline.md (how to add a string: never inline, always a message), and a row in
  app-spec.md for the English version.
- One commit per batch, when the user says to commit.

### Phase 3 Notes

Done on 2026-10-23.

- **Copy review:** one read of all the English (83 keys and 2 course texts changed, the glossary updated: "my buddy",
  "Add a dog", "sessions" never "lessons", "text message" never "SMS", American "Canceled").
- **Screens:** every page in English at 390 and 1440 (`lang`, `dir`, no horizontal scroll, no leftover Persian
  outside user data). Fixed from it: the dog form's month select on English phones, a demo-account note cut short,
  and a course's Latin name repeating its English title (`latinNameAddsToTitle`, `~/lib/course-format`).
- **Checks:** lint, typecheck, the production build and the Playwright smoke tests pass.
- **Settled by the owner the same day:** Tala is she/her; the brand is «زروان» on the Persian site too (titles, copy
  and SMS texts; «آموزش K9» is retired); the agents' Persian meta descriptions stand.
- **Also fixed:** `/courses`' family stages now lay out in flow, so a long family line no longer runs under the moon
  and the bubble (both languages); «کمیسیون» became «پورسانت» everywhere; the empty cart's second bubble says
  something new; Help's buying outro no longer repeats the step before it.

## Later

When the owner wants it: SMS in the customer's language (a `locale` stored on the user), and `/rules` once its wording
is approved. The Admin stays Persian.
