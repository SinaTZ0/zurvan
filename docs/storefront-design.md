# Storefront Design

The look, voice and patterns of the site, as the home page sets them. The visual reference is the two mockups in `image-reference/` (the home page, and a course page); the home page is built from them, and every page that is redesigned or rebuilt follows this doc. Pages still in the old look are listed in [legacy-pages.md](legacy-pages.md). For the steps to design a page, see [design-flow.md](design-flow.md); for code structure, [frontend-guideline.md](frontend-guideline.md).

The tokens are app-wide (`app/app.css`), so the signed-in areas use the same palette and faces: calmer and denser than the storefront, but the same black, gold and voice.

## What the Site Must Feel Like

- **The dog talks to you.** The visitor is greeted by dogs, not by a company. Each section has a dog that speaks in a chalk speech bubble, in informal Persian, about itself: «سلام! من اینجام که زندگی من و تو با هم بهتر بشه :)». Headlines are in the dog's voice too.
- **It sells real people.** The dogs talk about their trainers by first name: the head trainer (`HEAD_TRAINER` in `app/lib/head-trainer.ts`) runs the evaluation, «اول بذار آرمان منو بشناسه», and the team section shows all three trainers as equals. Never an anonymous pool of trainers.
- **Photos everywhere.** Dark, cinematic photos of dogs do the selling; text and UI are quiet around them.
- **Premium, not a gold shop.** Pure black and flat gold. Gold is on buttons, icons, numbers and small accents, never a large headline on the first screen.
- **Private training, one dog.** Never show or imply group classes, seats, a venue or a class schedule.
- **Every road leads to the free evaluation.** It is the main action on every public page.

## The Home Page

`app/routes/home/`, top to bottom. Each section has `aria-labelledby` pointing at its heading.

| Section                    | Component         | Surface                      | Job                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------- | ----------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                       | `HomeHero`        | full-bleed photo on `bg-jet` | Three dogs take turns saying hello: the photos crossfade every 7 seconds and the bubble's line changes with the dog; the headline stays. Every dog is in the photo's end half; the headline sits in the dark start half with no box. Phones: photo on top, words below on black.                                                                               |
| Promises                   | `PromiseStrip`    | `bg-sunken` with hairlines   | Four facts in the dog's voice with gold line icons: at home or outside, one-on-one, a free first meeting, courses that open one after another.                                                                                                                                                                                                                 |
| Needs                      | `NeedsSection`    | page                         | «متناسب با من و تو»: the heading on the start side, four photo cards beside it (house dog, obedience, companion, working dogs). A card sets the course grid's filter and scrolls down to it, so the filter lives in `home.tsx`. From the user's reference; its behavior modification and online consultation cards are dropped. A sideways snap row on phones. |
| Evaluation (`#evaluation`) | `EvaluationPanel` | raised `card`, `rounded-4xl` | The main ask. A cut-out dog in sunglasses leans out over the card's top edge; the four real steps from request to training, numbered in gold.                                                                                                                                                                                                                  |
| Courses (`#courses`)       | `CourseGrid`      | page                         | Filter pills by family, then photo cards (photo, title, summary, sessions, price, «مشاهده دوره»), six to a page with numbered page buttons under the grid: 3×2 on desktop, two columns on tablets, compact rows (square photo, no summary) on phones.                                                                                                          |
| Trainer (`#trainer`)       | `TrainerSection`  | page, a framed photo         | His photo with his dog, the dog's bubble over the photo's dark end, his name and role in gold, three points, «ارزیابی رایگان با آرمان».                                                                                                                                                                                                                        |
| Team (`#team`)             | `TeamSection`     | page                         | «معرفی مربیان»: the three trainers as equals, in tall portraits (the middle one set lower on desktop). Each trainer's dog sits bottom-left and says one line about them in a bubble that breaks out of the photo's top; the name, focus and years sit in a shade in the bottom-right corner, so the dog stays visible. A sideways snap row on phones.          |
| Closing                    | `ClosingBanner`   | photo band on `bg-jet`       | A dog peeks over the bottom edge, ears first; the last ask above it in the empty black. The photo is shown whole (a crop cut through the ears), its sides fading into the page on desktop.                                                                                                                                                                     |

The header and footer live in `app/routes/layout_public/` and wrap every public page.

### Where it sends people

