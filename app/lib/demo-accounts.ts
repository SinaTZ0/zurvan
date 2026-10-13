import type { UserRole } from "~/lib/user-constants";

/*===== Demo Accounts =====*/
// One account per role for the owner's showcase, created by `npm run db:seed:demo`. In showcase mode the sign-in page
// lists them, and each signs in with the showcase code. Browser-safe: the page reads this list directly.
export const DEMO_ACCOUNTS: {
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  /** What the owner will find behind this account, shown next to the number. */
  note: string;
}[] = [
  { phoneNumber: "09120000001", role: "admin", firstName: "آرمان", lastName: "رستمی", note: "مدیر سایت و مربی ارشد" },
  { phoneNumber: "09120000003", role: "partner", firstName: "بهرام", lastName: "کاظمی", note: "پت‌شاپ همکار" },
  { phoneNumber: "09120000007", role: "partner", firstName: "نیلوفر", lastName: "صادقی", note: "کلینیک همکار" },
  { phoneNumber: "09120000004", role: "customer", firstName: "سارا", lastName: "محمدی", note: "مشتری با دو سگ" },
  { phoneNumber: "09120000005", role: "customer", firstName: "علی", lastName: "نوری", note: "مشتری تازه، بدون سگ" },
  {
    phoneNumber: "09120000006",
    role: "customer",
    firstName: "مریم",
    lastName: "احمدی",
    note: "مشتری با ارزیابی امروز",
  },
];

/** Whether a number belongs to a demo account. */
export function isDemoPhoneNumber(phoneNumber: string): boolean {
  return DEMO_ACCOUNTS.some((account) => account.phoneNumber === phoneNumber);
}
