/*===== Dog Constants =====*/
// Browser-safe values shared by the API, the seed and the dog forms. Stored as plain text (see `app/db/schema.ts`).

/*===== Sex =====*/
export const DOG_SEXES = ["male", "female"] as const;

export type DogSex = (typeof DOG_SEXES)[number];

export const DOG_SEX_LABELS: Record<DogSex, string> = {
  male: "نر",
  female: "ماده",
};

/*===== Vaccination =====*/
export const VACCINATION_STATUSES = ["up_to_date", "partial", "unknown"] as const;

export type VaccinationStatus = (typeof VACCINATION_STATUSES)[number];

export const VACCINATION_STATUS_LABELS: Record<VaccinationStatus, string> = {
  up_to_date: "کامل",
  partial: "ناقص",
  unknown: "نمی‌دانم",
};

/*===== Limits =====*/
export const DOG_NAME_MAX_LENGTH = 40;
export const DOG_BREED_MAX_LENGTH = 60;
/** Digits only; ISO 11784 chips have 15, but some older ones differ. */
export const DOG_MICROCHIP_MAX_LENGTH = 20;
export const DOG_NOTES_MAX_LENGTH = 1000;

export const DOG_WEIGHT_MIN_KG = 0.5;
export const DOG_WEIGHT_MAX_KG = 120;

/** A birth date further back than this is almost certainly a typo. */
export const DOG_MAX_AGE_YEARS = 25;
