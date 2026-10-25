import { m } from "~/paraglide/messages";

/*===== Dog Constants =====*/
// Browser-safe values shared by the API, the seed and the dog forms. Stored as plain text (see `app/db/schema.ts`).
// Labels are getters over the messages (`messages/shared/`), read while rendering in the page's language; the Admin's
// pages are Persian only, so they read Persian.

/*===== Sex =====*/
export const DOG_SEXES = ["male", "female"] as const;

export type DogSex = (typeof DOG_SEXES)[number];

export const DOG_SEX_LABELS: Record<DogSex, string> = {
  get male() {
    return m.shared_dog_sex_male();
  },
  get female() {
    return m.shared_dog_sex_female();
  },
};

/*===== Breed Purity =====*/
// F2: what the breed inputs ask for. A purebred has one breed, a cross the breeds of its two parents, and a mixed dog
// (parents unknown) at most what it looks like.
export const DOG_BREED_PURITIES = ["purebred", "cross", "mixed"] as const;

export type DogBreedPurity = (typeof DOG_BREED_PURITIES)[number];

export const DOG_BREED_PURITY_LABELS: Record<DogBreedPurity, string> = {
  get purebred() {
    return m.shared_dog_purity_purebred();
  },
  get cross() {
    return m.shared_dog_purity_cross();
  },
  get mixed() {
    return m.shared_dog_purity_mixed();
  },
};

/*===== Training Goals =====*/
// What the owner trains the dog for; a dog can have several (a house dog that also does sport).
export const DOG_TRAINING_GOALS = ["home", "sport", "working"] as const;

export type DogTrainingGoal = (typeof DOG_TRAINING_GOALS)[number];

export const DOG_TRAINING_GOAL_LABELS: Record<DogTrainingGoal, string> = {
  get home() {
    return m.shared_dog_goal_home();
  },
  get sport() {
    return m.shared_dog_goal_sport();
  },
  get working() {
    return m.shared_dog_goal_working();
  },
};

/*===== Record Photos =====*/
/** What a photo in the dog's file shows (`dog_record_photo.purpose`). */
export const DOG_RECORD_PHOTO_PURPOSES = ["vaccination", "medical", "tattoo"] as const;

export type DogRecordPhotoPurpose = (typeof DOG_RECORD_PHOTO_PURPOSES)[number];

/** How many photos each purpose holds: a few pages of a vaccination card or of a vet's papers, one tattoo. */
export const DOG_RECORD_PHOTO_LIMITS: Record<DogRecordPhotoPurpose, number> = {
  vaccination: 6,
  medical: 6,
  tattoo: 1,
};

/*===== Vaccination =====*/
export const VACCINATION_STATUSES = ["up_to_date", "partial", "unknown"] as const;

export type VaccinationStatus = (typeof VACCINATION_STATUSES)[number];

export const VACCINATION_STATUS_LABELS: Record<VaccinationStatus, string> = {
  get up_to_date() {
    return m.shared_vaccination_up_to_date();
  },
  get partial() {
    return m.shared_vaccination_partial();
  },
  get unknown() {
    return m.shared_vaccination_unknown();
  },
};

/*===== Limits =====*/
export const DOG_NAME_MAX_LENGTH = 40;
export const DOG_BREED_MAX_LENGTH = 60;
/** Digits only; ISO 11784 chips have 15, but some older ones differ. */
export const DOG_MICROCHIP_MAX_LENGTH = 20;
export const DOG_NOTES_MAX_LENGTH = 1000;
export const DOG_COAT_COLOR_MAX_LENGTH = 60;
export const DOG_MARKINGS_MAX_LENGTH = 300;
export const DOG_MAX_BEHAVIOR_PROBLEMS = 20;
export const DOG_BEHAVIOR_PROBLEM_MAX_LENGTH = 120;

/** Shoulder height in whole centimetres: a toy breed's to a giant's. */
export const DOG_HEIGHT_MIN_CM = 10;
export const DOG_HEIGHT_MAX_CM = 110;

export const DOG_WEIGHT_MIN_KG = 0.5;
export const DOG_WEIGHT_MAX_KG = 120;

/** A birth date further back than this is almost certainly a typo. */
export const DOG_MAX_AGE_YEARS = 25;
