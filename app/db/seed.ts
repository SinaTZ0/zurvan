import { getTableColumns, inArray, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { applyHandWrittenSql } from "~/db/apply-sql";
import { db } from "~/db/client.server";
import { course, coursePrerequisite, refundPolicy } from "~/db/schema";
import { SEED_COURSES, SEED_DEFAULT_REFUND_POLICY, SEED_REFUND_POLICIES } from "~/db/seed-courses";

/*===== Seed =====*/
// `npm run db:seed`, after `npm run db:push`. It first applies the hand-written SQL (`apply-sql.ts`). Idempotent: rows
// are upserted by their natural key (policy name, course slug), so running it again updates the catalogue to match
// `seed-courses.ts` without duplicating anything.

const TOMAN_TO_RIAL = 10;

/** Toman → Rial, keeping "not sold at a list price" as null. */
function toRial(toman: number | undefined) {
  return toman === undefined ? null : toman * TOMAN_TO_RIAL;
}

async function seed() {
  // The money triggers first: they belong to the schema, and every setup runs this seed after the push.
  await applyHandWrittenSql(db);

  await db.transaction(async (tx) => {
    /*------ Refund Policies ------*/
    const policies = await tx
      .insert(refundPolicy)
      .values([...SEED_REFUND_POLICIES])
      .onConflictDoUpdate({
        target: refundPolicy.name,
        set: fromExcluded(refundPolicy, ["customerDescription", "unheldRefundPercent"]),
      })
      .returning();
    const defaultPolicy = policies.find((policy) => policy.name === SEED_DEFAULT_REFUND_POLICY)!;

    /*------ Courses ------*/
    const courses = await tx
      .insert(course)
      .values(
        SEED_COURSES.map((entry, index) => ({
          slug: entry.slug,
          title: entry.title,
          latinName: entry.latinName,
          family: entry.family,
          bookingKind: entry.bookingKind ?? "standard",
          status: "approved",
          summary: entry.summary,
          highlights: entry.highlights,
          commands: entry.commands,
          coverImage: entry.cover.src,
          coverAlt: entry.cover.alt,
          coverWidth: entry.cover.width,
          coverHeight: entry.cover.height,
          minAgeMonths: entry.minAgeMonths ?? null,
          maxAgeMonths: entry.maxAgeMonths ?? null,
          sessionCount: entry.sessionCount ?? null,
          place: entry.place ?? null,
          price: toRial(entry.priceToman),
          boardingPrice: toRial(entry.boardingPriceToman),
          testPrice: toRial(entry.testPriceToman),
          refundPolicyId: defaultPolicy.id,
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
          "bookingKind",
          "status",
          "summary",
          "highlights",
          "commands",
          "coverImage",
          "coverAlt",
          "coverWidth",
          "coverHeight",
          "minAgeMonths",
          "maxAgeMonths",
          "sessionCount",
          "place",
          "price",
          "boardingPrice",
          "testPrice",
          "refundPolicyId",
          "position",
        ]),
      })
      .returning({ id: course.id, slug: course.slug });
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

    console.log(
      `Seeded ${policies.length} refund policies, ${courses.length} courses, ${prerequisites.length} prerequisites.`,
    );
  });
}

/** `excluded.<column>` for each key, so an upsert sets those columns to the incoming row's values. */
function fromExcluded<T extends PgTable>(table: T, keys: (keyof T["$inferInsert"] & string)[]) {
  const columns = getTableColumns(table);
  return Object.fromEntries(keys.map((key) => [key, sql.raw(`excluded."${columns[key]!.name}"`)]));
}

await seed();
await db.$client.end();
