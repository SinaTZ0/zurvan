import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { entryCalendar, type EntryDate } from "~/lib/date-entry";
import { toLatinDigits } from "~/lib/digits";
import { ageFromBirthDate, birthDateFromAge } from "~/lib/dog-format";
import { todayIso } from "~/lib/jalali";
import { formatNumber } from "~/lib/locale-format";
import { normalizeForSearch } from "~/lib/search";
import {
  DOG_BEHAVIOR_PROBLEM_MAX_LENGTH,
  DOG_BREED_MAX_LENGTH,
  DOG_BREED_PURITIES,
  DOG_COAT_COLOR_MAX_LENGTH,
  DOG_HEIGHT_MAX_CM,
  DOG_HEIGHT_MIN_CM,
  DOG_MARKINGS_MAX_LENGTH,
  DOG_MAX_AGE_YEARS,
  DOG_MAX_BEHAVIOR_PROBLEMS,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_SEXES,
  DOG_TRAINING_GOALS,
  DOG_WEIGHT_MAX_KG,
  DOG_WEIGHT_MIN_KG,
  type DogBreedPurity,
  VACCINATION_STATUSES,
} from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { m } from "~/paraglide/messages";

/*===== Dog Form =====*/
// Written for the person filling it in: selects hold strings, a date is three parts in the page's entry calendar
// (Jalali in Persian, Gregorian in English; `~/lib/date-entry`), the birth date may be an age instead, numbers accept
// Persian digits and either decimal mark, and the behavior problems are one textarea, one per line. Every message is a
// function (`error: () => m…()`), read when the field fails, so it answers in the page's language. The server checks
// everything again (`app/orpc/dog/validation.ts`); the two are kept separate on purpose (docs/frontend-guideline.md,
// "Forms"), and the rules across fields below mirror the server's.

export const BIRTH_MODES = ["exact", "approximate"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: () => m.account_dog_form_err_text_max({ max: formatNumber(max) }) });

/** «۳۲٫۵», «32,5» and «32/5» are all how people type a decimal on a Persian keyboard. */
function toNumber(value: string): number {
  return Number(toLatinDigits(value).trim().replace(/[٫,/]/g, "."));
}

