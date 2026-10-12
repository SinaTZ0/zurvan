# K9 Training — App Specification

The source of truth for how the app works. It replaces the phase-one docs (see [What this replaces](#what-this-replaces)). The course catalog still comes from [zurvan-courses.md](zurvan-courses.md), but the shape of a dog profile and of a course's settings is still being worked out with the owner (see [F2](#f2-dog-profiles) and [F17](#f17-course-catalogue)).

**How to read it.** The spec is organized by **feature**, because one page often holds several features and one feature often shows up on several pages. Each feature says who uses it, its rules, its edge cases and the pages it appears on. [Pages](#pages) at the end lists every page with the features on it. Refer to a feature by its number (`F8`) in code comments and commits.

**Words.** A **course** is an item in the catalogue («دوره»): House manner, CGC. An **enrollment** is one dog taking one course: Leo's CGC. Requests are for a course; accepting one creates an enrollment, and lessons, money, cancellation and completion belong to the enrollment. The Persian UI can say «دوره» for both.

---

## The Business

**K9 Training** (آموزش K9) is one head trainer's private practice. He is the owner and the app's **Admin**. Training is private: one dog, at the owner's home or outside. A new dog starts with a **free evaluation**, a first checkup where the Admin gets to know the dog and fills in its profile. Once a dog has been evaluated, its owner can **request a course**. The Admin accepts the request, which creates an **enrollment** and puts its price in the customer's cart as money owed. The Admin then plans the lessons on his **calendar**, agrees them with the customer by phone, and confirms them. Within an hour of a lesson ending, the trainer who taught it is paid. **Partners** (clinics, groomers, pet shops) bring in customers and earn a commission once, on the customer's first enrollment.

The business is small, so the app leaves judgment calls to the Admin, who can pick up the phone. There are no payment deadlines, deposits or automatic expiries.

## Roles

| Role                            | Who                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Admin** (owner, head trainer) | Runs everything and teaches too. Has **no trainer wallet**: when he teaches, the trainer's part goes to the Admin wallet. |
| **Staff Trainer**               | Teaches the lessons the Admin assigns. Doesn't create courses, schedule anything or edit dog profiles.                    |
| **Partner**                     | A clinic, groomer or pet shop that brings in customers for a commission.                                                  |
| **Customer** (dog owner)        | Manages their dogs, requests evaluations and courses, pays what they owe.                                                 |

| Feature                              |    Customer    | Staff Trainer  | Partner |     Admin     |
| ------------------------------------ | :------------: | :------------: | :-----: | :-----------: |
| Dog profiles (F2)                    |      Own       | Assigned dogs  |    —    |      All      |
| Request evaluation / course (F3, F5) |       ✅       |       —        |    —    |       —       |
| Calendar (F6)                        | Own, read-only | Own, read-only |    —    |  Full, edits  |
| Referral link, QR, phone leads (F12) |       —        |       —        |   ✅    |      ✅       |
| Wallet (F7)                          |      Own       |      Own       |   Own   |      All      |
| Withdrawal (F11)                     |    Request     |    Request     | Request | Pays them out |

---

## Features

### F1. Sign-in and Accounts

**Who:** everyone.

- Sign in with a phone number and an SMS code. Already built: 5-digit code, valid for 2 minutes, resend after 60 seconds, invalidated after 5 wrong attempts, rate-limited per phone and per IP.
- One role per phone number. Only customers self-register; the Admin creates staff trainer and partner accounts.
- Blocked users can't sign in.
- Each user edits their name and Sheba number (for [F11](#f11-withdrawals)).

**Pages:** Login / Register · Profile Settings · Users · User Form

---

### F2. Dog Profiles

**Who:** the customer manages their own dogs; the Admin sees and edits all; a staff trainer sees the dogs of their lessons.

The exact fields are **pending the owner**. Until then the app keeps what exists today (name, breed, sex, birth date, weight, neutered, microchip, vaccinations, behavior and medical notes, photo) and builds nothing new on guesses. Details the customer doesn't fill in, the Admin gets in person and enters himself, usually at the evaluation ([F3](#f3-evaluation)).

**Locked after the evaluation.** Once a dog is **evaluated** ([F3](#f3-evaluation)), the fields that decide eligibility ([F4](#f4-eligibility)) are **locked for the customer**: today the **birth date** and the **breed**. Only the Admin can change them from then on. Otherwise a customer could change a birth date to get past an age range. When the owner defines more eligibility fields, they join this list.

**Passed courses.** A dog's profile lists the courses it has **passed**. A course gets there in two ways:

- **Completed on the site:** an enrollment of it completes ([F8](#f8-enrollment-money-and-completion)).
- **Marked by the Admin**, when he sees at the evaluation (or any time) that the dog already knows it, e.g. it was trained before the site existed. He can unmark these too.

Both count the same for prerequisites ([F4](#f4-eligibility)). Only the Admin edits the passed courses; the customer sees them.

**Notes.** The Admin writes dated notes on a dog's profile. Each note is kept, so they build up the dog's history. A note can settle an evaluation ([F3](#f3-evaluation)). **The customer reads every note**, and each new note sends them a notification that opens the dog's notes ([F14](#f14-notifications)). Private notes for the Admin only are a [future feature](#future-features).

**No deleting dogs.** A dog is never deleted, by anyone: its evaluations, enrollments and money point at it. Letting a customer disable a dog is a [future feature](#future-features).

A dog's page shows whether it is evaluated, its notes, its passed courses, and its enrollments and their status.

**Pages:** Dogs List · Dog Form · Dog Detail · Enrollment Detail (Admin)

---

### F3. Evaluation

**Who:** the customer requests; the Admin accepts, schedules and settles it.

The free first meeting with a dog: a **checkup**, not a test. The Admin gets to know the dog and uses what he learns to fill in its profile ([F2](#f2-dog-profiles)). Evaluations involve no money.

1. **Request.** The customer picks a dog and attaches photos or videos of its behavior. They give an **earliest date** and **when they're usually free** (weekdays and time of day: morning, afternoon, evening).
2. **Accept or reject.** The Admin rejects it with a reason, or accepts it. An accepted evaluation becomes an **evaluation card** on his calendar ([F6](#f6-calendar)), assigned to him by default. He can assign it to a staff trainer on the card.
3. **Schedule.** He places the card as a draft, calls the customer, and confirms it.
4. **Settle.** The Admin settles it with a note, or removes it (below).

**Result.** Once its confirmed card has **started**, an evaluation has one of three results:

| Result        | How it gets there                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `needsAction` | The confirmed card's end time has passed and the Admin hasn't settled it yet.                                                                     |
| `true`        | The Admin saves a **note** on the dog's profile any time after the card **started**, during the meeting or after it. This can skip `needsAction`. |
| `false`       | The Admin presses **Remove** in the needs-action list and confirms the dialog: the meeting didn't happen or doesn't count.                        |

`true` and `false` are final: a guard stops either from going back to `needsAction`, so the live query below must leave them out.

**Evaluated** is not stored separately: a dog is **evaluated** when any of its evaluations is `true`. That is what opens course requests ([F4](#f4-eligibility)) and locks the eligibility fields ([F2](#f2-dog-profiles)).

**The needs-action list.** The Admin's dashboard lists every evaluation that needs action. It is a **live query** (confirmed evaluations whose card has ended and that are neither `true` nor `false`), so an evaluation appears the moment its time is up, with no job to wait for. Each row has:

- **Go to the dog's profile.** The Admin changes whatever he wants there (details, passed courses), then writes a **note**. Saving it settles the evaluation as `true`. If he edits the profile but never writes the note, the evaluation stays on the list.
- **Remove.** Behind a confirmation dialog. Sets the evaluation to `false`. The customer gets an SMS ([F14](#f14-notifications)) and can request a new evaluation.

Only the Admin settles evaluations and edits profiles. Staff trainers don't, even when they held the meeting.

**Edge cases:**

- **Who can request an evaluation:** only a dog with **no** evaluation, or whose evaluations are all `false`, rejected or cancelled. A dog with an open request (requested or accepted), or one that `needsAction` or is `true`, can't request another.
- **A note written before the card started** (e.g. while the Admin fills in details from the customer's videos): it doesn't settle the evaluation.
- **The Admin cancels an evaluation** before its card starts (a rejected request, or a card he cancels): it never gets a result. The customer gets an SMS if it was confirmed, and can request again.
- **A draft evaluation card's time passes** without being confirmed: it gets no result; only confirmed cards do. The calendar flags it as a past draft ([F6](#f6-calendar)).
- **A dog the Admin already knows** (trained before the site existed): from its profile, he records an evaluation that is `true` straight away, with no card and no meeting. The dog is evaluated like any other.

**Pages:** Request an Evaluation · My Requests · Dog Detail · Evaluation Requests · Admin Dashboard (needs-action list) · Calendar

---

### F4. Eligibility

**Who:** runs when a customer requests a course, and when the Admin accepts a request or assigns a course directly ([F5](#f5-course-requests)).

One **eligibility check** decides whether a dog may take a course. It is a single place in the code, so new rules plug into it without touching the request flow. Today it checks:

1. The dog is **evaluated** ([F3](#f3-evaluation)).
2. The dog has **passed** every prerequisite course: completed it on the site, or the Admin marked it passed ([F2](#f2-dog-profiles)).
3. The dog's age is inside the course's age range.
4. The dog has no **other** open request and no **active** enrollment for the same course. (When the Admin accepts a request, that request itself doesn't count.)

A failed check says **why**, e.g. «اول باید دوره‌ی سگ خونگی را تمام کند» or «حداقل سن این دوره ۶ ماه است». It blocks the Admin too; his message also tells him how to resolve it. Breed rules and evaluation tags are [future features](#future-features).

**Pages:** Request a Course · Course Detail (public: shows which of the customer's dogs qualify) · Course Request Detail · Dog Detail (Admin)

---

### F5. Course Requests

**Who:** the customer requests; the Admin accepts or rejects, or assigns a course directly.

1. **Request.** The customer picks a course and a dog that passes [F4](#f4-eligibility). They give an **earliest start date** and **when they're usually free**. They don't pick lesson times; the Admin plans those and calls them.
2. **Accept or reject.** The Admin rejects with a reason, or accepts. On accept he confirms:
   - the **price**, pre-filled from the course,
   - the **lesson count**, pre-filled from the course,
   - the **trainer**: himself by default, or a staff trainer,
   - the **trainer share** percent. The input is **active only when he picks someone else**, and starts from a **hard-coded default** (`DEFAULT_TRAINER_SHARE_PERCENT`, 40%). When he teaches it himself the share doesn't apply (his part goes to the Admin wallet), so the input stays disabled and no share is saved.

   Accepting creates an **enrollment** with these values copied onto it. They never change afterwards.

3. **Owed.** Creating the enrollment charges its price to the customer ([F8](#f8-enrollment-money-and-completion)). It appears in the customer's cart ([F9](#f9-cart-and-payment)) and as an **enrollment card** on the Admin's calendar ([F6](#f6-calendar)).

**Assigning without a request.** The Admin can also enroll a dog in a course **directly**, from the dog's profile, with no request from the customer (e.g. they agreed it by phone or at the evaluation). He fills in the same form as when accepting, and from there it follows step 3. The customer gets an SMS ([F14](#f14-notifications)).

**Enrollment status:** `active` from creation, then `completed` ([F8](#f8-enrollment-money-and-completion)) or `cancelled` ([F10](#f10-cancellations-and-refunds)). Both are final.

**Edge cases:**

- **The dog stopped being eligible** since the request was sent, or the Admin assigns a course to a dog that doesn't qualify: [F4](#f4-eligibility) blocks, and he resolves the conflict first (mark a prerequisite passed, correct the birth date, record an evaluation).
- **The course changes in the catalogue after acceptance** (price, lesson count): existing enrollments keep their copied values.
- **The Admin got the values wrong:** he cancels the enrollment as his own fault (full refund of what is held, [F10](#f10-cancellations-and-refunds)) and assigns the course again directly with the right values.
- **The customer never pays:** no deadline and no expiry. The Admin calls them.

**Pages:** Request a Course · My Requests · Course Requests · Course Request Detail · Dog Detail (Admin: assign a course) · Cart

---

### F6. Calendar

**Who:** the Admin plans; customers and staff trainers see their own, read-only.

The Admin's **personal scheduler**, built for a **computer**. He plans everything by hand; the only cards the app makes for him are for enrollments and accepted evaluations. The customers' and trainers' read-only calendars also work on a phone.

**Cards:**

- **Enrollment card:** one per active enrollment, showing the dog, the course and how many lessons are **still to place** (lesson count − lessons placed and not cancelled). Dragging from it creates a **lesson card**. When nothing is left to place, it can't be dragged from and stays out of the way.
- **Evaluation card:** one per accepted evaluation. It is a single meeting, so the Admin drags the card itself onto the calendar.
- **Lesson card:** one lesson. The Admin can move it, change its length, its trainer and its place (home, outside, boarding), or cancel it. Its trainer defaults to the enrollment's trainer, its length to the course's lesson length. Like at acceptance, the lesson's **trainer share** input is active only when its trainer is someone other than the Admin. It starts from the enrollment's share if the enrollment has a staff trainer, otherwise from the hard-coded default (40%), and a change applies to that lesson only. So when the Admin keeps an enrollment but gives lesson 4 to a staff trainer, lesson 4's share input opens at 40%.
- **Personal blocks:** time the Admin marks busy for himself. No money, no customer.

**Draft and confirmed:**

- Placed lessons and evaluations start as **drafts**, which only the Admin sees.
- When he has agreed the times with the customer by phone, he **confirms** them. The customer and each trainer involved then see them on their calendars, and get an SMS ([F14](#f14-notifications)).
- Changing or cancelling a **confirmed** card sends an SMS. Drafts change silently.

**Who sees what.** There is no calendar per user: there is one table of cards, and each calendar is a query on it, by time window.

- **Customer:** the confirmed cards of their dogs (the customer is stored on each card, with an index).
- **Staff trainer:** the confirmed cards assigned to them.
- **Admin:** everything, drafts included, filterable by trainer.

**Edge cases:**

- **Cards overlap:** allowed. The calendar shows overlapping cards side by side and **warns, but never blocks**: there are plenty of good reasons, e.g. a trainer training two dogs together, a customer with two dogs having lessons at the same time, or an assistant joining the Admin's lesson. It warns when two overlapping cards share a **trainer** or a **dog**, or when a card overlaps one of the Admin's **personal blocks**. The warning is on the card; nothing needs to be dismissed to save or confirm.
- **A lesson moves from one staff trainer to another:** it keeps its current share, and the Admin can change it. Moving it to the Admin disables the input; moving it back to a staff trainer starts again from the enrollment's share or the default.
- **A paid lesson needs a different trainer or share:** a paid lesson is **locked**. On an active enrollment, the Admin cancels it, which reverses its payout ([F8](#f8-enrollment-money-and-completion)), and places a new lesson with the right trainer and share.
- **A completed enrollment:** all its lessons are **locked**; nothing can be moved, changed or cancelled. A money correction after completion is a manual transaction ([F7](#f7-ledger-and-wallets)).
- **A draft's time passes without being confirmed:** it is **not paid** ([F8](#f8-enrollment-money-and-completion) pays confirmed lessons only). The calendar flags past drafts so the Admin confirms or cancels them.
- **The lesson wasn't held properly** (no-show, cut short): the Admin decides. He cancels it (no payout, or the payout is reversed) or leaves it (it is paid like any other).
- **A lesson is cancelled:** it no longer counts toward the enrollment, so the enrollment card shows one more lesson to place.

**Pages:** Calendar (Admin) · My Calendar (customer) · My Calendar (staff trainer) · Lesson Detail

---

### F7. Ledger and Wallets

**Who:** everyone with money; the Admin sees all of it.

The ledger stays as it is built today:

- Every movement of money is a **transaction** whose signed **lines** add up to **0**: senders negative, receivers positive. A database trigger (`app/db/money-constraints.sql`) enforces it even if a bug skips the service.
- Transactions are **append-only**. A mistake is corrected by a new transaction, usually its **mirror** (every sign flipped).
- Money is integer **Rial**. Every wallet's balance is cached and updated in the same database transaction as its lines.
- The Admin can create **manual transactions** and mirrors, e.g. to forgive a debt (`Admin −X → Customer +X`) or to record money a customer paid him directly (`Bank −X → Customer +X`).

**Wallets:**

- **User wallets:** one per customer, staff trainer and partner. A customer's goes negative while they owe for an enrollment; others can go negative only through a reversal ([F8](#f8-enrollment-money-and-completion)).
- **System wallets:**
  - **Admin:** platform revenue, and the head trainer's teaching income.
  - **Gateway:** the other side of online card payments.
  - **Bank:** the other side of money moved through the bank by hand, in either direction: withdrawals paid out, and payments a customer made to the Admin directly.
  - **Withdrawal hold:** withdrawals waiting to be paid.
  - **Enrollment holding** (new): an enrollment's money between its acceptance and its lessons being taught.

**Pages:** Wallet · Transactions · Transaction Form · Wallets

---

### F8. Enrollment Money and Completion

**Who:** runs when an enrollment is created and in the hourly job ([F15](#f15-hourly-job)).

| When                               | Transaction                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| The enrollment is created          | Customer −price → Enrollment holding +price                                                           |
| Hourly, for each lesson that ended | Enrollment holding −lesson value → Trainer +trainer part, Admin +the rest (all to Admin if he taught) |
| A paid lesson is cancelled         | Mirror of its payout: the lesson value goes back to Enrollment holding                                |

**Lesson value.** Every payout is `floor(price ÷ lesson count)`, except the **final** one: the payout that brings the enrollment's paid lessons up to its lesson count. The final payout takes **everything still in the enrollment's holding**, so the payouts add up to the price exactly. E.g. 10,000,001 Rial over 3 lessons: 3,333,333, then 3,333,333, then 3,333,335. Which lesson is final depends only on the count, not on its date or position, so cancelled and replaced lessons don't change the rule.

- **Trainer part** = `floor(lesson value × the lesson's trainer share %)`. The Admin gets the rest, so rounding never unbalances a transaction. A lesson the Admin teaches has no trainer part: the whole value goes to the Admin wallet.
- A lesson's value doesn't change if the Admin makes it longer or shorter.
- The trainer part goes to **the lesson's trainer**, which may differ from lesson to lesson.
- Only **confirmed** lessons whose **end time has passed** and that **aren't cancelled** are paid, each **once** (a unique index on the lesson's payout).
- Lessons can be held before the customer pays. Trainers are paid either way.

**Completion.** An enrollment is **completed** in the same database transaction as its final payout. From then on it is final and its lessons are locked ([F6](#f6-calendar)). Its course is added to the dog's **passed courses** ([F2](#f2-dog-profiles)) and counts as a prerequisite ([F4](#f4-eligibility)).

**Example:** a 10,000,000 Rial course of 8 lessons, trainer share 40%, taught by a staff trainer, paid in full.

| When                |    Customer | Enrollment holding |   Trainer |     Admin |     Gateway |
| ------------------- | ----------: | -----------------: | --------: | --------: | ----------: |
| Enrollment created  | −10,000,000 |        +10,000,000 |           |           |             |
| Customer pays (F9)  | +10,000,000 |                    |           |           | −10,000,000 |
| Each lesson, hourly |             |         −1,250,000 |  +500,000 |  +750,000 |             |
| After all 8 lessons |           0 |                  0 | 4,000,000 | 6,000,000 | −10,000,000 |

**Edge cases:**

- **A paid lesson is cancelled** (its end time has passed and the hourly job has paid it), on an **active** enrollment: its payout is **mirrored**, so the trainer and Admin give the lesson value back to the enrollment's holding. The Admin places a replacement, or the money is refunded if the enrollment is cancelled. This can happen any time after the payout, not only within the hour.
- **The trainer already withdrew that money:** their wallet goes **negative**. They can't withdraw until later lessons bring it back up, and the Admin can settle it by hand.

**Pages:** Enrollment Detail · Wallet · Transactions

---

### F9. Cart and Payment

**Who:** the customer pays; the gateway confirms.

- The **cart** shows the **total owed**, which is the customer's negative balance, and the enrollments it is for. To show which enrollments are still unpaid, payments are matched to the **oldest** enrollment first. This matching is for display only; money isn't tied to an enrollment.
- «تسویه حساب» sends the whole total to the gateway. Paying part of it is a [future feature](#future-features).
- A successful payment is one database transaction: the payment record, `Gateway −X → Customer +X`, and the partner commission when it's due ([F13](#f13-partner-commission)).
- There is no deposit and no payment deadline.

**Edge cases:**

- **The gateway calls back twice:** a unique index on the payment rejects the second one, as today.
- **The customer pays twice** (two tabs, or just after the Admin forgave a debt): the extra becomes **credit** in their wallet, which they can spend on their next enrollment or withdraw.
- **The customer has credit when an enrollment is created:** the charge uses it up first; the cart shows only what's still owed.
- **The payment fails or is abandoned:** nothing moves; the debt stays and the cart still shows «تسویه حساب».

**Pages:** Cart · Payment Result · Wallet

---

### F10. Cancellations and Refunds

**Who:** only the Admin cancels an enrollment, and only an **active** one.

He records **who caused it**: the customer, or the trainer or Admin. That decides the refund, which comes out of what the enrollment still has in its holding:

| Cancellation                             | Customer gets back                                                  |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Before any lesson was paid               | Everything held: 100%.                                              |
| By the customer, after a lesson was paid | `held × refund policy %`, rounded down. The rest goes to the Admin. |
| By the trainer or the Admin              | Everything held: 100%, whatever the policy.                         |

The transaction: `Enrollment holding −held → Customer +refund, Admin +the rest`.

- Refund policies are presets on each course: **Flexible** 100%, **Moderate** 50%, **Strict** 0%.
- Cancelling an enrollment cancels its unpaid lessons, draft and confirmed, and sends an SMS for the confirmed ones.

**Edge cases:**

- **The customer still owes money:** the refund lowers the debt. Whatever is still owed (the lessons used plus the part the policy kept) stays owed; the Admin can forgive it with a manual transaction ([F7](#f7-ledger-and-wallets)).
- **The customer had paid in full:** the refund is credit they can spend or withdraw.
- **A completed enrollment** can't be cancelled; a correction is a manual transaction.
- **It was their first enrollment:** see [F13](#f13-partner-commission).

**Pages:** Enrollment Detail · Refund Policies · Cancellation and Refund Rules (public)

---

### F11. Withdrawals

**Who:** customers, staff trainers and partners request; the Admin pays them out through the bank (Sheba).

1. The user asks to withdraw at least **1,000,000 Rial**, no more than their balance, to their Sheba number.
2. **On request:** `User −Y → Withdrawal hold +Y`. The money is locked straight away.
3. The Admin has **72 hours** to act:
   - **Pay it:** he transfers the money through the bank and enters its tracking code. `Withdrawal hold −Y → Bank +Y`.
   - **Decline it, or the user cancels it:** `Withdrawal hold −Y → User +Y`.

**Edge cases:**

- **A negative or owing wallet** can't withdraw: the balance must cover the amount.
- **The 72 hours pass:** nothing automatic happens; the request is flagged as late in the Admin's queue.

**Pages:** Withdrawal Request · Wallet · Withdrawal Queue

---

### F12. Partner Attribution

**Who:** partners bring customers; the Admin manages partners.

Partners bring in customers through:

1. a **referral link** with their code,
2. a **QR code** of that link, for their shop,
3. **phone leads:** a phone number entered in their dashboard before the customer signs up.

Rules (as today):

- A customer is attributed to **one partner, permanently**, when they register.
- A referral link wins over a phone lead.
- If several partners entered the same phone number, the **earliest** lead wins; the others see it as lost.
- An inactive partner's link and leads don't attribute anyone.

**Pages:** Referral Link and QR Code · Phone Leads · Referred Customers · Partner Dashboard · Partners and Leads

---

### F13. Partner Commission

**Who:** paid automatically at a customer's payment.

**The rule.** At any **payment** that brings the customer's balance to **0 or above**, if the customer has a partner and no commission has been paid for them yet, the partner gets a percentage (setting, default **10%**) of the price of the customer's **earliest enrollment that isn't cancelled**, rounded down.

- It is paid **out of the Admin wallet**, so trainers' income never depends on who brought the customer: `Admin −commission → Partner +commission`.
- A **payment** is a gateway payment or one the Admin records by hand (`Bank −X → Customer +X`). Refunds, forgiven debts and other transactions never trigger it, even if they bring the balance to 0.
- Online payments always pay the whole amount owed, so in practice the commission comes with the customer's first online payment after their first enrollment.

**Example:** the first enrollment costs 10,000,000 Rial. The customer hands the Admin 4,000,000 directly, then pays the rest online.

| Step | What happens                             | Customer wallet |                       Partner |
| ---- | ---------------------------------------- | --------------: | ----------------------------: |
| 1    | The enrollment is created                |     −10,000,000 |                             0 |
| 2    | The Admin records 4,000,000 paid by hand |      −6,000,000 |     0 (balance still below 0) |
| 3    | The customer pays 6,000,000 online       |               0 | +1,000,000 (Admin −1,000,000) |

**Edge cases:**

- **Two payment callbacks at the same moment:** a unique index allows **one commission transaction per customer**.
- **The customer's first enrollment is cancelled before any payment brings the balance to 0:** it is cancelled, so the next enrollment becomes the earliest one that isn't.
- **The enrollment the commission was based on is cancelled afterwards:** the partner **keeps** it. The Admin can mirror it by hand.
- **The partner is inactive at that moment:** no commission; it stays with the Admin.

**Pages:** Partner Dashboard · Referred Customers · Wallet

---

### F14. Notifications

**Who:** sent automatically, by SMS, with an in-app copy. In showcase mode SMS land in the SMS Outbox instead of being sent.

| Event                                 | To                                       |
| ------------------------------------- | ---------------------------------------- |
| Evaluation or course request accepted | Customer                                 |
| Evaluation or course request rejected | Customer (with the reason)               |
| A course assigned by the Admin        | Customer                                 |
| Lessons or an evaluation confirmed    | Customer, and each trainer involved      |
| A confirmed card changed or cancelled | Customer, and each trainer involved      |
| An enrollment cancelled               | Customer, and its trainers               |
| Evaluation removed (`false`)          | Customer: it didn't count, request again |
| A new note on a dog                   | Customer, linking to the dog's notes     |
| Withdrawal paid or declined           | The user                                 |

**Pages:** SMS Outbox · the dashboards

---

### F15. Hourly Job

**Who:** the server, **every hour**, hard-coded (a lesson is about an hour and a half, so payouts look close to instant). In order:

1. **Pay lessons** ([F8](#f8-enrollment-money-and-completion)): every confirmed lesson whose end time has passed, that isn't cancelled and hasn't been paid. A final payout completes its enrollment in the same database transaction.
2. **Audit** the ledger ([F16](#f16-privacy-and-audit)).

Evaluations don't wait for it: the needs-action list is a live query ([F3](#f3-evaluation)). Only money has to be written once, so only money needs the job.

**Edge cases:**

- **A run is missed** (server down): it doesn't look only at the last hour, so the next run pays every lesson left behind, whatever its date.
- **It runs twice, or two runs overlap:** each lesson's payout is unique, so only one gets through.
- **The Admin cancels a lesson that went wrong:** it was most likely paid already, so the payout is reversed ([F8](#f8-enrollment-money-and-completion)). Trainers may see a lesson's pay and its reversal close together.

---

### F16. Privacy and Audit

- **Customers** see their own charges, payments, refunds and withdrawals, never the split lines (trainer, partner or Admin parts).
- **Staff trainers and partners** see only the transactions with a line on their own wallet.
- **Audit:** on every run of the hourly job, every wallet's cached balance must equal the sum of its lines, and all balances together must add up to 0. A mismatch is shown on the Admin dashboard with the wallet and the transactions involved.

**Pages:** Wallet · Transactions · Admin Dashboard

---

### F17. Course Catalogue

**Who:** the public browses; the Admin manages the catalogue.

- The catalogue and its course pages sell the head trainer and his courses, as today.
- Only the Admin creates and edits courses. Every course in this version has a **price**, a lesson count, a lesson length, an age range, prerequisites and a refund policy. It has **no trainer share**: the share is set when a staff trainer is assigned ([F5](#f5-course-requests), [F6](#f6-calendar)).
- The full set of course settings is **pending the owner**, like dog profiles.
- Archived courses can't be requested or assigned, but their active enrollments continue, and a completed one still counts as a prerequisite.
- Courses without a price (working and sport dogs) are **not in this version**; they are a [future feature](#future-features).

**Pages:** Home · Course Catalogue · Course Detail · Courses (Admin) · Course Form

---

### F18. Settings

Stored in the database so the Admin can change them without a release.

| Setting                | Default                         |
| ---------------------- | ------------------------------- |
| Partner commission     | 10%                             |
| Minimum withdrawal     | 1,000,000 Rial (۱۰۰ هزار تومان) |
| Withdrawal window      | 72 hours                        |
| OTP requests per phone | 5 per hour                      |
| OTP requests per IP    | 20 per hour                     |

The refund policy is per course. Hard-coded, not settings: the **default trainer share** (40%; the Admin changes the share per enrollment or per lesson when he assigns a staff trainer) and the **hourly job's interval**.

**Pages:** Platform Settings

---

## Pages

Each page and the features on it.

**Public**

| Page                          | Features           |
| ----------------------------- | ------------------ |
| Home                          | F17, F12 (`?ref=`) |
| Course Catalogue              | F17                |
| Course Detail                 | F17, F4            |
| Login / Register              | F1, F12            |
| Help and FAQ                  | —                  |
| Cancellation and Refund Rules | F10                |
| Privacy                       | —                  |
| Partner Enquiry               | F12                |

**Customer**

| Page                  | Features    |
| --------------------- | ----------- |
| Dashboard             | F6, F9, F14 |
| Dogs List             | F2          |
| Dog Form              | F2          |
| Dog Detail            | F2, F3, F8  |
| Request an Evaluation | F3          |
| Request a Course      | F5, F4      |
| My Requests           | F3, F5      |
| Cart                  | F9          |
| Payment Result        | F9          |
| My Calendar           | F6          |
| Enrollment Detail     | F8, F6      |

**Shared (customer, staff trainer, partner)**

| Page               | Features |
| ------------------ | -------- |
| Profile Settings   | F1       |
| Wallet             | F7, F16  |
| Withdrawal Request | F11      |

**Staff trainer**

| Page          | Features |
| ------------- | -------- |
| My Calendar   | F6       |
| Lesson Detail | F6, F2   |

**Partner**

| Page                      | Features |
| ------------------------- | -------- |
| Partner Dashboard         | F12, F13 |
| Referral Link and QR Code | F12      |
| Referred Customers        | F12, F13 |
| Phone Leads               | F12      |

**Admin**

| Page                  | Features         |
| --------------------- | ---------------- |
| Admin Dashboard       | F16, F11, F3, F5 |
| Calendar              | F6               |
| Dogs                  | F2               |
| Dog Detail            | F2, F3, F5, F4   |
| Evaluation Requests   | F3               |
| Evaluation Detail     | F3, F2           |
| Course Requests       | F5               |
| Course Request Detail | F5, F4           |
| Enrollments           | F8               |
| Enrollment Detail     | F8, F10, F6      |
| Users                 | F1               |
| User Form             | F1               |
| Courses               | F17              |
| Course Form           | F17              |
| Transactions          | F7, F16          |
| Transaction Form      | F7               |
| Wallets               | F7               |
| Withdrawal Queue      | F11              |
| Refund Policies       | F10              |
| Partners and Leads    | F12, F13         |
| Platform Settings     | F18              |
| SMS Outbox (showcase) | F14              |

---

## Future Features

Not in this version. The design leaves room for each.

1. **Customers cancel a lesson themselves**, at least **2 days** before it starts.
2. **One-use cards.** The Admin creates a card on the calendar that fires a transaction when it is held, e.g. a single extra session or a boarding night. The hourly job would pay it like a lesson.
3. **Partial payments.** The customer pays part of what they owe. [F13](#f13-partner-commission) already works with partial payments.
4. **Breed rules and evaluation tags** in [F4](#f4-eligibility), once the owner defines dog profiles and course settings.
5. **Discount codes.**
6. **Public pages for staff trainers.**
7. **Private notes.** Notes on a dog that only the Admin sees, beside the customer-visible notes ([F2](#f2-dog-profiles)). They wouldn't send a notification or settle an evaluation.
8. **Courses without a price** (working and sport dogs): requesting them, and the Admin setting their price when he accepts or assigns one ([F5](#f5-course-requests)). Until then the home page mentions them and customers contact the Admin to enroll.
9. **Disabling a dog.** The customer asks to disable one of their dogs. It is disabled **immediately** if the dog has no active enrollment and no draft card; otherwise the request goes to the Admin. What "disabled" means is still to be decided.

**Dropped** from the earlier docs: behavior modification requests and plans, course tests (an exam that counts as passing a course), assessment slots, trainers submitting courses for approval, reviews and comments, and orders as a separate step before payment.

## Open Questions

1. **Dog profile and course settings:** pending the owner ([F2](#f2-dog-profiles), [F17](#f17-course-catalogue)).

---

## What this replaces

This spec replaces, where they disagree:

- [app-phase-one.md](app-phase-one.md), [app-phase-one-overview.md](app-phase-one-overview.md) and [app-phase-one-pages.md](app-phase-one-pages.md)
- [business-logic.md](business-logic.md) (its rounding rules and settings live on here, adjusted)
- [foundations-plan.md](foundations-plan.md) (the foundations are built; slot booking is gone)
- The design briefs of dropped pages: [behavior-design.md](behavior-design.md), and the slot and test parts of [assessment-design.md](assessment-design.md) and [training-design.md](training-design.md)

The visual and voice docs ([storefront-design.md](storefront-design.md), [design-flow.md](design-flow.md), the frontend and backend guidelines) still apply.