| URL                               | Page                      | Linked from                                      |
| --------------------------------- | ------------------------- | ------------------------------------------------ |
| `/assessment`                     | Evaluation Request (F3)   | every «ارزیابی رایگان» button, footer            |
| `/#evaluation`, `/#trainer`       | home sections             | header nav                                       |
| `/courses/:slug`                  | Course Detail             | course cards                                     |
| `/courses`, `/courses?q=`         | Course Catalogue          | header search, nav, footer, buttons              |
| `/auth`                           | Login / Register          | header                                           |
| `/help`, `/help#how-buying-works` | Help and FAQ              | footer, account footer, Course Detail's buy card |
| `/privacy`                        | Privacy (not built)       | footer                                           |
| `/join/partner`                   | Partner Enquiry (no form) | footer                                           |

## Course Catalogue

`/courses` (`app/routes/course_catalogue/`) lists every course with search and the family pills; its state is the URL (`?q=`, `?family=`, `?page=`). The page's idea: the stock cut-out dog stands behind the filter shelf (a `bg-sunken` band), and its chalk bubble is the live result counter, so the same words that are announced to screen readers are the design. The outline draws in once, on load. Twelve cards to a page; a free-evaluation card closes the page.

## Login / Register

`/auth` (`app/routes/auth/`) is the home hero turned into a form, outside the storefront shell: the dog's photo fills the page, the form sits in its dark half with no box, and the dog's bubble asks the question of the step. Each step has its own dog (the three hero photos): the photo crossfades and the words change; the bubble's outline draws in once, on load. On phones the photo is a band on top that fades into the form.

## Help and FAQ

`/help` (`app/routes/help/`) answers how buying works without a phone call. The idea: the five-stop chalk road under the header is the overview of the journey (free evaluation, courses open, pay, call and training, done) and also the index into the FAQ below, whose six groups carry the same numbered discs (the last group, «ورود و شماره‌ات», is not a step and has none). A group's disc fills gold when it is the `:target`. Answers are plain body copy, not the dog's voice; the dog speaks in the headlines and the one bubble («اول پرداخت، بعد آرمان زنگ می‌زنه»). Question ids are the anchors other pages link to (`how-buying-works`, `after-paying`, `payment-failed`, …); group ids are `evaluation`, `courses`, `paying`, `training`, `done`, `account`. The copy never states refund or cancellation rules, deadlines, expiry, a calendar or lesson tracking: the one money-back sentence is that {آرمان} cancels and returns the money outside the site if he can't take the dog.

## Privacy

`/privacy` (`app/routes/privacy/`) is a calm document with one idea: «کی چی رو می‌بینه» is three small portraits of viewers (you, the head trainer, a partner) rather than a table, and the partner's card also lists what a partner does not see. A slim photo band with the lying shepherd and its bubble sits under the headline; on desktop a sticky rail lists the four sections. **It is a placeholder:** it states only what the app does today and makes no claim about retention periods, deletion rights, third parties or "we never share". It carries no "last updated" date.

## Partner Enquiry

`/join/partner` (`app/routes/join_partner/`) is for the owner of a clinic, groomer or pet shop, not a customer, so its main action is the phone call, not the free evaluation. **It has no form**: the API has no way to receive an enquiry and the Admin has no screen to read one yet (his Partners page is built, but the enquiry table and procedure are not). The hero is the home hero's style with one static photo (the puppy holding its leash) and a bubble addressed to the shop owner («بفرستش پیش آرمان»); below it a three-way strip (link, QR, phone leads), the three steps (call, the Admin creates the account, sign in), the commission card and a phone ask. The commission percent shown is `DEFAULT_PARTNER_COMMISSION_PERCENT`.

## Signed-in Pages

