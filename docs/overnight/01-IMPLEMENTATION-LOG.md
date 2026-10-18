# Implementation log

Newest entries are added at the bottom of each phase. Commits are on `feat/zurvann-overnight-feedback`. Nothing here is deployed.

## Phase A: header, navigation, pages

### Brief (written before the code, as `docs/design-flow.md` asks for a Redesign-verdict shell)

- **Purpose.** A visitor finds the courses, the trainer, a way to talk to her or him, and the partner information in one tap; a customer reaches the free assessment or sign-in without hunting.
- **Role.** The public shell (`layout_public`) wraps every storefront page. It is not a page of its own.
- **Structure.**
  - Desktop (from `lg`, 1024px): logo at the start; four text links (دوره‌ها، درباره‌ی طلا راستی، همکاران، تماس با ما); at the end the gold pill «ارزیابی رایگان» and either «ورود یا ثبت‌نام» (outline) or the signed-in controls (cart and person menu, unchanged).
  - Below `lg`: logo, sign-in or signed-in controls, and the menu button. The sheet holds the pill first, the same four links, then the account block.
  - Footer: the three columns stay; «درباره‌ی طلا راستی» and «تماس با ما» join the contact column; the assessment link leaves the footer (the pill is the one prominent place).
- **Hidden on purpose.** «مربی» (there is one trainer), the header search (search lives on the pages with something to search), «قوانین» (no approved legal text exists) and «پرونده‌ها» (the logbook is Phase G). A link appears only when its page is usable.
- **Style.** Existing tokens only: `bg-jet` bar, `text-sm font-bold text-muted-foreground` links with the current page in `text-foreground`, flat gold pill (`buttonVariants` default, `size="sm"`). No new colour, no new font.
- **Motion.** Colour changes on hover and focus only.
- **Accessibility.** `nav` landmark labelled «منوی اصلی»; `aria-current="page"` on the current link; every control reachable by keyboard with the visible focus ring; the menu sheet is the existing `Sheet`.
- **New pages.** `/about` and `/contact` are static, built only from details the owner supplied on the business card (name, role, 13 years, international credential, service area, phone, Telegram, Instagram, YouTube). No biography, no claims beyond the card.

### Result

- **Header.** `site-header.tsx` shows the four links from `lg` (`NavLink`, the current page in full-strength text), the gold «ارزیابی رایگان» pill and sign-in or the signed-in controls. The header search and the «مربی» link are gone; `site-search.tsx` is deleted.
- **Phone menu.** `mobile-menu.tsx`: the pill first, then the four links, then sign-in or account as outline buttons (one gold button in the sheet).
- **Footer.** The assessment link left; «درباره‌ی طلا راستی» and «تماس با ما» joined the contact column.
- **New pages.** `/about` (`app/routes/about/`) and `/contact` (`app/routes/contact/`), built only from the business card. `contact.ts` now exports each profile separately (`CENTER_TELEGRAM`, `CENTER_INSTAGRAM`, `CENTER_YOUTUBE`).
- **Hidden on purpose, with the reason.** «قوانین»: no approved legal text exists, and the rules say never to ship unreviewed legal text (`03-DECISIONS-NEEDED.md`). «پرونده‌ها / لاگ‌بوک»: Phase G.
- **Checks.** `npm run typecheck` and `oxlint` clean. Headless Chrome screenshots of `/about` and `/contact` at 1440px and the phone menu at 390px were read and look right (`docs/overnight/screenshots/a-*.png`). `/courses` needs the database and was not rendered locally in this step.
- **Docs.** `legacy-pages.md`, `storefront-design.md` and `app-spec.md` updated in the same change (page counts, the nav, the new pages).

## Phase B: simplified homepage

### Brief

