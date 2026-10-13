import type { Database } from "~/db/client.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import { mediaUrl } from "~/lib/storage.server";
import type { AdminCourse, Course, CourseInput } from "~/orpc/course/contract";
import { toAdminCourse, toPublicCourse } from "~/orpc/course/mapper";
import {
  findAllCourses,
  findAllPrerequisiteLinks,
  findApprovedCourseBySlug,
  findApprovedCourses,
  findCourseBySlug,
  findCoursesBySlugs,
  findEnrollmentCounts,
  findMaxPosition,
  findPrerequisitesByCourseIds,
  findRequiredBy,
  insertCourseOnce,
  lockAllCourses,
  replacePrerequisites,
  updateCoursePosition,
  updateCourseById,
  updateCourseStatus,
  type CourseCoverValues,
  type CourseRecord,
  type PrerequisiteRecord,
} from "~/orpc/course/repository";
import {
  COURSE_COVER_INVALID_MESSAGE,
  COURSE_COVER_REQUIRED_MESSAGE,
  COURSE_PREREQUISITE_SELF_MESSAGE,
  COURSE_PREREQUISITE_UNKNOWN_MESSAGE,
  COURSE_SLUG_TAKEN_MESSAGE,
  courseCycleMessage,
  courseFormSchema,
  courseSlugSchema,
  type CourseForm,
} from "~/orpc/course/validation";
import { getMediaVariantSize, getMediaVariantSpec } from "~/orpc/media/constants";
import { isMediaKind } from "~/orpc/media/mapper";
import { findMediaById } from "~/orpc/media/repository";
import { attachMedia, isMediaId } from "~/orpc/media/service";

/*===== List =====*/
/** Returns every approved course in catalogue order. */
export async function listCourses({ db }: { db: Database }): Promise<Course[]> {
  const records = await findApprovedCourses({ db });
  const prerequisites = await findPrerequisitesByCourseIds({ db, courseIds: records.map((record) => record.id) });
  const byCourseId = groupByCourseId(prerequisites);

  return records.map((record) => toPublicCourse({ record, prerequisites: byCourseId.get(record.id) ?? [] }));
}

/*===== Get =====*/
type GetCourseResult = { kind: "success"; course: Course } | { kind: "not-found" };

/**
 * Returns one approved course.
 *
 * @returns `not-found` when no approved course has the slug; drafts and archived courses are never public.
 */
export async function getCourse({ db, slug }: { db: Database; slug: string }): Promise<GetCourseResult> {
  const record = await findApprovedCourseBySlug({ db, slug });
  if (!record) return { kind: "not-found" };

  const prerequisites = await findPrerequisitesByCourseIds({ db, courseIds: [record.id] });
  return { kind: "success", course: toPublicCourse({ record, prerequisites }) };
}

/*===== Helpers =====*/
function groupByCourseId(prerequisites: PrerequisiteRecord[]): Map<string, PrerequisiteRecord[]> {
  const grouped = new Map<string, PrerequisiteRecord[]>();
  for (const prerequisite of prerequisites) {
    const list = grouped.get(prerequisite.courseId) ?? [];
    list.push(prerequisite);
    grouped.set(prerequisite.courseId, list);
  }
  return grouped;
}

/*===== Admin Types =====*/
type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/** The cover is stored as the `card` variant, which is what the catalogue and the course page show. */
const COVER_VARIANT = "card";

/*===== Admin Read =====*/
/** Adds the prerequisites, enrollment counts and dependents to stored courses: three queries however many courses. */
async function loadAdminCourses({ db, records }: { db: Database; records: CourseRecord[] }): Promise<AdminCourse[]> {
  const ids = records.map((record) => record.id);
  const [prerequisites, counts, requiredBy] = await Promise.all([
    findPrerequisitesByCourseIds({ db, courseIds: ids }),
    findEnrollmentCounts({ db, courseIds: ids }),
    findRequiredBy({ db, courseIds: ids }),
  ]);
  const prerequisitesByCourse = groupByCourseId(prerequisites);
  const countsByCourse = new Map(counts.map((row) => [row.courseId, row]));

  return records.map((record) =>
    toAdminCourse({
      record,
      prerequisites: prerequisitesByCourse.get(record.id) ?? [],
      counts: countsByCourse.get(record.id),
      requiredBy: requiredBy.filter((row) => row.requiredCourseId === record.id),
    }),
  );
}

