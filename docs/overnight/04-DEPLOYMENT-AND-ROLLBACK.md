# Deployment and rollback

**Merging this branch and then running the normal deploy would break the live site.** The branch adds tables, and `deploy.sh` only creates tables when run with `--db-push`, which runs Drizzle with `--force` and **auto-approves destructive SQL**. So the safe order is the opposite of "merge and deploy": read the migration notes below first, and use `--db-push` on purpose, once, after a backup.

## Release state

| Where                | State                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live site            | `main` at `1b7a29d`, deployed earlier with `deploy.sh` (no `--seed`, no `--db-push`). `https://k9training.zurvann.ir`                                    |
| This branch          | `feat/zurvann-overnight-feedback`, cut from `1b7a29d`. **Not pushed to production, not merged, no preview server exists.**                               |
| Why nothing deployed | The owner has not seen the new navigation, homepage or sign-in; the later phases add tables; and a schema change on this demo needs `--db-push` (above). |

## What is safe on its own

Phases A to D (header, pages, homepage, hero, search) are UI only: no schema change, no new server code. If the owner approves them, they could ship without `--db-push`. They live on the same branch as the rest, so cherry-picking or splitting the branch would be needed; the commits are small and separate (`6c9064f`, `53d24da`, `50c2885`, `d19699f`).

## Migrations on this branch (all additive)

| Phase | Change                                                                                | Existing data                                              |
| ----- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| E1    | New table `sign_in_failure` (phone number and time of a wrong password). Nothing else | None touched. The password itself uses the existing column |

Later phases add rows to this table as they land.

**Rollback.** For every phase the first rollback is "do not merge": the live site stays on `1b7a29d`. If the branch is merged and `--db-push` has been run, the new tables are unused by the old code, so rolling the code back to `1b7a29d` (`git revert` of the merge, then `deploy.sh`) leaves them harmlessly in place; drop them only by hand after a backup if they should go.

## Before any production push

1. Take a backup (`docs/deploy.md`).
2. `git diff 1b7a29d -- app/db/schema.ts` and confirm it only adds.
3. Merge, then `sudo bash /opt/k9training/deploy.sh --db-push` once.
4. Do **not** pass `--seed`: it wipes the demo history.
5. Open `/`, `/auth`, `/account/profile`, `/courses`.

## Local verification setup

The checks overnight ran against a **disposable Postgres 15 cluster** made with Homebrew's `initdb` in a temp directory (Docker was not running), holding no real data, and deleted afterwards. It must run in **UTC** like production's: Drizzle reads `timestamp` columns as UTC, so a cluster in another zone makes «now» look hours in the future and the 60-second resend rule never ends (`ALTER DATABASE … SET timezone TO 'UTC'`). Showcase mode, the public code and the demo payment gateway were used; **no SMS was sent, no card was charged, nothing was refunded.**
