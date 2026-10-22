import { z } from "zod";

import { SMS_KINDS } from "~/orpc/sms/constants";

/*===== Search Schema =====*/
// Both are loader deps (the API pages on the server), so changing a filter or a page fetches that page. `kind` absent
// means every kind. `page` is 1-based in the URL (absent is the first), 0-based for the API. A hand-typed bad value is
// dropped (`.catch`) instead of failing the page.
export const smsSearchSchema = z.object({
  kind: z.enum(SMS_KINDS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});