/** F8: every course, any status, in the order customers meet them. */
export async function adminListCourses({ db }: { db: Database }): Promise<AdminCourse[]> {
  return loadAdminCourses({ db, records: await findAllCourses({ db }) });
}

type AdminGetCourseResult = { kind: "success"; course: AdminCourse } | NotFoundResult;

/** @returns `not-found` for an unknown slug; a course is found whatever its status. */
export async function adminGetCourse({ db, slug }: { db: Database; slug: string }): Promise<AdminGetCourseResult> {
  const record = await findCourseBySlug({ db, slug });
  if (!record) return { kind: "not-found" };

  const [course] = await loadAdminCourses({ db, records: [record] });
  if (!course) throw new Error(`adminGetCourse: course ${slug} was not found after it was read`);
  return { kind: "success", course };
}

/*===== Admin Rules =====*/
/**
 * The stored cover for an uploaded image. The URL and size are built here from the media row, never taken from the
 * client, so a course can only point at an image this app made.
 *
 * @returns Undefined when the id is malformed or unknown, the image is not a `course` image, or someone else uploaded it.
 */
async function resolveCover({
  db,
  mediaId,
  userId,
}: {
  db: Database;
  mediaId: string;
  userId: string;
}): Promise<CourseCoverValues | undefined> {
  if (!isMediaId(mediaId)) return undefined;

  const media = await findMediaById({ db, id: mediaId });
  if (!media || !isMediaKind(media.kind) || media.kind !== "course" || media.uploadedBy !== userId) return undefined;

  const spec = getMediaVariantSpec({ kind: "course", variant: COVER_VARIANT });
  if (!spec) throw new Error(`resolveCover: course media has no ${COVER_VARIANT} variant`);
  const size = getMediaVariantSize({ spec, mediaWidth: media.width, mediaHeight: media.height });

  return {
    coverImage: mediaUrl({ kind: "course", mediaId: media.id, variant: COVER_VARIANT }),
    coverWidth: size.width,
    coverHeight: size.height,
  };
}

/** Whether `targetId` can be reached from `startId` by following "needs" links. Iterative, so a long chain is fine. */
function needsCourse({
  startId,
  targetId,
  needs,
}: {
  startId: string;
  targetId: string;
  needs: Map<string, string[]>;
}): boolean {
  const seen = new Set<string>();
  const pending = [startId];

  for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
    if (id === targetId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(needs.get(id) ?? []));
  }
  return false;
}

type PrerequisiteCheck = { kind: "ok"; ids: string[] } | { kind: "invalid"; message: string };

/**
 * The chosen prerequisites as course ids. Each slug must be an existing course (any status: an archived course can
 * still be a rung), not the course itself, and must not lead back to it: A needing B while B needs A would lock both
 * for ever. `selfId` is undefined for a new course, which nobody can need yet, so it cannot be in a cycle.
 */
async function checkPrerequisites({
  db,
  slugs,
  selfId,
  title,
}: {
  db: Database;
  slugs: string[];
  selfId: string | undefined;
  title: string;
}): Promise<PrerequisiteCheck> {
  const found = await findCoursesBySlugs({ db, slugs });
  const bySlug = new Map(found.map((record) => [record.slug, record]));

  const chosen: CourseRecord[] = [];
  for (const slug of slugs) {
    const record = bySlug.get(slug);
    if (!record) return { kind: "invalid", message: COURSE_PREREQUISITE_UNKNOWN_MESSAGE };
    if (record.id === selfId) return { kind: "invalid", message: COURSE_PREREQUISITE_SELF_MESSAGE };
    chosen.push(record);
  }

  if (selfId !== undefined && chosen.length > 0) {
    const needs = new Map<string, string[]>();
    for (const { courseId, requiredCourseId } of await findAllPrerequisiteLinks({ db })) {
      needs.set(courseId, [...(needs.get(courseId) ?? []), requiredCourseId]);
    }

    // The links of the course being saved are about to be replaced, but they are never walked: reaching it stops the walk.
    const cyclic = chosen.find((record) => needsCourse({ startId: record.id, targetId: selfId, needs }));
    if (cyclic) return { kind: "invalid", message: courseCycleMessage({ requiredTitle: cyclic.title, title }) };
  }

  return { kind: "ok", ids: chosen.map((record) => record.id) };
}

