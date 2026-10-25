-- Upgrade the live database for the blog (docs/app-spec.md, F16; 2026-10-25): the `blog_post` table, its two foreign
-- keys (the cover image, the related course) and the index the public list reads by.
--
-- How this file was made: `node --import tsx deploy/schema-diff.mjs <rev>` (Drizzle Kit's own diff between the two
-- `app/db/schema.ts` files, no database read), then read through by hand. It ONLY ADDS: one table, two foreign keys
-- and one index. It drops, renames and rewrites nothing.
--
-- Why it exists: `deploy.sh --db-push` cannot upgrade a database with a composite-primary-key table (docs/deploy.md).
--
-- How to apply (after a backup, from /opt/k9training on the server, before deploying the code that needs it):
--   docker compose --env-file .env -f compose.server.yaml exec -T db \
--     psql -U zurvan -d zurvan -v ON_ERROR_STOP=1 < deploy/upgrade-2026-10-blog.sql
-- It is one transaction: if any statement fails, nothing is changed. Running it a second time fails on the first
-- statement («relation already exists») and changes nothing. The old code keeps working against the upgraded database.

BEGIN;

CREATE TABLE "blog_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"previous_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"body" jsonb NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"cover_media_id" uuid,
	"cover_alt" text DEFAULT '' NOT NULL,
	"related_course_id" uuid,
	"title_en" text,
	"excerpt_en" text,
	"body_en" jsonb,
	"cover_alt_en" text,
	"search_text_en" text,
	"word_count_en" integer,
	"has_english" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);

ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE restrict ON UPDATE no action;

ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_related_course_id_course_id_fk" FOREIGN KEY ("related_course_id") REFERENCES "public"."course"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "blog_post_status_published_at_idx" ON "blog_post" USING btree ("status","published_at");

COMMIT;
