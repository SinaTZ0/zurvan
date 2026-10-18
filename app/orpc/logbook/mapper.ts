import type { LogbookEntry } from "~/orpc/logbook/contract";
import type { LogbookEntryRow } from "~/orpc/logbook/repository";

/*===== Entry =====*/
/** A stored session as the API shows it: no author id, and the course by its slug and title. */
export function toLogbookEntry({ entry, course }: LogbookEntryRow): LogbookEntry {
  return {
    id: entry.id,
    dogId: entry.dogId,
    occurredOn: entry.occurredOn,
    notes: entry.notes,
    exercises: entry.exercises,
    progress: entry.progress,
    isPublic: entry.isPublic,
    course,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
