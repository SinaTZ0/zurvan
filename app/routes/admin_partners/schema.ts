import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";
import { normalizePhoneNumber } from "~/lib/phone";

/*===== Constants =====*/
const NAME_MAX_LENGTH = 40;

/** Same shape as the server's check (`app/orpc/partner/validation.ts`); kept apart on purpose (docs/frontend-guideline.md). */
const CODE_PATTERN = /^[a-z0-9-]{3,32}$/;

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} را بنویس.`)
    .max(NAME_MAX_LENGTH, `${label} حداکثر ${formatNumberFa(NAME_MAX_LENGTH)} حرف است.`);

/*===== Create Form =====*/
// Written for the person filling it in. The phone accepts Persian digits and `+98` (the server normalizes again); the
// code is checked as typed, because an uppercase code is refused rather than silently lowercased: it is matched
// case-sensitively and printed on a shop's card and QR.
export const createPartnerSchema = z.object({
  firstName: nameField("نام"),
  lastName: nameField("نام خانوادگی"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "شماره‌ی موبایل را بنویس.")
    .refine((value) => normalizePhoneNumber(value) !== null, "شماره‌ی موبایل درست نیست؛ مثل ۰۹۱۲۳۴۵۶۷۸۹ بنویس."),
  code: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || CODE_PATTERN.test(value),
      "کد فقط از حرف کوچک انگلیسی، رقم و خط تیره ساخته می‌شود و ۳ تا ۳۲ نویسه است.",
    ),
});

export type CreatePartnerInput = z.input<typeof createPartnerSchema>;
export type CreatePartnerValues = z.output<typeof createPartnerSchema>;

/** The form's fields that the server can also name in `data.fields`. */
export const CREATE_FIELD_NAMES = ["firstName", "lastName", "phoneNumber", "code"] as const;
