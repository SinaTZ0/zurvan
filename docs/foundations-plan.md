# Foundations Plan

What has to exist before the phase one pages ([app-phase-one-pages.md](app-phase-one-pages.md)) are built, and the decisions behind it. The app is first a **showcase for the owner**, so some external services are faked (see [Showcase Shortcuts](#showcase-shortcuts)).

Related docs: [business-logic.md](business-logic.md) (working defaults for open rules) and [media.md](media.md) (images).

## Order

1. **Auth and roles:** phone + code login, roles, blocked users, referral attribution, role layouts and guards.
2. **Schema and money core:** every entity of section 4, wallets, transactions and mirrors, with tests.
3. **Slot booking and background jobs:** assessment slots that can't be double-booked, reminders and expiries.
4. **Shared UI and helpers:** dates, money, media, rich text, common components.
5. **Seed data**, so every role has something to show.

Then the pages, in this order: public → customer → trainer → partner → admin.

---

## Showcase Shortcuts

Each shortcut sits behind one small module, so the real service replaces it without touching pages.

- **SMS:** no provider. The login code is always **`12345`** (5 digits, matching the spec's code length and the OTP input). The request side still runs for real (60-second resend timer, rate limits), but the code check is replaced, so expiry and the 5-attempt limit are not enforced in showcase mode. Notifications ("assessment booked", "session reminder", …) are written to an `sms_outbox` table instead of being sent, and the Admin panel shows them, so the owner can see what would have been sent.
- **Payment gateway:** no gateway page. "Pay" goes straight to a fake gateway that always succeeds, runs the **same** success path a real verified callback would (Payment row, transactions, enrollments) and lands on Payment Result. Its Payment rows use the gateway name `demo`.
- **Login page hint:** in showcase mode the login page lists the demo phone numbers for each role, so the owner can switch roles quickly.

A single `SHOWCASE_MODE` env flag turns all three on. With it off, the app refuses to start until a real SMS provider and gateway are configured, so a demo setting can't leak into production.

---

## 1. Auth and Roles

- Replace Better-Auth's email + password with its **`phoneNumber`** plugin (OTP sign-in, `otpLength: 5`, `expiresIn: 120`, `allowedAttempts: 5`). In showcase mode its `sendOTP` writes to the outbox and its `verifyOTP` option accepts only `12345`. That option replaces the plugin's own check, which is why expiry and attempts are off in showcase mode.
- Add to `user`: phone (unique, normalized `09xxxxxxxxx`), first and last name, role, status, referral fields, last login. Drop the email requirement.
- Only `Customer` can self-register. Blocked users can't log in, and their existing sessions are revoked.
- OTP rate limits per phone and per IP use the defaults in [business-logic.md](business-logic.md) (B7).
- **Referral capture:** the Home page stores `?ref=` in a cookie (30 days). Signup reads it, then falls back to the earliest pending lead (3.11).
- Remove Altcha from login. The rate limits cover abuse, and the code adds the second factor. _(Altcha can come back on the OTP request if abuse shows up.)_

**Layouts and guards** (layout routes in `routes.ts`, flat slices):

| Layout           | URL prefix | Guard                                                             |
| ---------------- | ---------- | ----------------------------------------------------------------- |
| `layout_public`  | `/`        | none                                                              |
| `layout_account` | `/account` | signed in, any role but Admin                                     |
| `layout_trainer` | `/trainer` | has a Trainer Profile (a `Trainer`, or the Admin as head trainer) |
| `layout_partner` | `/partner` | role `Partner`                                                    |
| `layout_admin`   | `/admin`   | role `Admin`                                                      |

Guards are React Router **middleware** on the layout route: it loads the session once, puts the user in the router context for every child loader, and redirects to `/auth?redirectTo=…` when signed out. oRPC procedures check the role again with a `requireRole` middleware; the UI guard is never the only check.

## 2. Schema and Money Core

- Write every entity from section 4 of the spec in `app/db/schema.ts`, with DB constraints for the invariants that must never break:
  - A partial unique index for one non-cancelled assessment per slot, and one `Scheduling` or `Active` enrollment per (course, pet).
  - Exactly one head trainer, unique (transaction, wallet) on lines, at most one `Pending` withdrawal per user, at most one `Purchase` per order item, at most one enrollment per order item.
  - Lines of a transaction add up to 0: checked by a **deferred constraint trigger**, so it holds even if a bug skips the service.
- Move from `db:push` to **generated migrations** (`db:generate` + `db:migrate`) now that there's real data to keep.
- Bring `pet` up to the spec (birth date instead of age, sex, weight, notes, photo, known since…). Phase one is dogs only, so `species` and `PET_SPECIES` go away.
- **Money core** (`app/orpc/wallet/`): one `createTransaction` service that every money flow uses. It checks the lines, writes them and updates cached balances in one DB transaction. Mirror, purchase, refund and withdrawal steps are built on it.
- **Tests:** the money core is where a bug costs real money, so it gets focused integration tests: lines add up to 0, mirror flips signs, a repeated payment callback creates nothing twice, refunds follow the policy and the held sessions.

## 3. Slot Booking and Background Jobs

Courses are private, so there are no seats to protect. The one race left is two customers booking the same **assessment slot**.

### Slot booking (no double booking)

Use a **conditional update on the slot** inside the booking transaction:

```sql
UPDATE assessment_slot
SET status = 'booked'
WHERE id = $slotId
  AND status = 'open'
  AND starts_at > now()
RETURNING id;
```

- Postgres locks the row while updating, so two customers racing for the same slot run this one after the other. The second matches no row and is told the slot was just taken. No explicit locks or retries.
- In the same transaction, insert the `Booked` assessment. Cancelling sets the slot back to `open` in the same transaction as the status change.
- The partial unique index on (slot) for non-cancelled assessments is the last line of defence.
- **Test:** fire 20 concurrent bookings at one open slot; exactly one succeeds.

Enrollments need no such guard: paying creates them, and the partial unique index stops a second active enrollment of the same dog in the same course.

### Background jobs

Use **[pg-boss](https://github.com/timgit/pg-boss)**: a job queue that lives in the existing Postgres, so there's no Redis or extra container. Its cron schedules run once across all app instances, and jobs survive restarts.

It starts with the app server (from `entry.server.tsx`). One job, **`sweep`**, runs every few minutes, and each step is idempotent:

1. Send reminders for tomorrow's assessments and sessions (once each).
2. Expire behavior plans past their validity (3.7).
3. Close open assessment slots whose time has passed.
4. Move enrollments to `Active` when their first session is scheduled, if a write missed it.
5. Delete unattached media older than 24 hours ([media.md](media.md)).

Correctness never depends on the job running on time: booking checks the slot's time itself, and paying a behavior plan checks its expiry. The sweep only does the cleanup and the notifications.

## 4. Shared UI and Helpers

| Piece             | Plan                                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dates**         | Store UTC. Display with `Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran" })`, no library. A Jalali date and time picker for slots, sessions and birth dates. |
| **Money**         | `formatToman(rial)` → "۷۵۰ هزار تومان" / "۱٫۲ میلیون تومان", and a toman input that accepts Persian digits and stores Rial.                                                      |
| **Phone**         | `normalizePhone` shared by the login form, the lead form and the server.                                                                                                         |
| **Media**         | `media.upload`, `MediaImage`, and an image picker with preview ([media.md](media.md)). Behavior request videos are stored as uploaded, with a size limit (B15).                  |
| **Rich text**     | [Tiptap](https://tiptap.dev/) for the course description, stored as JSON and rendered on the server. No raw HTML is stored, so there's nothing to sanitize.                      |
| **Countdown**     | One component for the OTP resend and a behavior plan's expiry.                                                                                                                   |
| **Status badges** | One badge per status enum (course, slot, assessment, enrollment, session, behavior request, order, withdrawal, comment), with its Persian label and colour in one place.         |
| **Data table**    | For admin lists: server-side paging, sorting and filters in the URL (nuqs).                                                                                                      |
| **Page states**   | Shared empty, error and loading patterns, so all ~50 pages handle them the same way.                                                                                             |

New dependencies: `pg-boss`, `sharp`, `@aws-sdk/client-s3`, `@tiptap/react` + `@tiptap/starter-kit`, and a Jalali date helper for the picker.

## 5. Seed Data

`npm run db:seed` creates a believable demo: an Admin who is also the head trainer, two assistants (one verified, one not), 2 partners with leads, ~8 customers with dogs, the real catalog from [zurvan-courses.md](zurvan-courses.md) (with sample prices) plus an assistant's courses in every approval status, open and booked assessment slots, completed assessments with recommendations, enrollments in every status with held and upcoming sessions, a passed test, behavior requests in every status, paid orders, a refund, a pending withdrawal, and comments waiting for moderation. Images come from a small set in the repo, uploaded through the real media pipeline.

Showcase-mode demo phone numbers are fixed, so the login hint always matches.
