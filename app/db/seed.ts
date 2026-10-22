import { getTableColumns, inArray, notInArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { db } from "~/db/client.server";
import { course, coursePrerequisite } from "~/db/schema";
import { SEED_COURSES } from "~/db/seed-courses";

/*===== Seed =====*/
// `npm run db:seed`, after `npm run db:push`. Idempotent: courses are upserted by slug, so running it again updates the
// catalogue to match `seed-courses.ts` without duplicating anything. A course that is no longer in the seed is archived,
// not deleted: enrollments may point at it (F8).

const TOMAN_TO_RIAL = 10;

/** Toman → Rial, keeping "not sold at a list price" as null. */
function toRial(toman: number | undefined) {
  return toman === undefined ? null : toman * TOMAN_TO_RIAL;
}

async function seed() {
  await db.transaction(async (tx) => {
    /*------ Courses ------*/
    const courses = await tx
      .insert(course)
      .values(
        SEED_COURSES.map((entry, index) => ({
          slug: entry.slug,
          title: entry.title,
          latinName: entry.latinName,
          family: entry.family,
          status: "approved",
          summary: entry.summary,
          highlights: entry.highlights,
          commands: entry.commands,
          coverImage: entry.cover.src,
          coverAlt: entry.cover.alt,
          coverWidth: entry.cover.width,
          coverHeight: entry.cover.height,
          titleEn: entry.en.title,
          summaryEn: entry.en.summary,
          highlightsEn: entry.en.highlights,
          commandsEn: entry.en.commands,
          coverAltEn: entry.en.coverAlt,
          minAgeMonths: entry.minAgeMonths ?? null,
          maxAgeMonths: entry.maxAgeMonths ?? null,
          sessionCount: entry.sessionCount ?? null,
          place: entry.place ?? null,
          price: toRial(entry.priceToman),
          boardingPrice: toRial(entry.boardingPriceToman),
          position: index + 1,
        })),
      )
      .onConflictDoUpdate({
        target: course.slug,
        // Every seeded column follows the seed file; the id and createdAt stay.
        set: fromExcluded(course, [
          "title",
          "latinName",
          "family",
          "status",
          "summary",
          "highlights",
          "commands",
          "coverImage",
          "coverAlt",
          "coverWidth",
          "coverHeight",
          "titleEn",
          "summaryEn",
          "highlightsEn",
          "commandsEn",
          "coverAltEn",
          "minAgeMonths",
          "maxAgeMonths",
          "sessionCount",
          "place",
          "price",
          "boardingPrice",
          "position",
        ]),
      })
      .returning({ id: course.id, slug: course.slug });

    /*------ Courses Gone From the Seed ------*/
    await tx
      .update(course)
      .set({ status: "archived" })
      .where(
        notInArray(
          course.slug,
          SEED_COURSES.map((entry) => entry.slug),
        ),
      );

    const idBySlug = new Map(courses.map((row) => [row.slug, row.id]));

    /*------ Prerequisites ------*/
    // Replaced wholesale for the seeded courses, so a requirement removed from the seed file disappears too.
    await tx.delete(coursePrerequisite).where(
      inArray(
        coursePrerequisite.courseId,
        courses.map((row) => row.id),
      ),
    );
    const prerequisites = SEED_COURSES.flatMap((entry) =>
      (entry.requires ?? []).map((required) => ({
        courseId: idBySlug.get(entry.slug)!,
        requiredCourseId: idBySlug.get(required)!,
      })),
    );
    if (prerequisites.length > 0) await tx.insert(coursePrerequisite).values(prerequisites);

    console.log(`Seeded ${courses.length} courses, ${prerequisites.length} prerequisites.`);
  });
}

/** `excluded.<column>` for each key, so an upsert sets those columns to the incoming row's values. */
function fromExcluded<T extends PgTable>(table: T, keys: (keyof T["$inferInsert"] & string)[]) {
  const columns = getTableColumns(table);
  return Object.fromEntries(keys.map((key) => [key, sql.raw(`excluded."${columns[key]!.name}"`)]));
}

await seed();
await db.$client.end();
