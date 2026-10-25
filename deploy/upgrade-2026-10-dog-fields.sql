-- Upgrade the live database for the dog's new fields (docs/app-spec.md, F2; 2026-10-25): breed purity and a second breed,
-- training goals, height, coat color, markings, the microchip's implant date, a vaccination note, behavior problems, and
-- the `dog_record_photo` table for the photos in a dog's file (vaccination card, medical papers, tattoo).
--
-- How this file was made: `node --import tsx deploy/schema-diff.mjs <rev>` (Drizzle Kit's own diff between the two
-- `app/db/schema.ts` files, no database read), then read through by hand. It ONLY ADDS: one table, nine columns on `dog`
-- (each nullable or with a default, so every existing dog stays valid and reads as "not stated") and two foreign keys.
-- It drops, renames and rewrites nothing.
--
-- Why it exists: `deploy.sh --db-push` cannot upgrade a database with a composite-primary-key table (docs/deploy.md).
--
-- How to apply (after a backup, from /opt/k9training on the server, before deploying the code that needs it):
--   docker compose --env-file .env -f compose.server.yaml exec -T db \
--     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-dog-fields.sql
-- It is one transaction: if any statement fails, nothing is changed. Running it a second time fails on the first
-- statement («relation already exists») and changes nothing. The old code keeps working against the upgraded database.

BEGIN;

CREATE TABLE "dog_record_photo" (
	"dog_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "dog_record_photo_dog_id_media_id_pk" PRIMARY KEY("dog_id","media_id"),
	CONSTRAINT "dog_record_photo_media_id_unique" UNIQUE("media_id")
);

ALTER TABLE "dog" ADD COLUMN "breed_purity" text;

ALTER TABLE "dog" ADD COLUMN "breed_secondary" text;

ALTER TABLE "dog" ADD COLUMN "height_cm" integer;

ALTER TABLE "dog" ADD COLUMN "coat_color" text;

ALTER TABLE "dog" ADD COLUMN "markings" text;

ALTER TABLE "dog" ADD COLUMN "microchip_implanted_on" date;

ALTER TABLE "dog" ADD COLUMN "vaccination_notes" text;

ALTER TABLE "dog" ADD COLUMN "training_goals" text[] DEFAULT '{}'::text[] NOT NULL;

ALTER TABLE "dog" ADD COLUMN "behavior_problems" text[] DEFAULT '{}'::text[] NOT NULL;

ALTER TABLE "dog_record_photo" ADD CONSTRAINT "dog_record_photo_dog_id_dog_id_fk" FOREIGN KEY ("dog_id") REFERENCES "public"."dog"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "dog_record_photo" ADD CONSTRAINT "dog_record_photo_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;

COMMIT;
