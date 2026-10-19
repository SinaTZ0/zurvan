# Deployment and rollback

**Merging this branch and then running the normal deploy would break the live site.** The branch adds tables, and `deploy.sh` only creates tables when run with `--db-push`, which runs Drizzle with `--force` and **auto-approves destructive SQL**. So the safe order is the opposite of "merge and deploy": read the migration notes below first, and use `--db-push` on purpose, once, after a backup.

## Release state

| Where                | State                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live site            | `main` at `1b7a29d`, deployed earlier with `deploy.sh` (no `--seed`, no `--db-push`). `https://k9training.zurvann.ir`                                    |
| This branch          | `feat/zurvann-overnight-feedback`, cut from `1b7a29d`. **Not pushed to production, not merged, no preview server exists.**                               |
| Why nothing deployed | The owner has not seen the new navigation, homepage or sign-in; the later phases add tables; and a schema change on this demo needs `--db-push` (above). |

## What is safe on its own

Phases A to D (header, pages, homepage, hero, search) are UI only: no schema change, no new server code. The branch's commits are sequential and those four phases come first, so **`bc3b21b` is exactly A to D**: merging `main` up to that commit (`git merge bc3b21b`) ships them without the later work, and without `--db-push`. That commit was checked on its own, in a separate working copy: it typechecks, lints and builds, and its 79 tests pass. The commits are `6c9064f` (header, About, Contact), `53d24da` (home), `50c2885` (hero), `d19699f` (search) and `bc3b21b` (their evidence).

## Migrations on this branch (all additive)

| Phase | Change                                                                                                                                                                              | Existing data                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| E1    | New table `sign_in_failure` (phone number and time of a wrong password). Nothing else                                                                                               | None touched. The password itself uses the existing column                                                 |
| E3    | New table `cart_item` (user, dog, course, time). Nothing else                                                                                                                       | None touched. Existing browsers' carts are merged in on first use                                          |
| E2    | New table `consent` (person, kind, version, dog, accepted and withdrawn times) with two partial unique indexes                                                                      | None touched. Empty until rules are published                                                              |
| G1    | New column `dog.file_number` (text, unique, not null, default `'ZD-'` and ten random characters from `gen_random_uuid()`), added to the existing `dog` table                        | **Backfills every existing dog** with a number when the column is added (the default is evaluated per row) |
| G2    | New table `logbook_entry` (dog, optional enrollment, author, day, notes, exercises, summary, public mark, times)                                                                    | None touched. Empty until the trainer writes a session                                                     |
| G3    | New table `certificate` (number default `'ZC-'` and ten random characters, enrollment, issuer, issued/revoked times, revoke reason), unique on the number and on the enrollment     | None touched. Empty until the Admin issues one                                                             |
| G4    | None (uses `consent`, `logbook_entry` and `certificate`)                                                                                                                            | None                                                                                                       |
| F3    | New columns on `payment`: `total_amount` (bigint, nullable: old rows read as `amount`) and `deposit_percent` (integer, not null, default 100)                                       | Existing payments get 100 and a null total: they read as whole-price payments                              |
| F4    | New tables `refund` (payment, optional item, amount, status, reason, reference, who and when; amount > 0 check) and `audit_event` (actor, action, entity, facts, time)              | None touched. Empty until the Admin records a refund or issues a certificate                               |
| F5    | New columns on `payment`: `available_days` and `available_periods` (text arrays, not null, default `'{}'`): when the customer said they are usually free, for the coordination call | Existing payments get empty lists: nothing to show, nothing changes                                        |

Later phases add rows to this table as they land.

**A trap when pushing from the command line.** `npx drizzle-kit push` stops to ask «do you want to truncate `payment_item`?» whenever that table has rows, because it wants to re-add `payment_item_dog_course_unique`. **Answer no, or do not use the CLI on a database that matters.** The deploy script's `--db-push` uses Drizzle's API (`deploy/push-schema.mjs`) and does not ask; it applies a plain `DROP CONSTRAINT` and `ADD CONSTRAINT` for that index (brief, no data change). I could not run `deploy/push-schema.mjs` on this machine (Drizzle's introspection fails with «there is no parameter $1» on Node 24 against a local Postgres 15), so **the first `--db-push` of this branch should be tried on a restored backup first.**

`drizzle-kit push` also prints a few statements that have nothing to do with this branch and change no data: it drops and re-adds `payment_item_dog_course_unique` and re-sets some array column defaults on every run (a Drizzle quirk, seen on the disposable database too).

**Rollback.** For every phase the first rollback is "do not merge": the live site stays on `1b7a29d`. If the branch is merged and `--db-push` has been run, the new tables are unused by the old code, so rolling the code back to `1b7a29d` (`git revert` of the merge, then `deploy.sh`) leaves them harmlessly in place; drop them only by hand after a backup if they should go.

## Before any production push

1. Take a backup (`docs/deploy.md`).
2. `git diff 1b7a29d -- app/db/schema.ts` and confirm it only adds.
3. Merge, then `sudo bash /opt/k9training/deploy.sh --db-push` once.
4. Do **not** pass `--seed`: it wipes the demo history.
5. Open `/`, `/auth`, `/account/profile`, `/courses`.

## Local verification setup

The checks overnight ran against a **disposable Postgres 15 cluster** made with Homebrew's `initdb` in a temp directory (Docker was not running), holding no real data, and deleted afterwards. It must run in **UTC** like production's: Drizzle reads `timestamp` columns as UTC, so a cluster in another zone makes «now» look hours in the future and the 60-second resend rule never ends (`ALTER DATABASE … SET timezone TO 'UTC'`). Showcase mode, the public code and the demo payment gateway were used; **no SMS was sent, no card was charged, nothing was refunded.**

**End-to-end smoke tests.** `npm run test:e2e` (`e2e/smoke.spec.ts`) builds the production build, starts it on port 3000 and drives a browser through the pages a visitor and a new customer reach first. It needs the same environment as the app: a database that has the course seed (`npm run db:seed`) and `SHOWCASE_MODE=true` (so the code is `12345` and no SMS is sent), and Playwright's own Chromium (`npx playwright install chromium`). Overnight it was run on this machine with the installed Google Chrome through a temporary local config (the committed config is unchanged).
