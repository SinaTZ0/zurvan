import type { DogFormInput } from "~/routes/account_dog_form/schema";

/*===== Form Sections =====*/
// The form's four plates, named once. A new dog is added one plate per step (`?step=1..4`, in this order); an edit
// shows the four on one page. The form knows from them which plate the owner is in and whose dog speaks.

export const DOG_FORM_SECTIONS = ["identity", "body", "health", "training"] as const;

export type DogFormSection = (typeof DOG_FORM_SECTIONS)[number];

/** The steps of a new dog, 1-based as in the URL. */
export const DOG_FORM_STEP_COUNT = DOG_FORM_SECTIONS.length;

/** The section a 1-based step shows; a step outside 1..4 shows the first. */
export function sectionOfStep(step: number): DogFormSection {
  return DOG_FORM_SECTIONS[step - 1] ?? "identity";
}

/** The 1-based step that shows a section. */
export function stepOfSection(section: DogFormSection): number {
  return DOG_FORM_SECTIONS.indexOf(section) + 1;
}

/*===== Fields by Section =====*/
/**
 * The plate each field sits on, in the form's reading order (`firstFieldOf` relies on that order). The dog's photo is
 * on the print, outside the plates, and `locked` is not an input, so neither has one.
 */
const SECTION_OF_FIELD: Partial<Record<keyof DogFormInput, DogFormSection>> = {
  name: "identity",
  sex: "identity",
  birthMode: "identity",
  birthDay: "identity",
  birthMonth: "identity",
  birthYear: "identity",
  ageYears: "identity",
  ageMonths: "identity",
  breedPurity: "identity",
  breed: "identity",
  breedSecondary: "identity",
  weight: "body",
  isNeutered: "body",
  height: "body",
  coatColor: "body",
  markings: "body",
  vaccinationStatus: "health",
  vaccinationPhotoIds: "health",
  vaccinationNotes: "health",
  microchipNumber: "health",
  implantDay: "health",
  implantMonth: "health",
  implantYear: "health",
  tattooPhotoIds: "health",
  medicalNotes: "health",
  medicalPhotoIds: "health",
  trainingGoals: "training",
  behaviorProblems: "training",
  behaviorNotes: "training",
};

/** The fields a step checks before «بعدی» moves on (`trigger`). */
export function fieldsOfSection(section: DogFormSection): (keyof DogFormInput)[] {
  return (Object.keys(SECTION_OF_FIELD) as (keyof DogFormInput)[]).filter(
    (field) => SECTION_OF_FIELD[field] === section,
  );
}

/** The first plate, in reading order, that holds one of `fields`; null when none does (only `root` or the photo). */
export function firstSectionOf(fields: readonly string[]): DogFormSection | null {
  const sections = new Set(fields.map((field) => SECTION_OF_FIELD[field as keyof DogFormInput]));
  return DOG_FORM_SECTIONS.find((section) => sections.has(section)) ?? null;
}

/** The first of `fields` in the form's reading order (the server's field errors come in no particular order). */
export function firstFieldOf(fields: readonly string[]): keyof DogFormInput | null {
  const keys = Object.keys(SECTION_OF_FIELD) as (keyof DogFormInput)[];
  return keys.find((key) => fields.includes(key)) ?? null;
}
