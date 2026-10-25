import { z } from "zod";

import { toLatinDigits } from "~/lib/digits";
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
  DOG_MICROCHIP_MAX_LENGTH,
  DOG_NAME_MAX_LENGTH,
  DOG_NOTES_MAX_LENGTH,
  DOG_RECORD_PHOTO_LIMITS,
  DOG_SEXES,
  DOG_TRAINING_GOALS,
  DOG_WEIGHT_MAX_KG,
  DOG_WEIGHT_MIN_KG,
  VACCINATION_STATUSES,
  type DogRecordPhotoPurpose,
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

const heightSchema = z
  .number()
  .int({ error: heightRangeMessage })
  .min(DOG_HEIGHT_MIN_CM, { error: heightRangeMessage })
  .max(DOG_HEIGHT_MAX_CM, { error: heightRangeMessage })
  .nullish()
  .transform((value) => value ?? null);

function heightRangeMessage(): string {
  return m.server_dog_height_range({ min: formatNumber(DOG_HEIGHT_MIN_CM), max: formatNumber(DOG_HEIGHT_MAX_CM) });
}

/** Optional, so an empty input is "not given"; otherwise a real date that isn't in the future. */
const microchipDateSchema = z
  .string()
  .nullish()
  .transform((value) => toLatinDigits(value ?? "").trim() || null)
  .refine((value) => value === null || isRealDate(value), { error: () => m.server_dog_microchip_date_invalid() })
  .refine((value) => value === null || value <= todayInTehran(), {
    error: () => m.server_dog_microchip_date_future(),
  });

// Left out keeps what is stored (the column is not written), the same as the photo.
const trainingGoalsSchema = z
  .array(z.enum(DOG_TRAINING_GOALS, { error: () => m.server_dog_goal_invalid() }))
  .transform((goals) => [...new Set(goals)])
  .optional();

// One problem per line of a textarea, like the diary's exercises (`app/orpc/logbook/validation.ts`): blank lines are what
// a textarea leaves behind, and a repeated line is one problem. Left out keeps what is stored.
const behaviorProblemsSchema = z
  .array(
    z
      .string()
      .trim()
      .max(DOG_BEHAVIOR_PROBLEM_MAX_LENGTH, {
        error: () => m.server_dog_problem_max({ max: formatNumber(DOG_BEHAVIOR_PROBLEM_MAX_LENGTH) }),
      }),
  )
  .transform((lines) => [...new Set(lines.filter((line) => line !== ""))])
  .refine((lines) => lines.length <= DOG_MAX_BEHAVIOR_PROBLEMS, {
    error: () => m.server_dog_problems_max({ max: formatNumber(DOG_MAX_BEHAVIOR_PROBLEMS) }),
  })
  .optional();

/**
 * The IDs of images uploaded with `media.upload` (kind `record`) for one purpose, in the owner's order. Passed through
 * otherwise: whether each is the owner's upload is I/O, so the service decides. Left out keeps the stored photos; an
 * empty list removes them.
 */
function recordPhotoIdsSchema(purpose: DogRecordPhotoPurpose) {
  const max = DOG_RECORD_PHOTO_LIMITS[purpose];
  return z
    .array(z.string())
    .transform((ids) => [...new Set(ids)])
    .pipe(z.array(z.string()).max(max, { error: () => m.server_dog_record_photos_max({ max: formatNumber(max) }) }))
    .optional();
}

