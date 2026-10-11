# Customer Area Design

The signed-in area at `/account`, for customers first (trainers and partners will share its Profile, Wallet and
Withdrawal pages). It shares the storefront's theme, black lacquer and gold leaf, but these are **working screens**:
calmer, denser, no hero scenes. For the steps behind each brief, see [design-flow.md](design-flow.md); for the theme
and voice, [storefront-design.md](storefront-design.md).

> **Status: built.** The shell, Dogs List, Dog Form and Dog Detail are live at `/account`. Agreed with the owner:
> photos, the gold-leaf tag on Dog Detail, and trainers and partners landing on the storefront until their areas exist.

## What the Area Must Feel Like

- **The dog is the subject, Arman is the voice.** Every page is about one of the customer's dogs and what happens to
  it next. Where the site speaks, it is Arman speaking to the owner: «آرمان قبل از اولین جلسه این را می‌خواند».
- **A desk, not a shop window.** Static type scale (`text-sm`…`text-2xl`), no fluid display sizes, no doodle
  scenes, no `surface-inverse` band, no `glow`. Amiri appears in one place only: the dog's name.
- **Every dog has a next step.** The list and the detail page both answer "what do I do with this dog now?" before
  anything else: a new dog → the free assessment; a dog with a record → book its next course (later: its next
  session, a plan waiting to be paid, a recommendation).
- **Gold stays an accent.** Flat `primary` for links, the selected tab and hairlines; the gold-leaf `default` button
  for the one main action on a page; one gold-leaf object per page at most (the dog's tag on Dog Detail).

## The One Idea: the Dog Tag

K9 handlers' dogs wear a stamped metal tag. Here every dog gets one: a small rounded tag shape with a punched hole,
the dog's name engraved in Amiri, and its microchip number stamped underneath in Latin digits (or the sex and age
when there is no chip). It is the dog's mark everywhere in the area:

| Where       | Size                  | Finish                                                                 |
| ----------- | --------------------- | ---------------------------------------------------------------------- |
| Dogs List   | 64 px, the row's mark | the photo's `thumb`; without one, the engraved tag with the initial    |
| Dog Form    | live preview          | the detail header's composition, engraved; the name stamps in as typed |
| Dog Detail  | page header           | **gold leaf**, hanging from the photo: the page's one gold-leaf object |

The photo and the tag go together the way they do on a real dog: the tag **hangs** from the photo's bottom-start
corner, tilted a few degrees, on a short ring. A dog without a photo shows the tag alone, larger. It is a custom SVG
component (`DogTag`), in `app/components/` because all three pages use it.

## Shell: `layout_account`

- **Purpose:** frame every signed-in page with a way around the account and a way back to the site.
- **Structure:** a header on `jet` like the storefront's (same height, same logo), with:
  - the logo, linking to `/`;
  - the account tabs, from one list (`account-nav.ts`), showing **only built pages**: today «سگ‌های من». As pages
    arrive: «آموزش‌ها», «ارزیابی‌ها», «اصلاح رفتار», «سفارش‌ها», «کیف پول»;
  - at the end: «دوره‌ها» back to the catalogue, and the person menu (first name, phone in `dir="ltr"`,
    «خروج»).
  - No footer: a thin bottom line with the support phone number and «قوانین لغو و بازپرداخت».
- **Desktop (1440):** one row: logo · tabs · (space) · «دوره‌ها» · person menu. The selected tab is ivory with a
  2 px flat-gold underline; the others `muted-foreground`. Content in `site-container`, `py-10`.
- **Phone (390):** the top bar keeps the logo and the person menu. With fewer than three tabs, the tabs sit in the
  person menu's sheet. From three tabs on, they move to a **bottom tab bar** (`popover`, fixed, safe-area padding),
  because these pages are mostly opened on a phone, one-handed.
- **States:** the guard redirects before render; a loader error inside a page renders that page's boundary inside
  the shell, so the tabs stay.
- **Motion:** colour on hover and focus only. Sign-out clears the query cache after leaving.

---

## Dogs List: `/account/dogs`

- **Purpose:** see your dogs at a glance and take each one's next step, or add a dog.
- **Role:** the area's landing page until the Customer Dashboard exists (`/account` redirects here). Next: Dog
  Detail (a row), Dog Form (add). The home page's «رزرو دوره‌ی بعدی» and Course Detail's «سگت پرونده دارد؟» link
  here.