- Signed-in pages are calmer and denser than the storefront: less photo, more information per screen.
- A dog's state is spoken by the dog in its speech bubble, not shown as a label; the status badge is secondary.
- The wording and the one main action for each state live in `app/lib/dog-status.ts` (`getDogStatus`), so every page says the same thing.
- One main action per dog card. The quiet «پس گرفتن درخواست» shows only when the dog is just waiting for its evaluation.
- The Dashboard (`/account`, `app/routes/account_home/`) has no orchestrated moment. Dog Detail (`/account/dogs/:dogId`, `app/routes/account_dog_detail/`) has one: the header bubble drawing in.
- The Cart (`/account/cart`) has one orchestrated moment: the dog's bubble drawing in on the payment banner. Purchases (`/account/purchases`) has none.
- The Dog Form (`/account/dogs/new` and `…/:dogId/edit`, `app/routes/account_dog_form/`) has one orchestrated moment, the dog's bubble drawing in. The dog column is the dog's own page being written (photo or tag, name stamped as typed, a bubble following the section), not the stock cut-out; short either-or questions are pill radios like Assessment's chips.
- Profile Settings (`/account/profile`, `app/routes/account_profile/`) is shared by customers and partners. It has one orchestrated moment, the bubble drawing in; the tag column is the person's own page being written (their initial, their name as typed, the locked login number), the stock dog leans behind its top edge, and the bubble follows the focused card («ثبت شد!» after a save). Settings are reached from the person menu, not a tab.
- The partner's pages (`/account/partner`, `/account/partner/leads`) use the account shell with two tabs of their own. The Dashboard's one idea is the **shop card**: the QR must be dark on light, so on a black page it is a printed card laid on the table (an ivory tile) that he copies, downloads and puts by his till. Leads' idea is the **road**: every person is three stops, and a column of gold shows at a glance where each one stopped; a lost lead is grey and dashed and says only «به اسم تو ثبت نشد». The dog speaks once on the Dashboard and in Leads' empty state; neither page has an orchestrated moment (a new lead's row gets a fading gold ring).

## Admin Pages

The Admin area (`/admin`, `app/routes/layout_admin/`) uses the same tokens, calmer and denser than the signed-in customer pages: plain lists, `card` rows with `border-border`, `text-sm`, targets of at least 40px, one-click buttons. The dog barely speaks (only in `AdminEmptyState`) and there is no orchestrated animation; only what answers a click (a sheet, a dialog) moves. The shell is a short top bar, a rail at the start side on desktop and bottom tabs on phones. Every Admin list loads its whole list once and keeps its filter, page and open drawer as shallow nuqs params; statuses only move forward, so every write goes through `useAdminAction`, which refreshes the list when the row changed under him.

- Payments (`/admin/payments`): a ledger of slips. The idea is the **torn slip**: a paid item with no enrollment is drawn with a dashed destructive outline, never as a debt (no refunds are recorded). Failed and pending payments collapse to one calm line.
- Enrollments (`/admin/enrollments`): a call sheet. The idea is **one block per customer**, not per enrollment: the customer's number is the first thing in the block (a full call button on phones), and the lines beside it carry the two endings. «لغو» says in its dialog that money goes back outside the app.
- Evaluations (`/admin/evaluations`): a contact sheet. The idea is that each row carries up to three of the customer's photos and a video chip, so the Admin skims the queue by faces and opens a request only to call. The drawer is a `Sheet` because the `Drawer` component positions physically and is wrong in RTL. The open request is `?evaluation=<id>` (the new-request SMS links to it), and it stays open on the new status after an answer.
- Dashboard (`/admin`): an overview that is dark when there is nothing to do. The idea is **only what waits for him is lit**: a tile with something in it has its number in flat gold and a gold ring, a tile at zero is a calm card with a plain sentence, so a good day shows no gold at all. The paid-not-enrolled tile keeps Payments' dashed torn-slip outline. Enrollment, money and course numbers are ivory and never lit.
- Dogs (`/admin/dogs`): a register read by faces and stamps. Each row starts with the dog's photo and ends with one pill (`DogEvaluationStamp`), so he can run down the edge and know who is where on the road. The whole row is the link (the name carries a stretched link; the owner's number sits above it).
- Dog Detail (`/admin/dogs/:dogId`): the ladder. Courses are rungs in catalogue order, because courses open one after another: a passed rung is a filled gold check, an open one a gold ring, a locked one a lock with the reason that names the rung to climb first. The few buttons on a rung are the only gold buttons on the page besides «ارزیابی شد».
- Partners (`/admin/partners`): the pay sheet. Paying a partner is a bank transfer outside the app, so each block is arranged in the order he works: where to send (the Sheba in groups of four, one tap to copy), the sum, then «پرداخت شد» per commission (no bulk button, so each partner SMS is true). A partner who hasn't written his Sheba gets a line and a call button instead. The roster and the partner drawer (`?partner=`) carry his people and the deactivate switch.

## Pieces

