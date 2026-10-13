import { z } from "zod";

import { formatNumberFa } from "~/lib/digits";

/*===== Name =====*/
// Same limits as the profile's name form, written here because this slice does not import from a route slice. The
// Admin fixes misspelt names, so a one-letter name is accepted (the profile form asks for two).
export const USER_NAME_MAX_LENGTH = 40;

const namePart = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} را بنویس.`)
    .max(USER_NAME_MAX_LENGTH, `${label} حداکثر ${formatNumberFa(USER_NAME_MAX_LENGTH)} حرف است.`);

/** The two name parts as the service accepts them (trimmed). */
export const updateUserInputSchema = z.object({
  firstName: namePart("نام"),
  lastName: namePart("نام خانوادگی"),
});
