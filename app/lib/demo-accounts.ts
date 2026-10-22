import type { UserRole } from "~/lib/user-constants";
import { m } from "~/paraglide/messages";

/*===== Demo Accounts =====*/
// One account per role for the owner's showcase, created by `npm run db:seed:demo`. In showcase mode the sign-in page
// lists them, and each signs in with the showcase code. Browser-safe: the page reads this list directly. The names are
// the accounts' own (seeded in Persian, so they stay Persian on the English page); each `note` is a getter, so it is
// worded in the page's language when read, never frozen at import.
export const DEMO_ACCOUNTS: {
  phoneNumber: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  /** What the owner will find behind this account, shown next to the number. */
  note: string;
}[] = [
  {
    phoneNumber: "09120000001",
    role: "admin",
    firstName: "طلا",
    lastName: "راستی",
    get note() {
      return m.shared_demo_note_admin();
    },
  },
  {
    phoneNumber: "09120000003",
    role: "partner",
    firstName: "بهرام",
    lastName: "کاظمی",
    get note() {
      return m.shared_demo_note_pet_shop();
    },
  },
  {
    phoneNumber: "09120000007",
    role: "partner",
    firstName: "نیلوفر",
    lastName: "صادقی",
    get note() {
      return m.shared_demo_note_clinic();
    },
  },
  {
    phoneNumber: "09120000004",
    role: "customer",
    firstName: "سارا",
    lastName: "محمدی",
    get note() {
      return m.shared_demo_note_two_dogs();
    },
  },
  {
    phoneNumber: "09120000005",
    role: "customer",
    firstName: "علی",
    lastName: "نوری",
    get note() {
      return m.shared_demo_note_new();
    },
  },
  {
    phoneNumber: "09120000006",
    role: "customer",
    firstName: "مریم",
    lastName: "احمدی",
    get note() {
      return m.shared_demo_note_evaluation_today();
    },
  },
];

/** Whether a number belongs to a demo account. */
export function isDemoPhoneNumber(phoneNumber: string): boolean {
  return DEMO_ACCOUNTS.some((account) => account.phoneNumber === phoneNumber);
}
