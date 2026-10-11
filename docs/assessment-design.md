# Free Assessment Design

The free assessment end to end (spec 3.3): the public booking page, the customer's assessments, what Dog Detail
shows afterwards, and the smallest trainer area that closes the loop. The booking page is public, so it follows
[storefront-design.md](storefront-design.md). The customer and trainer pages are working screens, so they follow
[customer-area-design.md](customer-area-design.md): same theme, calmer, denser. For the steps behind each brief, see
[design-flow.md](design-flow.md).

> **Status: built.** Every page here is live; the API is `assessment.*` (see the end of this doc).

## What It Must Feel Like

- **An appointment with one person.** The customer books a time in Arman's diary, not a slot in a system. Every
  screen names him and says what will happen: «آرمان پسته را در خانه‌ی خودت می‌بیند، حدود یک ساعت، رایگان.»
- **The dog is the subject on both sides.** The customer picks _which dog_; the trainer sees a week of _dogs_, each
  marked with its tag, not a list of customer names.
- **The paper trail of a handler.** Three objects carry the area's vocabulary of stamped metal and paper: the dog's
  tag (already built), the **slip** (برگه‌ی ارزیابی, the booking as it fills in) and the **stamp** («رزرو شد»), which
  lands once when the booking is made. Nothing else gets ornament.
- **Never say the rule.** The trainer's recommendations start with CGC and BMC (B16). The customer only ever sees
  "Arman recommends, in this order"; no screen says every dog takes them.

## Design Plan

Within the app's one theme (tokens in `app/app.css`); nothing new is added to the palette.

- **Colour:** slate page (`--base`), `card` for raised panels, `sunken` for the empty states and the slip's plate,
  flat `primary` gold for the selected time, links and hairlines, `gold-leaf` for exactly one thing per page (the
  booking button inside the slip; on My Assessments the stamp). `success` only for «انجام شد», `destructive` only for
  cancelling.
- **Type:** Amiri for one line per page (the booking page's `h1`, the dog's name on the trainer's Assessment
  Detail), Vazirmatn for everything else on the static scale. Times are the data people scan for, so they are set
  large and bold in Persian digits (`text-2xl font-extrabold tabular-nums`), the day name above them small.
- **Layout:** 7/5 asymmetric splits on desktop with the action column sticky; phones get one column and a fixed
  bottom bar for the one action. Lists are ruled ledgers, not card grids.
- **Principle:** each page has one question it answers first: _when?_ (booking), _what's next?_ (My Assessments),
  _who am I seeing?_ (Schedule), _how did it go?_ (Assessment Detail).

---

## Book a Free Assessment: `/assessment`

- **Purpose:** pick a dog and a time to meet Arman, free.
- **Role:** entry, public (in `layout_public`). Linked from the hero, the trainer section, every course row, the
  closing banner, the footer, Dog Detail (`?dog=<id>`) and the Dogs List. Next: My Assessments, with the new booking
  stamped. Signed out → `/auth?redirectTo=/assessment…`, which brings them back here with the query kept.
