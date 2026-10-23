import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { entryCalendar } from "~/lib/date-entry";
import { toLatinDigits } from "~/lib/digits";
import { ageFromBirthDate, birthDateFromAge } from "~/lib/dog-format";
import { todayIso } from "~/lib/jalali";
import { formatNumber } from "~/lib/locale-format";
import {
  DOG_BREED_MAX_LENGTH,
  DOG_MAX_AGE_YEARS,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_SEXES,
  DOG_WEIGHT_MAX_KG,
  DOG_WEIGHT_MIN_KG,
  VACCINATION_STATUSES,
} from "~/orpc/dog/constants";
import type { Dog } from "~/orpc/dog/contract";
import { m } from "~/paraglide/messages";

/*===== Dog Form =====*/
// Written for the person filling it in: selects hold strings, the birth date is either a date in the page's entry
// calendar (Jalali in Persian, Gregorian in English; `~/lib/date-entry`) or an age, and the weight accepts Persian
// digits and either decimal mark. Every message is a function (`error: () => m…()`), read when the field fails, so it
// answers in the page's language. The server checks everything again (`app/orpc/dog/
// validation.ts`); the two are kept separate on purpose (docs/frontend-guideline.md, "Forms").

export const BIRTH_MODES = ["exact", "approximate"] as const;

const optionalText = ({ max, message }: { max: number; message: () => string }) =>
  z.string().trim().max(max, { error: message });

export const dogFormSchema = z
  .object({
    photoMediaId: z.string().nullable(),
    name: z
      .string()
      .trim()
      .min(1, { error: () => m.account_dog_form_err_name_required() })
      .max(DOG_NAME_MAX_LENGTH, {
        error: () => m.account_dog_form_err_name_max({ max: formatNumber(DOG_NAME_MAX_LENGTH) }),
      }),
    breed: optionalText({
      max: DOG_BREED_MAX_LENGTH,
      message: () => m.account_dog_form_err_breed_max({ max: formatNumber(DOG_BREED_MAX_LENGTH) }),
    }),
    sex: z.enum(DOG_SEXES, { error: () => m.account_dog_form_err_sex() }),
    birthMode: z.enum(BIRTH_MODES),
    birthDay: z.string(),
    birthMonth: z.string(),
    birthYear: z.string(),
    ageYears: z.string(),
    ageMonths: z.string(),
    weight: z
      .string()
      .trim()
      .min(1, { error: () => m.account_dog_form_err_weight_required() })
      // «۳۲٫۵», «32,5» and «32/5» are all how people type a decimal on a Persian keyboard.
      .transform((value) => Number(toLatinDigits(value).replace(/[٫,/]/g, ".")))
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
    vaccinationStatus: z.enum(VACCINATION_STATUSES),
    microchipNumber: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/\s+/g, ""))
      .refine((value) => /^\d{0,20}$/.test(value), { error: () => m.account_dog_form_err_microchip() }),
    behaviorNotes: optionalText({
      max: DOG_NOTES_MAX_LENGTH,
      message: () => m.account_dog_form_err_notes_max({ max: formatNumber(DOG_NOTES_MAX_LENGTH) }),
    }),
    medicalNotes: optionalText({
      max: DOG_NOTES_MAX_LENGTH,
      message: () => m.account_dog_form_err_notes_max({ max: formatNumber(DOG_NOTES_MAX_LENGTH) }),
    }),
  })
  .superRefine(
    (values, ctx) => {
      /*------ Birth Date ------*/
      if (values.birthMode === "approximate") {
        if (values.ageYears === "" || values.ageMonths === "") {
          ctx.addIssue({ code: "custom", path: ["ageYears"], message: m.account_dog_form_err_age_required() });
        }
        return;
      }

      if (!values.birthDay || !values.birthMonth || !values.birthYear) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: m.account_dog_form_err_date_required() });
        return;
      }
      const calendar = entryCalendar();
      const date = { year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) };
      if (!calendar.isValid(date)) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: m.account_dog_form_err_date_invalid() });
      } else if (calendar.toIso(date) > todayIso()) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: m.account_dog_form_err_date_future() });
      }
    },
    // Zod skips object refinements while any field fails; the date parts are plain strings that always parse, so the
    // date is checked anyway and its message shows with the others on the first submit.
    { when: () => true },
  );