/** The lines of the behavior-problems textarea as the server keeps them: trimmed, no blanks, no repeats. */
export function problemLines(text: string): string[] {
  return [
    ...new Set(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];
}

export const dogFormSchema = z
  .object({
    /** The evaluated dog's breed and birth date are shown, not asked (app-spec F2); the rules for them are skipped. */
    locked: z.boolean(),
    photoMediaId: z.string().nullable(),
    name: z
      .string()
      .trim()
      .min(1, { error: () => m.account_dog_form_err_name_required() })
      .max(DOG_NAME_MAX_LENGTH, {
        error: () => m.account_dog_form_err_name_max({ max: formatNumber(DOG_NAME_MAX_LENGTH) }),
      }),
    sex: z.enum(DOG_SEXES, { error: () => m.account_dog_form_err_sex() }),
    birthMode: z.enum(BIRTH_MODES),
    birthDay: z.string(),
    birthMonth: z.string(),
    birthYear: z.string(),
    ageYears: z.string(),
    ageMonths: z.string(),
    // A radio group's value: "" (or null) until one is picked; the rule below asks for it.
    breedPurity: z.string().nullish(),
    breed: optionalText(DOG_BREED_MAX_LENGTH),
    breedSecondary: optionalText(DOG_BREED_MAX_LENGTH),
    weight: z
      .string()
      .trim()
      .min(1, { error: () => m.account_dog_form_err_weight_required() })
      .transform(toNumber)
      .refine((value) => !Number.isNaN(value), { error: () => m.account_dog_form_err_weight_number() })
      .refine((value) => value >= DOG_WEIGHT_MIN_KG && value <= DOG_WEIGHT_MAX_KG, {
        error: () =>
          m.account_dog_form_err_weight_range({
            min: formatNumber(DOG_WEIGHT_MIN_KG),
            max: formatNumber(DOG_WEIGHT_MAX_KG),
          }),
      })
      .transform((value) => Math.round(value * 10) / 10),
    isNeutered: z.enum(["yes", "no"], { error: () => m.account_dog_form_err_neutered() }),
    // Whole centimetres at the shoulder; empty is "not given".
    height: z
      .string()
      .transform((value) => (value.trim() === "" ? null : toNumber(value)))
      .refine((value) => value === null || !Number.isNaN(value), {
        error: () => m.account_dog_form_err_height_number(),
      })
      .refine(
        (value) =>
          value === null || (Number.isInteger(value) && value >= DOG_HEIGHT_MIN_CM && value <= DOG_HEIGHT_MAX_CM),
        {
          error: () =>
            m.account_dog_form_err_height_range({
              min: formatNumber(DOG_HEIGHT_MIN_CM),
              max: formatNumber(DOG_HEIGHT_MAX_CM),
            }),
        },
      ),
    coatColor: optionalText(DOG_COAT_COLOR_MAX_LENGTH),
    markings: optionalText(DOG_MARKINGS_MAX_LENGTH),
    vaccinationStatus: z.enum(VACCINATION_STATUSES),
    vaccinationNotes: optionalText(DOG_NOTES_MAX_LENGTH),
    microchipNumber: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/\s+/g, ""))
      .refine((value) => /^\d{0,20}$/.test(value), { error: () => m.account_dog_form_err_microchip() }),
    implantDay: z.string(),
    implantMonth: z.string(),
    implantYear: z.string(),
    trainingGoals: z.array(z.enum(DOG_TRAINING_GOALS)),
    behaviorProblems: z.string(),
    behaviorNotes: optionalText(DOG_NOTES_MAX_LENGTH),
    medicalNotes: optionalText(DOG_NOTES_MAX_LENGTH),
    // The uploaded file photos' ids, in order; the record-photo fields keep them up to date.
    vaccinationPhotoIds: z.array(z.string()),
    medicalPhotoIds: z.array(z.string()),
    tattooPhotoIds: z.array(z.string()),
  })
  .superRefine(
    (values, ctx) => {
      const calendar = entryCalendar();
      const issue = (path: keyof DogFormInput, message: string) =>
        ctx.addIssue({ code: "custom", path: [path], message });

      /*------ Breed (mirrors the server's rules) ------*/
      if (!values.locked) {
        const purity = values.breedPurity;
        const breed = values.breed.trim();
        const second = values.breedSecondary.trim();
        if (!purity) {
          issue("breedPurity", m.account_dog_form_err_purity_required());
        } else if (purity === "purebred" && !breed) {
          issue("breed", m.account_dog_form_err_breed_required());
        } else if (purity === "cross") {
          if (!breed) issue("breed", m.account_dog_form_err_breed_parent_required());
          if (!second) issue("breedSecondary", m.account_dog_form_err_breed_secondary_required());
          else if (breed && normalizeForSearch(breed) === normalizeForSearch(second)) {
            issue("breedSecondary", m.account_dog_form_err_breed_secondary_same());
          }
        }
      }

      /*------ Birth Date ------*/
      let birthIso: string | null = null;
      if (!values.locked) {
        if (values.birthMode === "approximate") {
          if (values.ageYears === "" || values.ageMonths === "") {
            issue("ageYears", m.account_dog_form_err_age_required());
          }
        } else if (!values.birthDay || !values.birthMonth || !values.birthYear) {
          issue("birthDay", m.account_dog_form_err_date_required());
        } else {
          const date = toEntryDate({ day: values.birthDay, month: values.birthMonth, year: values.birthYear });
          if (!calendar.isValid(date)) issue("birthDay", m.account_dog_form_err_date_invalid());
          else if (calendar.toIso(date) > todayIso()) issue("birthDay", m.account_dog_form_err_date_future());
          else birthIso = calendar.toIso(date);
        }
      } else if (values.birthMode === "exact") {
        // Locked: the parts are the stored date, so they only serve the chip's "not before birth" check.
        const date = toEntryDate({ day: values.birthDay, month: values.birthMonth, year: values.birthYear });
        if (calendar.isValid(date)) birthIso = calendar.toIso(date);
      }

      /*------ Microchip Implant Date ------*/
      // Optional: all three parts or none. Only checked against a birth date the owner knows, as on the server.
      const parts = [values.implantDay, values.implantMonth, values.implantYear];
      if (parts.some(Boolean)) {
        const date = toEntryDate({ day: values.implantDay, month: values.implantMonth, year: values.implantYear });
        if (!parts.every(Boolean)) issue("implantDay", m.account_dog_form_err_implant_partial());
        else if (!calendar.isValid(date)) issue("implantDay", m.account_dog_form_err_date_invalid());
        else if (calendar.toIso(date) > todayIso()) issue("implantDay", m.account_dog_form_err_implant_future());
        else if (birthIso && calendar.toIso(date) < birthIso) {
          issue("implantDay", m.account_dog_form_err_implant_before_birth());
        }
      }

      /*------ Behavior Problems ------*/
      const lines = problemLines(values.behaviorProblems);
      const long = lines.findIndex((line) => line.length > DOG_BEHAVIOR_PROBLEM_MAX_LENGTH);
      if (long !== -1) {
        issue(
          "behaviorProblems",
          m.account_dog_form_err_problem_max({
            max: formatNumber(DOG_BEHAVIOR_PROBLEM_MAX_LENGTH),
            line: formatNumber(long + 1),
          }),
        );
      } else if (lines.length > DOG_MAX_BEHAVIOR_PROBLEMS) {
        issue(
          "behaviorProblems",
          m.account_dog_form_err_problems_max({ max: formatNumber(DOG_MAX_BEHAVIOR_PROBLEMS) }),
        );
      }
    },
    // Zod skips object refinements while any field fails; these rules read plain strings that always parse, so they
    // run anyway and their messages show with the others on the first check.
    { when: () => true },
  );

