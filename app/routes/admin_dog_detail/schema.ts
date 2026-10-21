import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { isoToJalali, isValidJalali, jalaliToIso, todayIso } from "~/lib/jalali";
import {
  DOG_BREED_MAX_LENGTH,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_SEXES,
  DOG_WEIGHT_MAX_KG,
  DOG_WEIGHT_MIN_KG,
  VACCINATION_STATUSES,
} from "~/orpc/dog/constants";
import type { AdminDog } from "~/orpc/dog/contract";

/*===== Edit Form =====*/
// Written for the person filling it in: selects hold strings, the birth date is three Jalali parts, and the weight
// accepts Persian digits and either decimal mark. The server checks everything again (`app/orpc/dog/validation.ts`);
// the two are kept separate on purpose (docs/frontend-guideline.md, "Forms"). Unlike the customer's form there is no
// «حدودی» age mode: the Admin types a date and says «تاریخ تقریبی است» with a checkbox.

const optionalText = ({ max, message }: { max: number; message: string }) => z.string().trim().max(max, message);

export const dogEditSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "اسم سگ رو بنویس.")
      .max(DOG_NAME_MAX_LENGTH, `اسم حداکثر ${formatNumberFa(DOG_NAME_MAX_LENGTH)} حرفه.`),
    breed: optionalText({
      max: DOG_BREED_MAX_LENGTH,
      message: `نژاد حداکثر ${formatNumberFa(DOG_BREED_MAX_LENGTH)} حرفه.`,
    }),
    sex: z.enum(DOG_SEXES, { error: "جنس رو انتخاب کن." }),
    birthDay: z.string(),
    birthMonth: z.string(),
    birthYear: z.string(),
    birthDateApproximate: z.boolean(),
    weight: z
      .string()
      .trim()
      .min(1, "وزن رو بنویس.")
      // «۳۲٫۵», «32,5» and «32/5» are all how people type a decimal on a Persian keyboard.
      .transform((value) => Number(toLatinDigits(value).replace(/[٫,/]/g, ".")))
      .refine((value) => !Number.isNaN(value), "وزن رو با عدد بنویس، مثلاً ۱۲٫۵.")
      .refine(
        (value) => value >= DOG_WEIGHT_MIN_KG && value <= DOG_WEIGHT_MAX_KG,
        `وزن باید بین ${formatNumberFa(DOG_WEIGHT_MIN_KG)} و ${formatNumberFa(DOG_WEIGHT_MAX_KG)} کیلو باشه.`,
      )
      .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, "وزن حداکثر یه رقم اعشار داره.")
      .transform((value) => Math.round(value * 10) / 10),
    isNeutered: z.enum(["yes", "no"], { error: "عقیم‌شده یا نه؟" }),
    vaccinationStatus: z.enum(VACCINATION_STATUSES),
    microchipNumber: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/\s+/g, ""))
      .refine((value) => /^\d{0,20}$/.test(value), "شماره‌ی میکروچیپ فقط عدده، حداکثر ۲۰ رقم."),
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
      if (!values.birthDay || !values.birthMonth || !values.birthYear) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "روز، ماه و سال تولد رو انتخاب کن." });
        return;
      }
      const date = { year: Number(values.birthYear), month: Number(values.birthMonth), day: Number(values.birthDay) };
      if (!isValidJalali(date)) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "این ماه این روز رو نداره." });
      } else if (jalaliToIso(date) > todayIso()) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "تاریخ تولد نمی‌تونه توی آینده باشه." });
      }
    },
    // Zod skips object refinements while any field fails; the date parts are plain strings that always parse, so the
    // date is checked anyway and its message shows with the others on the first submit.
    { when: () => true },
  );

export type DogEditInput = z.input<typeof dogEditSchema>;
export type DogEditValues = z.output<typeof dogEditSchema>;

/*===== To the API =====*/
/**
 * The input of `dog.admin.update`. Everything the form shows is sent: the Admin may change the breed and birth date
 * even after the dog is evaluated, so nothing is sent back "as stored" (unlike the customer's form). The photo is
 * not part of it; only the owner changes that.
 */
export function toAdminUpdateInput({ values, dogId }: { values: DogEditValues; dogId: string }) {
  return {
    id: dogId,
    name: values.name,
    breed: values.breed || null,
    sex: values.sex,
    birthDate: jalaliToIso({
      year: Number(values.birthYear),
      month: Number(values.birthMonth),
      day: Number(values.birthDay),
    }),
    birthDateApproximate: values.birthDateApproximate,
    weightKg: values.weight,
    isNeutered: values.isNeutered === "yes",
    vaccinationStatus: values.vaccinationStatus,
    microchipNumber: values.microchipNumber || null,
    behaviorNotes: values.behaviorNotes || null,
    medicalNotes: values.medicalNotes || null,
  };
}

/*===== From a Dog =====*/
/** The form's starting values: the dog's own. */
export function toFormDefaults(dog: AdminDog): DefaultValues<DogEditInput> {
  const jalali = isoToJalali(dog.birthDate);
  return {
    name: dog.name,
    breed: dog.breed ?? "",
    sex: dog.sex,
    birthDay: String(jalali.day),
    birthMonth: String(jalali.month),
    birthYear: String(jalali.year),
    birthDateApproximate: dog.birthDateApproximate,
    weight: String(dog.weightKg),
    isNeutered: dog.isNeutered ? "yes" : "no",
    vaccinationStatus: dog.vaccinationStatus,
    microchipNumber: dog.microchipNumber ?? "",
    behaviorNotes: dog.behaviorNotes ?? "",
    medicalNotes: dog.medicalNotes ?? "",
  };
}

/*===== Server Field Names =====*/
/** Where the server's field errors belong in this form; a name not listed here but also a form field maps to itself. */
export const SERVER_FIELD_TO_FORM: Record<string, keyof DogEditInput> = {
  birthDate: "birthDay",
  weightKg: "weight",
};

/** The server field names that are form field names too. */
export const SAME_NAME_FIELDS = new Set<string>([
  "name",
  "breed",
  "sex",
  "isNeutered",
  "vaccinationStatus",
  "microchipNumber",
  "behaviorNotes",
  "medicalNotes",
  "birthDateApproximate",
]);