export type DogFormInput = z.input<typeof dogFormSchema>;
export type DogFormValues = z.output<typeof dogFormSchema>;

/*===== To the API =====*/
/**
 * The values `dog.create` and `dog.update` take. `dog` is the dog being edited (null for a new one).
 *
 * Once it is evaluated the birth date and breed are locked, and the API rejects any change to them. The form can't
 * rebuild the stored date exactly (an approximate date is `YYYY-MM-01` made from an age that moves with the calendar),
 * so the stored values are sent back as they are instead of being rebuilt from the form's fields.
 */
export function toDogInput({ values, dog }: { values: DogFormValues; dog: Dog | null }) {
  const locked = dog?.isEvaluated === true;
  const approximate = locked ? dog.birthDateApproximate : values.birthMode === "approximate";
  const birthDate = locked
    ? dog.birthDate
    : approximate
      ? birthDateFromAge({ years: Number(values.ageYears), months: Number(values.ageMonths) })
      : entryCalendar().toIso({
          year: Number(values.birthYear),
          month: Number(values.birthMonth),
          day: Number(values.birthDay),
        });

  return {
    photoMediaId: values.photoMediaId,
    name: values.name,
    breed: locked ? dog.breed : values.breed || null,
    sex: values.sex,
    birthDate,
    birthDateApproximate: approximate,
    weightKg: values.weight,
    isNeutered: values.isNeutered === "yes",
    vaccinationStatus: values.vaccinationStatus,
    microchipNumber: values.microchipNumber || null,
    behaviorNotes: values.behaviorNotes || null,
    medicalNotes: values.medicalNotes || null,
  };
}

/*===== From a Dog =====*/
/** The form's starting values: empty for a new dog, the dog's own when editing. */
export function toFormDefaults(dog: Dog | null): DefaultValues<DogFormInput> {
  if (!dog) {
    return {
      photoMediaId: null,
      name: "",
      breed: "",
      // `sex` and `isNeutered` start unset on purpose: a pre-picked answer would be saved by people who skipped it.
      birthMode: "exact",
      birthDay: "",
      birthMonth: "",
      birthYear: "",
      ageYears: "",
      ageMonths: "",
      weight: "",
      vaccinationStatus: "unknown",
      microchipNumber: "",
      behaviorNotes: "",
      medicalNotes: "",
    };
  }

  // In the page's entry calendar, the one the selects offer (and `toDogInput` reads them back in).
  const picked = entryCalendar().fromIso(dog.birthDate);
  const age = ageFromBirthDate({ birthDate: dog.birthDate });
  return {
    photoMediaId: dog.photo?.id ?? null,
    name: dog.name,
    breed: dog.breed ?? "",
    sex: dog.sex,
    birthMode: dog.birthDateApproximate ? "approximate" : "exact",
    birthDay: String(picked.day),
    birthMonth: String(picked.month),
    birthYear: String(picked.year),
    ageYears: String(age.years),
    ageMonths: String(age.months),
    weight: String(dog.weightKg),
    isNeutered: dog.isNeutered ? "yes" : "no",
    vaccinationStatus: dog.vaccinationStatus,
    microchipNumber: dog.microchipNumber ?? "",
    behaviorNotes: dog.behaviorNotes ?? "",
    medicalNotes: dog.medicalNotes ?? "",
  };
}

/*===== Server Field Names =====*/
/** Where the server's field errors belong in this form. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof DogFormInput> = {
  birthDate: "birthDay",
  weightKg: "weight",
};

/** Ages offered in the «حدودی می‌دونم» ("I know roughly") selects. */
export const AGE_YEAR_OPTIONS = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => index);
export const AGE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index);
