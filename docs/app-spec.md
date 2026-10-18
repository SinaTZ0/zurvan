# K9 Training — App Specification

The source of truth for how the app works. The course catalog's content comes from [zurvan-courses.md](zurvan-courses.md); the shape of a dog profile and of a course's settings is still being worked out with the owner (see [F2](#f2-dog-profiles) and [F8](#f8-course-catalogue)).

**How to read it.** The spec is organized by **feature**, because one page often holds several features and one feature often shows up on several pages. Each feature says who uses it, its rules, its edge cases and the pages it appears on. [Pages](#pages) at the end lists every page with the features on it. Refer to a feature by its number (`F5`) in code comments and commits.

**Words.** A **course** is an item in the catalogue («دوره»): House manner, CGC. An **enrollment** is one dog taking one course: Leo's CGC. Buying a course for a dog creates an enrollment; completion and cancellation belong to the enrollment. The Persian UI can say «دوره» for both.

---

## The Business

**K9 Training** (آموزش K9) is a head trainer's private practice. He is the owner and the app's **Admin**. He is also the center's only trainer: the site introduces him alone (the two placeholder colleagues' cards are switched off since 2026-10-18 at the owner's request, but kept in the repo). Training is mostly private (one dog), at the client's place or at the center; the owner also plans group classes at the center and offers boarding by prior arrangement with a partner pension, but the app has no seats, schedule or booking for any of that.

The app is a **small shop with locked items**. A new dog starts with a **free evaluation**, a first checkup where he gets to know the dog. Once a dog is evaluated, its owner can **buy courses** for it, as long as it has passed each course's prerequisites. Courses have a **fixed price** and are **paid upfront**. After a purchase the Admin calls the customer, and when the training is over he marks the enrollment **done**, which unlocks the next courses. **Partners** (clinics, groomers, pet shops) bring in customers and earn a commission on a customer's first purchase.

**The app doesn't run the business.** Lesson times, sessions and everything in between are handled by the Admin in real life, by phone. The app records what was requested, bought and finished, and shows him the general picture. There is no calendar, no lesson tracking, no trainer earnings, no refunds, no deadlines and no automatic expiries.

## Roles

| Role                            | Who                                                                      |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Admin** (owner, head trainer) | Runs everything. The only staff account, and the only trainer.           |
| **Partner**                     | A clinic, groomer or pet shop that brings in customers for a commission. |
| **Customer** (dog owner)        | Manages their dogs, requests evaluations, buys courses.                  |

| Feature                             | Customer |  Partner  |       Admin        |
| ----------------------------------- | :------: | :-------: | :----------------: |
| Dog profiles (F2)                   |   Own    |     —     |        All         |
| Evaluation (F3)                     | Requests |     —     | Evaluates, rejects |
| Cart and checkout (F5)              |    ✅    |     —     |         —          |
| Enrollments (F6)                    |   Own    |     —     | Completes, cancels |
| Referral link, QR, phone leads (F7) |    —     |    ✅     |         ✅         |
| Commissions (F7)                    |    —     | Own, read |  All, marks paid   |

---

## Features

### F1. Sign-in and Accounts

**Who:** everyone.

- Sign in with a phone number and an SMS code. Already built: 5-digit code, valid for 2 minutes, resend after 60 seconds, invalidated after 5 wrong attempts, rate-limited per phone and per IP.
- One role per phone number. Only customers self-register; the Admin creates partner accounts.
- Blocked users can't sign in: the Admin blocks and unblocks from the Users page, which signs the user out everywhere at once. He can't block himself or any admin. Blocking a partner closes his sign-in only; his link and commissions are switched off by deactivating him ([F7](#f7-partners)).
- Each user edits their name. Partners also enter their Sheba number, so the Admin knows where to send commissions ([F7](#f7-partners)).
- **Password (optional).** After signing in, a customer or partner can set a password in Profile Settings and then sign in with their number and that password; the code stays, and is also how a forgotten password is fixed (sign in with a code, then set a new one there; the card asks for no "current password"). A password can be set or replaced only within 30 minutes of signing in, and doing so signs the other devices out. It is stored only as a hash. A wrong password, an unknown number and a number that never set one all read the same, 5 wrong passwords in 15 minutes pause password sign-in for that number (the code still works), and password sign-in is rate-limited per IP. While the sign-in code is the public showcase code, this adds convenience, not security.

**Pages:** Login / Register · Profile Settings · Users (user form in a dialog)

---

### F2. Dog Profiles

**Who:** the customer manages their own dogs; the Admin sees and edits all.

The exact fields are **pending the owner**. Until then the app keeps what exists today (name, breed, sex, birth date, weight, neutered, microchip, vaccinations, behavior and medical notes, photo) and builds nothing new on guesses. Details the customer doesn't fill in, the Admin gets in person and enters himself.

**Locked after the evaluation.** Once a dog is **evaluated** ([F3](#f3-evaluation)), the fields that decide eligibility ([F4](#f4-eligibility)) are **locked for the customer**: today the **birth date** and the **breed**. Only the Admin can change them from then on. Otherwise a customer could change a birth date to get past an age range.

**Passed courses.** A dog's profile lists the courses it has **passed**. A course gets there in two ways:

- **Completed on the site:** the Admin marks an enrollment of it done ([F6](#f6-enrollments)).
- **Marked by the Admin**, when he knows the dog already has it, e.g. it was trained before the site existed. He can unmark these too.

Both count the same for prerequisites ([F4](#f4-eligibility)). Only the Admin edits the passed courses; the customer sees them.

**No deleting dogs.** A dog is never deleted, by anyone: its evaluations and enrollments point at it.

A dog's page shows whether it is evaluated, its passed courses, its evaluation requests and its enrollments with their status.

**Pages:** Dashboard (customer: my dogs) · Dog Form · Dog Detail · Dogs (Admin) · Dog Detail (Admin)

---

### F3. Evaluation

**Who:** the customer requests; the Admin records the outcome.

The free first meeting with a dog: a **checkup**, not a test. It involves no money.

1. **Request.** The customer picks a dog and can attach **photos and videos** of it. They give an **earliest date** and **when they're usually free** (weekdays and time of day: morning, afternoon, evening).
2. **The Admin calls them** and they meet. The app doesn't record when.
3. **Outcome.** The Admin presses one of two buttons on the request:
   - **«ارزیابی شد»** (evaluated): the dog is now **evaluated** and its courses can be bought.
   - **«رد»** (rejected), with a reason: the dog isn't a fit, or the meeting never happened. The customer can request again.

**Status:** `requested` → `evaluated` or `rejected`; or `withdrawn` by the customer while it's still `requested`. All three are final.

**Evaluated** is not stored separately: a dog is evaluated when any of its evaluations is `evaluated`. That unlocks buying courses ([F4](#f4-eligibility)) and locks the eligibility fields ([F2](#f2-dog-profiles)).

**Edge cases:**

- **Who can request an evaluation:** only a dog with no evaluation, or whose evaluations all ended `rejected` or `withdrawn`. A dog with a `requested` or `evaluated` one can't request another.
- **A dog the Admin already knows** (trained before the site existed): from its profile, he marks it evaluated directly, with no request. It is recorded as an evaluation in `evaluated`.

**Pages:** Evaluation Request · Dashboard (customer: open requests) · Dog Detail · Evaluations (Admin) · Dog Detail (Admin)

---

### F4. Eligibility

**Who:** runs when a customer adds a course to the cart, at checkout, and again when the payment comes back ([F5](#f5-cart-and-checkout)).

One **eligibility check** decides whether a dog may buy a course. It is a single place in the code, so new rules plug into it without touching checkout. Today it checks:

1. The dog is **evaluated** ([F3](#f3-evaluation)).
2. The dog has **passed** every prerequisite course ([F2](#f2-dog-profiles)). A prerequisite that is only bought, or only in the cart, doesn't count: it must be done.
3. The dog's age is inside the course's age range.
4. The dog has no **active** enrollment of the same course.
5. The course isn't archived.

A failed check says **why**, e.g. «اول باید دوره‌ی سگ خونگی را تمام کند» or «حداقل سن این دوره ۶ ماه است». Course Detail shows, for each of the customer's dogs, whether it can take the course and why not.

**Pages:** Course Detail · Cart · Dog Detail (Admin: why a dog can't take a course)

---

### F5. Cart and Checkout

**Who:** the customer.

**The cart lives in the customer's account** (a `cart_item` table), so it follows them to another device; the browser keeps a copy in local storage so the page shows it at once. It holds items of **one course for one dog**. A customer can add several (two courses for two dogs, say) and pay for them all at once.

1. **Add to cart.** On Course Detail the customer picks one of their dogs and presses «افزودن به سبد». Picking a dog needs signing in. The same course for the same dog can't be in the cart twice.
2. **Cart.** It shows each item with the course's **current price** and its eligibility ([F4](#f4-eligibility)), read fresh from the server; an item that isn't eligible any more is marked and can't be paid for. The total is the sum of the eligible items.
3. **Pay.** «پرداخت» sends the items to the server, which checks each again and reads its price. It saves a **pending payment** listing the items (dog, course, price) and sends the total to the gateway.
4. **Result.** The gateway returns the customer to the Cart with a banner showing the result.
   - **Success:** in one database transaction, the payment becomes **paid**, an **enrollment** is created for each item at the price saved in step 3, and the partner commission is written when it's due ([F7](#f7-partners)). The cart is emptied. The customer sees «پرداخت انجام شد؛ برای هماهنگی با شما تماس می‌گیریم» (paid; we'll call you), and the Admin gets an SMS ([F9](#f9-notifications)).
   - **Failure or abandoned:** the pending payment becomes **failed**; the cart is unchanged.

Prices are fixed by the course. Discounts and changing a price for one customer are not in this version.

**Edge cases:**

- **The gateway calls back twice:** a unique index on the gateway's payment id, and a pending payment that can be settled only once, reject the second one.
- **An item stops being eligible between checkout and the callback** (the same course bought for the same dog in another tab, or the Admin archives the course): the payment is still recorded as paid, but that item gets **no enrollment**. It is flagged on the Admin Dashboard as **paid, not enrolled**, and the Admin gives that money back outside the app.
- **A price changes while the course is in the cart:** the cart always shows the current price; the customer pays what it showed at «پرداخت».
- **Another browser or device:** the cart is the account's, so it is there on any device. It is read again when the tab is used, so what was added elsewhere appears. A cart a browser held from before carts lived in the account is merged in once; after that the account's cart wins, so an item bought or removed elsewhere isn't put back by an out-of-date copy. Signing out empties the browser's copy and keeps the account's.
- **A payment settles:** the items it bought leave the cart, on every device.

**Pages:** Course Detail · Cart · Purchases

---

### F6. Enrollments

**Who:** created by checkout; the Admin completes or cancels them.

An enrollment is created **only by a successful payment** ([F5](#f5-cart-and-checkout)): the Admin doesn't create, accept or price them. Its price is the one paid and never changes.

| Status      | How it gets there                                                                             |
| ----------- | --------------------------------------------------------------------------------------------- |
| `active`    | Paid for at checkout. The Admin calls the customer to arrange the training.                   |
| `completed` | The Admin presses **«تمام شد»** on it in the Enrollments list and confirms. No note, no form. |
| `cancelled` | The Admin presses **«لغو»** and confirms.                                                     |

`completed` and `cancelled` are final. A completed enrollment makes its course **passed** for the dog ([F2](#f2-dog-profiles)).

**Edge cases:**

- **The Admin can't take the customer** (fully booked, or the dog isn't a fit after all): he cancels the enrollment. Refunds aren't in this version, so the money goes back outside the app and isn't recorded.
- **The course changes in the catalogue after the purchase:** existing enrollments keep the price paid.

**Pages:** Dashboard (customer) · Dog Detail · Enrollments (Admin) · Dog Detail (Admin)

---

### F7. Partners

**Who:** partners bring customers; the Admin manages partners and pays their commissions outside the app.

**Attribution.** Partners bring in customers through:

1. a **referral link** with their code,
2. a **QR code** of that link, for their shop,
3. **phone leads:** a phone number entered in their dashboard before the customer signs up.

- A customer is attributed to **one partner, permanently**, when they register.
- A referral link wins over a phone lead.
- If several partners entered the same phone number, the **earliest** lead wins; the others see it as lost.
- An inactive partner's link and leads don't attribute anyone.
- A partner can't enter a number that already has an account (a lead only matters at registration). He can never edit or delete a lead, so earliest-wins can't be gamed. A lead is `lost` when a link or an earlier partner's lead took the customer; the list then shows no name and nobody else.
- Deactivating a partner is reversible and stops new attributions **and** new commissions, including a first purchase by a customer he already had; written commissions stay payable.
- The Admin creates the account with the partner's name, phone number and an optional link code. The code never changes, because it is printed on the partner's card and QR.

**Commission.** At a customer's **first paid purchase**, if they have an active partner, the app writes one **commission**: a percentage (setting, default **10%**) of the total of the enrollments that payment created, rounded down to the Rial.

- One commission per customer, ever. Later purchases earn nothing.
- The Admin pays partners **outside the app**, by bank, and presses **«پرداخت شد»** on each commission. The partner sees each commission as paid or unpaid, both in the commissions list and on the row of the person it came from in Leads and Customers (the amount and the state; never the purchase's price, the course or the dog).
- **The enrollment is cancelled afterwards:** the partner keeps the commission.

**Pages:** Partner Dashboard (referral link, QR code, commissions) · Leads and Customers · Partners and Leads (Admin)

---

### F8. Course Catalogue

**Who:** the public browses; the Admin manages the catalogue.

- The catalogue and its course pages sell the head trainer and his courses, as today. Course Detail adds «افزودن به سبد» ([F5](#f5-cart-and-checkout)).
- Only the Admin creates and edits courses. Every course in this version has a **fixed price**, an age range and prerequisites. Its lesson count and lesson length are **shown to customers** as a description («حدوداً ۵ جلسه»); the app doesn't track lessons.
- The full set of course settings is **pending the owner**, like dog profiles.
- Archived courses can't be bought, but their active enrollments continue, and a completed one still counts as a prerequisite. Archiving and restoring are reversible switches. A course is never deleted, and its link name (slug) never changes after it is created.
- The Admin sets the catalogue order (up and down on the Courses page), uploads the cover, and picks prerequisites; a prerequisite that would make a cycle is refused. A new course goes on sale at once. A price change applies to later purchases only; existing enrollments keep the price paid (F5).
- Courses without a price (working and sport dogs) are **not in this version**; they are a [future feature](#future-features).

**Pages:** Home · Course Catalogue · Course Detail · Courses (Admin) · Course Form

---

### F9. Notifications

**Who:** sent automatically, by SMS, with an in-app copy. In showcase mode SMS land in the SMS Outbox instead of being sent. The outbox is read-only and paged (it gains a row per sign-in code).

| Event                          | To                                          |
| ------------------------------ | ------------------------------------------- |
| A new evaluation request       | Admin                                       |
| Evaluation marked «ارزیابی شد» | Customer: their dog's courses are now open  |
| Evaluation rejected            | Customer (with the reason)                  |
| A purchase paid                | Customer (receipt), and the Admin (to call) |
| An enrollment marked done      | Customer                                    |
| An enrollment cancelled        | Customer                                    |
| A commission marked paid       | Partner                                     |

**Pages:** SMS Outbox · the dashboards

---

### F10. Settings

Stored in the database so the Admin can change them without a release. Each is read on every use, so a change applies at once with no restart; a missing value means its default. A commission already written keeps the percent it was written with. The Admin can set the commission from 1 to 50%, codes per phone from 1 to 30 and per IP from 5 to 200 (guardrails against a typo). The demo accounts skip the hourly per-phone cap. The code length, its 2-minute validity, 5 wrong tries and the 60-second wait are fixed in code.

| Setting                | Default     |
| ---------------------- | ----------- |
| Partner commission     | 10%         |
| OTP requests per phone | 5 per hour  |
| OTP requests per IP    | 20 per hour |

**Pages:** Platform Settings

---

### F11. Admin Dashboard

**Who:** the Admin, every time he opens the app.

A plain **overview** of what's going on, not accounting. Each number links to the list behind it, already filtered.

| Block           | Shows                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Waiting for him | Evaluation requests to answer; the latest purchases, to call; items **paid, not enrolled** ([F5](#f5-cart-and-checkout)) |
| Enrollments     | Active, completed, cancelled                                                                                             |
| Money           | Sales this month and in total; commissions not yet paid                                                                  |
| Courses         | Each course: how many bought, active, completed                                                                          |

Money is integer **Rial**. At this scale every number is a simple indexed query; nothing is cached.

**Pages:** Admin Dashboard

---

### F12. Privacy and Safeguards

**Privacy.**

- **Customers** see their own dogs, evaluations, enrollments and payments.
- **Partners** see their own leads, which of their customers registered and bought, and their commissions. Not prices, dogs or other partners.

**Safeguards**, enforced by the database:

| Safeguard                   | How                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Paid prices never change    | Each item's price is saved on the pending payment at checkout and copied onto its enrollment.                                   |
| A payment settles once      | A unique index on the gateway's payment id; a pending payment becomes paid or failed by a conditional update, once.             |
| No double enrollment        | A partial unique index: one **active** enrollment per dog and course. The loser of a race becomes **paid, not enrolled**.       |
| One commission per customer | A unique index on the customer.                                                                                                 |
| Statuses only move forward  | Each status change is a conditional update (e.g. evaluate only a `requested` evaluation; complete only an `active` enrollment). |

**Tests** (focused, per the repository's testing rules): eligibility blocking each rule; a duplicate gateway callback rejected; two payments for the same dog and course leaving one enrollment and one flagged item; one commission per customer.

**Pages:** Cart · Purchases · Partner Dashboard · Admin Dashboard

---

## Pages

Each page and the features on it: **30 pages**. A list and its form or detail are one page wherever the form or detail fits in a **drawer** or **dialog**. Every drawer and dialog still has its own URL (e.g. `?evaluation=123`), so SMS links ([F9](#f9-notifications)) and the back button open it directly.

**Public (9)**

| Page             | Features                                          |
| ---------------- | ------------------------------------------------- |
| Home             | F8, F7 (`?ref=`)                                  |
| Course Catalogue | F8                                                |
| Course Detail    | F8, F4, F5 (which dogs qualify, «افزودن به سبد»)  |
| Login / Register | F1, F7                                            |
| Help and FAQ     | — (how buying works: pay first, then we call you) |
| Privacy          | —                                                 |
| About            | —                                                 |
| Contact          | —                                                 |
| Partner Enquiry  | F7                                                |

**Customer (6)**

| Page                                                                               | Features   |
| ---------------------------------------------------------------------------------- | ---------- |
| Dashboard: my dogs, open evaluation requests, my enrollments                       | F2, F3, F6 |
| Dog Form                                                                           | F2         |
| Dog Detail: evaluated or not, passed courses, evaluations, enrollments             | F2, F3, F6 |
| Evaluation Request: dog, photos and videos, earliest date, when I'm free           | F3         |
| Cart: items with price and eligibility, «پرداخت», the gateway's result as a banner | F5, F4     |
| Purchases: past payments and the enrollments each one bought                       | F5         |

**Shared (1)**

| Page             | Features |
| ---------------- | -------- |
| Profile Settings | F1       |

**Partner (2)**

| Page                                                   | Features |
| ------------------------------------------------------ | -------- |
| Partner Dashboard: referral link, QR code, commissions | F7       |
| Leads and Customers: lead → registered → bought        | F7       |

**Admin (12)**

| Page                                                                                | Features   |
| ----------------------------------------------------------------------------------- | ---------- |
| Admin Dashboard                                                                     | F11        |
| Evaluations: requests with their photos and videos in a drawer; «ارزیابی شد» / «رد» | F3         |
| Enrollments: active, completed and cancelled; «تمام شد» and «لغو» on each row       | F6         |
| Payments: every payment and its items, with **paid, not enrolled** items flagged    | F5         |
| Dogs                                                                                | F2         |
| Dog Detail: edit, passed courses, mark evaluated, eligibility per course            | F2, F3, F4 |
| Users (user form in a dialog)                                                       | F1         |
| Courses                                                                             | F8         |
| Course Form                                                                         | F8         |
| Partners and Leads: partners, their customers, commissions with «پرداخت شد»         | F7         |
| Platform Settings                                                                   | F10        |
| SMS Outbox (showcase)                                                               | F9         |

---

## Future Features

Not in this version.

1. **Staff trainers**, with lessons assigned to them, their share of each course, and payouts.
2. **A calendar and lesson tracking**: planning lessons, confirming them with the customer, and showing progress («۳ از ۸ جلسه»).
3. **Cancellations and refunds**: refund policies per course, recorded refunds.
4. **The Admin selling by hand**: enrolling a dog himself, at his own price, for a customer who pays him directly.
5. **Discount codes.**
6. **Notes on a dog** that build up its history, visible to the customer or private to the Admin.
7. **Courses without a price** (working and sport dogs). Until then the home page mentions them and customers contact the Admin to enroll.
8. **Disabling a dog** at the customer's request.
9. **Breed rules and evaluation tags** in [F4](#f4-eligibility), once the owner defines dog profiles and course settings.
10. **A cart saved on the server**, shared across devices.

**Dropped** from the earlier docs: staff trainers as a role, the calendar, course requests and the Admin accepting them, trainer earnings and payouts, wallets and the money ledger, refund policies, behavior modification requests and plans, course tests, assessment slots, trainers submitting courses for approval, and reviews and comments.

## Impact on What's Built

- **Retired:** the trainer role and its area, assessment slots, behavior requests and plans, wallets, transactions and their zero-sum trigger, discount codes, training sessions, refund policies, and the share and refund math in `app/lib/business-rules.ts`.
- **Done** in the backend refactor: everything under _Retired_ is gone from the schema, the API and the demo seed, and the retired and Rebuild route slices were deleted or turned into placeholder notices ([legacy-pages.md](legacy-pages.md)). The API is in `app/orpc/` by feature: `evaluation`, `checkout` (eligibility, cart review, pay, the gateway callback, payments), `enrollment`, `commission`, `dog` and `course`, each with an `admin` part for the Admin.
- **Kept and adapted:** sign-in, dogs, media (request videos move to evaluations), the catalogue and storefront, the showcase payment gateway, orders and order items (they become the pending payment and its items), referral attribution, the SMS Outbox.
- Code comments that cite the deleted phase-one docs (`app-phase-one.md`, `business-logic.md`, `foundations-plan.md` and the design briefs) are updated as that code is refactored.

## Open Questions

1. **Dog profile and course settings:** pending the owner ([F2](#f2-dog-profiles), [F8](#f8-course-catalogue)).