- **Structure:**
  1. **Page header:** `h1` «سگ‌های من», one line under it («هر سگ پرونده‌ی خودش را دارد. از اینجا قدم بعدی‌اش را
     بردار.»), and the «سگ تازه اضافه کن» button (outline) at the end.
  2. **The dogs:** one raised `card` holding a ruled list (`divide-y`), oldest dog first. Each row:
     - the dog's photo (`thumb`, rounded), or the engraved tag with its initial;
     - name (bold) and breed; a short facts line: «نر، حدوداً ۳ ساله، ۳۲٫۵ کیلو»;
     - a **record mark**: «پرونده دارد» (flat gold, with a check) or «هنوز ارزیابی نشده» (muted);
     - the **next step** at the end of the row, as a quiet link-button: «رزرو دوره‌ی بعدی» or «ارزیابی رایگان رزرو
       کن». Later states take over this slot (next session date, a plan to pay).
     - The whole row links to Dog Detail; the next-step button is its own target.
  3. **Below the card:** one muted sentence for an owner with several dogs: «هر سگ جدا ارزیابی می‌شود؛ ارزیابی
     رایگان است.»
- **Empty state** (the second demo customer): no card, no list. One centred panel on `sunken`: the single doodle
  allowed in this area (`DoodleWalk`, a person walking their dog), «هنوز سگی اضافه نکرده‌ای», a line that says why
  («آرمان هر سگ را اول رایگان می‌بیند. برای رزرو ارزیابی، اول سگت را معرفی کن.»), and the gold-leaf «سگت را اضافه
  کن» button.
- **Loading / error:** rendered on the server, so no skeleton. Errors use the shared page-error pattern inside the
  shell: what failed and «دوباره امتحان کن».
- **Design:**
  - Desktop: the header row (title start, button end) over the card at full container width. Rows are 88 px tall
    with three aligned columns — tag + name/facts (wide), record mark, next step (end) — so several dogs read as a
    ledger, not a grid of cards. Eye: the dog's name → its next step → the record mark.
  - Phone: the add button becomes a full-width row under the title. Each row stacks: tag + name/facts, then the
    record mark and the next step on one line beneath; the next step stays a 44 px target.
- **Style:** page surface; the list on `card` + `shadow-sm`; the empty state on `sunken`. Gold only on the record
  mark and the actions.
- **Motion:** row hover tints `bg-primary/5` and nudges the row's chevron toward the reading direction. No
  orchestrated moment: this page is opened often.

## Dog Form: `/account/dogs/new`, `/account/dogs/:dogId/edit`

- **Purpose:** tell Arman who your dog is: its identity, its body and health, and its habits.
- **Role:** form. Reached from the Dogs List («سگ تازه اضافه کن»), the empty state, Dog Detail («ویرایش»), and
  later from the assessment booking («سگ تازه»), which passes `?redirectTo=` to come back. Saving goes to the dog's
  page (or `redirectTo`).
- **Structure:**
  1. **Header:** a back link («سگ‌های من» or the dog's name), `h1` «معرفی سگ تازه» / «ویرایش {name}».
  2. **Three fieldsets**, each with a short `legend` and a one-line reason:
     - **شناسنامه:** the photo (a square picker: pick or drop a JPG or PNG, it uploads at once and shows its
       preview with «عوض کن» and «حذف»; a Persian error for HEIC or a too-large file); name; breed (a combobox of common breeds in Persian that also accepts any text); sex (two-way
       segmented: نر / ماده); **birth date** as a two-way choice: «تاریخش را می‌دانم» (Jalali day, month and year
       selects) or «حدودی می‌دانم» (years and months old). The second stores an approximate date, so the site can
       say «حدوداً ۳ ساله».
     - **بدن و سلامت:** weight in kilos (accepts Persian digits and a decimal); neutered (بله / نه); vaccination
       (کامل / ناقص / نمی‌دانم); microchip number, marked optional.
     - **برای مربی:** behavior notes and medical notes, each with an example placeholder («مثلاً: از سگ‌های بزرگ
       می‌ترسد») and the line that says who reads them: «این دو را فقط آرمان و مربی سگت می‌بینند، قبل از اولین
       جلسه.»
  3. **Actions:** the gold-leaf «ذخیره» (create: «اضافه کن») and a quiet «انصراف». On the edit page only, at the
     very bottom and separated by a hairline: «حذف این سگ از حسابم» (destructive, ghost), which opens a confirm
     dialog naming the dog. Removing keeps its history (soft delete).
- **States:** field errors next to fields, the server's general errors in the form-level alert, the submit button
  disabled with a spinner while saving, input kept after a failure. Leaving with unsaved changes isn't blocked
  (short form).
- **Design:**
  - Desktop: 7/5 split. The form in the start column (max ~40rem); in the end column, sticky, the **live tag**
    preview (the photo with the tag hanging from it, as Dog Detail will show it) with a short "what Arman will see"
    summary under it: the facts line and the first line of each note, as
    they are typed. Eye: the first empty field → the tag → the save button.
  - Phone: one column. The preview shrinks to a short strip at the top (the photo's thumbnail, the small tag, the
    name and the facts line); the notes summary is dropped. Segmented controls fill the width; the save button is full width at the end.
- **Style:** page surface; the fieldsets are not boxed: a `legend` + hairline rule each, so the form reads as one
  sheet, not three cards. The tag preview sits on `sunken` with a faint inner shadow, like an engraving plate.
- **Motion — the page's one moment:** as the name is typed, it is stamped onto the tag again (`animate-tag-stamp`:
  it lands a touch large and faint and settles, 180 ms). The whole name re-stamps rather than each new letter,
  because splitting Persian text into letters breaks the joins between them. Reduced motion: the text simply updates.

