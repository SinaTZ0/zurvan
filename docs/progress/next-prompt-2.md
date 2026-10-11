# Next Session Prompt 2

Paste everything below the line as the first message of the next session. Written with [report-2.md](report-2.md).

---

Read CLAUDE.md, docs/progress/report-2.md, docs/app-phase-one.md (3.7, 3.12, 3.13, entities 9, 14–20),
docs/business-logic.md (B13, B15, B7), docs/app-phase-one-pages.md, docs/training-design.md, docs/customer-area-design.md,
docs/assessment-design.md, docs/media.md and docs/design-flow.md before anything else.

## Where things stand (all committed on main)

- Public: Home, Course Detail (`/courses/:slug`, whose actions now lead to booking), Book a Free Assessment
  (`/assessment`). Customer (`/account`): Dogs, Dog Form, Dog Detail, My Assessments, Book a Course or Test
  (`/account/book/:slug`), Checkout and Payment Result (`/account/checkout/:orderId[/result]`), My Training and
  Enrollment Detail (`/account/training[/:id]`). Trainer (`/trainer`): Schedule (assessment slots and sessions),
  Assessment Detail, Enrollments and Enrollment Detail (`/trainer/enrollments[/:id]`).
- Auth: phone + code (SHOWCASE_MODE: code 12345, SMS in `sms_outbox`). Demo accounts in app/lib/demo-accounts.ts:
  …01 Admin/head trainer «آرمان», …02 Trainer «نگار» (owns house manners), …03 Partner, …04 customer «سارا» (Leo:
  record and six enrollments in every status; Pesteh: assessment booked; 6M toman in her wallet), …05 no dogs, …06
  «مریم» with Rocky (assessment due today).
- Money core: `createTransaction` / `createMirrorTransaction` in app/orpc/wallet/service.ts are the only way money
  moves; a deferred trigger (app/db/money-constraints.sql, applied by `npm run db:seed`) refuses unbalanced
  transactions. `order.*`: bookingOptions, book, get, applyDiscount, removeDiscount, pay (wallet first, then the demo
  gateway via `/payment/callback`, idempotent), cancelEnrollment (B11/B12 refunds). `enrollment.*` for both sides,
  `wallet.mine`. Business rules in app/lib/business-rules.ts (`splitPurchase`, `splitRefund`,
  `calculateEnrollmentRefund`, `allocateDiscount`) are browser-safe and used by both sides.
- Shared UI: SessionCard, Receipt, Stamp, EnrollmentStatusBadge, DogTag, DogPortrait, DogProfile, SegmentedChoice;
  `formatToman` (exact, for anything that moves money) and `formatTomanShort` (prices in headers). The account area
  has a phone bottom tab bar from three sections on; a route hides it with `handle = { hideBottomTabs: true }`.
- Seeds: `npm run db:seed` (catalogue + money triggers), `npm run db:seed:demo` (+ demo accounts, dogs, assessments,
  and Leo's training bought through the real order flow, app/db/seed-training.ts). Schema changes: run
  `npx drizzle-kit push --force` yourself (all data is demo), then `npm run db:seed`. Tests: `npx vitest run app/orpc`.

## Next task: behavior modification requests, end to end

1. **Backend:** Behavior Request (entity 9) with its status flow (3.7): the customer's request with a problem
   category, a description and up to 3 videos (B15: mp4/mov, 100 MB each, stored as uploaded, private to the
   customer, trainers and the Admin; this needs a video kind in the media pipeline, see docs/media.md); the trainer
   proposes a plan (sessions, price, note) or declines with a reason; the customer withdraws or pays. Paying goes
   through the existing order flow: an order item for the behavior course with the plan's price, `behaviorRequestId`
   on the item and the enrollment, `plannedSessions` from the plan. A plan can be paid for 7 days (B13); paying checks
   the expiry itself, so no job is needed for correctness. Focused integration tests: paying a plan creates one
   enrollment with the plan's sessions and price, an expired plan can't be paid, another customer can't see the
   videos.
2. **Pages:** the public Behavior Modification Request (`/behavior-modification`, storefront look, asks to sign in),
   My Behavior Requests (customer), and the trainer's Behavior Requests list and Behavior Request Detail (videos,
   propose or decline). Paying uses the existing Checkout. The trainer tabs gain «درخواست‌ها».
3. **If time allows:** the customer's Wallet (balance and own lines from `wallet.mine`) and My Orders.
4. Follow design-flow.md: write the briefs (a new doc, like training-design.md) and show me before UI code. Use the
   frontend-design skill. Public pages follow storefront-design.md; account and trainer pages customer-area-design.md
   and the paper trail of the assessment and training docs.

Delegation: you may hand well-defined pieces to Sonnet subagents at high effort (schema/oRPC from an agreed shape, a
page from an agreed brief). Keep briefs, design decisions and final review yourself; check their work and screenshots
before committing. Commit each finished piece on main.

Working notes from the last two sessions:

- Before running page agents in parallel, register their routes in `routes.ts` with stub modules and commit, and
  build the shared components they need first. Give each agent its own dev-server port, its own accounts and a rules
  file (.tmp-claude/training-page-agent-rules.md is the latest template); agents must not seed or commit. Re-seed
  yourself at the end. Resuming a finished agent with SendMessage keeps its context and is cheap for follow-ups.
- Never `pkill -f` with a pattern that appears in your own command line: it kills your own shell (it happened to the
  coordinator this session). Stop servers by PID.
- Agents report API gaps they worked around (extra requests per row, matching on message text): close the gap in the
  API and have them remove the workaround before committing.
- Integration tests that move money touch the shared system wallets: clean up inside one database transaction,
  taking each deleted line's amount back off its wallet's balance (see app/orpc/order/integration.test.ts), so the
  wallets keep adding up to 0.
- Screenshots: sign in once per account through /api/auth/phone-number/send-otp + verify (Origin header), save
  Playwright storageState and reuse it. A number can request a code only every 60 s.
- Before committing, check `git status`; commit agents' work by path. Run prettier only on files you changed.
- Zod 4 skips object-level refinements when a field fails; use `{ when: () => true }` for cross-field checks.
- tsconfig's lib is ES2022, so `toSorted` doesn't typecheck; the `unicorn/no-array-sort` warnings are known.

Known loose ends (don't fix unless related): listed in report-2.md, "Loose Ends" and "Not Verified in the Browser".
