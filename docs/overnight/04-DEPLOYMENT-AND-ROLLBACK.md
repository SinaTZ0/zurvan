# Deployment and rollback

**Do not merge this branch and run `deploy.sh` as usual, and do not use `--db-push` on the live database.** Two separate reasons:

1. The branch adds tables and columns. A plain deploy does not create them, so the new code would fail on the first query that touches one.
2. **`deploy.sh --db-push` cannot upgrade the live database at all.** This was found while preparing this note and is not caused by the branch: Drizzle Kit's push API ignores query parameters, and reading a table with a composite primary key (`course_prerequisite`, `dog_passed_course`) needs one, so the push stops with «there is no parameter $1». I reproduced it with the live commit's own `deploy/push-schema.mjs` against a database in the live schema. The script **stops the app first and leaves it stopped** when the push fails (`docs/deploy.md`). It only worked at the first deployment because an empty database has nothing to read.

So the database is upgraded with a reviewed SQL file, **before** the new code is deployed:

## The safe order

Everything below runs on the server in `/opt/k9training`. `deploy/upgrade-2026-10-overnight.sql` adds only; read it first (it is about 140 lines, with its own header).

1. **Merge the branch into `main`** and push (or copy the SQL file to the server another way).
2. **Back up the database.** The app can stay up:

   ```bash
   mkdir -p .deploy/backups
   docker compose --env-file .env -f compose.server.yaml exec -T db \
     pg_dump -U zurvan -Fc zurvan > .deploy/backups/before-overnight-upgrade.dump
   ```

3. **Update the checkout without deploying** (`sudo git pull --ff-only`, the same fast-forward `deploy.sh` does). The running app is unaffected until `deploy.sh` rebuilds it.
4. **Apply the SQL.** One transaction: if any statement fails, nothing changes.

   ```bash
   docker compose --env-file .env -f compose.server.yaml exec -T db \
     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-overnight.sql
   ```

   It prints `COMMIT` at the end. The old code keeps running against the upgraded database (proved below), so there is no rush between this step and the next.

5. **Deploy the code** with a plain `sudo bash deploy.sh`: **no `--db-push`, no `--seed`** (`--seed` wipes the demo history).
6. **Look.** `/`, `/auth`, `/courses`, then signed in `/account/profile`, `/buy` and a dog's page (it now shows a file card with a QR code), and `docker compose ... logs --tail=100 app`.

## The rehearsal

Run overnight, on this machine, against a **second disposable database** built the way the live one is built, and not against anything real:

| Step                                                                                                                                                                                                                                    | Result                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build the schema of `main` at `1b7a29d` (with that commit's own tooling), fill it with that commit's demo data (6 people, 3 dogs, 11 courses) and add a paid payment with two items and two enrollments, a failed one and a pending one | 20 tables                                                                                                                                                   |
| Fingerprint every table (row count and a hash of every old column), apply the SQL file                                                                                                                                                  | **20 of 20 old tables unchanged**; 7 new tables; new columns only on `dog` (`file_number`) and `payment` (4); no column removed; `COMMIT`                   |
| Check the backfills                                                                                                                                                                                                                     | 3 dogs, 3 distinct well-formed file numbers; 3 payments with `deposit_percent` 100, no `total_amount`, empty availability lists; the 7 new tables are empty |
| Run the file a second time                                                                                                                                                                                                              | Fails on its first statement (`relation "audit_event" already exists`) and changes nothing                                                                  |
| Run **the branch's** whole test suite against the upgraded database                                                                                                                                                                     | 192 of 192 pass                                                                                                                                             |
| Run **the live commit's** own test suite against the upgraded database (so the old code survives it)                                                                                                                                    | 69 of 69 pass                                                                                                                                               |
| Ask Drizzle Kit what it would still change on the upgraded database                                                                                                                                                                     | Only its usual quirk statements (below); nothing about any table, column, index or constraint of the branch                                                 |

**Not verified:** a run on the real server, and PostgreSQL 17 (the rehearsal used 15; the file uses nothing version-specific, and `gen_random_uuid()` is built in from 13). If anything about the first run looks wrong, restore the dump from step 2.

## Release state

| Where                | State                                                                                                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Live site            | `main` at `1b7a29d`, deployed earlier with `deploy.sh` (no `--seed`, no `--db-push`). `https://k9training.zurvann.ir`                           |
| This branch          | `feat/zurvann-overnight-feedback`, cut from `1b7a29d`. **Not pushed to production, not merged, no preview server exists.**                      |
| Why nothing deployed | The owner has not seen the new navigation, homepage or sign-in; the later phases add tables, which need the SQL upgrade above, not `--db-push`. |

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

**Every row above is applied by `deploy/upgrade-2026-10-overnight.sql`**, which came from Drizzle Kit's own diff of the two `app/db/schema.ts` files (no database was read) and was then read through by hand. It has 7 `CREATE TABLE`, 5 `ADD COLUMN`, foreign keys, indexes and one unique constraint, and no `DROP`, `TRUNCATE` or `DELETE`. `git diff 1b7a29d..HEAD -- app/db/schema.ts` removes one comment line and nothing else.

**Do not use `npx drizzle-kit push` on a database that matters either.** It stops to ask «do you want to truncate `payment_item`?» whenever that table has rows, because it wants to re-add `payment_item_dog_course_unique`, and it prints a few statements that have nothing to do with this branch (re-setting some array column defaults) on every run. They change no data; they are a Drizzle quirk, seen on the live schema and the new one alike.

**Rollback.** For every phase the first rollback is "do not merge": the live site stays on `1b7a29d`. If the SQL has been applied and the code is then rolled back to `1b7a29d` (`git revert` of the merge, then `deploy.sh`), nothing needs undoing: the old code ignores the new tables and columns, and its own 69 tests pass against the upgraded database. Drop the new tables only by hand, after a backup, if they should go. To go all the way back to the data as it was, restore the dump from step 2 (`docs/deploy.md`, «Backups and data»), and deploy the revision that matches it.

## Local verification setup

The checks overnight ran against a **disposable Postgres 15 cluster** made with Homebrew's `initdb` in a temp directory (Docker was not running), holding no real data, and deleted afterwards. It must run in **UTC** like production's: Drizzle reads `timestamp` columns as UTC, so a cluster in another zone makes «now» look hours in the future and the 60-second resend rule never ends (`ALTER DATABASE … SET timezone TO 'UTC'`). Showcase mode, the public code and the demo payment gateway were used; **no SMS was sent, no card was charged, nothing was refunded.**

**End-to-end smoke tests.** `npm run test:e2e` (`e2e/smoke.spec.ts`) builds the production build, starts it on port 3000 and drives a browser through the pages a visitor and a new customer reach first. It needs the same environment as the app: a database that has the course seed (`npm run db:seed`) and `SHOWCASE_MODE=true` (so the code is `12345` and no SMS is sent), and Playwright's own Chromium (`npx playwright install chromium`). Overnight it was run on this machine with the installed Google Chrome through a temporary local config (the committed config is unchanged).
