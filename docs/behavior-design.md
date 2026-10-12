# Behavior Design

Behavior modification requests end to end (spec 3.7, B13, B15): the public request page, the customer's My Behavior
Requests, the trainer's Behavior Requests list and Behavior Request Detail, and what paying a plan changes in Checkout.
The request page is public, so it follows [storefront-design.md](storefront-design.md); the rest are working screens and
follow [customer-area-design.md](customer-area-design.md) and the paper trail of
[assessment-design.md](assessment-design.md) and [training-design.md](training-design.md). For the steps behind each
brief, see [design-flow.md](design-flow.md).

> **Status: built.** The briefs were approved by the owner and the pages follow them: the API (`behaviorRequest.*`, the
> video routes, the plan paid through `order.*`), the four pages, the shared pieces and the Checkout changes. The
> trainer's tab also shows how many requests wait for an answer.

## What It Must Feel Like

- **Showing a problem to a doctor, not filling a ticket.** The owner is often worried or embarrassed (a dog that
  bites). The page asks for the three things Arman needs to judge it (what, a video, where) and nothing else, and it
  says who sees the video: «فقط آرمان و مربی سگت ویدیوها را می‌بینند.»
- **Arman answers with a plan, in his own words.** The reply is not a status change: it is a short note, a number of
  sessions and a price, signed by him. The screen that shows it reads like a prescription slip, not an invoice.
- **A deadline you can see, never a threat.** A plan is payable for 7 days (B13). The customer sees how many days are
  left as a physical thing, and an expired plan reads as «فرصت تمام شد؛ اگر هنوز می‌خواهی، درخواست تازه بفرست.», not
  as a failure.
- **Never say the rule.** Whether a dog "needs" a behavior plan after CGC, or that most plans are 6 to 10 sessions,
  is not said anywhere.

## The One Idea: the Plan Slip

