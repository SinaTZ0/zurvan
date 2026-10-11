import type { Database } from "~/db/client.server";
import type { Course, CourseDetail } from "~/orpc/course/contract";
import { toPublicCourse, toPublicCourseDetail } from "~/orpc/course/mapper";
import {
  findApprovedCourseBySlug,
  findApprovedCourses,
  findPrerequisitesByCourseIds,
  type PrerequisiteRecord,
} from "~/orpc/course/repository";

/*===== List =====*/
/** Returns every approved course in catalogue order. */
export async function listCourses({ db }: { db: Database }): Promise<Course[]> {
  const records = await findApprovedCourses({ db });
  const prerequisites = await findPrerequisitesByCourseIds({ db, courseIds: records.map((record) => record.id) });
  const byCourseId = groupByCourseId(prerequisites);

  return records.map((record) => toPublicCourse({ record, prerequisites: byCourseId.get(record.id) ?? [] }));
}

/*===== Get =====*/
type GetCourseResult = { kind: "success"; course: CourseDetail } | { kind: "not-found" };

/**
 * Returns one approved course with its refund policy.
 *
 * @returns `not-found` when no approved course has the slug; drafts and archived courses are never public.
 */
export async function getCourse({ db, slug }: { db: Database; slug: string }): Promise<GetCourseResult> {
  const found = await findApprovedCourseBySlug({ db, slug });
  if (!found) return { kind: "not-found" };

  const prerequisites = await findPrerequisitesByCourseIds({ db, courseIds: [found.course.id] });

  return {
    kind: "success",
    course: toPublicCourseDetail({ record: found.course, refundPolicy: found.refundPolicy, prerequisites }),
  };
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
