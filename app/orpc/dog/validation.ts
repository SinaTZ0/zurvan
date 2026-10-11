import { z } from "zod";

import { formatNumberFa, toLatinDigits } from "~/lib/digits";
import {
  DOG_BREED_MAX_LENGTH,
  DOG_MAX_AGE_YEARS,
  DOG_MICROCHIP_MAX_LENGTH,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_SEXES,
  DOG_WEIGHT_MAX_KG,
  DOG_WEIGHT_MIN_KG,
  VACCINATION_STATUSES,
} from "~/orpc/dog/constants";

/*===== Dates =====*/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Tehran as `YYYY-MM-DD`, so a dog born "today" is never in the future for the owner. */
function todayInTehran(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(new Date());
}

/** Whether the text is a real calendar date (rejects `2024-02-30`, which `Date` would roll over). */
function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** `today` minus whole years, as `YYYY-MM-DD`. A Feb 29 today becomes Feb 28 in a non-leap year. */
function yearsAgo({ today, years }: { today: string; years: number }): string {
  const [year = "", month = "", day = ""] = today.split("-");
  const date = new Date(Date.UTC(Number(year) - years, Number(month) - 1, Number(day)));
  if (date.getUTCMonth() !== Number(month) - 1) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

/*===== Fields =====*/
/** Optional free text: surrounding space goes, and empty means "not given", so it is stored as null. */
function optionalText({ max, message }: { max: number; message: string }) {
  return z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((value) => value || null);
}

const birthDateSchema = z
  .string()
  .transform((value) => toLatinDigits(value).trim())
  .refine(isRealDate, "تاریخ تولد را درست وارد کنید.")
  .refine((value) => value <= todayInTehran(), "تاریخ تولد نمی‌تواند در آینده باشد.")
  .refine(
    (value) => value >= yearsAgo({ today: todayInTehran(), years: DOG_MAX_AGE_YEARS }),
    `سن سگ حداکثر ${formatNumberFa(DOG_MAX_AGE_YEARS)} سال است.`,
  );

const weightSchema = z
  .number({ error: "وزن را وارد کنید." })
  .min(DOG_WEIGHT_MIN_KG, `وزن حداقل ${formatNumberFa(DOG_WEIGHT_MIN_KG)} کیلوگرم است.`)
  .max(DOG_WEIGHT_MAX_KG, `وزن حداکثر ${formatNumberFa(DOG_WEIGHT_MAX_KG)} کیلوگرم است.`)
  // The column keeps one decimal; compare in tenths so 32.5 passes despite floating-point noise.
  .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, "وزن را با حداکثر یک رقم اعشار وارد کنید.");

// Chip numbers are copied from a vet's paperwork, often with spaces and Persian digits.
const microchipSchema = z
  .string()
  .nullish()
  .transform((value) => toLatinDigits(value ?? "").replace(/\s+/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\d*$/, "شماره میکروچیپ فقط از رقم تشکیل می‌شود.")
      .max(DOG_MICROCHIP_MAX_LENGTH, `شماره میکروچیپ حداکثر ${formatNumberFa(DOG_MICROCHIP_MAX_LENGTH)} رقم است.`),
  )
  .transform((value) => value || null);

/*===== Dog =====*/
// Domain rules for a dog, for both create and update. Messages are user-facing because they surface as field errors.
export const dogInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "نام سگ را وارد کنید.")
    .max(DOG_NAME_MAX_LENGTH, `نام سگ حداکثر ${formatNumberFa(DOG_NAME_MAX_LENGTH)} حرف است.`),
  breed: optionalText({
    max: DOG_BREED_MAX_LENGTH,
    message: `نژاد حداکثر ${formatNumberFa(DOG_BREED_MAX_LENGTH)} حرف است.`,
  }),
  sex: z.enum(DOG_SEXES, { error: "جنسیت سگ را انتخاب کنید." }),
  birthDate: birthDateSchema,
  birthDateApproximate: z.boolean().optional().default(false),
  weightKg: weightSchema,
  isNeutered: z.boolean({ error: "وضعیت عقیم‌سازی را مشخص کنید." }),
  microchipNumber: microchipSchema,
  vaccinationStatus: z
    .enum(VACCINATION_STATUSES, { error: "وضعیت واکسن را انتخاب کنید." })
    .optional()
    .default("unknown"),
  behaviorNotes: optionalText({
    max: DOG_NOTES_MAX_LENGTH,
    message: `یادداشت رفتاری حداکثر ${formatNumberFa(DOG_NOTES_MAX_LENGTH)} حرف است.`,
  }),
  medicalNotes: optionalText({
    max: DOG_NOTES_MAX_LENGTH,
    message: `یادداشت پزشکی حداکثر ${formatNumberFa(DOG_NOTES_MAX_LENGTH)} حرف است.`,
  }),
});

export type DogInput = z.output<typeof dogInputSchema>;

/*===== Id =====*/
const dogIdSchema = z.guid();

/** Whether the text can be a dog id. A malformed id would make Postgres throw, so it is treated as "no such dog". */
export function isDogId(value: string): boolean {
  return dogIdSchema.safeParse(value).success;
}
