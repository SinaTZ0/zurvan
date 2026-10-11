-- Money constraints that Drizzle Kit can't declare. Applied by `npm run db:seed`, which every setup runs after the schema
-- push (`app/db/apply-sql.ts`). Idempotent: functions are replaced and triggers dropped and recreated.

-- A wallet transaction has at least two lines and its lines add up to 0 (spec 3.12). Checked as a deferred constraint
-- trigger, so it runs at commit, after every line of the transaction is in, and holds even if a bug skips
-- `createTransaction`. A transaction whose header is gone (a test cleaning up) is not checked.
CREATE OR REPLACE FUNCTION wallet_transaction_check_balanced() RETURNS trigger AS $$
DECLARE
  checked_id uuid;
  line_count integer;
  line_sum numeric;
BEGIN
  IF TG_TABLE_NAME = 'wallet_transaction' THEN
    checked_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    checked_id := OLD.transaction_id;
  ELSE
    checked_id := NEW.transaction_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM wallet_transaction WHERE id = checked_id) THEN
    RETURN NULL;
  END IF;

  SELECT count(*), coalesce(sum(amount), 0) INTO line_count, line_sum
  FROM wallet_transaction_line WHERE transaction_id = checked_id;

  IF line_count < 2 OR line_sum <> 0 THEN
    RAISE EXCEPTION 'wallet transaction % is unbalanced: % lines adding up to %', checked_id, line_count, line_sum
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_transaction_balanced ON wallet_transaction;
CREATE CONSTRAINT TRIGGER wallet_transaction_balanced
  AFTER INSERT ON wallet_transaction
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION wallet_transaction_check_balanced();

DROP TRIGGER IF EXISTS wallet_transaction_line_balanced ON wallet_transaction_line;
CREATE CONSTRAINT TRIGGER wallet_transaction_line_balanced
  AFTER INSERT OR UPDATE OR DELETE ON wallet_transaction_line
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION wallet_transaction_check_balanced();
