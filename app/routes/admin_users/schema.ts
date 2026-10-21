import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";

/*===== Name Form =====*/
// The server checks again (`app/orpc/user/validation.ts`); the two are kept apart on purpose (docs/frontend-guideline.md,
// "Forms"). The Admin fixes misspelt names, so a one-letter name is fine.
const USER_NAME_MAX_LENGTH = 40;

const namePart = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} رو بنویس.`)
    .max(USER_NAME_MAX_LENGTH, `${label} حداکثر ${formatNumberFa(USER_NAME_MAX_LENGTH)} حرف می‌تونه باشه.`);

export const userNameSchema = z.object({
  firstName: namePart("نام"),
  lastName: namePart("نام خانوادگی"),
});

export type UserNameInput = z.input<typeof userNameSchema>;
export type UserNameValues = z.output<typeof userNameSchema>;

/** Where the server's field errors belong in this form. */
export const NAME_FIELDS = ["firstName", "lastName"] as const;