/** Runs the schemas that read only the input and merges their messages, so one answer lists every field to fix. */
function parseCourseInput({ input, slug }: { input: unknown; slug?: string }) {
  const form = courseFormSchema.safeParse(input);
  const slugResult = slug === undefined ? undefined : courseSlugSchema.safeParse(slug);

  const issues = slugResult?.success === false ? slugResult.error.issues.map(withSlugPath) : [];
  if (!form.success) issues.push(...form.error.issues);
  if (issues.length > 0 || !form.success) return { kind: "invalid" as const, ...issuesToErrorData(issues) };

  return { kind: "ok" as const, form: form.data, slug: slugResult?.data };
}

function withSlugPath<Issue extends { path: PropertyKey[] }>(issue: Issue): Issue {
  return { ...issue, path: ["slug"] };
}

/** The columns the form owns. */
function toCourseValues(form: CourseForm) {
  const { prerequisites: _prerequisites, ...values } = form;
  return values;
}

/*===== Admin Create =====*/
type AdminCreateResult = { kind: "success"; course: AdminCourse } | InvalidResult;

/**
 * F8: adds a course at the end of the catalogue, on sale. The course and its prerequisites are written in one
 * transaction. Every refusal is a field message and writes nothing; the cover image is claimed only after the course is
 * saved, so a refused form leaves the upload free for the next try.
 *
 * The slug is checked up front for the message and again by the unique index, so two creates racing for it get the
 * same message instead of an error.
 */
export async function adminCreateCourse({
  db,
  userId,
  input,
}: {
  db: Database;
  userId: string;
  input: CourseInput & { slug: string; coverMediaId: string };
}): Promise<AdminCreateResult> {
  /*------ Validate ------*/
  const parsed = parseCourseInput({ input, slug: input.slug });
  if (parsed.kind === "invalid") return parsed;
  const { form } = parsed;
  const slug = parsed.slug ?? input.slug;

  /*------ Rules that need the database ------*/
  const fields: Record<string, string> = {};
  if (await findCourseBySlug({ db, slug })) fields.slug = COURSE_SLUG_TAKEN_MESSAGE;

  const mediaId = input.coverMediaId.trim();
  const cover = mediaId ? await resolveCover({ db, mediaId, userId }) : undefined;
  if (!cover) fields.cover = mediaId ? COURSE_COVER_INVALID_MESSAGE : COURSE_COVER_REQUIRED_MESSAGE;

  const prerequisites = await checkPrerequisites({
    db,
    slugs: form.prerequisites,
    selfId: undefined,
    title: form.title,
  });
  if (prerequisites.kind === "invalid") fields.prerequisites = prerequisites.message;

  if (!cover || prerequisites.kind === "invalid" || Object.keys(fields).length > 0) {
    return { kind: "invalid", errors: [], fields };
  }

  /*------ Write ------*/
  const created = await db.transaction(async (tx) => {
    const position = (await findMaxPosition({ db: tx })) + 1;
    const id = await insertCourseOnce({ db: tx, slug, values: toCourseValues(form), cover, position });
    if (!id) return undefined;

    await replacePrerequisites({ db: tx, courseId: id, requiredCourseIds: prerequisites.ids });
    return id;
  });
  if (!created) return { kind: "invalid", errors: [], fields: { slug: COURSE_SLUG_TAKEN_MESSAGE } };

  // The course is saved, so a media that vanished in the meantime only costs the cleanup job its bookkeeping.
  await attachMedia({ db, mediaId, kind: "course", userId });

  const result = await adminGetCourse({ db, slug });
  if (result.kind !== "success") throw new Error(`adminCreateCourse: course ${slug} was not found after it was stored`);
  return { kind: "success", course: result.course };
}

/*===== Admin Update =====*/
type AdminUpdateResult = { kind: "success"; course: AdminCourse } | InvalidResult | NotFoundResult;

/**
 * F8: rewrites a course's fields and prerequisites in one transaction. The slug never changes (it is in carts and
 * URLs), nor does the status or the position. No `coverMediaId` keeps the cover; `coverAlt` is always written. A price
 * or age change reaches the cart at once, while every enrollment keeps the price it paid.
 *
 * @returns `not-found` for an unknown slug; `invalid` with field messages, writing nothing.
 */
