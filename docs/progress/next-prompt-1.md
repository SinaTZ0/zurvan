# Next Session Prompt 1

Paste everything below the line as the first message of the next session. Written with [report-1.md](report-1.md).

---

Read CLAUDE.md, docs/foundations-plan.md (section 2 "Schema and Money Core" and section 3), docs/app-phase-one.md
(3.4, 3.5, 3.6, 3.8, 3.9, 3.10, 3.11, 3.12, entities 10–19), docs/business-logic.md (B1–B6, B10–B12, B14),
docs/app-phase-one-pages.md, docs/customer-area-design.md, docs/assessment-design.md and docs/design-flow.md before
anything else.

## Where things stand (all committed on main)

- Public: Home (`/`), Course Detail (`/courses/:slug`), Book a Free Assessment (`/assessment`). Catalogue in Postgres
  via `course.list` / `course.get` (no Trainer Profile, approval workflow or owner trainer yet).
- Auth: phone + 5-digit code (SHOWCASE_MODE: code is always 12345, SMS go to `sms_outbox`). Demo accounts in
  app/lib/demo-accounts.ts: 09120000001 Admin/head trainer «آرمان», …02 Trainer «نگار», …03 Partner, …04 customer
  (Leo: record + completed assessment with recommendations; Pesteh: booked assessment), …05 customer with no dogs,
  …06 customer «مریم» with Rocky (assessment booked today, ready for the trainer to record).
- Guards: `requireSession({ roles })` route middleware (app/lib/session-guard.server.ts) → `sessionContext`; oRPC
  `requireRoleMiddleware(...roles)`. Layouts: `layout_public`, `layout_account` (/account), `layout_trainer`
  (/trainer, guarded by role trainer|admin until the Trainer Profile exists). Partner and admin layouts don't exist;
  partners land on `/`, the Admin on `/trainer`. Both desks share `AccountHeader` (sections passed as props).
- Customer area: Dogs List, Dog Form, Dog Detail (record timeline + next-step panel with recommendations whose «رزرو»
  links to `/courses/:slug` until course booking exists), My Assessments. Tabs in `account-nav.ts`.
- Trainer area: Schedule (week of assessment slots, open/close times), Assessment Detail (complete / no-show /
  cancel, ordered recommendations pre-filled with CGC/BMC per B16).
- Assessments: `assessment_slot`, `assessment`, `assessment_recommendation`; `assessment.*` oRPC (public / customer /
  `assessment.trainer.*`), race-safe booking with a 20-way concurrency test. `hasRecord` = `knownSince` or a
  completed assessment; an enrollment with a held session must join that rule.
- Media: SeaweedFS (S3 on :8333, bucket zurvann), `media.upload`, `MediaImage`, `attachMedia` / `deleteMedia`.
  Shared: DogTag, DogPortrait, DogProfile, SegmentedChoice, AssessmentStatusBadge, app/lib/dog-format.ts,
  app/lib/jalali.ts, app/lib/tehran-time.ts (fixed UTC+03:30), app/lib/api-error.ts (`describeApiFailure`).
- Seeds: `npm run db:seed` (catalogue), `npm run db:seed:demo` (+ demo accounts, dogs, slots, assessments).
- Schema changes: run `npx drizzle-kit push --force` yourself (all data is demo). Tests: `npx vitest run app/orpc`.

## Next task: book a course, pay, and train — with the money core under it

1. Money core and schema (foundations-plan step 2, the part the course flow needs): Wallet, Transaction,
   Transaction Line with one `createTransaction` service (lines sum to 0, checked by a deferred constraint trigger;
   cached balances; mirror), Order, Order Item, Payment (gateway `demo`, always succeeds, same success path as a real
   verified callback), Enrollment (`Scheduling` → `Active` → …, one Scheduling/Active per course+dog), Session,
   Discount Code. Purchase split per B1–B6 (head trainer's part goes to the Admin wallet, B8). Focused integration
   tests: lines add to 0, a repeated payment callback creates nothing twice, refunds follow B11, mirror flips signs.
   Eligibility (3.8: prerequisites passed or test passed, age range, dog has a record) checked on the server.
2. Customer pages: Book a Course or Test (dog with eligibility notices, boarding, address, preferred times, goal),
   Checkout (discount code, wallet use), Payment Result, My Training, Enrollment Detail (sessions, refund preview,
   cancel). Dog Detail's «رزرو» buttons and Course Detail's «سگت پرونده دارد؟» then go to booking.
3. Trainer side to close the loop: Enrollments list and Enrollment Detail (schedule/reschedule sessions, held/missed,
   notes, planned count, result). A held session gives the dog a record. Seed enrollments in several statuses.
4. Follow design-flow.md: write the briefs (new doc or sections) and show me before UI code. Use the
   frontend-design skill. Customer and trainer screens follow customer-area-design.md; public ones storefront-design.md.

Delegation: you may hand well-defined pieces to Sonnet subagents at high effort (schema/oRPC from an agreed shape, a
page from an agreed brief, lint/typecheck fixes). Keep briefs, design decisions and final review yourself; check
their work and screenshots before committing. Commit each finished piece on main.

Working notes from the last session:

- Before running page agents in parallel, register their routes in `routes.ts` with stub modules and commit, so no
  two agents edit it at once. Give each agent its own dev-server port and its own demo accounts; agents must not
  re-seed (it wipes the others' data) — re-seed yourself at the end. Put the shared rules in a file
  (.tmp-claude/page-agent-rules.md is a good template) and point each agent at it.
- Tell every subagent: run its own dev server on its own port and stop it by PID, never `pkill -f "port <n>"` from a
  command line that itself contains that text (it kills the agent's own shell) and never a broad
  `pkill -f "react-router dev"`.
- Screenshots: sign in once per account through /api/auth/phone-number/send-otp + verify (Origin header), save
  Playwright storageState and reuse it. A number can request a code only every 60 s; the per-IP limit lives in the
  dev server's memory.
- Before committing, check `git status`: staged deletions ride along with the next commit. Commit agents' work by
  path so one piece doesn't swallow another's files. Run prettier only on files you changed (a glob over docs/
  reformats unrelated docs).
- Zod 4 skips object-level refinements when a field fails; use `{ when: () => true }` when a cross-field check must
  show on the first submit.
- tsconfig's lib is ES2022, so `toSorted` doesn't typecheck; the `unicorn/no-array-sort` warnings are known.

Known loose ends (don't fix unless related): trainer time fields show Latin digits; DogTag at its large size wraps
short names like «رکس»; marking a dog as known from Assessment Detail isn't built; no pg-boss sweep yet (reminders,
expiries, unattached media); the Cloudflare demo deploy has no database; still on `db:push`, not generated
migrations; the base-colour picker in the header is a design aid to remove before launch.
