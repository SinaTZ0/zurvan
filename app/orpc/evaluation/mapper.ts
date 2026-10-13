import {
  EVALUATION_PERIODS,
  EVALUATION_STATUSES,
  EVALUATION_VIDEOS_PATH,
  EVALUATION_WEEKDAYS,
  type EvaluationPeriod,
  type EvaluationStatus,
  type EvaluationWeekday,
} from "~/orpc/evaluation/constants";
import type { AdminEvaluation, Evaluation, EvaluationVideo } from "~/orpc/evaluation/contract";
import type { EvaluationPhotoRecord, EvaluationRow, EvaluationVideoRecord } from "~/orpc/evaluation/repository";
import { parseVideoFormat } from "~/orpc/evaluation/video";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== Video =====*/
/** @throws When the stored format isn't one the pipeline writes (see `parseVideoFormat`). */
export function toEvaluationVideo(record: EvaluationVideoRecord): EvaluationVideo {
  return {
    id: record.id,
    format: parseVideoFormat(record.format),
    fileName: record.fileName,
    sizeBytes: record.sizeBytes,
    url: `${EVALUATION_VIDEOS_PATH}/${record.id}`,
  };
}

/*===== Evaluation =====*/
/**
 * Converts a stored evaluation into the customer's view: groups the dog, attaches its photos and videos, and narrows
 * `status` and the free times, which are plain text in the database.
 *
 * @throws When `status` isn't a known value: corrupted data that should surface instead of a wrong status.
 */
export function toEvaluation({
  row,
  photos,
  videos,
}: {
  row: EvaluationRow;
  photos: EvaluationPhotoRecord[];
  videos: EvaluationVideoRecord[];
}): Evaluation {
  const { evaluation: record } = row;
  if (!isStatus(record.status)) throw new Error(`Evaluation ${record.id} has an unknown status: ${record.status}`);

  return {
    id: record.id,
    status: record.status,
    dog: { id: row.dog.id, name: row.dog.name, photo: row.dogPhoto ? toPublicMedia(row.dogPhoto) : null },
    earliestDate: record.earliestDate,
    availableDays: record.availableDays.filter(isWeekday),
    availablePeriods: record.availablePeriods.filter(isPeriod),
    rejectionReason: record.status === "rejected" ? record.rejectionReason : null,
    photos: photos.filter((photo) => photo.evaluationId === record.id).map((photo) => toPublicMedia(photo.media)),
    videos: videos.filter((video) => video.evaluationId === record.id).map(toEvaluationVideo),
    createdByAdmin: record.createdByAdmin,
    createdAt: record.createdAt,
    decidedAt: record.decidedAt,
  };
}

export function toAdminEvaluation(input: Parameters<typeof toEvaluation>[0]): AdminEvaluation {
  return { ...toEvaluation(input), customer: input.row.customer };
}

/*===== Type Guards =====*/
function isStatus(value: string): value is EvaluationStatus {
  return (EVALUATION_STATUSES as readonly string[]).includes(value);
}

function isWeekday(value: string): value is EvaluationWeekday {
  return (EVALUATION_WEEKDAYS as readonly string[]).includes(value);
}

function isPeriod(value: string): value is EvaluationPeriod {
  return (EVALUATION_PERIODS as readonly string[]).includes(value);
}
