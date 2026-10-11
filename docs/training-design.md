# Training Design

Booking a course or a test, paying for it, and the training that follows (spec 3.4–3.6, 3.9, 3.12): the customer's
booking, checkout, payment result, My Training and Enrollment Detail, and the trainer's Enrollments and Enrollment
Detail. All of them are working screens, so they follow [customer-area-design.md](customer-area-design.md) and the
paper trail of [assessment-design.md](assessment-design.md): same theme, calm, dense, one gold-leaf object per page.
For the steps behind each brief, see [design-flow.md](design-flow.md).

> **Status: agreed with the owner, pages being built.** The API under them is built: `order.*`, `enrollment.*` and
> `wallet.mine` (see the end of this doc), and so are the shared pieces (`SessionCard`, `Receipt`, `Stamp`,
> `EnrollmentStatusBadge`).

## What It Must Feel Like

- **Hiring Arman, not checking out of a shop.** Booking reads like agreeing a job with a person: which dog, where,
  when it suits you, and he calls to fix the first session. No cart, no "added to basket", no upsell.
- **Money is plain.** Every amount is in toman, in Persian digits, with what it is for written beside it. What the
  customer pays, what came from the wallet and what comes back on cancelling are all shown before they act, and the
  number on a button is the number that moves.
- **The sessions are the course.** A private course has no start date, only sessions, and refunds count unheld
  sessions. So the screens show a course as its sessions, used and unused, everywhere it appears.

## The One Idea: the Session Card

A trainer's punch card. Every enrollment is a small card with one box per planned session, in order:

| Box               | Look                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| not scheduled yet | empty hairline box                                                      |
| scheduled         | outlined in flat gold, the day and time inside («شنبه ۲۶ مهر ۱۷:۰۰»)    |
| held              | **punched**: a round hole in flat gold, the date small under it         |
| missed            | punched with a short diagonal stroke, muted: used, but nothing happened |
| cancelled         | not a box; cancelled sessions are listed only in the session list       |

The card makes the refund rule visible without explaining it: the boxes still empty or outlined are the "unheld
sessions" the refund is counted on. On Enrollment Detail the cancel dialog highlights them. It is one custom component
(`SessionCard`, `app/components/`), used at three sizes: a strip in lists, the full card on the customer's detail, and
the editable card on the trainer's detail. A test is a card with one box. Reduced motion: no punching animation, the
hole is simply there.

The receipt (رسید) is the second object: the slip of the assessment page, now carrying money. It appears on the
booking page (filling in), at checkout (the one to pay) and on the payment result (stamped).

## Design Plan

Within the app's one theme (tokens in `app/app.css`); nothing is added to the palette.

- **Colour:** slate page, `card` for raised panels, `sunken` for the receipt's plate and the empty states, flat
  `primary` for links, the selected tile's ring and the session card's gold, `gold-leaf` once per page (the main
  button, or the stamp on the payment result). `success` for «قبول» and a paid order, `destructive` only for
  cancelling.
