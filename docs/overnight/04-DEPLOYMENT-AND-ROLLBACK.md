# Deployment and rollback

**Merging this branch and then running the normal deploy would break the live site.** The branch adds tables, and `deploy.sh` only creates tables when run with `--db-push`, which runs Drizzle with `--force` and **auto-approves destructive SQL**. So the safe order is the opposite of "merge and deploy": read the migration notes below first, and use `--db-push` on purpose, once, after a backup.

## Release state

| Where                | State                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live site            | `main` at `1b7a29d`, deployed earlier with `deploy.sh` (no `--seed`, no `--db-push`). `https://k9training.zurvann.ir`                                    |
| This branch          | `feat/zurvann-overnight-feedback`, cut from `1b7a29d`. **Not pushed to production, not merged, no preview server exists.**                               |
| Why nothing deployed | The owner has not seen the new navigation, homepage or sign-in; the later phases add tables; and a schema change on this demo needs `--db-push` (above). |

## What is safe on its own

Phases A to D (header, pages, homepage, hero, search) are UI only: no schema change, no new server code. The branch's commits are sequential and those four phases come first, so **`bc3b21b` is exactly A to D**: merging `main` up to that commit (`git merge bc3b21b`) ships them without the later work, and without `--db-push`. The commits are `6c9064f` (header, About, Contact), `53d24da` (home), `50c2885` (hero), `d19699f` (search) and `bc3b21b` (their evidence).

## Migrations on this branch (all additive)

| Phase | Change                                                                                | Existing data                                                     |
| ----- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| E1    | New table `sign_in_failure` (phone number and time of a wrong password). Nothing else | None touched. The password itself uses the existing column        |
| E3    | New table `cart_item` (user, dog, course, time). Nothing else                         | None touched. Existing browsers' carts are merged in on first use |

Later phases add rows to this table as they land.

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
