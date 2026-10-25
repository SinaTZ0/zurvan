-- Upgrade the live database for a course's places (docs/app-spec.md, F5 and F8; 2026-10-26): a course now lists the
-- places it can be taught (at the client's place, at the center, outside, boarding) and may recommend one, the customer
-- picks one per cart item, and the pick is kept on the payment item and the enrollment. The course's single `place` and
-- its shown-only `boarding_price` go: boarding's extra cost is agreed on the phone, never priced on the site.
--
-- How this file was made: written by hand from `app/db/schema.ts` (`deploy/schema-diff.mjs` stops at Drizzle Kit's
-- "renamed or new column?" prompt for `place` → `places`), and applied the same way to the development database.
--
-- What it does to the data: each course's places come from its old place, the way `app/db/seed-courses.ts` now lists
-- the owner's cards: «منزل» → at the client's place, «بیرون» → outside, «اکثراً بیرون» → at the client's place and
-- outside, and boarding for every course that had a place (every card offers it «در صورت تمایل»). A course with no place
-- (working and sport dogs) gets none, which still reads «بعد از ارزیابی». No course is recommended. Cart items, payment
-- items and enrollments get an empty place: what was bought before shows no place. The boarding prices are dropped.
--
-- Why it exists: `deploy.sh --db-push` cannot upgrade a database with a composite-primary-key table (docs/deploy.md).
--
-- When: with the app stopped, together with the code that needs it. The old code reads `place` and `boarding_price`,
-- which are gone afterwards, and the new code reads `places`, which isn't there before.
--
-- How to apply (after a backup, from /opt/k9training on the server):
--   docker compose --env-file .env -f compose.server.yaml exec -T db \
--     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-course-places.sql
-- It is one transaction: if any statement fails, nothing is changed. Running it a second time fails on the first
-- statement («column already exists») and changes nothing.

BEGIN;

ALTER TABLE "course" ADD COLUMN "places" text[] DEFAULT '{}'::text[] NOT NULL;

ALTER TABLE "course" ADD COLUMN "recommended_place" text;

UPDATE "course" SET "places" = CASE "place"
	WHEN 'home' THEN ARRAY['home', 'boarding']
	WHEN 'outside' THEN ARRAY['outside', 'boarding']
	WHEN 'mostly-outside' THEN ARRAY['home', 'outside', 'boarding']
	ELSE '{}'::text[]
END;

ALTER TABLE "course" DROP COLUMN "place";

ALTER TABLE "course" DROP COLUMN "boarding_price";

ALTER TABLE "cart_item" ADD COLUMN "place" text;

ALTER TABLE "payment_item" ADD COLUMN "place" text;

ALTER TABLE "enrollment" ADD COLUMN "place" text;

COMMIT;
