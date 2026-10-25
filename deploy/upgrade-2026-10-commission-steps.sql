-- Upgrade the live database for the partner commission on every purchase (docs/app-spec.md, F7; 2026-10-25): a customer
-- now earns their partner one commission per paid purchase, so the commission is unique per payment, not per customer.
--
-- How this file was made: written by hand from the `commission` table in `app/db/schema.ts`, and applied the same way
-- to the development database. It drops one unique constraint (`commission_customer_id_unique`), adds another
-- (`commission_payment_id_unique`) and an index on the customer. No row is changed: every existing commission already
-- has its own payment, since there was one per customer. The commission steps are a `platform_setting` row the app
-- writes when the Admin saves them; until then it uses the default steps, so no data is needed. The old
-- `partner_commission_percent` row, if any, is no longer read and is left alone.
--
-- Why it exists: `deploy.sh --db-push` cannot upgrade a database with a composite-primary-key table (docs/deploy.md).
--
-- When: with the app stopped, together with the code that needs it. The payment callback's insert names its conflict
-- target, so the OLD code fails on the upgraded database (no unique customer) and the NEW code fails on the old one
-- (no unique payment): a purchase in between would be refused by the database and roll back.
--
-- How to apply (after a backup, from /opt/k9training on the server):
--   docker compose --env-file .env -f compose.server.yaml exec -T db \
--     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-commission-steps.sql
-- It is one transaction: if any statement fails, nothing is changed. Running it a second time fails on the first
-- statement («constraint does not exist») and changes nothing.

BEGIN;

ALTER TABLE "commission" DROP CONSTRAINT "commission_customer_id_unique";
ALTER TABLE "commission" ADD CONSTRAINT "commission_payment_id_unique" UNIQUE("payment_id");
CREATE INDEX "commission_customer_id_idx" ON "commission" USING btree ("customer_id");

COMMIT;