export type DogFormInput = z.input<typeof dogFormSchema>;
export type DogFormValues = z.output<typeof dogFormSchema>;

/*===== Dates =====*/
function toEntryDate(parts: { day: string; month: string; year: string }): EntryDate {
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/** A stored `YYYY-MM-DD` as the three selects' values in the page's entry calendar; empty when there is none. */
function toDateParts(iso: string | null): { day: string; month: string; year: string } {
  if (!iso) return { day: "", month: "", year: "" };
  const picked = entryCalendar().fromIso(iso);
  return { day: String(picked.day), month: String(picked.month), year: String(picked.year) };
}

/*===== To the API =====*/
/**
 * The values `dog.create` and `dog.update` take. `dog` is the dog being edited (null for a new one).
 *
 * Once it is evaluated the breed type, the breed(s) and the birth date are locked, and the API rejects any change to
 * them. The form can't rebuild the stored date exactly (an approximate date is `YYYY-MM-01` made from an age that moves
 * with the calendar), so the stored values are sent back as they are instead of being rebuilt from the form's fields;
 * an old dog without a breed type keeps its null. Every list goes on every save (a list left out would keep the stored
 * one), and so do the three photo lists.
 */
export function toDogInput({ values, dog }: { values: DogFormValues; dog: Dog | null }) {
  const locked = dog?.isEvaluated === true;
  const calendar = entryCalendar();
  const approximate = locked ? dog.birthDateApproximate : values.birthMode === "approximate";
  const birthDate = locked
    ? dog.birthDate
    : approximate
      ? birthDateFromAge({ years: Number(values.ageYears), months: Number(values.ageMonths) })
      : calendar.toIso(toEntryDate({ day: values.birthDay, month: values.birthMonth, year: values.birthYear }));
  const purity: DogBreedPurity | null = DOG_BREED_PURITIES.find((value) => value === values.breedPurity) ?? null;
  const implanted = values.implantDay
    ? calendar.toIso(toEntryDate({ day: values.implantDay, month: values.implantMonth, year: values.implantYear }))
    : null;

  return {
    photoMediaId: values.photoMediaId,
    name: values.name,
    breedPurity: locked ? dog.breedPurity : purity,
    breed: locked ? dog.breed : values.breed || null,
    breedSecondary: locked ? dog.breedSecondary : purity === "cross" ? values.breedSecondary || null : null,
    sex: values.sex,
    birthDate,
    birthDateApproximate: approximate,
    weightKg: values.weight,
    isNeutered: values.isNeutered === "yes",
    heightCm: values.height,
    coatColor: values.coatColor || null,
    markings: values.markings || null,
    vaccinationStatus: values.vaccinationStatus,
    vaccinationNotes: values.vaccinationNotes || null,
    microchipNumber: values.microchipNumber || null,
    microchipImplantedOn: implanted,
    trainingGoals: values.trainingGoals,
    // The server trims, drops the blanks and the repeats (`app/orpc/dog/validation.ts`).
    behaviorProblems: values.behaviorProblems.split("\n"),
    behaviorNotes: values.behaviorNotes || null,
    medicalNotes: values.medicalNotes || null,
    vaccinationPhotoIds: values.vaccinationPhotoIds,
    medicalPhotoIds: values.medicalPhotoIds,
    tattooPhotoIds: values.tattooPhotoIds,
  };
}

/*===== From a Dog =====*/
/** The form's starting values: empty for a new dog, the dog's own when editing. */
export function toFormDefaults(dog: Dog | null): DefaultValues<DogFormInput> {
  if (!dog) {
    return {
      locked: false,
      photoMediaId: null,
      name: "",
      // `sex`, `breedPurity` and `isNeutered` start unset on purpose: a pre-picked answer would be saved by people who
      // skipped it.
      birthMode: "exact",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      ageYears: "",
      ageMonths: "",
      breedPurity: "",
      breed: "",
      breedSecondary: "",
      weight: "",
      height: "",
      coatColor: "",
      markings: "",
      vaccinationStatus: "unknown",
      vaccinationNotes: "",
      microchipNumber: "",
      implantDay: "",
      implantMonth: "",
      implantYear: "",
      trainingGoals: [],
      behaviorProblems: "",
      behaviorNotes: "",
      medicalNotes: "",
      vaccinationPhotoIds: [],
      medicalPhotoIds: [],
      tattooPhotoIds: [],
    };
  }

  // In the page's entry calendar, the one the selects offer (and `toDogInput` reads them back in).
  const birth = toDateParts(dog.birthDate);
  const implant = toDateParts(dog.microchipImplantedOn);
  const age = ageFromBirthDate({ birthDate: dog.birthDate });
  return {
    locked: dog.isEvaluated,
    photoMediaId: dog.photo?.id ?? null,
    name: dog.name,
    sex: dog.sex,
    birthMode: dog.birthDateApproximate ? "approximate" : "exact",
    birthDay: birth.day,
    birthMonth: birth.month,
    birthYear: birth.year,
    ageYears: String(age.years),
    ageMonths: String(age.months),
    breedPurity: dog.breedPurity ?? "",
    breed: dog.breed ?? "",
    breedSecondary: dog.breedSecondary ?? "",
    weight: String(dog.weightKg),
    isNeutered: dog.isNeutered ? "yes" : "no",
    height: dog.heightCm === null ? "" : String(dog.heightCm),
    coatColor: dog.coatColor ?? "",
    markings: dog.markings ?? "",
    vaccinationStatus: dog.vaccinationStatus,
    vaccinationNotes: dog.vaccinationNotes ?? "",
    microchipNumber: dog.microchipNumber ?? "",
    implantDay: implant.day,
    implantMonth: implant.month,
    implantYear: implant.year,
    trainingGoals: dog.trainingGoals,
    behaviorProblems: dog.behaviorProblems.join("\n"),
    behaviorNotes: dog.behaviorNotes ?? "",
    medicalNotes: dog.medicalNotes ?? "",
    vaccinationPhotoIds: dog.vaccinationPhotos.map((photo) => photo.id),
    medicalPhotoIds: dog.medicalPhotos.map((photo) => photo.id),
    tattooPhotoIds: dog.tattooPhoto ? [dog.tattooPhoto.id] : [],
  };
}

/*===== Server Field Names =====*/
/** Where the server's field errors belong in this form, when the names differ. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof DogFormInput> = {
  birthDate: "birthDay",
  weightKg: "weight",
  heightCm: "height",
  microchipImplantedOn: "implantDay",
};

/** Ages offered in the «حدودی می‌دونم» ("I know roughly") selects. */
export const AGE_YEAR_OPTIONS = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => index);
export const AGE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index);
