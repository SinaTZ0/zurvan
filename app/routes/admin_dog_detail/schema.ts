import type { DefaultValues } from "react-hook-form";
import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import { isoToJalali, isValidJalali, jalaliToIso, todayIso } from "~/lib/jalali";
import { normalizeForSearch } from "~/lib/search";
import {
  DOG_BEHAVIOR_PROBLEM_MAX_LENGTH,
  DOG_BREED_MAX_LENGTH,
  DOG_BREED_PURITIES,
  DOG_COAT_COLOR_MAX_LENGTH,
  DOG_HEIGHT_MAX_CM,
  DOG_HEIGHT_MIN_CM,
  DOG_MARKINGS_MAX_LENGTH,
  DOG_MAX_BEHAVIOR_PROBLEMS,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_SEXES,
  DOG_TRAINING_GOALS,
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

/** The breed type's pills: the three types, and «ثبت نشده» for an old dog whose type was never asked. */
export const BREED_PURITY_UNSET = "unset";

/** The behavior problems textarea's lines, one problem each: blanks go, a repeated line is one problem (like the server). */
export function splitProblems(text: string): string[] {
  return [
    ...new Set(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    ),
  ];
}

export const dogEditSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "اسم سگ رو بنویس.")
      .max(DOG_NAME_MAX_LENGTH, `اسم حداکثر ${formatNumberFa(DOG_NAME_MAX_LENGTH)} حرفه.`),
    breedPurity: z.enum([...DOG_BREED_PURITIES, BREED_PURITY_UNSET]),
    breed: optionalText({
      max: DOG_BREED_MAX_LENGTH,
      message: `نژاد حداکثر ${formatNumberFa(DOG_BREED_MAX_LENGTH)} حرفه.`,
    }),
    breedSecondary: optionalText({
      max: DOG_BREED_MAX_LENGTH,
      message: `نژاد حداکثر ${formatNumberFa(DOG_BREED_MAX_LENGTH)} حرفه.`,
    }),
    trainingGoals: z.array(z.enum(DOG_TRAINING_GOALS)),
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
    // Optional; whole centimetres, typed with any digits.
    height: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : Number(toLatinDigits(value))))
      .refine(
        (value) =>
          value === null || (Number.isInteger(value) && value >= DOG_HEIGHT_MIN_CM && value <= DOG_HEIGHT_MAX_CM),
        `قد رو با عدد صحیح بنویس، بین ${formatNumberFa(DOG_HEIGHT_MIN_CM)} و ${formatNumberFa(DOG_HEIGHT_MAX_CM)} سانتی‌متر.`,
      ),
    coatColor: optionalText({
      max: DOG_COAT_COLOR_MAX_LENGTH,
      message: `رنگ پوشش حداکثر ${formatNumberFa(DOG_COAT_COLOR_MAX_LENGTH)} حرفه.`,
    }),
    markings: optionalText({
      max: DOG_MARKINGS_MAX_LENGTH,
      message: `علائم ظاهری حداکثر ${formatNumberFa(DOG_MARKINGS_MAX_LENGTH)} حرفه.`,
    }),
    vaccinationStatus: z.enum(VACCINATION_STATUSES),
    microchipNumber: z
      .string()
      .transform((value) => toLatinDigits(value).replace(/\s+/g, ""))
      .refine((value) => /^\d{0,20}$/.test(value), "شماره‌ی میکروچیپ فقط عدده، حداکثر ۲۰ رقم."),
    // Optional, three Jalali parts that are all filled or all empty.
    implantDay: z.string(),
    implantMonth: z.string(),
    implantYear: z.string(),
    vaccinationNotes: optionalText({
      max: DOG_NOTES_MAX_LENGTH,
      message: `توضیح واکسن‌ها حداکثر ${formatNumberFa(DOG_NOTES_MAX_LENGTH)} حرفه.`,
    }),
    behaviorProblems: z.string().superRefine((text, ctx) => {
      const problems = splitProblems(text);
      if (problems.length > DOG_MAX_BEHAVIOR_PROBLEMS) {
        ctx.addIssue({ code: "custom", message: `حداکثر ${formatNumberFa(DOG_MAX_BEHAVIOR_PROBLEMS)} مورد.` });
      } else if (problems.some((problem) => problem.length > DOG_BEHAVIOR_PROBLEM_MAX_LENGTH)) {
        ctx.addIssue({
          code: "custom",
          message: `هر مورد حداکثر ${formatNumberFa(DOG_BEHAVIOR_PROBLEM_MAX_LENGTH)} حرفه.`,
        });
      }
    }),
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
      let birthIso: string | null = null;
      if (!values.birthDay || !values.birthMonth || !values.birthYear) {
        ctx.addIssue({ code: "custom", path: ["birthDay"], message: "روز، ماه و سال تولد رو انتخاب کن." });
      } else {
        const date = {
          year: Number(values.birthYear),
          month: Number(values.birthMonth),
          day: Number(values.birthDay),
        };
        if (!isValidJalali(date)) {
          ctx.addIssue({ code: "custom", path: ["birthDay"], message: "این ماه این روز رو نداره." });
        } else if (jalaliToIso(date) > todayIso()) {
          ctx.addIssue({ code: "custom", path: ["birthDay"], message: "تاریخ تولد نمی‌تونه توی آینده باشه." });
        } else {
          birthIso = jalaliToIso(date);
        }
      }

      /*------ Breeds ------*/
      // The same rules as the server's: the breed inputs follow the breed type. «ثبت نشده» (an old dog) asks nothing.
      const { breedPurity, breed, breedSecondary } = values;
      if ((breedPurity === "purebred" || breedPurity === "cross") && !breed) {
        ctx.addIssue({ code: "custom", path: ["breed"], message: "نژاد رو بنویس." });
      }
      if (breedPurity === "cross") {
        if (!breedSecondary) {
          ctx.addIssue({ code: "custom", path: ["breedSecondary"], message: "نژاد والد دوم رو بنویس." });
        } else if (breed && normalizeForSearch(breed) === normalizeForSearch(breedSecondary)) {
          ctx.addIssue({ code: "custom", path: ["breedSecondary"], message: "نژاد دو والد نباید یکی باشه." });
        }
      }

      /*------ Microchip Implant Date ------*/
      const parts = [values.implantDay, values.implantMonth, values.implantYear];
      if (parts.some(Boolean)) {
        const date = {
          year: Number(values.implantYear),
          month: Number(values.implantMonth),
          day: Number(values.implantDay),
        };
        if (!parts.every(Boolean)) {
          ctx.addIssue({
            code: "custom",
            path: ["implantDay"],
            message: "روز، ماه و سال رو کامل انتخاب کن، یا همه رو خالی بذار.",
          });
        } else if (!isValidJalali(date)) {
          ctx.addIssue({ code: "custom", path: ["implantDay"], message: "این ماه این روز رو نداره." });
        } else if (jalaliToIso(date) > todayIso()) {
          ctx.addIssue({ code: "custom", path: ["implantDay"], message: "تاریخ کاشت نمی‌تونه توی آینده باشه." });
        } else if (birthIso && !values.birthDateApproximate && jalaliToIso(date) < birthIso) {
          // An estimated birth date may fall after the real day, so only an exact one is held to this.
          ctx.addIssue({ code: "custom", path: ["implantDay"], message: "تاریخ کاشت نمی‌تونه پیش از تولد باشه." });
        }
      }
    },
    // Zod skips object refinements while any field fails; the date parts are plain strings that always parse, so the
    // dates and breeds are checked anyway and their messages show with the others on the first submit.
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
    // Every one of these is sent on every save: a text field left out is cleared, and the server nulls the second breed
    // unless the dog is a cross. «ثبت نشده» (an old dog) sends no type.
    breedPurity: values.breedPurity === BREED_PURITY_UNSET ? null : values.breedPurity,
    breed: values.breed || null,
    breedSecondary: values.breedPurity === "cross" ? values.breedSecondary || null : null,
    sex: values.sex,
    birthDate: jalaliToIso({
      year: Number(values.birthYear),
      month: Number(values.birthMonth),
      day: Number(values.birthDay),
    }),
    birthDateApproximate: values.birthDateApproximate,
    weightKg: values.weight,
    isNeutered: values.isNeutered === "yes",
    heightCm: values.height,
    coatColor: values.coatColor || null,
    markings: values.markings || null,
    vaccinationStatus: values.vaccinationStatus,
    vaccinationNotes: values.vaccinationNotes || null,
    microchipNumber: values.microchipNumber || null,
    microchipImplantedOn: values.implantYear
      ? jalaliToIso({
          year: Number(values.implantYear),
          month: Number(values.implantMonth),
          day: Number(values.implantDay),
        })
      : null,
    // Lists are replaced, never kept, so what the Admin sees in the sheet is exactly what is stored.
    trainingGoals: values.trainingGoals,
    behaviorProblems: splitProblems(values.behaviorProblems),
    behaviorNotes: values.behaviorNotes || null,
    medicalNotes: values.medicalNotes || null,
  };
}

