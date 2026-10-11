import { DOG_SEXES, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { DogSex, VaccinationStatus } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import type { DogRecord } from "~/orpc/dog/repository";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== Public Dog =====*/
/**
 * Converts a stored dog into its public shape: drops `ownerId`, `photoMediaId`, `deletedAt` and `updatedAt`, adds the photo, narrows `sex` and
 * `vaccinationStatus`, which are plain text in the database, and calculates `hasRecord`.
 *
 * @throws When `sex` isn't a known value. There is no honest fallback for it, and the service only ever writes valid
 * values, so this means corrupted data that should surface instead of being shown as a wrong sex.
 */
export function toPublicDog(record: DogRecord): Dog {
  if (!isDogSex(record.sex)) throw new Error(`Dog ${record.id} has an unknown sex: ${record.sex}`);

  return {
    id: record.id,
    name: record.name,
    breed: record.breed,
    sex: record.sex,
    birthDate: record.birthDate,
    birthDateApproximate: record.birthDateApproximate,
    weightKg: record.weightKg,
    isNeutered: record.isNeutered,
    microchipNumber: record.microchipNumber,
    // A status removed from the list later reads as "unknown" instead of failing output validation.
    vaccinationStatus: isVaccinationStatus(record.vaccinationStatus) ? record.vaccinationStatus : "unknown",
    behaviorNotes: record.behaviorNotes,
    medicalNotes: record.medicalNotes,
    knownSince: record.knownSince,
    // Spec: a Completed assessment, an enrollment with a Held session, or `knownSince` set. The first two are read with
    // the dog as `hasRecordEvent`.
    hasRecord: record.knownSince !== null || record.hasRecordEvent,
    photo: record.photo ? toPublicMedia(record.photo) : null,
    createdAt: record.createdAt,
  };
}

/*===== Type Guards =====*/
function isDogSex(value: string): value is DogSex {
  return (DOG_SEXES as readonly string[]).includes(value);
}

function isVaccinationStatus(value: string): value is VaccinationStatus {
  return (VACCINATION_STATUSES as readonly string[]).includes(value);
}
