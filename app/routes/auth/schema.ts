import { z } from "zod";

import { normalizePhoneNumber } from "~/lib/phone";
import { SIGN_IN_CODE_LENGTH } from "~/lib/user-constants";

/*===== Phone =====*/
// Typed however the person likes (Persian digits, +98, spaces); sent normalized as `09xxxxxxxxx`.
export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, "شماره موبایلت را بنویس.")
    .transform((value, ctx) => {
      const normalized = normalizePhoneNumber(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: "شماره موبایل درست نیست. مثال درست: ۰۹۱۲۳۴۵۶۷۸۹" });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type PhoneInput = z.input<typeof phoneSchema>;
export type PhoneValues = z.output<typeof phoneSchema>;

/*===== Code =====*/
export const codeSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${SIGN_IN_CODE_LENGTH}}$`), "کد پنج‌رقمی پیامک را کامل بنویس."),
});

export type CodeValues = z.infer<typeof codeSchema>;

/*===== Name =====*/
// Asked once, after a new number is verified. Used in greetings ("سلام سارا").
const namePart = (missing: string) => z.string().trim().min(2, missing).max(40, "حداکثر ۴۰ حرف.");

export const nameSchema = z.object({
  firstName: namePart("اسمت را بنویس."),
  lastName: namePart("نام خانوادگی‌ات را بنویس."),
});

export type NameValues = z.infer<typeof nameSchema>;
