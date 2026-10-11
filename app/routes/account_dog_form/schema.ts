import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { ageFromBirthDate, birthDateFromAge } from "~/lib/dog-format";
import { isoToJalali, isValidJalali, jalaliToIso, todayIso } from "~/lib/jalali";
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

/*===== Dog Form =====*/
// Written for the person filling it in: selects hold strings, the birth date is either a Jalali date or an age, and
// the weight accepts Persian digits and either decimal mark. The server checks everything again (`app/orpc/dog/
// validation.ts`); the two are kept separate on purpose (docs/frontend-guideline.md, "Forms").

export const BIRTH_MODES = ["exact", "approximate"] as const;

const optionalText = ({ max, message }: { max: number; message: string }) => z.string().trim().max(max, message);

export const dogFormSchema = z
  .object({
    photoMediaId: z.string().nullable(),
    name: z
      .string()
      .trim()
      .min(1, "اسم سگت را بنویس.")
      .max(DOG_NAME_MAX_LENGTH, `اسم حداکثر ${formatNumberFa(DOG_NAME_MAX_LENGTH)} حرف است.`),
    breed: optionalText({
      max: DOG_BREED_MAX_LENGTH,
      message: `نژاد حداکثر ${formatNumberFa(DOG_BREED_MAX_LENGTH)} حرف است.`,
    }),
    sex: z.enum(DOG_SEXES, { error: "نر است یا ماده؟" }),
    birthMode: z.enum(BIRTH_MODES),
    birthDay: z.string(),
    birthMonth: z.string(),
    birthYear: z.string(),
    ageYears: z.string(),
    ageMonths: z.string(),
    weight: z
      .string()
      .trim()
      .min(1, "وزنش را بنویس؛ تقریبی هم کافی است.")
      // «۳۲٫۵», «32,5» and «32/5» are all how people type a decimal on a Persian keyboard.
      .transform((value) => Number(toLatinDigits(value).replace(/[٫,/]/g, ".")))
      .refine((value) => !Number.isNaN(value), "وزن را با عدد بنویس، مثلاً ۱۲٫۵.")
      .refine(
        (value) => value >= DOG_WEIGHT_MIN_KG && value <= DOG_WEIGHT_MAX_KG,
        `وزن بین ${formatNumberFa(DOG_WEIGHT_MIN_KG)} و ${formatNumberFa(DOG_WEIGHT_MAX_KG)} کیلو است.`,
      )
      .transform((value) => Math.round(value * 10) / 10),
    isNeutered: z.enum(["yes", "no"], { error: "عقیم شده یا نه؟" }),
    vaccinationStatus: z.enum(VACCINATION_STATUSES),
    microchipNumber: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/\s+/g, ""))
      .refine((value) => /^\d{0,20}$/.test(value), "شماره میکروچیپ فقط عدد است، حداکثر ۲۰ رقم."),
    behaviorNotes: optionalText({
      max: DOG_NOTES_MAX_LENGTH,
      message: `حداکثر ${formatNumberFa(DOG_NOTES_MAX_LENGTH)} حرف.`,
    }),
    medicalNotes: optionalText({
      max: DOG_NOTES_MAX_LENGTH,
      message: `حداکثر ${formatNumberFa(DOG_NOTES_MAX_LENGTH)} حرف.`,
    }),
  })
  .superRefine(
    (values, ctx) => {
      /*------ Birth Date ------*/
      if (values.birthMode === "approximate") {
        if (values.ageYears === "" || values.ageMonths === "") {
          ctx.addIssue({ code: "custom", path: ["ageYears"], message: "حدوداً چند سال و چند ماهش است؟" });
        }
        return;
      }

      if (!values.birthDay || !values.birthMonth || !values.birthYear) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "روز، ماه و سال تولد را انتخاب کن." });
        return;
      }
      const date = { year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) };
      if (!isValidJalali(date)) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "این روز در این ماه نیست." });
      } else if (jalaliToIso(date) > todayIso()) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "تاریخ تولد نمی‌تواند در آینده باشد." });
      }
    },
    // Zod skips object refinements while any field fails; the date parts are plain strings that always parse, so the
    // date is checked anyway and its message shows with the others on the first submit.
    { when: () => true },
  );

export type DogFormInput = z.input<typeof dogFormSchema>;
export type DogFormValues = z.output<typeof dogFormSchema>;

/*===== To the API =====*/
/** The values `dog.create` and `dog.update` take. */
export function toDogInput(values: DogFormValues) {
  const approximate = values.birthMode === "approximate";
  const birthDate = approximate
    ? birthDateFromAge({ years: Number(values.ageYears), months: Number(values.ageMonths) })
    : jalaliToIso({ year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) });

  return {
    photoMediaId: values.photoMediaId,
    name: values.name,
    breed: values.breed || null,
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

  const jalali = isoToJalali(dog.birthDate);
  const age = ageFromBirthDate({ birthDate: dog.birthDate });
  return {
    photoMediaId: dog.photo?.id ?? null,
    name: dog.name,
    breed: dog.breed ?? "",
    sex: dog.sex,
    birthMode: dog.birthDateApproximate ? "approximate" : "exact",
    birthDay: String(jalali.day),
    birthMonth: String(jalali.month),
    birthYear: String(jalali.year),
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

/** Ages offered in the «حدودی می‌دانم» selects. */
export const AGE_YEAR_OPTIONS = Array.from({ length: DOG_MAX_AGE_YEARS + 1 }, (_, index) => index);
export const AGE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index);
