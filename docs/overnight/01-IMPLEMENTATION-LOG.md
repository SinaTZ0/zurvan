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

## Phase E3: the cart lives in the account

### Result

- **Server.** One additive table, `cart_item` (user, dog, course; it goes with its owner, dog or course, since nothing points at it) and a `cart` API for the signed-in customer only: `get`, `add`, `remove`, `clear`, `merge`. Every query is scoped to the customer; a dog that isn't theirs and a course that doesn't exist are refused on `add` and dropped on `merge`; adding twice is the same as once; the limit is the existing `CART_MAX_ITEMS`. When a payment settles, the items it bought are taken out of the cart (after the commit and best-effort: the payment and enrollment path was **not** restructured, one call was added after it).
- **Browser.** `cartItemsAtom` is still what every page reads (the six cart consumers are untouched). `addCartItemAtom`, `removeCartItemAtom` and `clearCartAtom` change the browser at once and also send the change to the server, and the server's answer (the whole cart) replaces the browser's, so items added on another device appear; only the newest answer is applied. `CartSync` (mounted by the public and account layouts for customers only, never on the sign-in page, so `finish()`'s `queryClient.clear()` can't drop a merge) reads the account's cart on arrival and when the tab is used again. Signing out empties this browser's copy without touching the account's.
- **Old browsers.** A cart held in a browser from before this change is merged into the account **once** (`zurvan-cart-synced` marks the browser as done); after that the account's cart wins.
- **Found by running it, fixed, and now tested.** The cart page passes a bigger object than the API takes (422 on removal), so the atoms now send exactly `{courseSlug, dogId}`; and a copy held by the browser put paid items back when the customer returned from the gateway, which the marker above prevents.
- **Wording kept true.** The FAQ («سبدم توی گوشی دیگه‌م هم هست؟»), the privacy list's cart row, `app-spec.md` F5, `CLAUDE.md` and `legacy-pages.md` no longer say the cart is browser-only.
- **Checks.** `typecheck`, `oxlint` clean. 6 integration tests (`app/orpc/cart/integration.test.ts`: ownership, idempotence, separation between customers, the limit, merge, paying) and 12 atom tests (`app/atoms/cart.test.ts`, including answer order, refusal, offline and sign-out). Two headless-Chrome runs against the dev server: **14 checks** across two "devices" (an add on A shows on B, an add on B appears on A when its tab is used again, a removal propagates, sign-out keeps the account's cart and empties the browser's, signing in brings it back, an old browser's cart is merged once) and **7 checks** paying from the cart (the demo gateway settles, both items become enrollments, the cart is empty in the account and the browser).
- **Test suite made reliable.** The new paying test exposed a race that was already there: the integration tests share one database and run in parallel, and the dashboard's "money by the Tehran month" test counts money across it, so a payment settled by another file in the middle of its count failed it now and then (1 run in about 6). `vitest.config.ts` now runs test files one at a time (`fileParallelism: false`; the suite takes about 8 seconds instead of 3). The password test's «unknown number» was also a fixed number whose wrong passwords piled up across runs until it was paused; it is now a new number each run and cleaned up. Six full runs in a row: 99 of 99 pass.

## Phase H: partners see their own referrals' payment status

### Result

- **What already existed (checked, not rebuilt).** The partner role and dashboard, the referral link and QR, phone leads, attribution rules (a link beats a lead, the earliest lead wins, an inactive partner attributes no one), the stages lead → registered → bought → lost per person, and commissions as paid or unpaid, with a role guard that keeps a partner away from every other partner's people.
- **What was added (read-only).** Each person who bought now carries the partner's **own commission for them** (amount, and when the Admin paid it, or «منتظر پرداخت»), joined in the same query that already found the purchase date. It shows on the person's row on «شماره‌ها و مشتری‌ها» (`lead-row.tsx`) and is in the screen-reader sentence. A `lost` person and anyone who has not bought show nothing; the purchase's price, course and dog are still never shown (F12). «چطور حساب می‌شود؟» gained one line saying so.
- **Not built, on purpose.** Partners registering customers and dogs on their behalf and seeing a dog's course progress: both depend on privacy and consent decisions that are not made (`03-DECISIONS-NEEDED.md`). Commission percentages, triggers and settlement were **not touched**: the existing 10% default, «first paid purchase» trigger and the Admin's manual «پرداخت شد» stay exactly as they were, and are listed as not-yet-approved commercial rules. No partner logos or external trainers are shown anywhere on the public site.
- **Checks.** `typecheck`, `oxlint` clean. The partner integration test now also proves: nothing owed before a purchase; a phone lead and a link customer both show `{amount, paidAt: null}` after buying (10% of the base, rounded down) and the amount and date after the Admin marks it paid; the loser of a shared number sees no commission and no name; no `price` key on the person. Headless Chrome at 1440 and 390 pixels with a seeded partner (waiting, registered, bought and paid, bought and waiting): two commission lines, one paid with its date and one waiting (`docs/overnight/screenshots/h-leads-*.jpg`).

## Phase E2: consent records and the site rules (built, switched off)

### Result

- **What is built.** One additive table, `consent` (person, kind, **version**, optional dog, accepted time, withdrawn time; rows are never deleted; two partial unique indexes make accepting twice record once), a consent service and a small API (`consent.status`, `consent.acceptSiteRules`). The browser never sends a version: the server records the one in force, so nobody can accept text that isn't published or an old version. The same record, with a dog and a withdraw operation, is what Phase G's public logbook consent uses.
- **What is switched off, and why.** The site rules' wording is legal text the owner has not approved, and it was not invented. `app/lib/site-rules.ts` holds `null`, so there is **no «قوانین» page (404), no nav or footer link, no tick at sign-up, no tick before paying, and nothing is recorded**. Setting the registry (with a version) turns every part on at once; the steps are in the file's header.
- **When on.** The name step of sign-up asks for the tick and stores the acceptance; the cart asks a customer who hasn't accepted the version in force; **the server refuses to start a payment** until they have (`RULES_NOT_ACCEPTED`, so a hand-made request can't skip the tick); a new version asks again.
- **Checks.** `typecheck`, `oxlint` clean. 7 integration tests (`app/orpc/consent/integration.test.ts`): nothing recorded with no rules; the version and time recorded once however often it is accepted and for that person only; a new version asks again and keeps the old record; payment refused without acceptance and allowed after, and not in the way with no rules; a per-dog consent recorded, withdrawn and still on record, never read as someone else's. **Verified in a real browser with temporary placeholder rules** (edited locally, never committed, reverted and the page confirmed 404 again): the page, the header and footer links, the tick on the name step (it won't continue without it and records `site-rules test-1` with it), and the tick on the cart (payment waits for it, then goes through and records it). Preview screenshots: `docs/overnight/screenshots/e2-*-preview.jpg` (the wording in them is a placeholder, not the site's).
- **Found on the way.** `drizzle-kit push` (the CLI) stops to ask whether to **truncate `payment_item`** whenever that table has rows, because it wants to re-add a unique constraint (see `04-DEPLOYMENT-AND-ROLLBACK.md`). The deploy script uses the Drizzle API instead and does not ask.

## Phase G1: the dog's file number, its QR code and its record page

### Result

- **File number.** One additive column, `dog.file_number`: `ZD-` and ten random hexadecimal characters, made by the database default, unique and never edited. Adding it gave every existing dog a number (checked on the disposable database: 9 dogs, 9 distinct numbers). It is part of the dog's API shape, so both pages read it.
- **QR code.** The encoder moved from the partner page into shared `app/lib/qr.server.ts` (the partner card still works through it), and the PNG helper and copy button moved with it. The owner's and the Admin's dog pages each show a **file card**: the number, the QR code on pure white (a dark code on a dark page would not scan), the link it carries, «کپی لینک» and a PNG to print. The Admin can also find a dog by typing its number in the dogs list.
- **The record page.** `/logbook/:fileNumber` is private by default and says so in one answer for everyone: a signed-in owner is sent to their own dog's page, the Admin to the dog's admin page, and **every other case reads exactly the same** (a private record, a number that doesn't exist, text that isn't a number), never with the dog's name, never cached (`Cache-Control: no-store`), never indexed (`noindex`). The lookup behind the redirect answers with a path or with nothing, so it can't be used to find out which numbers are real. `/logbook` takes a number typed any way and opens its address.
- **Checks.** `typecheck`, `oxlint` clean. 3 integration tests (`app/orpc/logbook/integration.test.ts`: the number is made by the database, unique and unchanged by an edit; the owner gets their dog's page and the Admin any dog's, whatever the case typed; another customer, a partner, a number that doesn't exist and a malformed one all get the same nothing) and 3 unit tests for the number's shape. Headless Chrome against the dev server, 15 checks: a stranger sees the private page (no cache, no index, no dog name, identical for a real number, a missing one and a malformed one); the lookup accepts `zd 4bb5…` and refuses «hello»; the owner scanning their own code lands on their dog's page, which shows the number, the QR and the link; another customer sees the private page; the Admin lands on the dog's admin page and finds the dog by its number. Screenshots: `docs/overnight/screenshots/g1-*.jpg`.
- **Wording kept true.** One privacy-page row says what the number is and that the record is private.
