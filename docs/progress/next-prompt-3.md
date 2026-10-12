# Next Session Prompt 3

Paste everything below the line as the first message of the next session. Written with [report-3.md](report-3.md).

---

Read CLAUDE.md, docs/progress/report-3.md, docs/app-phase-one.md (3.10, 3.12, 3.13, entities 14–20),
docs/business-logic.md (B1–B12, the withdrawal rules), docs/app-phase-one-pages.md, docs/customer-area-design.md,
docs/training-design.md, docs/behavior-design.md and docs/design-flow.md before anything else.

## Where things stand (all committed on main)

- Public: Home, Course Detail, Book a Free Assessment (`/assessment`), Behavior Modification Request
  (`/behavior-modification`). Customer (`/account`): Dogs, Dog Form, Dog Detail, My Assessments, Book a Course or Test,
  Checkout and Payment Result, My Training and Enrollment Detail, My Behavior Requests
  (`/account/behavior-requests`). Trainer (`/trainer`): Schedule, Assessment Detail, Enrollments and Enrollment Detail,
  Behavior Requests and Behavior Request Detail (`/trainer/behavior-requests[/:requestId]`).
- Auth: phone + code (SHOWCASE_MODE: code 12345, SMS in `sms_outbox`). Demo accounts in app/lib/demo-accounts.ts: …01
  Admin/head trainer «آرمان», …02 Trainer «نگار», …03 Partner, …04 customer «سارا» (Leo: six enrollments and past
  behavior requests; Pesteh: a behavior plan waiting to be paid; 6M toman in her wallet), …05 no dogs, …06 «مریم» with
  Rocky (a behavior request waiting for Arman).
- Money core: `createTransaction` / `createMirrorTransaction` in app/orpc/wallet/service.ts are the only way money moves;
  a deferred trigger (app/db/money-constraints.sql, applied by `npm run db:seed`) refuses unbalanced transactions.
  `order.*`, `enrollment.*`, `behaviorRequest.*`, `wallet.mine`. Business rules in app/lib/business-rules.ts are
  browser-safe.
- Shared UI: SessionCard, Receipt, Stamp, PlanSlip, VideoPlayer, EnrollmentStatusBadge, BehaviorStatusBadge, DogTag,
  DogPortrait, DogProfile, SegmentedChoice; `formatToman` (exact) and `formatTomanShort`. The desk header's tabs take a
  `badge` count. A route hides the phone's bottom tabs with `handle = { hideBottomTabs: true }`.
- Seeds: `npm run db:seed` (catalogue + money triggers), `npm run db:seed:demo` (+ demo accounts, dogs, assessments,
  Leo's training bought through the real order flow, the behavior requests). Schema changes: run
  `npx drizzle-kit push --force` yourself (all data is demo), then `npm run db:seed`. Tests: `npx vitest run app/orpc`.

## Next task: the customer's money pages

1. **Wallet** (shared by customers, trainers and partners, `wallet.mine`): balance and the user's own lines, grouped and
   readable (a purchase, a refund, a withdrawal). Customers first.
2. **My Orders** (customer): past orders with their items, discount, wallet part and gateway part, and their status;
   a link to the enrollment or the behavior request each item created.
3. **Withdrawal** (3.13), if the owner's rules are settled enough in docs/business-logic.md: request, hold, and the
   Admin's payout and release. If a rule is missing, defer it and name the blocker.
4. Follow design-flow.md: write the briefs (a new doc, like behavior-design.md) and show me before UI code. Use the
   frontend-design skill. These are account pages: customer-area-design.md and the paper trail of the training docs
   (the Receipt is the object for money).

Delegation: you may hand well-defined pieces to subagents (schema/oRPC from an agreed shape, a page from an agreed
brief). Keep briefs, design decisions and final review yourself; check their work before committing. Commit each
finished piece on main.

Working notes from the last sessions:

- Before running page agents in parallel, register their routes in `routes.ts` with stub modules and commit, and build
  the shared components they need first. Give each agent its own dev-server port, its own accounts and a rules file
  (.tmp-claude/behavior-page-agent-rules.md is the latest template); agents must not seed or commit. Re-seed yourself at
  the end, and delete the test accounts the agents made (.tmp-claude/cleanup-test-users.ts removes the 0912000 11–14xx
  ones with their data).
- Check the agents' screenshots yourself: the best catches this session were a narrow tile squeezing an error message
  and a stamp covering a badge.
- Never `pkill -f` with a pattern that appears in your own command line. Stop servers by PID.
- Agents report API gaps they worked around: close the gap in the API and have them remove the workaround.
- Integration tests that move money touch the shared system wallets: clean up inside one database transaction, taking
  each deleted line's amount back off its wallet's balance (see app/orpc/order/integration.test.ts). A test must not use
  a clock far in the future: every behavior-request service call sweeps all due plans.
- Screenshots: sign in once per account through /api/auth/phone-number/send-otp + verify (Origin header). A number can
  request a code only every 60 s, and the dev server limits sign-ins per IP.
- Before committing, check `git status`; commit agents' work by path. Run prettier only on files you changed (not a
  whole directory: it reflowed an unrelated file once).
- Zod 4 skips object-level refinements when a field fails; use `{ when: () => true }` for cross-field checks.
- tsconfig's lib is ES2022, so `toSorted` doesn't typecheck; the `unicorn/no-array-sort` warnings are known.

Known loose ends (don't fix unless related): listed in report-3.md, "Loose Ends" and "Not Verified in the Browser".
