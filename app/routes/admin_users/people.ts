import { toPersianDigits } from "~/lib/digits";
import type { AdminUser } from "~/orpc/user/contract";

/*===== Nameless People =====*/
/**
 * A person who signed up with a number and never wrote a name (many of them are smoke-test customers). The API's
 * `name` falls back to the raw number for them, so the roll reads «بی‌نام» instead of showing the number twice.
 */
export function isNameless(user: Pick<AdminUser, "firstName" | "lastName">): boolean {
  return user.firstName.trim() === "" && user.lastName.trim() === "";
}

/**
 * How a toast or a screen reader names the person: the name, or for a nameless one the number in Persian digits
 * («۰۹۱۲… مسدود شد» says who, «بی‌نام مسدود شد» wouldn't).
 */
export function spokenName(user: Pick<AdminUser, "name" | "firstName" | "lastName" | "phoneNumber">): string {
  if (!isNameless(user)) return user.name;
  return user.phoneNumber === null ? "این کاربر" : toPersianDigits(user.phoneNumber);
}