| Piece                      | Where                                           | Use                                                                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SpeechBubble`             | `app/components/speech-bubble.tsx`              | The dog's words in `font-hand`, inside a hand-drawn chalk outline with a tail pointing back at the dog. `tail` (and `lgTail` for desktop) picks the tail's edge and end. Opaque black inside, so it reads over photos. `drawIn` is for the page's one moment.       |
| `ChalkDoodle`              | `app/components/chalk-doodle.tsx`               | White marker doodles (heart, paw, crown, arrows, bone, sparkles, swoosh, exclamation) from `public/photo/home/doodle-*.webp`. Decoration only. One or two per section, near a dog or a bubble.                                                                      |
| `DogPhoto`                 | `app/components/dog-photo.tsx`                  | A dog's photo in its frame; when there is no photo, the flat engraved `DogTag` on a sunken box.                                                                                                                                                                     |
| `WithdrawEvaluationButton` | `app/components/withdraw-evaluation-button.tsx` | The quiet «پس گرفتن درخواست» for an evaluation request that is still waiting, on the Dashboard and Dog Detail.                                                                                                                                                      |
| `DogThumb`                 | `app/components/dog-thumb.tsx`                  | A small round photo of the dog, or its first letter on a disc, for lists of dogs.                                                                                                                                                                                   |
| `DogEmptyState`            | `app/components/dog-empty-state.tsx`            | The cut-out dog with a bubble, a title, a sentence and one gold button, for an empty signed-in page.                                                                                                                                                                |
| `PersonMenu`               | `app/components/person-menu.tsx`                | The signed-in person's pill and menu, shared by the storefront and account headers.                                                                                                                                                                                 |
| `CourseCard`               | `app/components/course-card.tsx`                | A course as a photo card (photo, title, summary, sessions, price, «مشاهده دوره»); `showPrerequisites` adds the «بعد از» line. Used by the home grid and the catalogue, with `CourseFamilyFilter` (the family pills), `Pagination` and `app/lib/course-families.ts`. |

These live in `app/components/` because several routes use them.

## Colour and Surfaces

The tokens are in `app/app.css` ("Black & Flat Gold"). One dark theme; there is no light mode.

- **Black:** the page is pure black (`--base: #000`). Raised surfaces are neutral greys (`card` `#121212`, `popover` `#1a1a1a`), never warm or tinted: under gold, a warm black reads as mud.
- **Gold:** `primary` `#F5B83D`, flat, with near-black text on it. For buttons, icons, step numbers, the selected filter and small accents. `border` is a faint gold hairline. The `gold-leaf` and `text-gold-leaf` utilities still exist for the old pages, but they are flat gold now: no metal sheen.
- **Text:** ivory (`foreground`); `muted-foreground` for secondary text. **Chalk** (`text-chalk`, white) is only for speech bubbles and doodles.
- **Layers, back to front:** `sunken` (a band), page, `card` + `shadow-sm` (raised), `popover` + `shadow-lg` (overlays). `jet` is the header and hero surface.
- **Photos carry the warmth.** Don't add glows or gradients for colour; use dark gradients only to let text sit on a photo, from the text side.

## Type

- **Three faces, three jobs.**
  - `font-display`: **Estedad**, heavy (`font-black`). The hero headline and section `<h2>`s only.
  - `font-sans`: **Vazirmatn**, for everything else, including `<h3>`s inside a section.
  - `font-hand`: **Marhey**, only inside speech bubbles. Never for UI or body text.
- The stencil face (`font-stencil`) is for the brand's «K9» only.
- **Sizes:** `text-display` for the hero headline, `text-h1` for section titles on the home page, `text-lead` for the hero's line. Body, buttons and inputs stay on Tailwind's static scale.
- **Persian needs room:** tall line heights (the tokens carry them), never negative letter spacing, `text-balance` on headings, `text-pretty` on paragraphs.
- **Numbers** in Persian digits (`formatNumberFa`, `toLocaleString("fa-IR")`). Latin names and phone numbers in `dir="ltr"` or `<bdi>`.
- No single word in a headline coloured or styled differently, and no small labels above section titles.

## Actions

- **Buttons are pills** (the base style is `rounded-full`). `default` is flat gold, the main action; `outline` is the quieter alternative. `size="lg"` for page-level actions, `size="sm"` inside cards.
- **One main action per view, one quieter alternative.** Never two equal buttons side by side.
- **Button wording is plain**, even though the page speaks as the dog: «ارزیابی رایگان بگیر», «دوره‌ها را ببین», «مشاهده دوره». It says what happens.

## Voice and Copy

- **The dog speaks** in headlines and bubbles: first person, informal spoken Persian (`می‌شه`, `منو`, `خونه‌مون`), short, warm, a little playful: «من فقط فرمان نمی‌برم؛ می‌فهمم.», «چی می‌تونم یاد بگیرم؟». Supporting paragraphs can stay in the dog's voice; course data (titles, summaries) stays as the catalogue writes it.
- **Facts only.** The dog describes how training here works (private, at home or outside, free evaluation first, pay and then Arman calls), never promises results it can't back.
- Course facts are approximate and say so: use `describeSessions`, `describeAge`, `describePlace` and `formatTomanShort` from `app/lib/course-format.ts`.
- Never write that every dog should take CGC or almost every dog BMC.
- Behavior modification is dropped: don't mention it.