The **plan slip** (برگه‌ی برنامه) is the third piece of the paper trail after the assessment slip and the receipt: a
slim ticket on `sunken` with a perforated edge. It carries what Arman proposed: the number of sessions, the price set
large, his note quoted and signed «— آرمان». Along its perforated bottom edge runs a **strip of seven notches, one per
day of validity, punched out one per day that has passed** (the sessions' punch-card vocabulary, now for time). The
strip is the whole deadline: 7 whole notches = «۷ روز فرصت داری», 1 left = «فقط تا فردا»; punched all the way =
expired, and the slip turns muted with «منقضی شد» across the strip.

It is one custom component (`PlanSlip`, `app/components/`) in three places:

| Where                   | Size / state                                   | Finish                                                         |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| My Behavior Requests    | full, with the notches and the pay button      | the page's one gold-leaf object is the button on it            |
| Behavior Request Detail | live preview under the form, empty until typed | engraved; sessions, price and the date it will expire as typed |
| Checkout                | not used: the receipt shows the item           | (the plan's sessions are a line on the receipt)                |

Reduced motion changes nothing: the slip is static. The page's moment is the stamp (below).

## Design Plan

Within the app's one theme (tokens in `app/app.css`); nothing is added to the palette.

- **Colour:** slate page, `card` for raised panels, `sunken` for the slip and the empty states, flat `primary` gold
  for links, the selected category's ring, the video upload's progress and the notches' punch rim, `gold-leaf` once
  per page (the pay button on a proposed plan; «ثبت برنامه» on the trainer's detail; the stamp on arrival after
  sending). `success` only for «پرداخت شد», `destructive` only for rejecting and withdrawing.
- **Type:** Amiri for one line per page (the `h1` of the request page, the dog's name on the trainer's detail),
  Vazirmatn elsewhere on the static scale. The price on the slip is `text-2xl font-extrabold tabular-nums`; sessions
  are the same weight one step down.
- **Layout:** 7/5 with the action or preview column sticky on desktop; one column on phones, with a fixed bottom bar for
  the one action.
- **Principle:** each page answers one question first: _what do I send?_ (request), _where is it?_ (My Behavior
  Requests), _what is waiting for me?_ (trainer's list), _what is this dog doing, and what do I propose?_ (detail).

---

## Behavior Modification Request: `/behavior-modification`

- **Purpose:** show Arman the problem (dog, what, a video, where) and ask for his plan.
- **Role:** entry, public (in `layout_public`), linked from the course detail of «اصلاح رفتار», the home page's
  behavior door, the header and the footer. Next: My Behavior Requests with the new request stamped. Signed out →
  `/auth?redirectTo=/behavior-modification…`, which comes back here.
- **Structure:**
  1. **Header** (plain slate): `h1` in Amiri «مشکل رفتاری سگت را نشانم بده», one `text-lead` line («ویدیویی از رفتار
     سگت بفرست. خودم می‌بینم و می‌گویم چند جلسه و با چه هزینه‌ای درستش می‌کنیم.»), three `Fact`s: «برای هر سن و نژاد»،
     «ویدیوها خصوصی می‌مانند»، «پاسخ با برنامه و قیمت». At the end, Arman's small round portrait with one signed sentence.
  2. **The form**, one sheet in four numbered parts (a sequence), each a `legend` + hairline like the Dog Form:
     1. **کدام سگ؟** The assessment page's dog tiles. A dog with a request in progress or in a behavior plan is dimmed
        with its reason and the way out: «درخواست در جریان است» → My Behavior Requests; «در برنامه‌ی اصلاح رفتار است» →
        its Enrollment Detail. «سگ تازه» as on the assessment page, with `redirectTo`.
     2. **مشکل چیست؟** The nine problems and «سایر» as a wrapping set of selectable chips (one choice; the owner's
        wording, `BEHAVIOR_PROBLEM_CATEGORY_LABELS`), then a textarea («از کی شروع شده؟ چه وقت‌هایی بدتر می‌شود؟ قبلاً
        چه کار کرده‌ای؟») with a character hint at 3000.
     3. **ویدیو:** the page's uploader. A dashed drop area on `sunken` («تا ۳ ویدیوی MP4 یا MOV، هرکدام تا ۱۰۰ مگابایت»);
        each picked file becomes a tile at once: the first frame (`<video preload="metadata">`), the name and size
        in Persian digits, a flat-gold progress line while it uploads (XHR progress), then a check and «حذف». An
        error (wrong format, too big, too many unsent) shows in the tile in `destructive`. Under it: «فقط آرمان و مربی
        سگت ویدیوها را می‌بینند. از چند زاویه و از نزدیک بگیر.»
     4. **کجا و کی؟** The address of the sessions and a textarea for the days and times that suit, as on the booking
        page (same wording, so owners know it).
  3. **The slip** (desktop: sticky end column; phone: a fixed bottom bar with the button): fills in as the parts are
     chosen: the dog's thumbnail and tag, the problem, the video count, the first line of the description. Under it:
     «آرمان ویدیوها را می‌بیند و برنامه‌ای با قیمت می‌فرستد. تا وقتی نپرداخته‌ای هزینه‌ای نداری.» and the gold-leaf
     «درخواست را بفرست».
- **States:** signed out: parts 1–4 replaced by one panel on `card` («برای فرستادن درخواست، اول با شماره موبایلت وارد شو.»
  and «ورود و ادامه»), like the assessment page; not a customer: the page says it is for dog owners; no dogs: part 1 is one
  line and «سگت را معرفی کن»; every dog blocked: part 1 explains and links to My Behavior Requests; no behavior course
  open (`options.course` null): «فعلاً درخواست نمی‌گیرم» and the center's phone. The submit button is disabled until
  there is a dog, a category, a description, an address, times and at least one finished upload; while an upload runs it
  says «ویدیو در حال بارگذاری است». Field errors next to their part; `NOT_ELIGIBLE` in the form's alert. Input is kept
  after a failure. Rendered on the server.
- **Design:** desktop (1440): header across; below it 7/5, the form in the start column (parts at ~44rem), the slip sticky
  in the end column. Eye: `h1` → the first unfilled part → the video tiles → the slip's button. Phone (390): one column,
  dog tiles in a horizontal row, chips wrapping, video tiles stacked full width, the bottom bar from part 1 on.
- **Style:** page surface; the header on plain slate; the slip on `sunken` with the faint inner shadow of an engraving
  plate; flat gold for the selected chip, part numbers and progress; the gold-leaf button the only gold leaf.
- **Motion:** colour on hover and focus; a chip fills in 150 ms; the slip's lines cross-fade as they fill; the progress
  line is the only thing that moves by itself. No orchestrated moment: it belongs to the next page.

## My Behavior Requests: `/account/behavior-requests`

- **Purpose:** see where each request stands, pay Arman's plan, or take a request back.
- **Role:** list, in the account area; a new tab «اصلاح رفتار» after «ارزیابی‌ها» (`account-nav.ts`). Reached from the
  tab and after sending (`?sent=<id>`). Next: Checkout (a plan's pay button), Enrollment Detail (a paid one),
  `/behavior-modification` (a new request).
- **Structure:**
  1. **Header:** `h1` «اصلاح رفتار», one line («مشکل‌هایی که برای آرمان فرستاده‌ای و برنامه‌ای که برایشان داده.») and the
     outline «درخواست تازه» at the end.
  2. **در جریان:** one raised `card` per request in progress (submitted or proposed), newest first. Each: the dog
     (thumbnail, name, link to its page), the problem as a flat-gold badge, the date sent, the description folded under
     «توضیح تو» with the video list (name, size, a play dialog), then by status:
     - **submitted:** a quiet sentence («آرمان هنوز ویدیوها را ندیده. معمولاً ظرف یکی دو روز جواب می‌دهد.») and the
       ghost «پس گرفتن درخواست».
     - **proposed:** the **plan slip**: sessions, price, Arman's note, the notches and the line «تا شنبه ۲۶ مهر ساعت ۱۷
       فرصت پرداخت داری»; the gold-leaf «پرداخت {price}» (→ `behaviorRequest.checkout`, then Checkout) and the ghost
       «پس گرفتن درخواست».
  3. **قبلی‌ها:** a ruled ledger, newest first, unboxed: date, dog, problem, a status badge. A row opens in place:
     - **paid:** the plan as a small slip and «برو به آموزش» (Enrollment Detail);
     - **declined:** Arman's reason quoted and signed «— آرمان», and «درخواست تازه»;
     - **expired:** the muted slip with «منقضی شد» and «درخواست تازه»;
     - **withdrawn:** «این درخواست را پس گرفتی.»
- **The stamp, the page's one moment.** Arriving with `?sent=<id>`, that card is first and the existing `Stamp`
  («فرستاده شد») lands on its corner once; then `sent` is dropped from the URL. Reduced motion: it is simply there.
- **States:** empty (no requests): one panel on `sunken`, «هنوز مشکلی نفرستاده‌ای», «ویدیوی کوتاهی از رفتار سگت کافی است.»
  and the gold-leaf «درخواست بفرست». In progress empty but past not: one muted line. Pay errors (`NOT_PAYABLE`, the plan
  ran out meanwhile) show in the card's alert and the list reloads. Withdraw asks in a dialog naming the dog.
- **Design:** desktop: header row; the cards in one column at ~44rem with the slip beside the description on wide
  screens (slip at the end column of the card); the ledger full width. Eye: the slip's price → the pay button →
  the notches. Phone: the card stacks (description, slip, button full width, withdraw).
- **Style:** page surface; in-progress cards on `card` + `shadow-sm`; the slip on `sunken` inside the card; the ledger
  unboxed with hairlines.
- **Motion:** the stamp; the row opening; the video dialog opening. Nothing else.

## Trainer: Behavior Requests: `/trainer/behavior-requests`

- **Purpose:** see which requests wait for Arman's answer, and which plans are out.
- **Role:** list; a new tab «درخواست‌ها» in `trainer-nav.ts` (with a small count of waiting ones when there are some).
  Next: Behavior Request Detail.
- **Structure:**
  1. **Header:** `h1` «درخواست‌های اصلاح رفتار», a segmented filter (در جریان / پاسخ‌داده‌شده / همه).
  2. **منتظر جواب:** the to-do, on `card` with the flat-gold start border: dog tag and name, the problem, the customer's
     name, how long ago it was sent («۳ ساعت پیش», the oldest first), the number of videos, «ببین و جواب بده».
  3. **برنامه فرستاده‌ای:** a ledger: dog, problem, the plan's sessions and price, and the days left on it (the strip of
     notches, small).
  4. **تمام‌شده** (with the filter): paid, declined, withdrawn and expired, with a badge and date.
- **Empty:** «درخواستی منتظر جواب نیست.» on `sunken`.
- **Design:** desktop: full-width ledger with aligned columns (dog, problem, customer, age, chevron); phone: rows stack,
  the to-do rows keep a 44 px target.

## Trainer: Behavior Request Detail: `/trainer/behavior-requests/:id`

- **Purpose:** watch the videos, read what the owner says, and answer with a plan or a decline.
- **Role:** detail + form, reached from the list. Back to the list. Not another trainer's: «این درخواست پیدا نشد.»
- **Structure:** the Assessment Detail's 5/7 shape, with the videos first.
  1. **Header:** back link «درخواست‌ها»; the dog's name in Amiri (`h1`), the status badge, the problem and when it was sent.
  2. **The case** (start column): the video players stacked (native controls, `preload="metadata"`, the file name and size
     under each; a download link as a fallback for formats a browser can't play, such as iPhone HEVC in Chrome); the
     customer's description as a quote; then the dog (`DogPortrait`, its facts and the **behavior and medical notes** set
     large), the address (with «نشانی را کپی کن»), the preferred times quoted, the customer's name and phone (`tel:`).
  3. **The answer** (end column, sticky):
     - **submitted:** two tabs on one card: «برنامه بده» and «رد کن». The plan form: sessions (stepper, 1–100), price in
       toman (Persian digits accepted; the form converts to Rial), «توضیح برنامه» (required: «صاحب سگ این را می‌خواند»), and
       under them the **live plan slip** showing exactly what the customer will get, including the date it expires
       («۷ روز فرصت: تا شنبه ۲۶ مهر ساعت ۱۷»). The gold-leaf «برنامه را بفرست». The decline form: a reason (required,
       «صاحب سگ این را می‌بیند. مثلاً: اول یک ارزیابی حضوری لازم است.») and the destructive-tone «رد کردن درخواست»
       (a confirm dialog).
     - **proposed:** the sent plan on the slip with its notches and «ویرایش برنامه» (replaces it, restarts the 7 days, and
       cancels an order the customer already opened; the form says so) and «رد کردن».
     - **paid:** the slip, «پرداخت شد», and a link to the enrollment («زمان‌بندی جلسه‌ها»).
     - **declined, withdrawn, expired:** the status, the reason or date, nothing to do.
- **The one idea: the answer is the slip.** The trainer composes the plan on the object the customer will see, so
  the number of sessions and the price are obviously the point and the deadline is never a surprise.
- **States:** saving errors in the form's alert (`NOT_ANSWERABLE` when the customer withdrew meanwhile: the page reloads
  to the new status); the button spins while saving; success: a toast «برنامه فرستاده شد» and the page shows the
  proposed state.
- **Design:** desktop 5/7 flipped for reading: the case (7) at the start, the answer (5) sticky at the end, so the
  videos stay beside the form while writing. Eye: the video → the behavior notes → the sessions and price → the
  button. Phone: header, the answer first only when it is the trainer's turn? No: the case first (the trainer must watch
  before answering), the answer after, with a fixed bottom bar showing «برنامه بده» that scrolls to it.
- **Style:** page surface; the answer on `card` + `shadow-sm`; the case unboxed with hairlines; videos on `sunken`
  frames; the button the one gold-leaf object besides the dog's tag.
- **Motion:** the slip's numbers update as typed (cross-fade, no counting animation); nothing else.

## Checkout and Enrollment Detail: what changes

- **Checkout:** a plan item reads «اصلاح رفتار · برنامه‌ی {n} جلسه‌ای» with the dog; the place line shows the address; there
  is no boarding line; «تغییر» is replaced by «برنامه‌ی آرمان» linking to My Behavior Requests (the plan can't be edited
  here). A plan that ran out meanwhile shows `NOT_PAYABLE`'s sentence above the button, as any lapsed order does.
- **Account and trainer tabs:** «اصلاح رفتار» after «ارزیابی‌ها»; «درخواست‌ها» after «شاگردها».
- **Course Detail:** the behavior course's action («درخواست بفرست») already leads to `/behavior-modification`.
- **Not in this round:** the trainer's Enrollment Detail doesn't show the request's videos yet (a link from the enrollment
  to its request is a small follow-up); My Orders and the customer's Wallet (item 3 of the prompt) wait for the next session.