/*===== From a Dog =====*/
/** The form's starting values: the dog's own. */
export function toFormDefaults(dog: AdminDog): DefaultValues<DogEditInput> {
  const jalali = isoToJalali(dog.birthDate);
  const implant = dog.microchipImplantedOn ? isoToJalali(dog.microchipImplantedOn) : null;
  return {
    name: dog.name,
    breedPurity: dog.breedPurity ?? BREED_PURITY_UNSET,
    breed: dog.breed ?? "",
    breedSecondary: dog.breedSecondary ?? "",
    trainingGoals: dog.trainingGoals,
    height: dog.heightCm === null ? "" : String(dog.heightCm),
    coatColor: dog.coatColor ?? "",
    markings: dog.markings ?? "",
    implantDay: implant ? String(implant.day) : "",
    implantMonth: implant ? String(implant.month) : "",
    implantYear: implant ? String(implant.year) : "",
    vaccinationNotes: dog.vaccinationNotes ?? "",
    behaviorProblems: dog.behaviorProblems.join("\n"),
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
  heightCm: "height",
  microchipImplantedOn: "implantDay",
};

/** The server field names that are form field names too. */
export const SAME_NAME_FIELDS = new Set<string>([
  "name",
  "breedPurity",
  "breed",
  "breedSecondary",
  "sex",
  "isNeutered",
  "vaccinationStatus",
  "microchipNumber",
  "behaviorNotes",
  "medicalNotes",
  "birthDateApproximate",
  "coatColor",
  "markings",
  "vaccinationNotes",
  "trainingGoals",
  "behaviorProblems",
]);

/**
 * The form field a server error key belongs to, or null when the form has none. A list's item errors come as
 * `behaviorProblems.3` (dotted path), which belong to the list's one textarea.
 */
export function serverFieldToForm(field: string): keyof DogEditInput | null {
  const root = field.split(".")[0] ?? field;
  const mapped = SERVER_FIELD_TO_FORM[root];
  if (mapped) return mapped;
  return SAME_NAME_FIELDS.has(root) ? (root as keyof DogEditInput) : null;
}