/*===== Dog =====*/
// Domain rules for a dog, for both create and update. Messages are user-facing because they surface as field errors.
// The fields come first and the rules across fields after, so the Admin's schema can leave the photos out (`omit` is
// not allowed on a schema with refinements).
const dogFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.server_dog_name_required() })
    .max(DOG_NAME_MAX_LENGTH, { error: () => m.server_dog_name_max({ max: formatNumber(DOG_NAME_MAX_LENGTH) }) }),
  // Required for the customer while the breed isn't locked; the service decides, since it knows the dog (F2).
  breedPurity: z
    .enum(DOG_BREED_PURITIES, { error: () => m.server_dog_purity_required() })
    .nullish()
    .transform((value) => value ?? null),
  breed: optionalText({
    max: DOG_BREED_MAX_LENGTH,
    message: () => m.server_dog_breed_max({ max: formatNumber(DOG_BREED_MAX_LENGTH) }),
  }),
  breedSecondary: optionalText({
    max: DOG_BREED_MAX_LENGTH,
    message: () => m.server_dog_breed_max({ max: formatNumber(DOG_BREED_MAX_LENGTH) }),
  }),
  sex: z.enum(DOG_SEXES, { error: () => m.server_dog_sex_required() }),
  birthDate: birthDateSchema,
  birthDateApproximate: z.boolean().optional().default(false),
  weightKg: weightSchema,
  isNeutered: z.boolean({ error: () => m.server_dog_neutered_required() }),
  heightCm: heightSchema,
  coatColor: optionalText({
    max: DOG_COAT_COLOR_MAX_LENGTH,
    message: () => m.server_dog_coat_color_max({ max: formatNumber(DOG_COAT_COLOR_MAX_LENGTH) }),
  }),
  markings: optionalText({
    max: DOG_MARKINGS_MAX_LENGTH,
    message: () => m.server_dog_markings_max({ max: formatNumber(DOG_MARKINGS_MAX_LENGTH) }),
  }),
  microchipNumber: microchipSchema,
  microchipImplantedOn: microchipDateSchema,
  vaccinationStatus: z
    .enum(VACCINATION_STATUSES, { error: () => m.server_dog_vaccination_required() })
    .optional()
    .default("unknown"),
  vaccinationNotes: optionalText({
    max: DOG_NOTES_MAX_LENGTH,
    message: () => m.server_dog_vaccination_notes_max({ max: formatNumber(DOG_NOTES_MAX_LENGTH) }),
  }),
  trainingGoals: trainingGoalsSchema,
  behaviorProblems: behaviorProblemsSchema,
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
  vaccinationPhotoIds: recordPhotoIdsSchema("vaccination"),
  medicalPhotoIds: recordPhotoIdsSchema("medical"),
  tattooPhotoIds: recordPhotoIdsSchema("tattoo"),
});

type DogRuleFields = {
  breedPurity: string | null;
  breed: string | null;
  breedSecondary: string | null;
  birthDate: string;
  birthDateApproximate: boolean;
  microchipImplantedOn: string | null;
};

/**
 * The rules across fields, as one transform so the stored values follow them:
 *
 * - The breed inputs follow the purity (F2): a purebred needs its breed; a cross needs both parents' breeds, and two
 *   different ones; a mixed dog's breed (what it looks like) is optional. Only a cross keeps `breedSecondary`. A dog
 *   with no purity (written before it was asked) keeps its breed as it is.
 * - A chip isn't implanted before the dog is born. Only checked against a birth date the owner knows: an estimated
 *   one may fall after the real day.
 */
function withDogRules<Schema extends z.ZodType<DogRuleFields>>(schema: Schema) {
  return schema.transform((dog, context) => {
    const breedSecondary = dog.breedPurity === "cross" ? dog.breedSecondary : null;

    if ((dog.breedPurity === "purebred" || dog.breedPurity === "cross") && !dog.breed) {
      context.addIssue({ code: "custom", path: ["breed"], message: m.server_dog_breed_required() });
    }
    if (dog.breedPurity === "cross") {
      if (!breedSecondary) {
        context.addIssue({
          code: "custom",
          path: ["breedSecondary"],
          message: m.server_dog_breed_secondary_required(),
        });
      } else if (dog.breed && normalizeForSearch(dog.breed) === normalizeForSearch(breedSecondary)) {
        context.addIssue({ code: "custom", path: ["breedSecondary"], message: m.server_dog_breed_secondary_same() });
      }
    }

    if (dog.microchipImplantedOn && !dog.birthDateApproximate && dog.microchipImplantedOn < dog.birthDate) {
      context.addIssue({
        code: "custom",
        path: ["microchipImplantedOn"],
        message: m.server_dog_microchip_date_before_birth(),
      });
    }

    return { ...dog, breedSecondary };
  });
}

export const dogInputSchema = withDogRules(dogFieldsSchema);

export type DogInput = z.output<typeof dogInputSchema>;

/** The Admin's: every detail of any dog, the locked ones included, and none of its photos (the owner's uploads). */
export const adminDogInputSchema = withDogRules(
  dogFieldsSchema.omit({ photoMediaId: true, vaccinationPhotoIds: true, medicalPhotoIds: true, tattooPhotoIds: true }),
);

/*===== Id =====*/
const dogIdSchema = z.guid();

/** Whether the text can be a dog id. A malformed id would make Postgres throw, so it is treated as "no such dog". */
export function isDogId(value: string): boolean {
  return dogIdSchema.safeParse(value).success;
}
