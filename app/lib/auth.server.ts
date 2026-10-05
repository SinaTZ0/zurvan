import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { db } from "~/db/client.server";
import * as schema from "~/db/schema";
import { env } from "~/env.server";
import { ALTCHA_HEADER, CAPTCHA_FAILED_CODE } from "~/lib/auth-constants";
import { verifyAltchaPayload } from "~/lib/altcha.server";

/*===== Auth Instance =====*/
/**
 * Better-Auth server instance: email + password accounts with database sessions.
 *
 * Mounted at `/api/auth/*` (see `app/routes/api_auth/`). Server code reads the session with
 * `auth.api.getSession({ headers })`.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Vite moves to the next free port (5174, …) when 5173 is taken, and Better-Auth rejects sign-in
  // and sign-up from any origin other than `baseURL`. Trust every local port in development only.
  trustedOrigins: env.NODE_ENV === "development" ? ["http://localhost:*", "http://127.0.0.1:*"] : [],
  emailAndPassword: {
    enabled: true,
    // Demo: accounts work immediately, and sign-up signs the user in.
    requireEmailVerification: false,
    autoSignIn: true,
  },
  hooks: {
    /*------ Sign-up Captcha ------*/
    // Better-Auth has no built-in Altcha provider, so the check runs as a `before` hook. The payload
    // travels in a header because the sign-up body only accepts user fields.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const verified = await verifyAltchaPayload(ctx.headers?.get(ALTCHA_HEADER));
      if (!verified) {
        throw new APIError("BAD_REQUEST", {
          code: CAPTCHA_FAILED_CODE,
          message: "Captcha verification failed.",
        });
      }
    }),
  },
});

export type AuthSession = typeof auth.$Infer.Session;
