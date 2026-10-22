import { z } from "zod";

import { normalizePhoneNumber } from "~/lib/phone";
import { SIGN_IN_CODE_LENGTH } from "~/lib/user-constants";
import { m } from "~/paraglide/messages";

/*===== Phone =====*/
// Typed however the person likes (Persian digits, +98, spaces); sent normalized as `09xxxxxxxxx`. Messages are functions
// (`error: () => …`) so they are worded in the page's language when a field is checked, never frozen at import.
export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, { error: () => m.auth_phone_required() })
    .transform((value, ctx) => {
      const normalized = normalizePhoneNumber(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: m.auth_phone_invalid() });
        return z.NEVER;
      }
      return normalized;
    }),
});

export type PhoneInput = z.input<typeof phoneSchema>;
export type PhoneValues = z.output<typeof phoneSchema>;

/*===== Password =====*/
// Only "was something typed": whether it is right is the server's to say, and it answers the same for a wrong password
// and an unknown number. The strength rules apply when a password is set, not when it is used.
export const passwordSchema = z.object({
  password: z.string().min(1, { error: () => m.auth_password_required() }),
});

export type PasswordValues = z.infer<typeof passwordSchema>;

/*===== Code =====*/
export const codeSchema = z.object({
  code: z.string().regex(new RegExp(`^\\d{${SIGN_IN_CODE_LENGTH}}$`), { error: () => m.auth_code_incomplete() }),
});

export type CodeValues = z.infer<typeof codeSchema>;

/*===== Name =====*/
// Asked once, after a new number is verified. Used in greetings ("سلام سارا").
const namePart = (missing: () => string) =>
  z
    .string()
    .trim()
    .min(2, { error: missing })
    .max(40, { error: () => m.auth_name_too_long() });

export const nameSchema = z.object({
  firstName: namePart(() => m.auth_first_name_required()),
  lastName: namePart(() => m.auth_last_name_required()),
});

export type NameValues = z.infer<typeof nameSchema>;
