import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "~/lib/auth.server";

/*===== Auth Client =====*/
/**
 * Browser client for Better-Auth endpoints (`/api/auth/*`). It talks to the current origin, so no base URL is
 * configured here. The server instance is imported as a type only, so none of its code reaches the browser.
 */
export const authClient = createAuthClient({
  plugins: [phoneNumberClient(), inferAdditionalFields<typeof auth>()],
});
