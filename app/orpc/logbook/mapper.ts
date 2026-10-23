import type { LogbookEntry } from "~/orpc/logbook/contract";
import type { LogbookEntryRow } from "~/orpc/logbook/repository";
import { courseTitle } from "~/orpc/course/mapper";
import type { Locale } from "~/paraglide/runtime";

/*===== Entry =====*/
/**
 * A stored session as the API shows it: no author id, and the course by its slug and its name in `locale` (Persian
 * where the English isn't written); the Admin's lists stay Persian.
 */
export function toLogbookEntry(
  { entry, course }: LogbookEntryRow,
  { locale = "fa" }: { locale?: Locale } = {},
): LogbookEntry {
  return {
    id: entry.id,
    dogId: entry.dogId,
    occurredOn: entry.occurredOn,
    notes: entry.notes,
    exercises: entry.exercises,
    progress: entry.progress,
    isPublic: entry.isPublic,
    course: course ? { slug: course.slug, title: courseTitle({ locale, course }) } : null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
