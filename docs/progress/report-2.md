# Progress Report 2

Written 2026-10-12, after course booking, payment and training were finished end to end on the money core. The next
session starts from [next-prompt-2.md](next-prompt-2.md). The previous report is [report-1.md](report-1.md).

## How Much of Phase One Is Done

Roughly **a third**, up from a fifth. The money system, the hardest part, now exists and is tested.

### Pages

17 of the 66 in [app-phase-one-pages.md](../app-phase-one-pages.md) are built. New this session: Book a Course or
Test, Checkout, Payment Result, My Training, Enrollment Detail (customer), Enrollments and Enrollment Detail (trainer).
The trainer's Schedule now shows sessions too. That leaves 49:

| Area     | Left | Pages                                                                                   |
| -------- | ---- | --------------------------------------------------------------------------------------- |
| Public   | 7    | Catalogue, Trainer Page, Behavior Request, Help, Refund rules, Privacy, Partner Enquiry |
| Customer | 4    | Dashboard, Behavior Requests, Orders, Write Review                                      |
| Shared   | 3    | Profile, Wallet, Withdrawal                                                             |
| Trainer  | 8    | Dashboard, behavior requests (2), course submission and review (3), comments, earnings  |
| Partner  | 4    | all                                                                                     |
| Admin    | 23   | all                                                                                     |

### Backend

Built: auth, media, dogs, the catalogue, assessments, and now **wallets and transactions, orders, payments,
enrollments, sessions and discount codes**. Still to build:

- **Data:** Trainer and Partner Profiles, the course approval fields, Behavior Request, Withdrawal, Partner Lead,
  Review, Comment, Platform Setting.
- **Money flows still missing:** withdrawals (hold, payout, release), the Admin's manual and mirror transactions,
  partner commission (the split supports it; the customer's referral isn't stored until the Partner Profile exists).
- **Background jobs** (pg-boss), generated migrations, rich text, the admin data table (unchanged since report 1).

## What This Session Built

- **Money core** (`app/orpc/wallet/`): one `createTransaction` that checks the lines, numbers the transaction
  (`TX-140507-0042`) and moves the cached balances, with locks taken in a fixed order. The database also refuses an
  unbalanced transaction at commit through a deferred constraint trigger (`app/db/money-constraints.sql`), which
  `npm run db:seed` applies because `db:push` can't. Mirrors, and `wallet.mine` for a user's own lines.
- **Order flow** (`app/orpc/order/`): eligibility on the server (record, prerequisites or their tests, age, one live
  enrollment per course and dog), booking into a pending order with the price and refund policy copied, discount
  codes, wallet first then the demo gateway, and a callback route (`/payment/callback`) that verifies, settles exactly
  once and fulfils in one database transaction. Paying creates the enrollments and one purchase per item split per
  B1–B8 (the head trainer's part goes to the Admin wallet). `order.cancelEnrollment` refunds per B11/B12 as a
  proportional mirror into the customer's wallet.
- **Training** (`app/orpc/enrollment/`, built by a subagent): the customer's training with a refund preview; the
  trainer's list, week of sessions, schedule / reschedule / cancel, held or missed with notes, planned count, result.
  A held session gives the dog a record.
- **Tests:** 21 across the API, including lines adding to 0, the trigger, mirrors, a repeated callback creating
  nothing twice, a B11 refund after one of seven sessions, and eligibility.
- **Pages** from [training-design.md](../training-design.md), built by three parallel subagents and reviewed from
  their screenshots: the session card (a punch card of the sessions), the receipt, the «پرداخت شد» stamp. Dog Detail,
  the Dogs List and Course Detail now lead to booking. Phones get the account's bottom tab bar.
- **Demo:** `npm run db:seed:demo` buys Leo six enrollments through the real flow (passed with the assistant, a
  failed then passed test, cancelled with a refund, CGC under way, Advanced waiting), with the codes `MEHR1405` and
  `WELCOME`. Sara keeps 6M toman in her wallet. Every wallet adds up to 0.

## Decided With the Owner

From [training-design.md](../training-design.md#decided): a test needs no record and no prerequisites (age still
applies); age ranges are inclusive in whole months; one course per order on screen; trainers can cancel their
students' enrollments with the full unheld share; customers can't cancel a single session online yet; courses without
an owner trainer are the head trainer's.

## Not Verified in the Browser

- Payment Result's "paid but not fulfilled" state (the money went to the wallet because the order was cancelled
  meanwhile): it can't be produced in the demo, so it has never been seen rendered.
- Checkout's `NOT_PAYABLE` message with the order still pending (a code that lapsed between applying and paying).
- Server-side field errors on the booking form, and the trainer's Enrollment Detail not-found page.

## Loose Ends

- «قوانین لغو و بازپرداخت» links to `/help/refunds`, which doesn't exist yet (it is in the Public pages).
- Minor polish seen in screenshots: session lists join facts with «·»; a finished test in Dog Detail's record says
  «قبول» twice (text and badge); the customer's cancel button in the dialog reads dim.
- Platform Settings don't exist: trainer share, partner commission and the B7 values are constants in
  `app/lib/business-rules.ts`.
- From report 1, still open: trainer time fields show Latin digits; DogTag wraps short names at its large size;
  marking a dog as known; the pg-boss sweep (session reminders now matter too); the Cloudflare demo has no database;
  `db:push` instead of migrations; the base-colour picker in the header.

## Suggested Order of Milestones

1. **Behavior requests** end to end: the request with videos (the media pipeline needs a video kind, B15), the
   trainer's plan, paying it through the existing checkout, its expiry (B13).
2. **Wallet, Withdrawal and My Orders:** small pages on money that exists now; withdrawals need the hold, payout and
   release transactions and the Admin's queue.
3. Trainer Profile and Trainer Page, the Catalogue, and course approval.
4. Reviews, comments and moderation.
5. Partners: referrals, leads, commissions.
6. The rest of the Admin panel, Platform Settings, the SMS Outbox page, help pages, background jobs, migrations.
