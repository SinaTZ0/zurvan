import { z } from "zod";

/*===== Search Schema =====*/
// `edit` is the edit sheet. It isn't a loader dep, and opening it pushes a history entry, so the browser's Back closes
// the sheet and the open sheet has its own URL (`?edit=true`). A closed sheet is the default and leaves the URL.
// `session` is the session sheet, the same way: `new` for a new session or the entry's id to correct it. A hand-typed
// bad value is dropped (`.catch`) instead of failing the page.
export const adminDogDetailSearchSchema = z.object({
  edit: z.boolean().optional().catch(undefined),
  session: z.string().optional().catch(undefined),
});
