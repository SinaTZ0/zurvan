import { z } from "zod";

import { normalizePhoneNumber } from "~/lib/phone";

/*===== Add Lead =====*/
// The same sentence the server answers with for a bad number (`PHONE_NUMBER_MESSAGE`), so a typo is caught before the
// request and reads the same either way. The server stays the authority: it also knows who already has an account.
const PHONE_MESSAGE = "شماره‌ی موبایل درست نیست؛ مثل ۰۹۱۲۳۴۵۶۷۸۹ بنویس.";

export const addLeadFormSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => normalizePhoneNumber(value) !== null, PHONE_MESSAGE),
});

export type AddLeadFormValues = z.infer<typeof addLeadFormSchema>;
