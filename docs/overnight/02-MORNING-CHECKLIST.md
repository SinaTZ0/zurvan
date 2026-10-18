# Morning checklist

The primary handoff. Everything below is on the branch `feat/zurvann-overnight-feedback` and **runs locally only**: nothing from this branch is live (the live site is `main` at `1b7a29d`; see `04-DEPLOYMENT-AND-ROLLBACK.md`).

**How to read an item.** Each has a normal Markdown checkbox and a status written as text. `[x]` means the status text says _Implemented and verified_ and says how it was verified. `[-]` means _Partially implemented_ and says what is missing. `[ ]` means _Pending/blocked_ and says why. Nothing is ticked without a check that was actually run.

**Environment legend.** **Local** = the branch on a developer machine with a database. **Staging** = none exists. **Production** = nothing from this branch.

**To try the branch locally** (the normal setup, `README.md`): check out the branch, `npm ci`, start Postgres, `npm run db:push` (only adds tables and columns), `npm run db:seed:demo`, `npm run dev`, open `http://localhost:5173`. Sign in with any demo number (`09120000004` is a customer with two dogs, `09120000001` the Admin) and the code `12345`. A new number signs up the same way.

---

## A. Header, navigation, pages

- [x] **Implemented and verified.** Desktop navigation: horizontal RTL menu with four links, no «مربی», no search in the menu. _Route:_ any public page. _Test:_ at 1024px or wider read the header: دوره‌ها، درباره‌ی طلا راستی، همکاران، تماس با ما, the current page in full-strength text, and the gold pill «ارزیابی رایگان». _Env:_ Local. _Evidence:_ headless Chrome DOM check (clicked the About link and the logo) and screenshots `screenshots/a-about-1440.png`, `a-contact-1440.png`.
- [x] **Implemented and verified.** Responsive mobile navigation. _Test:_ under 1024px tap «منو»: the pill first, the same four links, then sign-in (or account) as outline buttons. _Env:_ Local. _Evidence:_ `screenshots/a-menu-390.png`.
- [x] **Implemented and verified.** New pages `/about` and `/contact`, built only from the business card. _Test:_ open both; every phone, Telegram, Instagram and YouTube link is clickable and matches the card; no `k9training.ir`. _Env:_ Local.

## B. Homepage

- [x] **Implemented and verified.** Course/price duplication removed; three quick actions; the team section and the four need cards switched off (files kept). _Route:_ `/`. _Test:_ the page has no course grid and no prices; under the hero are «ثبت‌نام و ورود»، «مشاهده دوره‌ها»، «ارزیابی رایگان». _Env:_ Local. _Evidence:_ full-page screenshots `screenshots/b-home-1440-full.jpg`, `b-home-390-full.jpg`.
- [x] **Implemented and verified.** Partner promotion: nothing on the home page describes the partner programme any more (there was nothing to move); «همکاران» in the nav leads to `/join/partner`. _Env:_ Local.

## C. Mascot and hero

- [x] **Implemented and verified.** Navigation-driven hero: a new session or arriving by a link steps to the next dog; back, forward, reload and waiting keep it; dots pick one; no autoplay. _Route:_ `/`. _Test:_ open `/` (dog 1), wait 10 seconds (no change), go to `/about` and click the logo (dog 2), press Back then Forward (dog 2 stays), reload (stays). _Env:_ Local. _Evidence:_ 14 checks in headless Chrome, all passing; 7 unit tests (`app/lib/hero-state.test.ts`).
- [x] **Implemented and verified.** Only the three approved dialogue lines are live; no new pop-ups. The headline «من فقط فرمان نمی‌برم؛ می‌فهمم.» is **still live** because the owner has not supplied the new line (candidates in `03-DECISIONS-NEEDED.md`).
- [ ] **Pending/blocked.** Authentic Zurvann (Malinois puppy to adult) art. _Why:_ it does not exist in the repository; the three stand-in dogs stay and nothing claims otherwise. Spec and asset inventory: `05-MASCOT-SPEC.md`.

## D. Search

- [x] **Implemented and verified.** Course search reads title, Latin name, summary, kind, results and curriculum lines (so «igp» finds the sport course), with Persian folding. _Route:_ `/courses`. _Test:_ type `igp`, then `سگ همدم`, then a nonsense word (empty state). _Env:_ Local. _Evidence:_ 5 unit tests, screenshot `screenshots/d-courses-search-igp-1440.jpg`.
- [ ] **Pending/blocked.** Article search. _Why:_ there is no article route or content; nothing was built or faked. See `03-DECISIONS-NEEDED.md`.

## E. Accounts