export async function adminUpdateCourse({
  db,
  userId,
  input,
}: {
  db: Database;
  userId: string;
  input: CourseInput & { slug: string; coverMediaId?: string | undefined };
}): Promise<AdminUpdateResult> {
  const existing = await findCourseBySlug({ db, slug: input.slug });
  if (!existing) return { kind: "not-found" };

  /*------ Validate ------*/
  const parsed = parseCourseInput({ input });
  if (parsed.kind === "invalid") return parsed;
  const { form } = parsed;

  /*------ Rules that need the database ------*/
  const fields: Record<string, string> = {};

  // A blank id is "not sent": the form has nothing to send when the cover wasn't changed.
  const mediaId = input.coverMediaId?.trim() ?? "";
  const cover = mediaId ? await resolveCover({ db, mediaId, userId }) : undefined;
  if (mediaId && !cover) fields.cover = COURSE_COVER_INVALID_MESSAGE;

  const prerequisites = await checkPrerequisites({
    db,
    slugs: form.prerequisites,
    selfId: existing.id,
    title: form.title,
  });
  if (prerequisites.kind === "invalid") fields.prerequisites = prerequisites.message;

  if (prerequisites.kind === "invalid" || Object.keys(fields).length > 0) {
    return { kind: "invalid", errors: [], fields };
  }

  /*------ Write ------*/
  await db.transaction(async (tx) => {
    await updateCourseById({ db: tx, id: existing.id, values: toCourseValues(form), cover });
    await replacePrerequisites({ db: tx, courseId: existing.id, requiredCourseIds: prerequisites.ids });
  });

  if (cover) await attachMedia({ db, mediaId, kind: "course", userId });

  const result = await adminGetCourse({ db, slug: input.slug });
  if (result.kind !== "success") throw new Error(`adminUpdateCourse: course ${input.slug} vanished after it was saved`);
  return { kind: "success", course: result.course };
}

/*===== Admin Set Status =====*/
type AdminSetStatusResult = { kind: "success"; course: AdminCourse } | NotFoundResult;

/**
 * F8: puts a course on sale or takes it off. Never refused and touches nothing else: active enrollments continue and a
 * completed one still counts as a prerequisite, because eligibility reads passed courses by id, not by status. Setting
 * the status it already has succeeds.
 */
export async function adminSetCourseStatus({
  db,
  slug,
  status,
}: {
  db: Database;
  slug: string;
  status: "approved" | "archived";
}): Promise<AdminSetStatusResult> {
  const record = await findCourseBySlug({ db, slug });
  if (!record) return { kind: "not-found" };

  if (record.status !== status) await updateCourseStatus({ db, id: record.id, status });

  const result = await adminGetCourse({ db, slug });
  if (result.kind !== "success") throw new Error(`adminSetCourseStatus: course ${slug} vanished after it was saved`);
  return result;
}

/*===== Admin Move =====*/
type AdminMoveResult = { kind: "success"; courses: AdminCourse[] } | NotFoundResult;

/**
 * F8: swaps a course with its neighbour and renumbers every position 1..n, which also heals ties and gaps. At either end
 * it changes nothing. The rows are locked first, so two moves at once happen one after the other.
 *
 * @returns The whole catalogue in its new order.
 */
export async function adminMoveCourse({
  db,
  slug,
  direction,
}: {
  db: Database;
  slug: string;
  direction: "up" | "down";
}): Promise<AdminMoveResult> {
  const found = await db.transaction(async (tx) => {
    const ordered = await lockAllCourses({ db: tx });
    const index = ordered.findIndex((record) => record.slug === slug);
    if (index === -1) return false;

    const neighbour = direction === "up" ? index - 1 : index + 1;
    if (neighbour >= 0 && neighbour < ordered.length) {
      const current = ordered[index];
      const other = ordered[neighbour];
      if (current && other) {
        ordered[index] = other;
        ordered[neighbour] = current;
      }
    }

    /*------ Renumber ------*/
    for (const [position, record] of ordered.entries()) {
      if (record.position !== position + 1)
        await updateCoursePosition({ db: tx, id: record.id, position: position + 1 });
    }
    return true;
  });
  if (!found) return { kind: "not-found" };

  return { kind: "success", courses: await adminListCourses({ db }) };
}