## Shared Pieces This Needs

| Piece                         | Where                                      | Note                                                                            |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `PlanSlip`                    | `app/components/plan-slip.tsx`             | sessions, price, note, notches; `view`, `preview` and `muted` states; a story   |
| `BehaviorStatusBadge`         | `app/components/behavior-status-badge.tsx` | like `EnrollmentStatusBadge`, from `BEHAVIOR_REQUEST_STATUS_LABELS`             |
| `VideoPlayer`                 | `app/components/video-player.tsx`          | native `<video>` in a `sunken` frame, name, size, download fallback             |
| `useVideoUpload`              | `routes/assessment`-style route hook       | XHR to `POST /api/behavior-videos` with progress; used only by the request page |
| `formatFileSize`              | `app/lib/` (Persian digits, «۱۲ مگابایت»)  | used by the uploader and the players                                            |
| Account and trainer nav items | `account-nav.ts`, `trainer-nav.ts`         | «اصلاح رفتار»; «درخواست‌ها»                                                     |

## API

- Customer: `behaviorRequest.options` (dogs with the reason one can't start a request), `submit`, `listMine`, `withdraw`,
  `checkout` (creates the pending order for a proposed plan; go on to `/account/checkout/:orderId`).
- Trainer (and the Admin as head trainer): `behaviorRequest.trainer.list`, `get`, `propose`, `decline`.
- Videos: `POST /api/behavior-videos` (multipart `file`, customers), `GET` and `DELETE /api/behavior-videos/:id`
  (streamed with ranges to the uploader, then the request's customer and trainer and the Admin; everyone else gets 404).
- `order.get` items now carry `behaviorRequestId` and `planSessions`. Paying checks the plan again (status, the 7 days,
  the price), also when the gateway calls back later, so no job is needed for correctness.

## Decided

- **A request carries the address and the preferred times**, so paying a plan is one click to Checkout (the enrollment
  needs both) and the training goal is `home`.
- **One request per dog at a time**, and none while the dog is in a behavior plan (a dog has one live enrollment per
  course anyway). A second problem is sent after the first is answered.
- **A request goes to the behavior course's owner trainer**, the head trainer by default; the plan's enrollment belongs
  to the trainer who wrote it.
- **A trainer can replace a proposed plan** (typo in the price): the 7 days restart and a started order is cancelled.
- **Plan expiry is lazy**: reads mark due plans `expired`; paying checks the deadline itself.
- **Videos are private and app-streamed**, not served by nginx; they are stored as uploaded (no transcoding).

## Open for the Owner

- Whether `HEAD_TRAINER`'s voice («— آرمان») should sign the trainer's note automatically; it is shown signed, but the
  text is whatever he writes.
- Whether to cap how many requests a customer can send a day (a dog can only have one open, so abuse is limited).