- **Purpose.** A first-time visitor understands the site and reaches the courses, sign-up or the free assessment in one or two taps, without a catalogue in their face.
- **Structure, top to bottom.** Hero; **quick actions** (new: three compact cards, each one link: «ثبت‌نام و ورود»، «مشاهده دوره‌ها»، «ارزیابی رایگان»); promises; evaluation panel (explains the assessment, one button); services; the trainer (no button); closing banner (the last ask).
- **Switched off, kept in the repo with their photos.** The four need cards, the priced course grid (the same courses were shown twice) and the team section (two placeholder colleagues). Bringing one back is an import and a line in `home.tsx`.
- **Partner program.** Nothing on the home page describes it, so nothing was removed; the nav's «همکاران» leads to `/join/partner`.
- **Style and motion.** The cards use the existing border, `bg-card` surface and gold icon ring; the only motion is the arrow's nudge on hover (`motion-safe`).

### Result

- `home.tsx` no longer loads the course list: the page renders without the database (the loader only remembers a `?ref=` referral cookie, checked unchanged).
- `quick-actions.tsx` added; `trainer-section.tsx` lost its button (the page already asks for the assessment four times).
- `CLAUDE.md`, `app-spec.md`, `storefront-design.md` and `head-trainer.ts` now say the owner is the only trainer shown and list what is switched off.
- Checks: `typecheck` and `oxlint` clean. Full-page headless-Chrome screenshots at 1440px and 390px were read (`docs/overnight/screenshots/b-home-*.jpg`): no course grid, no team, the cards stack on a phone.

## Phase C: Zurvann mascot and the hero's change rules

### Result

- **Rules (implemented).** The hero follows the visitor, not a clock: a new session or an arrival by a link steps to the next dog; back, forward, reload and waiting keep it; the dots pick one by hand. `app/lib/hero-state.ts` holds the pure rules (7 unit tests); the home loader chooses the dog to paint first from two cookies; `HomeHero` steps on `PUSH` and `REPLACE` arrivals and writes the cookie. The autoplay, its progress bar, the pause button and the unused `slide-progress` animation are gone.
- **Verified in a real browser** (headless Chrome against the dev server, 14 checks, all passing): first visit shows dog 1 and writes both cookies; waiting 9 seconds changes nothing; reload keeps it; a link back to Home steps; Back then Forward keeps it; a dot picks and survives a reload; a returning visitor's new session steps once (1 to 2) and wraps (2 to 0); a visitor who started on another page sees the first dog; a hand-edited cookie falls back to the first.
- **Dialogue.** Only the three approved lines are live. The headline stays as it is (not approved as final); alternatives are in `03-DECISIONS-NEEDED.md`. No new pop-ups: contextual bubbles already exist on the auth page, the empty dashboard, the cart banner and the help header.
- **Mascot plan and assets.** `05-MASCOT-SPEC.md`: growth stages, state rules, asset inventory and prompt proposals. **Blocker:** Zurvann's authentic art does not exist yet; the three stand-in dogs stay and nothing claims otherwise.
- **Performance.** Only the dog showing at first paint gets `fetchPriority="high"`, and the server picks it, so the largest paint is the right image on a full load.
- Checks: `typecheck`, `oxlint` and the hero-state tests clean.

## Phase D: contextual search

### Result

- **Courses.** The catalogue search (title, Latin name, summary) now also reads the family's tab label (the course's kind: «فرمان‌پذیری»، «سگ همدم»، «ورزشی»…), the promised results (`highlights`) and the curriculum lines (`commands`, which hold the sport branches BH, IGP 1 to 3, FH, WUSV). Each field is matched on its own; Persian folding (ی/ي، ک/ك، ZWNJ, spaces, digits, case) is unchanged. The placeholder now reads «مثلاً سگ همدم، CGC یا IGP». Tests: `course_catalogue/search.test.ts` (5, including «ورزشی» typed with an Arabic ي, `igp`, and "no match across two fields").
- **No search in the menu or on pages with nothing to search.** The header search is already gone (Phase A).
- **Articles.** No article route or content store exists, so nothing was built and nothing pretends to search articles. The behaviour the owner described («ادرار هیجانی» returning matches or a truthful empty state) belongs to the article feature; it is in `03-DECISIONS-NEEDED.md`.
- **Logbook.** A public logbook search, if it ships, must read only records marked public (Phase G).
- Checks: `typecheck`, `oxlint` and the search tests clean.
- **Rendered with a seeded database** (a disposable local Postgres, see `04-DEPLOYMENT-AND-ROLLBACK.md`): `/courses`, `/courses/sport`, `/courses/house-manner`, `/auth`, `/help`, `/about`, `/contact` and `/` all answer 200; searching `igp` in the catalogue finds the sport course and the dog's bubble says so (`docs/overnight/screenshots/d-courses-search-igp-1440.jpg`). The Phase B home screenshots were retaken after Phase C.

