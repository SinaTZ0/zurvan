# Progress Report 3

Written 2026-10-12, after behavior modification requests were finished end to end. The next session starts from
[next-prompt-3.md](next-prompt-3.md). The previous report is [report-2.md](report-2.md).

## How Much of Phase One Is Done

Roughly **two fifths**, up from a third. 21 of the 66 pages in [app-phase-one-pages.md](../app-phase-one-pages.md) are
built; new this session: Behavior Modification Request, My Behavior Requests, and the trainer's Behavior Requests and
Behavior Request Detail. Still to build: 45 pages, of which the Public area has 6 (Catalogue, Trainer Page, Help, Refund
rules, Privacy, Partner Enquiry), the Customer area 3 (Dashboard, Orders, Write Review), Shared 3 (Profile, Wallet,
Withdrawal), Trainer 6, Partner 4 and Admin 23.

Backend still to build: Trainer and Partner Profiles, the course approval fields, Withdrawal, Partner Lead, Review,
Comment, Platform Setting; withdrawals, the Admin's manual and mirror transactions and partner commission; pg-boss
jobs, generated migrations, rich text, the admin data table.

## What This Session Built

- **Behavior Request** (`app/orpc/behavior-request/`, entity 9): the customer's request (problem category, description,
  address, preferred times, 1 to 3 videos), the trainer's plan or decline, withdrawing, and paying. Paying goes through
  the existing order flow (`behaviorRequestId` on the order item and the enrollment, `plannedSessions` and the price from
  the plan). A plan is payable for 7 days (B13): expiry is lazy (reads mark due plans `expired`) and paying checks the
  deadline itself, also when the gateway calls back late (the order is cancelled, the money stays in the wallet).
- **Videos** (B15): private, stored as uploaded under `behavior-video/{id}/original.{mp4|mov}`, never served by nginx.
  `POST /api/behavior-videos` takes the upload (format read from the file's `ftyp` brand); `GET` streams with ranges to
  the uploader, the request's customer and trainer and the Admin; everyone else gets 404. See [media.md](../media.md).
- **Pages** from [behavior-design.md](../behavior-design.md), built by four parallel subagents from the approved briefs and
  reviewed from their screenshots: the **plan slip** (sessions, price, the trainer's note and a strip of seven notches,
  one punched out per day), the video uploader with progress, the trainer composing the plan on the slip the customer
  will see, and the «فرستاده شد» stamp on arrival. Checkout shows a plan's sessions and links back to the plan instead
  of «تغییر». The trainer's tab shows a count of requests waiting.
- **Tests:** 6 more (27 across the API): paying a plan creates one enrollment with the plan's sessions and price, a plan
  that ran out can't be paid by any route, another customer can't see the videos, and the one-request-per-dog rule.
- **Demo:** `npm run db:seed:demo` adds five requests for Sara and Maryam (proposed, submitted, expired, declined,
  withdrawn) with 7 videos.

## Decided

From [behavior-design.md](../behavior-design.md#decided): a request carries the address and times, so paying is one click
to Checkout; one open request per dog and none while the dog is in a behavior plan; a request goes to the behavior
course's owner trainer (the head trainer by default) and the enrollment belongs to the plan's author; a trainer can
replace a proposed plan (the 7 days restart and a started order is cancelled).

## Not Verified in the Browser

- A real playable video: there is no ffmpeg here and the demo videos are 24-byte placeholders, so players show an empty
  frame. Upload a real clip through the form to see one play (also check an iPhone HEVC clip in Chrome: the download link
  is the fallback).
- The trainer pages as the assistant «نگار» (her list should be empty and Arman's request should read «این درخواست پیدا
  نشد.»); the second was seen, the first was not.
- The paid state of a plan in the ledger and the trainer's detail, with `PlanSlip`'s `strip={false}`.
- The Payment Result and Checkout cases listed in [report-2.md](report-2.md) are still unseen.

## Loose Ends

- The trainer's Enrollment Detail doesn't link to the request or show its videos.
- Uploads are buffered in memory; a chunked upload without `Content-Length` skips the early 413 and is refused later by
  the service. nginx needs `client_max_body_size 110m` for `/api/behavior-videos`. Unsent videos are never cleaned up
  (TODO in media.md).
- `findBehaviorCourse` takes the first approved behavior course by position; a second one would silently win.
- Every service call sweeps all due plans in the database with its own clock, so a test or a script using a future `now`
  expires the demo's open plans; the seed brings them back.
- Minor: a dog without a photo shows its initial on the request cards; the stamp's corner is shared with the assessment
  page.
- From earlier reports, still open: the loose ends in [report-2.md](report-2.md).

## Suggested Order of Milestones

1. **Wallet, Withdrawal and My Orders:** small pages on money that exists now; withdrawals need the hold, payout and
   release transactions and the Admin's queue.
2. Trainer Profile and Trainer Page, the Catalogue, and course approval.
3. Reviews, comments and moderation.
4. Partners: referrals, leads, commissions.
5. The rest of the Admin panel, Platform Settings, the SMS Outbox page, help pages, background jobs, migrations.
