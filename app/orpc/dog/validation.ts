import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";
import { formatNumber } from "~/lib/locale-format";
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
import { m } from "~/paraglide/messages";

/*===== Messages =====*/
// Every message is a function, read when a value fails: the schema is built once at import, and a sentence built then
// would keep the language of whichever request loaded the module first (docs/i18n/english-version-plan.md, "Phase 4
// Notes"). Inside `/rpc` the request's language is the page's.

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
function optionalText({ max, message }: { max: number; message: () => string }) {
  return z
    .string()
    .trim()
    .max(max, { error: message })
    .nullish()
    .transform((value) => value || null);
}

const birthDateSchema = z
  .string()
  .transform((value) => toLatinDigits(value).trim())
  .refine(isRealDate, { error: () => m.server_dog_birth_date_invalid() })
  .refine((value) => value <= todayInTehran(), { error: () => m.server_dog_birth_date_future() })
  .refine((value) => value >= yearsAgo({ today: todayInTehran(), years: DOG_MAX_AGE_YEARS }), {
    error: () => m.server_dog_too_old({ years: formatNumber(DOG_MAX_AGE_YEARS) }),
  });

const weightSchema = z
  .number({ error: () => m.server_dog_weight_required() })
  .min(DOG_WEIGHT_MIN_KG, { error: () => m.server_dog_weight_min({ kg: formatNumber(DOG_WEIGHT_MIN_KG) }) })
  .max(DOG_WEIGHT_MAX_KG, { error: () => m.server_dog_weight_max({ kg: formatNumber(DOG_WEIGHT_MAX_KG) }) })
  // The column keeps one decimal; compare in tenths so 32.5 passes despite floating-point noise.
  .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, {
    error: () => m.server_dog_weight_decimal(),
  });

// Chip numbers are copied from a vet's paperwork, often with spaces and Persian digits.
const microchipSchema = z
  .string()
  .nullish()
  .transform((value) => toLatinDigits(value ?? "").replace(/\s+/g, ""))
  .pipe(
    z
      .string()
      .regex(/^\d*$/, { error: () => m.server_dog_microchip_digits() })
      .max(DOG_MICROCHIP_MAX_LENGTH, {
        error: () => m.server_dog_microchip_max({ max: formatNumber(DOG_MICROCHIP_MAX_LENGTH) }),
      }),
  )
  .transform((value) => value || null);

/*===== Dog =====*/
// Domain rules for a dog, for both create and update. Messages are user-facing because they surface as field errors.
export const dogInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.server_dog_name_required() })
    .max(DOG_NAME_MAX_LENGTH, { error: () => m.server_dog_name_max({ max: formatNumber(DOG_NAME_MAX_LENGTH) }) }),
  breed: optionalText({
    max: DOG_BREED_MAX_LENGTH,
    message: () => m.server_dog_breed_max({ max: formatNumber(DOG_BREED_MAX_LENGTH) }),
  }),
  sex: z.enum(DOG_SEXES, { error: () => m.server_dog_sex_required() }),
  birthDate: birthDateSchema,
  birthDateApproximate: z.boolean().optional().default(false),
  weightKg: weightSchema,
  isNeutered: z.boolean({ error: () => m.server_dog_neutered_required() }),
  microchipNumber: microchipSchema,
  vaccinationStatus: z
    .enum(VACCINATION_STATUSES, { error: () => m.server_dog_vaccination_required() })
    .optional()
    .default("unknown"),
  behaviorNotes: optionalText({
    max: DOG_NOTES_MAX_LENGTH,
    message: () => m.server_dog_behavior_notes_max({ max: formatNumber(DOG_NOTES_MAX_LENGTH) }),
  }),
  medicalNotes: optionalText({
    max: DOG_NOTES_MAX_LENGTH,
    message: () => m.server_dog_medical_notes_max({ max: formatNumber(DOG_NOTES_MAX_LENGTH) }),
  }),
  // Passed through: whether the media exists, is a dog photo and is the owner's is I/O, so the service decides.
  photoMediaId: z.string().nullish(),
});

export type DogInput = z.output<typeof dogInputSchema>;

/*===== Id =====*/
const dogIdSchema = z.guid();

/** Whether the text can be a dog id. A malformed id would make Postgres throw, so it is treated as "no such dog". */
export function isDogId(value: string): boolean {
  return dogIdSchema.safeParse(value).success;
}