## Phase E1: sign in with a password

### Result

- **What it is.** Optional. After signing in with a code, a customer or partner sets a password on the profile page («رمز عبور» card) and can then sign in with their number and password. The code stays, and is also the way back in after a forgotten password.
- **Server.** Better-Auth's own `/sign-in/phone-number` does the password check (the `account.password` column already existed; nothing is added for the password itself). New: `password.status` and `password.set` (oRPC, `app/orpc/password/`) and one additive table, `sign_in_failure` (phone number and time of each wrong password, rows older than a day dropped).
  - A password can be set or replaced only within 30 minutes of signing in (`SESSION_TOO_OLD` otherwise), and doing so signs every other session out. There is no «current password» field on purpose: someone who forgot theirs signs in with a code and sets a new one, and there is no separate reset endpoint to attack.
  - A wrong password and an unknown number answer the same (401, same message), so the endpoint can't be used to find out who has an account. A blocked account is refused before the password is tried.
  - 5 wrong passwords for one number in 15 minutes pause password sign-in for that number (429 `TOO_MANY_SIGN_IN_ATTEMPTS`); the code still works, so the owner of the number is never locked out. Setting a new password clears the count. A per-IP rule (20 per 10 minutes) sits on top.
  - Rules for a new password are modest on purpose: 8 to 128 characters, not the person's own number, not a one-character repeat or one of the first passwords everyone tries. No symbol rules.
- **Pages.** The sign-in page has a password step (same welcome dog; «با کد پیامکی وارد شو» and «رمزم را فراموش کرده‌ام», which sends the code and, after signing in, lands on the password card with the field ready). The profile page has the card (two fields, an eye to show what was typed, the dog's line, a «خروج و ورود دوباره» button when the session is too old). A shared `PasswordInput` serves both.
- **Honest limit.** In showcase mode the sign-in code is public (`12345`), so «forgot my password» is exactly as open as signing in. Passwords add convenience now and security only once a real SMS provider exists (`00-AUDIT.md`, `03-DECISIONS-NEEDED.md`).
- **Wording kept true.** The FAQ answer «چطوری وارد می‌شم؟» and `app-spec.md` F1 now describe passwords. The privacy page's list said «رمز عبور نداریم»; it now says a password, if set, is stored only as a hash, and that wrong-password attempts are kept for a day. **These two sentences need the owner's (or a lawyer's) eye** (`03-DECISIONS-NEEDED.md`).
- **Checks.** `typecheck` and `oxlint` clean. 7 integration tests against a real database (`app/orpc/password/integration.test.ts`): hash-only storage, weak passwords refused, stale session refused, replacement signs other sessions out, unknown number = wrong password, the pause (and its end after a new password), blocked account refused. The whole suite passes (86 tests).
- **Verified in a real browser** (headless Chrome against the dev server, 20 checks, all passing): a new number signs up with the code; short, common and mismatched passwords are refused on the field; a good one is saved; the eye toggles; sign-in with the password works; a wrong password and an unknown number show the same message; five wrong passwords pause even the right one; «forgot» ends at the password card with the field focused; the new password signs in and the pause is gone. Screenshots: `docs/overnight/screenshots/e1-*.jpg`.
- **Local-setup note.** The disposable Postgres must run in UTC, like production's: Drizzle reads `timestamp` columns as UTC, so a cluster in another zone makes «now» look hours in the future and the 60-second resend rule never ends. Set once with `ALTER DATABASE … SET timezone TO 'UTC'`.