## Layout

- Content sits in `site-container`; photo bands go full width and put their content back in one.
- Sections are separated by `pt-section-lg` on the home page. Anchored sections carry `scroll-mt-24`.
- Desktop splits are asymmetric (7/5, 5/7), not centred halves.
- **Desktop and phone are designed separately.** The home page's examples: the hero's photo goes on top on phones with the words below; the cut-out dog sits on the card's top edge on phones and stands at its end on desktop; the bubble's tail points up at the dog on phones and across at it on desktop.
- Radii: `rounded-3xl` for cards and photos, `rounded-4xl` for a big panel, `rounded-full` for buttons and pills.

## Imagery

- **Dark, cinematic dog photos:** low-key light, warm amber rim light, black backgrounds, no text. They are generated by the user from prompts; [image-reference/prompts.md](../image-reference/prompts.md) has the shared style line and the prompts used so far. For a new page: write the prompts in the same style (several small photos go 4 to a sheet, 2×2 at 1536×1024; cut-outs on a transparent background), the user generates them, then slice and export them.
- **Export:** WebP into `public/photo/home/` (or a folder per page), about 750px wide for cards and 900/1536px for full-width photos, with a `<picture>` source for desktop. Every image has its intrinsic `width`/`height`; `loading="lazy"` unless it's on the first screen (then `fetchPriority="high"`).
- **Course photos** are each course's `cover` in `app/db/seed-courses.ts` (re-seed with `npm run db:seed`).
- **Cut-outs** (a dog on a transparent background) may break out of a card's edge; that's the one place a photo leaves its frame.
- Persian `alt` text describes the scene; doodles get `alt=""`.

## Motion

- **One orchestrated moment per page at most.** The home page's is the hero bubble drawing its chalk outline, then its words appearing (`drawIn`). No fade-in on every section.
- **The hero slideshow** is the one piece that moves on its own: a slow crossfade with a gentle push-in. A gold progress bar per photo drives it (the next photo comes when the bar's animation ends), with a pause button beside the bars, as WCAG asks of anything that moves for more than 5 seconds. Reduced motion never advances it; the bars still pick a photo. Don't add autoplaying carousels elsewhere.
- Hovers: a course photo zooms slightly, an arrow nudges toward the reading direction. Only `transform` and `opacity`, behind `motion-safe:`.
- Reduced motion shows everything finished, without movement.

## Loose Ends

- **Placeholders:** the head trainer's name, years and photo; the other two trainers' names, focuses and years; the course prices; the footer phone number. The photos are generated stand-ins until the owner has real ones.
- **Working and sport dogs** have no price and show «بعد از ارزیابی»; they are a future feature (app-spec F8).
- **Help copy to confirm with the owner:** the answers are written from app-spec F1 to F6; the owner should read them once (especially «اگه آرمان نتونه سگمو بپذیره چی؟», `boarding` and `no-price`).
- **Privacy is a placeholder** until the owner sends real legal text. To confirm with him: (1) dog and evaluation photos are served by an unguessable link, so anyone with the exact address can open them (only evaluation videos are private), and the page says so; (2) the sign-in page's «به هیچ‌کس نمی‌دهیم» claim, and who the SMS provider and the payment gateway will be once they replace the showcase ones; (3) the «پرداخت‌ها» row says the card number and password never reach the site: true of the redirect design, to re-check with the real gateway; (4) retention and deletion: the page only says dogs and payments are never deleted from an account; (5) a partner sees commission amounts, which at 10% reveal a first purchase's total, while the page lists payments among what a partner doesn't see (F12's wording).
- **Partner Enquiry has no form.** A form needs a public `partner.enquire` procedure, a `partner_enquiry` table, an SMS to the Admin, a per-IP limit and an app-spec edit; do it together with the Admin's Partners page, where enquiries can be read. The page describes the referral link, QR code and phone leads, which the Partner Dashboard shows. The commission percent is a constant, but the Admin can change the setting: if he does, the page is stale until it reads the setting.
- **Leftover assets:** most of `public/demo/` and the old files in `public/photo/` (outside `home/`) are unused or only used by legacy pages. Delete them as those pages go.
