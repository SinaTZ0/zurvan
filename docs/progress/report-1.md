# Progress Report 1

Written 2026-10-11, after the free assessment was finished end to end. The next session starts from
[next-prompt-1.md](next-prompt-1.md).

## How Much of Phase One Is Done

Roughly **a fifth**. The hardest part, the money system, hasn't started.

### Pages

10 of the 66 in [app-phase-one-pages.md](../app-phase-one-pages.md) are built: Home, Course Detail, Login, Dogs List,
Dog Form, Dog Detail, Book a Free Assessment, My Assessments, Schedule (assessment slots only) and Assessment Detail.
That leaves 56:

| Area     | Left | Pages                                                                                                                          |
| -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| Public   | 7    | Catalogue, Trainer Page, Behavior Request, Help, Refund rules, Privacy, Partner Enquiry                                        |
| Customer | 9    | Dashboard, Book Course/Test, Checkout, Payment Result, My Training, Enrollment Detail, Behavior Requests, Orders, Write Review |
| Shared   | 3    | Profile, Wallet, Withdrawal                                                                                                    |
| Trainer  | 10   | Dashboard, enrollments, behavior requests, course submission and review, comments, earnings                                    |
| Partner  | 4    | all                                                                                                                            |
| Admin    | 23   | all                                                                                                                            |

### Backend

Built: auth, media, dogs, reading the course catalogue, and assessments. Still to build:

- **Data:** about 18 more tables for the spec's entities: Trainer and Partner Profiles, the course approval fields,
  Behavior Request, Enrollment, Session, Discount Code, Order and Order Item, Payment, Wallet, Transaction and its
  Lines, Withdrawal, Partner Lead, Review, Comment, Platform Setting.
- **Money core:** one `createTransaction` service with the database check that every transaction's lines add up to
  zero, and its tests.
- **Background jobs** (pg-boss): reminders, expiries, cleaning up unused uploads.
- **Infrastructure and shared tools:** moving from `db:push` to generated migrations, the rich-text editor for course
  descriptions, the toman money helpers, and the admin data table.

## Suggested Order of Milestones

1. **Course booking on the money core:** wallets and transactions, orders, the demo payment, enrollments and sessions;
   the customer's booking, checkout and training pages; the trainer's enrollment pages.
2. Behavior requests: the video upload, the trainer's plan, paying for it, and its expiry.
3. Trainer Profile and Trainer Page, the Course Catalogue, and the course approval workflow.
4. Reviews, comments and moderation.
5. Partners: referrals, leads, commissions.
6. Withdrawals, the rest of the Admin panel, Platform Settings, the SMS Outbox page, the help pages, background jobs
   and migrations.

The Course Catalogue (`/courses`) is a small, self-contained public page that many links already point to, so it can
be slotted in before milestone 1 if wanted.

## What This Session Built

- **Assessments, backend:** `assessment_slot`, `assessment` and `assessment_recommendation`, with the `assessment.*`
  oRPC feature. Booking claims the slot with one conditional update, with partial unique indexes behind it; a test
  fires 20 simultaneous bookings at one slot and exactly one wins. Completing an assessment gives the dog a record.
- **Pages:** Book a Free Assessment (`/assessment`), My Assessments (`/account/assessments`), the Dog Detail and Dogs
  List changes, the trainer area (`/trainer`): Schedule and Assessment Detail. Briefs in
  [assessment-design.md](../assessment-design.md).
- **Decided with the owner:** only Arman's times are offered for booking for now; a dog with a record can't book a
  free assessment.
- **Demo:** a sixth account, `09120000006` (Maryam), whose dog Rocky is booked with Arman on the seed day, so the
  trainer side has an outcome to record.

## Loose Ends

Listed in [assessment-design.md](../assessment-design.md#loose-ends): the trainer's time fields show Latin digits;
`DogTag` at its large size wraps short names like «رکس»; marking a dog as known from Assessment Detail and the
day-before reminders aren't built. The trainer's "no-show" and "cancel" actions reached their dialogs in testing but
weren't submitted in the browser.