## Dog Detail and Record: `/account/dogs/:dogId`

- **Purpose:** see everything about one dog and take its next step.
- **Role:** detail. This is where a dog with a record books its next course. Reached from the Dogs List; leads to
  the free assessment, a course's booking (later), the Dog Form.
- **Structure:**
  1. **Header:** back link «سگ‌های من»; the photo (`card`, 4:3) with the **gold-leaf tag** hanging from it (name
     stamped, microchip under it), or the tag alone without a photo; the name as `h1`
     in Amiri (the area's one display line); the facts line; «ویرایش» (outline, small) at the end.
  2. **Next step panel:** one raised card with one sentence from Arman and one gold-leaf button:
     - a dog with no record: «پسته را اول رایگان می‌بینم تا بگویم از کجا شروع کنید.» → «ارزیابی رایگان رزرو کن»
       (`/assessment?dog=…`);
     - a dog with a record: «لئو پرونده دارد؛ می‌توانی دوره‌ی بعدی‌اش را مستقیم رزرو کنی.» → «دوره‌ها را ببین»
       (`/courses`, until booking exists). Once assessments exist, the recommended courses list here, in order, each
       with «رزرو».
  3. **Record (پرونده):** a vertical timeline, newest first. Entry kinds as entities arrive: assessment (date, the
     trainer's notes, recommendations), enrollment (course, status badge, sessions held, result and note), passed
     test. Today only one kind exists: «آرمان لئو را از {Jalali month and year} می‌شناسد» for `knownSince`.
     Empty: «پرونده‌ی پسته بعد از ارزیابی رایگان باز می‌شود.» with no extra button (the panel above has it).
  4. **Profile:** a `dl` with hairlines (`Fact`-style label and value): breed, sex, birth date (Jalali, «حدوداً»
     when approximate) and age, weight, neutered, vaccination, microchip.
  5. **Notes for the trainer:** behavior and medical notes as quoted paragraphs, with «ویرایش» linking to the form;
     empty notes say «چیزی ننوشته‌ای.» and invite adding.
- **Not found:** an unknown, removed or someone else's dog renders the page boundary inside the shell: «این سگ پیدا
  نشد» and a link back to «سگ‌های من».
- **Design:**
  - Desktop: 5/7. The start column is the dog itself (the portrait, then the profile and notes); the end column is its
    story (name, facts and «ویرایش», then the next-step panel, then the record). So the next step sits beside the tag
    on the first screen. Eye: the tag → the name → the next-step button → the record.
  - Phone: portrait, name, next step, record, profile, notes, in that order (the desktop columns become `contents`
    and `order` interleaves them). The next-step button is full width.
- **Style:** page surface; the next-step panel on `card` + `shadow-sm`; the profile and notes unboxed with hairlines;
  the timeline's line in `border`, its dots flat gold for completed events and outlined for upcoming ones. The tag is
  the only gold leaf besides the button.
- **Motion:** none orchestrated (the form has the area's moment). Hover tints on the timeline entries that link
  somewhere.

---

## Shared Pieces This Needs

| Piece                                 | Where                          | Note                                                                 |
| ------------------------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `DogTag`                              | `app/components/dog-tag.tsx`   | SVG tag: `engraved` and `leaf` finishes, sizes; story in Storybook   |
| `describeDog` (sex, age, weight line) | `app/lib/dog-format.ts`        | «نر، حدوداً ۳ ساله، ۳۲٫۵ کیلو»; age from the birth date, never stored |
| Jalali date helpers                   | `app/lib/jalali.ts`            | format with `Intl` (`fa-IR-u-ca-persian`); Jalali ↔ Gregorian for the form needs a converter: the small `jalaali-js` package |
| Segmented control                     | `app/components/ui/toggle-group.tsx` | already there; check its look against the tokens first          |
| Breed suggestions                     | `app/orpc/dog/constants.ts`    | ~30 common breeds in Iran, Persian names                             |

## Decided

- **Photos** are in: the media pipeline ([media.md](media.md)) is built for them, on the local SeaweedFS.
- **The gold-leaf tag** on Dog Detail is the exception to "no gold leaf on the first screen": small, and the
  subject's own metal.
- **Trainers and partners** land on the storefront after signing in until their areas exist. The dog pages are
  customer-only.