- **Structure:**
  1. **Header** (plain slate, the storefront's first-screen rules): `h1` in Amiri «ارزیابی رایگان با آرمان», one
     `text-lead` line («یک ساعت با سگت، در خانه‌ی خودت یا بیرون. آخرش می‌گویم از کدام دوره شروع کنید.»), three `Fact`s:
     «رایگان», «حدود ۶۰ دقیقه», «خانه‌ی تو یا بیرون». At the end, Arman's small round portrait with one signed
     sentence: «قبل از هر دوره‌ای، خودم سگت را می‌بینم.»
  2. **The form**, one sheet in four numbered parts (it is a sequence, so the numbers mean something). Each part is a
     `legend` + hairline, not a box, like the Dog Form:
     1. **کدام سگ؟** The customer's dogs as a row of selectable tiles: the photo `thumb` (or the engraved tag),
        name, facts line. A dog with a record is disabled with «پرونده دارد؛ مستقیم دوره رزرو کن» linking to its
        page. A dog with a booked assessment is disabled with its time: «شنبه ۱۹ مهر، ساعت ۱۷ رزرو شده». The last
        tile is «سگ تازه» (dashed), to `/account/dogs/new?redirectTo=/assessment`; after creating, the Dog Form
        comes back with `?dog=<new id>` so the new dog is already picked. `?dog=` preselects; one eligible dog is
        preselected on its own.
     2. **برای چه می‌خواهی؟** Three choice cards (radio group): «سگ خانواده» (a calm, well-mannered companion),
        «ورزشی» (agility, sport), «کار» (guarding, working dogs), each with one line. Defaults to home.
     3. **چه چیزی را می‌خواهی عوض شود؟ و کجا ببینمش؟** A textarea (placeholder «مثلاً: روی مهمان‌ها می‌پرد و قلاده را
        می‌کشد»), then the place: a two-way segmented «خانه‌ی من» / «یک جای دیگر» and one text field whose label
        follows the choice («نشانی» / «کجا؟ مثلاً پارک ملت، در ورودی شمالی»). Says who reads it: «فقط آرمان این را
        می‌بیند.»
     4. **کی؟** The diary (below).
  3. **The slip** (desktop: sticky end column; phone: a fixed bottom bar). It fills in as the parts are chosen: the
     dog's thumbnail with its small tag, the goal, the place's first line, and the chosen day and time set large.
     Empty lines read as quiet placeholders («هنوز وقتی انتخاب نکرده‌ای»). Under it one plain sentence, «با آرمان، رایگان،
     حدود ۶۰ دقیقه.», then the gold-leaf «ارزیابی را رزرو کن» and one line: «تا قبل از شروع وقت می‌توانی لغوش
     کنی.» On phones the bottom bar shows the chosen time and the button; the full slip is above the button in the
     page flow after part 4.
- **The diary (part 4), the page's one idea.** Not a calendar grid and not a cloud of time chips: Arman's next two
  weeks as a **ruled diary**, one row per day that has open times. Each row: the day name and Jalali date at the
  start, then a thin time rail from 9:00 to 21:00 with the open times sitting on it **at their hour**, so mornings and
  evenings read at a glance, the way his day actually looks. A time is a pill on the rail («۱۷:۰۰»); the chosen one
  fills with flat gold. Days without open times are left out; the rail's hour ticks are faint and labelled only at
  9, 12, 15, 18 and 21. Only Arman's times are listed (decided with the owner); the assistant's slots stay on her
  own schedule.
  - Phone: the rail doesn't fit, so each day row becomes the day name and its times as a wrapping row of pills
    (44 px targets), still one ruled row per day.
- **States:**
  - **Signed out:** parts 1–3 are replaced by one panel on `card`: «برای رزرو، اول با شماره موبایلت وارد شو. یک
    دقیقه طول می‌کشد.» and the `solid` «ورود و ادامه» to `/auth?redirectTo=…`. The diary still shows (read-only
    pills that also lead to sign-in), so a visitor sees real free times before giving a number.
  - **Signed in, not a customer** (the Admin, a trainer, a partner): the panel says the page is for dog owners and
    links trainers to «برنامه‌ی من» (`/trainer`).
  - **No dogs:** part 1 is one line and the «سگت را معرفی کن» button (same `redirectTo`); the other parts wait,
    dimmed.
  - **Every dog has a record or a booking:** part 1 explains it, and links to the Dogs List. Parts 2–4 dim.
  - **No open times:** the diary is replaced by «این دو هفته وقت خالی ندارم. زنگ بزن تا با هم یک وقت پیدا کنیم.»
    with the center's phone (`CENTER_PHONE`, `dir="ltr"`).
  - **Just taken** (`SLOT_TAKEN`): the diary reloads, the choice clears, and a line above it says «این وقت همین الان
    رزرو شد. یک وقت دیگر انتخاب کن.» Field errors sit next to their part; the slip button shows a spinner while
    booking and the input is kept after a failure.
  - Rendered on the server: no skeleton.
- **Design:**
  - Desktop (1440): header across the container; below it 7/5, the form in the start column (parts at max ~44rem,
    the diary using the column's full width), the slip sticky in the end column from part 1 down. Eye: the `h1` →
    the first unfilled part → the slip's time → the button.
  - Phone (390): header, then parts 1–4 in one column, dog tiles in a horizontal scroll row, choice cards stacked,
    the diary as wrapping pill rows; the fixed bottom bar appears once part 1 is reached (like Course Detail's
    `PhoneActionBar`).
- **Style:** page surface; the header unboxed on plain slate; the slip on `sunken` with a faint inner shadow (the
  engraving plate, as the Dog Form's preview), holding the page's one gold-leaf object, the button. Gold elsewhere is
  flat: the selected tile's ring, the chosen pill, part numbers.
- **Motion:** colour on hover and focus; the chosen pill fills with a 150 ms colour change; the slip's lines
  cross-fade as they fill. No orchestrated moment here: it belongs to the next page, where the booking is stamped.

## My Assessments: `/account/assessments`

- **Purpose:** see when you are meeting Arman, cancel if you must, and read what he said afterwards.
- **Role:** list, in the account area; a new tab «ارزیابی‌ها» after «سگ‌های من» (`account-nav.ts`). Reached from the
  tab and after booking (`?booked=<id>`). Next: Dog Detail (a dog's name), `/assessment` (book another), a
  recommended course's page.
- **Structure:**
  1. **Header:** `h1` «ارزیابی‌ها», one line («وقت‌هایی که آرمان سگ‌هایت را می‌بیند، و حرف‌هایش بعد از هر
     ارزیابی.»), and the outline «ارزیابی تازه رزرو کن» at the end.
  2. **Upcoming:** each booked assessment as a raised card shaped like the slip: day name small, the time and date
     large, then the dog (thumbnail, name, link to its page), «با آرمان», the place, the goal, and the customer's own
     note folded under «یادداشت تو». At the card's end, «لغو این ارزیابی» (ghost, destructive tone), which opens a
     confirm dialog naming the dog and time, with an optional reason. Once cancelled, the card leaves Upcoming and a
     toast says «ارزیابی لغو شد».
  3. **Past:** a ruled ledger, newest first. Each row: date, dog thumbnail and name, the status badge. A completed
     row opens in place (accordion) to show Arman's notes as a quoted paragraph signed «— آرمان» and his
     recommendations as a numbered list of course names linking to their pages. «حاضر نشد» and «لغو شد» rows show
     who cancelled and the reason when the trainer did, plus «یک وقت دیگر رزرو کن».
- **The stamp, the page's one moment.** Arriving with `?booked=<id>`, that card is first and a round «رزرو شد» stamp
  in gold leaf lands on its corner (`animate-tag-stamp`'s motion, slightly larger and tilted), once. Then `booked` is
  dropped from the URL so a reload doesn't stamp again. Reduced motion: the stamp is simply there.
- **States:** empty (no assessments at all): one panel on `sunken`, «هنوز ارزیابی‌ای رزرو نکرده‌ای», «آرمان هر سگ را اول
  رایگان می‌بیند.» and the gold-leaf «ارزیابی رایگان رزرو کن». Upcoming empty but past not: one muted line in its
  place. Errors use the shared page-error pattern inside the shell.
- **Design:**
  - Desktop: header row; Upcoming cards in a single column at ~44rem with the time block at the start of each card
    and the details beside it (the time is what the eye lands on); Past as a full-width ledger with aligned columns
    (date, dog, status, chevron). Eye: the next time → its dog → cancel.
  - Phone: the card stacks (time block, then details, then cancel full width); ledger rows wrap the status under
    the dog.
- **Style:** page surface; Upcoming on `card` + `shadow-sm`; Past unboxed with hairlines; the stamp the one gold-leaf
  object.
- **Motion:** the stamp; the accordion opening; nothing else.

## Dog Detail: what changes

The page keeps its brief in [customer-area-design.md](customer-area-design.md); assessments fill the parts it
reserved.

- **Next step panel**, by the dog's state:
  - no record, nothing booked: as now, «ارزیابی رایگان رزرو کن» to `/assessment?dog=…`;
  - an assessment booked: «پسته را شنبه ۱۹ مهر ساعت ۱۷ می‌بینم.» and the outline «ارزیابی‌ها» link to My
    Assessments (no gold-leaf button: there is nothing to do);
  - a completed assessment with recommendations: «بعد از ارزیابی، این دوره‌ها را به این ترتیب پیشنهاد می‌کنم:» and
    the courses as a numbered list. The first gets the gold-leaf «رزرو {title}»; the rest a quiet «رزرو». Each goes
    to its course page until course booking exists;
  - a record without recommendations: as now.
- **Record timeline:** a completed assessment is an entry with its date, «ارزیابی با آرمان», the notes quoted and
  the recommendations as a short numbered line; a booked one is an entry with an outlined dot («ارزیابی رزرو شده:
  شنبه ۱۹ مهر، ساعت ۱۷»); a no-show reads «ارزیابی: حاضر نشدید». Cancelled ones stay out of the record.
- **Dogs List:** a dog with a booking shows its time in the next-step slot («ارزیابی: شنبه ۱۹ مهر») instead of the
  button.

---

## Trainer Area Shell: `layout_trainer`

- **Purpose:** the trainer's desk: their schedule now, enrollments and requests later.
- **Guard:** `requireSession({ roles: ["trainer", "admin"] })`. The spec's rule is "has a Trainer Profile (a Trainer,
  or the Admin as head trainer)"; until entity 2 exists the role stands in for it. `roleHomePath` sends trainers and
  the Admin to `/trainer` after signing in (the Admin panel will take over the Admin's home when it exists).
- **Structure:** the account shell's header and footer, reused rather than copied: the same `jet` bar and logo,
  tabs from a `trainer-nav.ts` list (today «برنامه»), «سایت» back to `/`, the person menu with the role shown
  («مربی ارشد» for the Admin). The header and tabs take their list as a prop so both areas share them.

## Schedule: `/trainer`

- **Purpose:** see who you are meeting this week, open new times, and record how past meetings went.
- **Role:** the trainer area's landing page (Trainer Dashboard and Schedule are one page until there are sessions
  and requests). Next: Assessment Detail.
- **Structure:**
  1. **Header:** `h1` «برنامه‌ی من», the week's range («۱۹ تا ۲۵ مهر»), the week stepper (previous, «این هفته»,
     next) and the gold-leaf «وقت باز کن» at the end (the page's one main action).
  2. **Waiting for an outcome:** only when there are some: booked assessments whose time has passed, as a short
     ruled list at the top on `card` with a flat-gold start border: dog tag, dog name, when, «نتیجه را ثبت کن». This is
     the trainer's real to-do, so it comes before the week.
  3. **The week:** seven day columns, Saturday first (on the right in RTL). Each column: the day name and date as
     its head (today's head underlined in flat gold), then its slots in time order:
     - **open:** a dashed hairline box with the time and «باز»; a small «ببند» appears on hover and focus (and is
       always visible on touch), confirm in place;
     - **booked:** a raised block with the time, the dog's **engraved tag** with its name, the breed and the goal,
       linking to Assessment Detail;
     - **completed / no-show:** the same block, muted, with a small status badge;
     - closed slots are not shown.
       A day with nothing reads «—».
- **The one idea: a week of dog tags.** Booked times show the dog's tag, not the customer's name, so the week reads as
  the dogs he is meeting. The customer's name is on the detail page.
- **Open times (dialog; a bottom sheet on phones):** one composer for one-off and repeating times: weekday toggles
  (ش ی د س چ پ ج), one or more times (`HH:mm` fields, «ساعت دیگر» to add one), a start date (Jalali; today by
  default), «برای چند هفته» (1–8), the length (60 by default). A live line counts what will happen: «۱۶ وقت باز
  می‌شود، از شنبه ۱۹ مهر تا ۱۰ آبان.» Submit: «باز کن». The result is a toast («۱۶ وقت باز شد؛ ۲ تا با وقت‌های قبلی
  هم‌پوشانی داشت و باز نشد.») and the week refreshes.
- **States:** a week with no slots shows the columns with «—» and one line under the header: «این هفته وقتی باز
  نکرده‌ای.» next to «وقت باز کن». Errors: the shared page-error pattern inside the shell.
- **Design:**
  - Desktop: header row; the to-do list at ~44rem; the week as a 7-column grid at full container width, columns
    separated by hairlines (`divide-x`), blocks full column width. Eye: the to-do → today's column → «وقت باز کن».
  - Phone: header stacks with the button full width; the week becomes an agenda, one ruled row per day with its
    slots under it; days without slots collapse to one muted line.
- **Style:** page surface; the to-do on `card` with the gold start border; booked blocks on `card` + `shadow-xs`;
  open boxes unfilled. Gold: today's underline, the button.
- **Motion:** colour on hover and focus; the «ببند» reveal (opacity). No orchestrated moment: the trainer opens this
  page many times a day.

## Assessment Detail: `/trainer/assessments/:id`

- **Purpose:** know the dog before you go, then write what you saw and where it should start.
- **Role:** detail + form. Reached from the Schedule (a booked block or the to-do). Back to the Schedule.
- **Structure:**
  1. **Header:** back link «برنامه‌ی من»; the dog's name in Amiri (`h1`), the status badge, the day, time and
     length; at the end, for an upcoming booking only, «لغو این ارزیابی» (ghost, destructive), which asks for a
     reason (the customer gets it by SMS) and closes the slot.
  2. **Before you go** (start column): the dog's portrait with its tag (the existing `DogPortrait`), its facts line
     and profile `dl`, then the **behavior and medical notes** set larger than the profile, because they are what to
     read in the car; then the customer's request: the goal, «چه چیزی را می‌خواهد عوض شود» as a quote, the place
     (with «نشانی را کپی کن»), the customer's name and phone as a `tel:` link.
  3. **The outcome** (end column, sticky):
     - **Booked, time has come:** the form. «یادداشت برای صاحب سگ» (textarea; label line «صاحب سگ این را در پرونده‌ی
       سگش می‌بیند.»), then **the path**: the recommended courses as a numbered vertical path (a line with stations,
       echoing Course Detail's path), each station a course name with «بالاتر» / «پایین‌تر» buttons and «حذف»; under
       it a course picker (combobox of approved courses) to add one. CGC and BMC arrive pre-filled when they apply,
       each with a quiet «پیش‌فرض» note. Under the path, one muted line: «صاحب سگ همین ترتیب را در صفحه‌ی سگش
       می‌بیند.» Actions: the gold-leaf «ارزیابی را ثبت کن» and the outline «حاضر نشد» (confirm dialog, optional
       note).
     - **Booked, still upcoming:** the same form, read-only, with the line «بعد از شروع وقت می‌توانی نتیجه را ثبت
       کنی.»
     - **Completed:** the notes and the path, read-only, with the date they were recorded.
     - **No-show / cancelled:** the status, the note or reason, and who cancelled.
- **The one idea: the path is the preview.** The trainer edits the recommendations in the same shape the customer
  will see them, a numbered path from where the dog starts, so the order is obviously the point.
- **States:** another trainer's assessment, or an unknown id: the page boundary «این ارزیابی پیدا نشد» and a link to
  the Schedule. Saving errors in the form's alert; the button spins while saving; on success the page shows the
  completed state and a toast «ارزیابی ثبت شد».
- **Design:**
  - Desktop: 5/7, the dog in the start column, the outcome in the end column (sticky), so the notes about the dog
    stay beside the form while writing. Eye: the dog's name → the behavior notes → the notes field → the button.
  - Phone: header, the outcome first when it can be recorded (the trainer is standing at the door, done), the dog
    after; when upcoming, the dog first. The path's buttons are 44 px; the actions are full width.
- **Style:** page surface; the outcome on `card` + `shadow-sm`; the dog unboxed with hairlines; the path's line in
  `border` with flat-gold stations; the button the one gold-leaf object besides the dog's tag.
- **Motion:** a station moving up or down slides into its new place (`transform`, 200 ms `ease-silk`), so the order
  change is visible; reduced motion swaps instantly.

---

## Shared Pieces This Needs

| Piece                                   | Where                                        | Note                                                        |
| --------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| Tehran time helpers                     | `app/lib/tehran-time.ts`                     | built with the API: Tehran ↔ UTC, «شنبه ۱۹ مهر», «۱۷:۰۰»    |
| `AssessmentStatusBadge`                 | `app/components/assessment-status-badge.tsx` | label and tone per status, used by the customer and trainer |
| Account header and tabs, list as a prop | `routes/layout_account/components/`          | the trainer shell passes its own list                       |
| Dog Form `?dog=` on return              | `routes/account_dog_form/`                   | after creating with `redirectTo`, append `dog=<new id>`     |

## API

`app/orpc/assessment/`: `availableSlots` (public), `book`, `listMine`, `cancel` (customer), and
`trainer.schedule`, `trainer.openSlots`, `trainer.closeSlot`, `trainer.get`, `trainer.complete`,
`trainer.markNoShow`, `trainer.cancel` (trainer or Admin, scoped to their own slots). Booking takes the slot with one
conditional update, with a partial unique index behind it (foundations-plan step 3). A completed assessment gives
the dog a record.

## Decided

- **Only Arman's times** are offered on the booking page for now; `assessment.availableSlots` lists the head
  trainer's open slots.
- **A dog with a record can't book a free assessment.** Having a record means it has been assessed (or Arman knows
  it), so it books its next course instead.

## Loose Ends

- **Times on the trainer's composer** use the browser's native time field, which shows Latin digits («17:00»).
- **The demo seed** books Rocky an hour before it runs, so seeding late at night gives a late-evening slot.
- **`DogTag` at its large size** wraps a three-letter name like «رکس» onto two lines (seen while testing the trainer
  pages).
- **Not built yet:** marking a dog as already known from Assessment Detail, the day-before reminders (pg-boss sweep),
  and closing past open slots (they are hidden from the week instead).
