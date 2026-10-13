import { parseAsBoolean } from "nuqs/server";

/*===== Constants =====*/
/** The Dogs list, where «همه‌ی سگ‌ها» goes back to. */
export const ADMIN_DOGS_PATH = "/admin/dogs";

/*===== Parsers =====*/
// `edit` is the edit sheet. It is shallow (no loader reads it) and pushes a history entry, so the browser's Back closes
// the sheet and the open sheet has its own URL (`?edit=true`). A closed sheet is the default and leaves the URL.
export const adminDogDetailSearchParams = {
  edit: parseAsBoolean.withDefault(false).withOptions({ shallow: true, history: "push" }),
};
