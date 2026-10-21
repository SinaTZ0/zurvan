import type { DogFormInput } from "~/routes/account_dog_form/schema";

/*===== Form Sections =====*/
// The form's three plates, named once so the form knows which plate the owner is in and whose dog speaks.

export const DOG_FORM_SECTIONS = ["identity", "body", "trainer"] as const;

export type DogFormSection = (typeof DOG_FORM_SECTIONS)[number];

/*===== Fields by Section =====*/
/** The plate each field sits on. The photo is on the print, outside the plates, so it has none. */
const SECTION_OF_FIELD: Partial<Record<keyof DogFormInput, DogFormSection>> = {
  name: "identity",
  sex: "identity",
  breed: "identity",
  birthMode: "identity",
  birthDay: "identity",
  birthMonth: "identity",
  birthYear: "identity",
  ageYears: "identity",
  ageMonths: "identity",
  weight: "body",
  isNeutered: "body",
  vaccinationStatus: "body",
  microchipNumber: "body",
  behaviorNotes: "trainer",
  medicalNotes: "trainer",
};

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
