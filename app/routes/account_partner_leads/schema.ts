import { z } from "zod";

import { normalizePhoneNumber } from "~/lib/phone";
import { m } from "~/paraglide/messages";

/*===== Add Lead =====*/
// The message says what the server answers with for a bad number (`server_partner_phone_invalid`), so a typo is caught
// before the request and reads the same either way. It is read when validation runs, never at import, so it follows the
// page's language. The server stays the authority: it also knows who already has an account.

export const addLeadFormSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .refine((value) => normalizePhoneNumber(value) !== null, {
      error: () => m.account_partner_leads_form_phone_invalid(),
    }),
});

export type AddLeadFormValues = z.infer<typeof addLeadFormSchema>;