- [x] **Implemented and verified.** Password sign-in next to the code, never replacing it. _Route:_ `/auth`. _Test:_ sign in with a code, open `/account/profile`, set a password (try `12345678`: refused; two different ones: refused), sign out, on `/auth` type the number and press «ورود با رمز عبور», sign in. Type a wrong password: «شماره یا رمز عبور درست نیست…», the same text for a number that doesn't exist. _Env:_ Local. _Evidence:_ 7 integration tests and a 20-check headless-Chrome run, screenshots `screenshots/e1-*.jpg`.
- [x] **Implemented and verified.** Reset: «رمزم را فراموش کرده‌ام» sends a code; after signing in with it the profile page opens at the password card with the field ready, and a new password replaces the old one and signs the other devices out. No separate reset endpoint and no password hints exist. _Test:_ five wrong passwords (the sixth try is paused even with the right one), press «رمزم را فراموش کرده‌ام», enter `12345`, set a new password, sign in with it. _Env:_ Local.
- [-] **Partially implemented: showcase caveat.** In showcase mode the sign-in code is the public `12345`, so «forgot my password» is exactly as open as sign-in. Passwords add convenience now and security only once a real SMS provider exists.
- [x] **Implemented and verified.** User profile: the account area, the initial in the header menu, the profile page (name, password) and several dogs per owner (existing, checked as before). _Route:_ `/account`, `/account/profile`, `/account/dogs/new`. _Test:_ sign up, name yourself, add two dogs, sign out, sign in again: both dogs are there. _Env:_ Local.
- [-] **Partially implemented: acceptance of the site rules, with version and time.** Built and verified end to end with a temporary placeholder text, but **switched off**: the wording is the owner's to approve (`03-DECISIONS-NEEDED.md`), so there is no rules page, link or tick yet and nothing is recorded. To turn on: set `SITE_RULES` in `app/lib/site-rules.ts` (steps are in its header). _Test once on:_ sign up (the tick on the name step), open `/rules`, pay with a customer who hasn't accepted (the cart asks first; the server refuses without it). _Env:_ Local.
- [x] **Implemented and verified.** The cart persists across devices (it lives in the account). _Route:_ `/courses/…`, `/account/cart`. _Test:_ sign in on two browsers with the same number; on the first open a course, pick a dog, «افزودن به سبد»; on the second open the site (the cart icon shows 1) and `/account/cart`; add another course there, return to the first browser (the icon shows 2 once the tab is used); remove one on the second; sign out on the first (the cart is still there after signing in again). _Env:_ Local. _Evidence:_ 6 integration tests, 12 atom tests, and two headless-Chrome runs (14 and 7 checks).
- [x] **Implemented and verified.** Orders: payments and enrollments were already stored on the server and listed for the account under «خریدها»; the paid items now leave the cart on every device. _Test:_ pay from the cart (demo gateway), the cart is empty afterwards on both browsers. _Env:_ Local; the gateway is the demo one, no card is charged.

## F. Assessment, eligibility, checkout, payments

- [ ] **Pending/blocked.** Eligibility and assessment, purchasing wizard, deposit, refund ledger, notifications. _Status:_ not started when this draft was written; this section is rewritten as each part lands.

## G. Logbook, QR, certificate

- [x] **Implemented and verified.** Every dog has a unique, stable file number and a QR link. _Route:_ `/account/dogs/<id>` (owner) and `/admin/dogs/<id>` (Admin): the file card with the number, the QR code, the link and «دانلود QR برای چاپ». _Test:_ add a dog, open its page, copy the link, open it signed out (a private record that never shows the dog's name), signed in as the owner (you land on the dog's page) and as another customer (a private record). _Env:_ Local. _Evidence:_ 3 integration tests and a 15-check headless-Chrome run, screenshots `screenshots/g1-*.jpg`.
- [ ] **Pending/blocked.** Session logbook, public/private permissions with consent, certificate. _Status:_ in progress (G2 to G4).

## H. Partners

- [x] **Implemented and verified.** A partner sees the payment status of his own referrals, read-only: each person who bought shows his commission for them and whether it is paid. _Route:_ `/account/partner/leads` (sign in as a demo partner, `09120000003`). _Test:_ sign up a new customer through the partner's link (`/?ref=<code>`, the code is on his dashboard), pay for a course (demo gateway), then open the partner's page: the row shows «پورسانت: … · منتظر پرداخت»; on the Admin's commissions page press «پرداخت شد» and the row reads «پرداخت شد · date». Another partner's customers never appear. _Env:_ Local. _Evidence:_ the partner integration tests, screenshots `screenshots/h-leads-*.jpg`.
- [-] **Partially implemented: partner registers customers and dogs.** Not built: it needs the privacy and consent decisions listed in `03-DECISIONS-NEEDED.md`. Partners can still enter a phone number (a lead) as before; attribution (link, code, lead) is unchanged and tested.
- [x] **Implemented and verified.** No external trainers or partner logos on the public site (nothing was added; the team section stays switched off). _Env:_ Local.

## Cross-cutting

- [ ] **Pending/blocked.** English/Persian switcher. _Why:_ no translated, reviewed content exists; a fake switcher is not shipped. Audit and staged plan: `03-DECISIONS-NEEDED.md`.
- [x] **Implemented and verified.** CF-33 trainer/contact content (already live): name, phone `09214087867`, Telegram, Instagram, YouTube, area «تمام نقاط تهران». **Gaps recorded, not guessed:** no second phone and no WhatsApp number or link exist in the data; no `k9training.ir`. _Env:_ Production (verified after the earlier deploy).
- [x] **Implemented and verified.** Brand placeholders audited, not changed: 31 page titles and descriptions, 9 SMS and sign-in bodies and 1 line of UI copy still say «آموزش K9». _Why not changed:_ a naming decision for the owner (`03-DECISIONS-NEEDED.md`).
- [-] **Partially implemented.** RTL, accessibility, responsive UI, empty/loading/error states: checked on the pages that changed (headless Chrome at 1440 and 390 pixels, keyboard focus order read in the markup); not a full audit of every page.
- [-] **Partially implemented.** Lint, typecheck, test suite, build: lint and typecheck clean and the suite green after every phase so far (99 tests, files run one at a time); the final full run, including the production build, is recorded in `01-IMPLEMENTATION-LOG.md` at the end.
- [x] **Implemented and verified.** Git commits recorded; the branch is not deployed (`04-DEPLOYMENT-AND-ROLLBACK.md`).