- **Type:** Amiri for one line per page (the dog's name where a dog is the subject); Vazirmatn otherwise, static
  scale. Amounts are `tabular-nums`, the total of a receipt `text-2xl font-extrabold`.
- **Layout:** 7/5 on desktop with the receipt or the action column sticky; one column on phones with a fixed bottom
  bar for the one action, like the assessment page.

---

## Book a Course or Test: `/account/book/:courseSlug`

- **Purpose:** pick the dog and tell Arman where and when, for this course (or its test).
- **Role:** form, in the account area (signed-in customers; the guard sends others to `/auth?redirectTo=…`). Reached
  from Course Detail («سگت پرونده دارد؟ مستقیم رزرو کن», and «فقط تست» for a course with a test → `?kind=test`), and
  from Dog Detail's recommendations (`?dog=…&assessment=…`). Next: Checkout.
- **Structure:**
  1. **Header:** back link to the course; `h1` «رزرو {title}» (or «تست {title}»), the Latin name small; one line of
     facts: «حدوداً ۷ جلسه · در خانه‌ی تو · ۹۰۰ هزار تومان» rendered as `Fact`s, not a dotted string.
  2. **The form**, a sequence, so its parts are numbered:
     1. **کدام سگ؟** The dog tiles of the assessment page. An eligible dog is selectable; an ineligible one is shown
        dimmed with its reason under the name, each reason with its way out: «هنوز ارزیابی نشده» → «ارزیابی رایگان
        رزرو کن»; a missing prerequisite → that course's page (or its test); already enrolled → its Enrollment Detail.
        A dog Arman recommended this course for carries a small flat-gold mark «پیشنهاد آرمان». A dog that passed it
        before shows, once picked, a notice with a checkbox: «لئو این دوره را قبلاً با موفقیت گذرانده است. می‌خواهم
        دوباره بگیرد.»
     2. **کجا؟** For a course: a two-way choice «در خانه‌ی من» / «پانسیون» (the latter with «+ ۶۰۰ هزار تومان», or
        disabled with «قیمت پانسیون را تلفنی بپرس» and the phone number when it has no price). With home, the
        address field («نشانی، با کوچه و پلاک»); with boarding, one line saying the dog stays at the kennel and
        training continues there. A test has no boarding: only the address.
     3. **کی برایت مناسب است؟** A textarea: «مثلاً: شنبه‌ها و دوشنبه‌ها بعد از ساعت ۱۷». Under it: «آرمان با تو
        تماس می‌گیرد و وقت اولین جلسه را با هم می‌گذارید.»
     4. **برای چه؟** The three goal cards of the assessment page (home, sport, work).
  3. **The receipt** (desktop: sticky end column; phone: the bottom bar shows the total and the button): the dog's
     thumbnail and tag, the course, boarding if chosen, the total; then the refund policy's one sentence, and the
     gold-leaf «ادامه و پرداخت».
- **States:** the course can't be booked online (behavior modification, working and sport dogs, no test): the form is
  replaced by the reason and the way to start (the request, or the assessment). No dogs: one line and «سگت را معرفی
  کن». No eligible dog: the tiles still show, each with its reason, and the button is disabled with «یکی از سگ‌ها را
  انتخاب کن». Field errors next to their part; `NOT_ELIGIBLE` from the server in the form's alert.
- **Design:** desktop 7/5, eye: the `h1` → the first unfilled part → the receipt's total → the button. Phone: one
  column, dog tiles in a horizontal row, the bottom bar from part 1 on.
- **Motion:** colour on hover and focus; the receipt's lines cross-fade as they fill. No orchestrated moment.

## Checkout: `/account/checkout/:orderId`

- **Purpose:** see exactly what you pay, use a code or your wallet, and pay.
- **Role:** the step between booking and the gateway (also the way to pay a behavior plan later). Next: the gateway,
  or straight to Payment Result when the wallet covers it.
- **Structure:** one column, ~36rem, centred on the page: the receipt is the page.
  1. **Header:** `h1` «پرداخت», the order number small (`ZR-140507-0042`, `dir="ltr"`).
  2. **The receipt**, on `sunken`, ruled lines:
     - each item: the course (or test) and the dog's thumbnail and name, the training place and preferred times in
       one muted line, «تغییر» back to the booking page; the price, and boarding as its own line;
     - **کد تخفیف:** a quiet «کد تخفیف داری؟» that opens one field and «اعمال». Applied: the code and its amount
       as a negative line, with «حذف». A rejected code shows the server's reason under the field.
     - **کیف پول:** only with a positive balance: a switch «از کیف پولم برداشته شود» with the balance beside it; on,
       a negative line «از کیف پول».
     - the total to pay online, large; if the wallet covers everything, «پرداخت آنلاین لازم نیست».
  3. The refund policy's sentence, and «قوانین لغو و بازپرداخت» linked.
  4. The gold-leaf button: «پرداخت ۹۰۰ هزار تومان» (or «پرداخت از کیف پول»). In showcase mode a muted line under it:
     «نسخه‌ی نمایشی: پرداخت بدون درگاه انجام می‌شود.»
- **States:** a paid order sends to its Payment Result; a cancelled one shows «این سفارش لغو شده» and a link to book
  again. `NOT_PAYABLE` (the dog got enrolled meanwhile, the code lapsed and the total changed) shows its reason above
  the button and the receipt reloads.
- **Phone:** the same column full width; the button in a fixed bottom bar with the amount.
- **Motion:** a line added or removed (discount, wallet) slides in and the total counts to its new value (300 ms
  `ease-silk`); reduced motion swaps instantly.

## Payment Result: `/account/checkout/:orderId/result`

- **Purpose:** know that it worked and what happens next, or why it didn't and try again.
- **Role:** where the gateway callback lands (`/payment/callback` redirects here). Next: Enrollment Detail, or
  Checkout to retry.
- **Structure:** the checkout's receipt, read-only, with:
  - **paid:** a round gold-leaf stamp «پرداخت شد» landing on the receipt's corner (the assessment page's stamp, the
    page's one moment), the gateway's tracking number and masked card when paid online, then the next step in
    Arman's voice: «لئو ثبت شد. ظرف یکی دو روز تماس می‌گیرم تا وقت اولین جلسه را بگذاریم.» and the button «برو به
    آموزش لئو» (Enrollment Detail).
  - **failed:** no stamp; «پرداخت انجام نشد» with the gateway's reason, «پولی از حسابت کم نشد؛ اگر کم شده، تا ۷۲
    ساعت برمی‌گردد.», and the gold-leaf «دوباره پرداخت کن» back to Checkout.
  - **paid but not fulfilled** (the order was cancelled while paying): «مبلغ به کیف پولت رفت» with the amount, and a
    link to book again.
- **Motion:** the stamp, once; reduced motion shows it in place.

## My Training: `/account/training`

- **Purpose:** see each dog's courses and what is next in each.
- **Role:** list; a new tab «آموزش‌ها» after «سگ‌های من». Next: Enrollment Detail.
- **Structure:**
  1. **Header:** `h1` «آموزش‌ها», one line («دوره‌ها و تست‌های سگ‌هایت، و جلسه‌ی بعدی هر کدام.»).
  2. **در جریان** (scheduling, active): raised cards, one per enrollment: the dog's thumbnail and name, the course,
     the session card's strip, and the next thing in one sentence: «جلسه‌ی بعد: شنبه ۲۶ مهر، ساعت ۱۷» or «آرمان
     برای اولین جلسه تماس می‌گیرد».
  3. **تمام‌شده:** a ruled ledger, newest first: date, dog, course, the result badge (قبول / مردود / لغو شد).
- **Empty:** on `sunken`: «هنوز دوره‌ای نگرفته‌ای.» and a link to the dogs (where each dog's next step is).
- **Design:** desktop: cards in one column at ~44rem, the strip under the course name; phone: the same, full width.

## Enrollment Detail (customer): `/account/training/:enrollmentId`

- **Purpose:** follow one dog's course session by session, and cancel it if you must.
- **Structure:**
  1. **Header:** back link «آموزش‌ها»; the dog's name in Amiri with its small tag, the course as the line under it,
     the status badge.
  2. **The session card**, full size: the boxes, «۲ از ۷ جلسه برگزار شد», and the next session's day, time and place.
  3. **Sessions:** a ruled list, oldest first: date and time, place, status, and the trainer's note as a quote.
  4. **Result** (passed or failed): Arman's final note, quoted and signed «— آرمان», with the date.
  5. **Details:** a `dl`: trainer, boarding, address, preferred times, training goal, the order number and the paid
     amount, the refund policy.
  6. **Cancel** (live only), at the bottom after a hairline: «لغو این آموزش» (ghost, destructive), opening a dialog
     that says exactly what comes back and why: «تا اولین جلسه کل مبلغ برمی‌گردد: ۹۰۰ هزار تومان به کیف پولت.» or
     «۲ جلسه برگزار شده. نصف سهم ۵ جلسه‌ی باقی‌مانده برمی‌گردد: ۳۲۱ هزار تومان.», with the session card small in the
     dialog and the unheld boxes highlighted, an optional reason, and «لغو کن و پول را برگردان».
- **Design:** desktop 7/5: the card, sessions and result in the start column; details and cancel in the end column.
  Phone: header, card, sessions, result, details, cancel.
- **Motion:** none orchestrated.

---

## Trainer: Enrollments: `/trainer/enrollments`

- **Purpose:** see who is waiting for a first session, and every dog in training.
- **Role:** list; a new tab «شاگردها» after «برنامه». Next: Enrollment Detail.
- **Structure:**
  1. **Header:** `h1` «شاگردها», a filter (segmented: در جریان / تمام‌شده / همه).
  2. **منتظر زمان‌بندی:** the trainer's real to-do, like the Schedule's: a short list on `card` with the flat-gold
     start border: dog tag and name, course, the customer's name and phone (`tel:`), and their preferred times
     quoted, since that is what the call is about; «زمان‌بندی کن».
  3. **در جریان:** a ledger: dog tag and name, course, the session card strip, the next session, chevron.
  4. **تمام‌شده** (with the filter): result and date.
- **Design:** desktop full width ledger with aligned columns; phone: rows stack.

## Trainer: Enrollment Detail: `/trainer/enrollments/:enrollmentId`

- **Purpose:** plan and record one dog's sessions, and close the course with a result.
- **Structure:** the Assessment Detail's 5/7 shape.
  1. **Header:** back link «شاگردها»; dog's name in Amiri, the course, the status badge.
  2. **The dog** (start column): `DogPortrait`, the behavior and medical notes set large, the customer's name and
     phone, address (copy), preferred times, boarding, and the assessment's notes when it came from one.
  3. **The session card, editable** (end column, sticky):
     - an empty box → the schedule composer (popover; a bottom sheet on phones): day, time, length (60 by default),
       place (prefilled: the address, or the kennel with boarding). After saving, overlaps come back as a warning
       line under the card: «با ارزیابی راکی در همان ساعت هم‌پوشانی دارد.» Never a block.
     - a scheduled box → reschedule, cancel; once its time has passed: «برگزار شد» / «غیبت» and a note for the
       owner.
     - a punched box → its note, editable.
     - «تعداد جلسه‌ها» with − and + beside the card. Changing it shows what it does to a refund before saving: «اگر
       صاحب سگ الان لغو کند، ۳۲۱ هزار تومان برمی‌گردد.»
  4. **Result:** after a used session, «نتیجه را ثبت کن»: قبول / مردود and the final note («صاحب سگ این را در
     پرونده‌ی سگش می‌بیند.»), the gold-leaf «ثبت نتیجه».
  5. **Cancel the enrollment** (destructive, at the bottom): reason required («صاحب سگ آن را می‌بیند»), the refund
     it gives (the whole share of the unheld sessions).
- **Motion:** a box punched by «برگزار شد»: the hole is pressed in (scale and shadow, 180 ms, the page's moment);
  reduced motion: it simply appears.

## Schedule: what changes

The week shows sessions next to assessment slots: a session block on `card` with the dog's engraved tag, the course
name and «جلسه‌ی ۳ از ۷», linking to the trainer's Enrollment Detail. The to-do list at the top gains sessions whose
time has passed without «برگزار شد» or «غیبت».

## Dog Detail, Dogs List and Course Detail: what changes

- **Dog Detail:** the recommendations' «رزرو» goes to `/account/book/:slug?dog=…&assessment=…`. The record timeline
  gains enrollments: course, status, the session strip, the result note; a passed test reads «تست {course}: قبول».
  The next-step panel, with a live enrollment, shows its next session instead of the recommendations.
- **Dogs List:** a dog in training shows «جلسه‌ی بعد: شنبه ۲۶ مهر» in the next-step slot.
- **Course Detail:** «سگت پرونده دارد؟ مستقیم رزرو کن» goes to `/account/book/:slug`; a course with a test adds
  «فقط تست» (`?kind=test`).

---

## Shared Pieces This Needs

| Piece                         | Where                                        | Note                                                  |
| ----------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `SessionCard`                 | `app/components/session-card.tsx`            | strip, full and editable sizes; story in Storybook    |
| `Receipt`                     | `app/components/receipt.tsx`                 | ruled lines and a total; booking, checkout, result    |
| `EnrollmentStatusBadge`       | `app/components/enrollment-status-badge.tsx` | like `AssessmentStatusBadge`                          |
| `formatToman` short forms     | `app/lib/course-format.ts`                   | «۹۰۰ هزار تومان», «۱٫۲ میلیون تومان» (foundations §4) |
| Account and trainer nav items | `account-nav.ts`, `trainer-nav.ts`           | «آموزش‌ها»; «شاگردها»                                 |

## API

- `order.bookingOptions`, `order.book`, `order.get`, `order.applyDiscount`, `order.removeDiscount`, `order.pay`,
  `order.cancelEnrollment` (customer, trainer, Admin), and the `/payment/callback` route.
- `enrollment.listMine`, `enrollment.get` (customer, with a refund preview) and `enrollment.trainer.*`: `list`, `get`,
  `sessions`, `scheduleSession`, `rescheduleSession`, `cancelSession`, `markSession`, `updateSessionNote`,
  `setPlannedSessions`, `recordResult`.
- `wallet.mine`: balance and own lines.

## Decided

- **A test needs no record and no prerequisites:** it is an assessment itself (3.6), and it is how a dog trained
  elsewhere joins the Companion path midway. The age range still applies.
- **Age ranges are inclusive in whole months:** BMC's 6–7 months takes a dog of 7 months and 20 days.
- **One course per order** on these screens. The orders and the API take several items, so a cart can come later.
- **Trainers can cancel their own students' enrollments** with the full share of the unheld sessions (spec 3.4 says
  "a trainer or Admin"); the reason is sent to the customer.
- **Customers can't cancel a single session online** yet: they call, and the trainer reschedules or cancels it. The
  24-hour late-cancellation rule (B11) waits for that.
- **Courses with no owner trainer belong to the head trainer**, so the seeded catalogue needs no account to exist.
