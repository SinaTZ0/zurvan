import { DOG_BREED_PURITIES, DOG_SEXES, DOG_TRAINING_GOALS, VACCINATION_STATUSES } from "~/orpc/dog/constants";
import type { DogBreedPurity, DogSex, DogTrainingGoal, VaccinationStatus } from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import type { DogRecord, DogRecordPhotoRecord, PassedCourseRecord } from "~/orpc/dog/repository";
import { courseTitle } from "~/orpc/course/mapper";
import { toPublicMedia } from "~/orpc/media/mapper";
import type { Locale } from "~/paraglide/runtime";

/*===== Public Dog =====*/
/**
 * Converts a stored dog into its public shape: drops `ownerId`, `photoMediaId` and `updatedAt`, adds the photos and the
 * passed courses, and narrows `sex`, `breedPurity`, `vaccinationStatus` and `trainingGoals`, which are plain text in the
 * database.
 *
 * @throws When `sex` isn't a known value. There is no honest fallback for it, and the service only ever writes valid
 * values, so this means corrupted data that should surface instead of being shown as a wrong sex.
 */
export function toPublicDog({
  record,
  passed,
  recordPhotos,
  locale,
}: {
  record: DogRecord;
  passed: PassedCourseRecord[];
  /** May hold other dogs' photos too: a list reads them all in one query. */
  recordPhotos: DogRecordPhotoRecord[];
  /** The language of the passed courses' titles. The Admin's views pass "fa". */
  locale: Locale;
}): Dog {
  if (!isDogSex(record.sex)) throw new Error(`Dog ${record.id} has an unknown sex: ${record.sex}`);

  const photosFor = (purpose: string) =>
    recordPhotos
      .filter((photo) => photo.dogId === record.id && photo.purpose === purpose)
      .map((photo) => toPublicMedia(photo.media));

  return {
    id: record.id,
    fileNumber: record.fileNumber,
    name: record.name,
    // A purity removed from the list later reads as not stated instead of failing output validation.
    breedPurity: record.breedPurity !== null && isBreedPurity(record.breedPurity) ? record.breedPurity : null,
    breed: record.breed,
    breedSecondary: record.breedSecondary,
    sex: record.sex,
    birthDate: record.birthDate,
    birthDateApproximate: record.birthDateApproximate,
    weightKg: record.weightKg,
    isNeutered: record.isNeutered,
    heightCm: record.heightCm,
    coatColor: record.coatColor,
    markings: record.markings,
    microchipNumber: record.microchipNumber,
    microchipImplantedOn: record.microchipImplantedOn,
    // A status removed from the list later reads as "unknown" instead of failing output validation.
    vaccinationStatus: isVaccinationStatus(record.vaccinationStatus) ? record.vaccinationStatus : "unknown",
    vaccinationNotes: record.vaccinationNotes,
    trainingGoals: record.trainingGoals.filter(isTrainingGoal),
    behaviorProblems: record.behaviorProblems,
    behaviorNotes: record.behaviorNotes,
    medicalNotes: record.medicalNotes,
    isEvaluated: record.isEvaluated,
    passedCourses: passed
      .filter((entry) => entry.dogId === record.id)
      .map((entry) => ({ slug: entry.slug, title: courseTitle({ locale, course: entry }), source: entry.source })),
    photo: record.photo ? toPublicMedia(record.photo) : null,
    vaccinationPhotos: photosFor("vaccination"),
    medicalPhotos: photosFor("medical"),
    tattooPhoto: photosFor("tattoo")[0] ?? null,
    createdAt: record.createdAt,
  };
}

/*===== Type Guards =====*/
function isDogSex(value: string): value is DogSex {
  return (DOG_SEXES as readonly string[]).includes(value);
}

function isBreedPurity(value: string): value is DogBreedPurity {
  return (DOG_BREED_PURITIES as readonly string[]).includes(value);
}

function isTrainingGoal(value: string): value is DogTrainingGoal {
  return (DOG_TRAINING_GOALS as readonly string[]).includes(value);
}

function isVaccinationStatus(value: string): value is VaccinationStatus {
  return (VACCINATION_STATUSES as readonly string[]).includes(value);
}
