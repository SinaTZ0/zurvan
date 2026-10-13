import { oc } from "@orpc/contract";
import { z } from "zod";

import { commonErrors } from "~/orpc/errors";
import { authErrors, roleErrors } from "~/orpc/middleware/auth/auth.errors";
import { SMS_KINDS } from "~/orpc/sms/constants";

/*===== Schemas =====*/
export const smsMessageSchema = z.object({
  id: z.string(),
  phoneNumber: z.string(),
  kind: z.enum(SMS_KINDS),
  body: z.string(),
  createdAt: z.date(),
});

export type SmsMessage = z.infer<typeof smsMessageSchema>;

export const smsListSchema = z.object({
  /** Newest first, one page. */
  items: z.array(smsMessageSchema),
  /** Messages matching the kind filter. */
  total: z.number().int(),
  /** Messages per kind, ignoring the filter, so the pills keep their counts. Kinds with no rows are absent. */
  kindCounts: z.partialRecord(z.enum(SMS_KINDS), z.number().int()),
});

export type SmsList = z.infer<typeof smsListSchema>;

/*===== Procedures =====*/
/**
 * The outbox grows with every sign-in code, so it is paged on the server (the one Admin list that is). `page` is
 * 0-based; one past the end returns no items and the real `total`. Rows whose kind is not in `SMS_KINDS` are skipped.
 */
export const adminListSmsContract = oc
  .errors({ ...commonErrors, ...authErrors, ...roleErrors })
  .input(z.strictObject({ kind: z.enum(SMS_KINDS).optional(), page: z.number().int().min(0).default(0) }))
  .output(smsListSchema);

export const smsContract = {
  admin: {
    list: adminListSmsContract,
  },
};
