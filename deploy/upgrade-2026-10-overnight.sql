-- Upgrade the live database from the schema of `main` at 1b7a29d to the schema of the branch
-- feat/zurvann-overnight-feedback.
--
-- How this file was made: Drizzle Kit's own diff between the two `app/db/schema.ts` files (no database was read), then
-- read through by hand. It ONLY ADDS: 7 new tables, 5 new columns (each nullable or with a default), foreign keys, indexes
-- and one unique constraint. It drops, renames, truncates and rewrites nothing that holds data, except that adding
-- `dog.file_number` (a volatile default) gives every existing dog its own number as the column is added.
--
-- Why it exists: `deploy.sh --db-push` cannot upgrade a database that has the `course_prerequisite` table, so it cannot
-- upgrade the live one. Drizzle Kit's push API ignores query parameters, and its introspection of a table with a composite
-- primary key (`course_prerequisite`, `dog_passed_course`) needs one («there is no parameter $1»). The script first stops
-- the app. See docs/overnight/04-DEPLOYMENT-AND-ROLLBACK.md.
--
-- How to apply (after a backup, from /opt/k9training on the server):
--   docker compose --env-file .env -f compose.server.yaml exec -T db \
--     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-overnight.sql
-- It is one transaction: if any statement fails, nothing is changed. Running it a second time fails on the first
-- statement («relation already exists») and changes nothing.
--
-- The old code keeps working against the upgraded database (it ignores the new tables and columns), so rolling the code
-- back never needs this undone.

BEGIN;

CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);


CREATE TABLE "cart_item" (
	"user_id" text NOT NULL,
	"dog_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cart_item_user_id_dog_id_course_id_pk" PRIMARY KEY("user_id","dog_id","course_id")
);


CREATE TABLE "certificate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text DEFAULT 'ZC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"issued_by" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_reason" text,
	CONSTRAINT "certificate_number_unique" UNIQUE("number"),
	CONSTRAINT "certificate_enrollment_id_unique" UNIQUE("enrollment_id")
);


CREATE TABLE "consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"version" text NOT NULL,
	"dog_id" uuid,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);


CREATE TABLE "logbook_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dog_id" uuid NOT NULL,
	"enrollment_id" uuid,
	"author_id" text NOT NULL,
	"occurred_on" date NOT NULL,
	"notes" text NOT NULL,
	"exercises" text[] DEFAULT '{}'::text[] NOT NULL,
	"progress" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);


CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"payment_item_id" uuid,
	"amount" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"reference" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"cancelled_at" timestamp,
	CONSTRAINT "refund_amount_check" CHECK ("refund"."amount" > 0)
);


CREATE TABLE "sign_in_failure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);


ALTER TABLE "dog" ADD COLUMN "file_number" text DEFAULT 'ZD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)) NOT NULL;

ALTER TABLE "payment" ADD COLUMN "total_amount" bigint;

ALTER TABLE "payment" ADD COLUMN "deposit_percent" integer DEFAULT 100 NOT NULL;

ALTER TABLE "payment" ADD COLUMN "available_days" text[] DEFAULT '{}'::text[] NOT NULL;

ALTER TABLE "payment" ADD COLUMN "available_periods" text[] DEFAULT '{}'::text[] NOT NULL;

ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_dog_id_dog_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dog"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "certificate" ADD CONSTRAINT "certificate_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "certificate" ADD CONSTRAINT "certificate_issued_by_user_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "consent" ADD CONSTRAINT "consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "consent" ADD CONSTRAINT "consent_dog_id_dog_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dog"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_dog_id_dog_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dog"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_enrollment_id_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollment"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "logbook_entry" ADD CONSTRAINT "logbook_entry_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_item_id_payment_item_id_fk" FOREIGN KEY ("payment_item_id") REFERENCES "public"."payment_item"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "refund" ADD CONSTRAINT "refund_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;

CREATE INDEX "audit_event_entity_idx" ON "audit_event" USING btree ("entity_type","entity_id","created_at");

CREATE INDEX "consent_user_id_kind_idx" ON "consent" USING btree ("user_id","kind");

CREATE UNIQUE INDEX "consent_account_standing_idx" ON "consent" USING btree ("user_id","kind","version") WHERE "consent"."dog_id" is null and "consent"."revoked_at" is null;

CREATE UNIQUE INDEX "consent_dog_standing_idx" ON "consent" USING btree ("user_id","kind","version","dog_id") WHERE "consent"."dog_id" is not null and "consent"."revoked_at" is null;

CREATE INDEX "logbook_entry_dog_id_occurred_on_idx" ON "logbook_entry" USING btree ("dog_id","occurred_on");

CREATE INDEX "refund_payment_id_idx" ON "refund" USING btree ("payment_id");

CREATE INDEX "refund_status_created_at_idx" ON "refund" USING btree ("status","created_at");

CREATE INDEX "sign_in_failure_phone_created_at_idx" ON "sign_in_failure" USING btree ("phone_number","created_at");

ALTER TABLE "dog" ADD CONSTRAINT "dog_file_number_unique" UNIQUE("file_number");

COMMIT;
