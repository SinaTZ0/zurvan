import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { phoneNumber } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";

import { db } from "~/db/client.server";
import * as schema from "~/db/schema";
import { env } from "~/env.server";
import { isDemoPhoneNumber } from "~/lib/demo-accounts";
import { isNormalizedPhoneNumber, phonePlaceholderEmail } from "~/lib/phone";
import { readOtpLimits } from "~/lib/platform-settings.server";
import { findPartnerForNewCustomer, readReferralCode } from "~/lib/referral.server";
import { recentSms, sendSms } from "~/lib/sms.server";
import {
  ACCOUNT_BLOCKED_CODE,
  SHOWCASE_SIGN_IN_CODE,
  SIGN_IN_CODE_LENGTH,
  SIGN_IN_CODE_RESEND_SECONDS,
} from "~/lib/user-constants";

/*===== Startup Check =====*/
// There is no SMS provider yet, so outside showcase mode nobody could ever receive a code. Refuse to start rather
// than run a site nobody can sign in to (`SHOWCASE_MODE`).
if (!env.SHOWCASE_MODE) {
  throw new Error(
    "No SMS provider is configured. Set SHOWCASE_MODE=true, or wire a provider in app/lib/sms.server.ts.",
  );
}

/*===== Sign-in Code Rules =====*/
const CODE_EXPIRES_IN_SECONDS = 120; // F1: valid for 2 minutes
const CODE_ALLOWED_ATTEMPTS = 5; // F1
const HOUR_MS = 60 * 60 * 1000;

/*===== Auth Instance =====*/
/**
 * Better-Auth server instance: phone number + a one-time code by SMS, with database sessions. The same two steps sign
 * a person in or, the first time, sign them up as a customer (F1).
 *
 * Mounted at `/api/auth/*` (see `app/routes/api_auth/`). Server code reads the session with
 * `auth.api.getSession({ headers })`.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // Vite moves to the next free port (5174, …) when 5173 is taken, and Better-Auth rejects requests from any origin
  // other than `baseURL`. Trust every local port in development only.
  trustedOrigins: env.NODE_ENV === "development" ? ["http://localhost:*", "http://127.0.0.1:*"] : [],

  user: {
    additionalFields: {
      // Asked once, right after a new number is verified; the person can type them.
      firstName: { type: "string", required: false, input: true },
      lastName: { type: "string", required: false, input: true },
      // Never from the client: only customers sign themselves up, and only the Admin blocks.
      role: { type: "string", required: false, defaultValue: "customer", input: false },
      status: { type: "string", required: false, defaultValue: "active", input: false },
      lastLoginAt: { type: "date", required: false, input: false },
      // Set by the sign-up hook below (F7), never from the client.
      referredByPartnerId: { type: "string", required: false, input: false },
    },
  },

  /*------ Rate Limits ------*/
  // Per IP. The per-number limits need the send log, so they live in the hook below. Both maximums are the Admin's
  // settings (F10), read on every request, so a change needs no restart. A lowered maximum applies to the next
  // request; the counters of the window already running keep counting and are only compared against the new number.
  rateLimit: {
    enabled: true,
    customRules: {
      "/phone-number/send-otp": async () => ({ window: HOUR_MS / 1000, max: (await readOtpLimits({ db })).perIp }),
    },
  },

  plugins: [
    phoneNumber({
      otpLength: SIGN_IN_CODE_LENGTH,
      expiresIn: CODE_EXPIRES_IN_SECONDS,
      allowedAttempts: CODE_ALLOWED_ATTEMPTS,
      // The form normalizes before sending; anything else is a client bug or a hand-made request.
      phoneNumberValidator: isNormalizedPhoneNumber,
      signUpOnVerification: { getTempEmail: phonePlaceholderEmail },

      /*------ Showcase Code ------*/
      // The plugin's random code is never sent: the message carries the showcase code instead.
      sendOTP: ({ phoneNumber: phone }) =>
        sendSms({
          phoneNumber: phone,
          kind: "sign-in-code",
          body: `کد ورود شما به آموزش K9: ${SHOWCASE_SIGN_IN_CODE}\nاین کد را به کسی ندهید.`,
        }),
      // Replaces the plugin's own check, which would compare against the random code. A code must still have been
      // requested and not expired, so the 2-minute validity holds; wrong attempts aren't counted, since the code is
      // public in showcase mode anyway.
      verifyOTP: async ({ phoneNumber: phone, code }, ctx) => {
        const pending = await ctx?.context.internalAdapter.findVerificationValue(phone);
        if (!pending) throw new APIError("BAD_REQUEST", { code: "OTP_NOT_FOUND", message: "OTP not found" });
        if (pending.expiresAt < new Date()) {
          throw new APIError("BAD_REQUEST", { code: "OTP_EXPIRED", message: "OTP expired" });
        }
        return code === SHOWCASE_SIGN_IN_CODE;
      },
    }),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/phone-number/send-otp" && ctx.path !== "/phone-number/verify") return;
      const phone: unknown = ctx.body?.phoneNumber;
      if (typeof phone !== "string") return;

      /*------ Blocked Accounts ------*/
      // Checked before a code is sent, so a blocked number doesn't even get an SMS, and again at verify.
      const [blocked] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(and(eq(schema.user.phoneNumber, phone), eq(schema.user.status, "blocked")))
        .limit(1);
      if (blocked) throw new APIError("FORBIDDEN", { code: ACCOUNT_BLOCKED_CODE, message: "Account is blocked." });

      /*------ Per-number Limits ------*/
      if (ctx.path !== "/phone-number/send-otp") return;
      const now = Date.now();
      const sent = await recentSms({ phoneNumber: phone, kind: "sign-in-code", since: new Date(now - HOUR_MS) });
      if (sent.latest && now - sent.latest.getTime() < SIGN_IN_CODE_RESEND_SECONDS * 1000) {
        throw new APIError("TOO_MANY_REQUESTS", { code: "RESEND_TOO_SOON", message: "Wait before resending." });
      }
      // The owner signs in and out of the demo accounts while showing the site, so they skip the hourly cap.
      const { perPhone } = await readOtpLimits({ db });
      if (sent.count >= perPhone && !isDemoPhoneNumber(phone)) {
        throw new APIError("TOO_MANY_REQUESTS", { code: "TOO_MANY_CODES", message: "Too many codes this hour." });
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        /*------ Partner Attribution ------*/
        // F7: a customer is attributed to one partner, permanently, when they register: by the referral link's
        // cookie first, then by a phone number a partner entered earlier.
        before: async (newUser, context) => {
          const partnerId = await findPartnerForNewCustomer({
            db,
            referralCode: context?.headers ? await readReferralCode(context.headers) : null,
            phoneNumber: typeof newUser.phoneNumber === "string" ? newUser.phoneNumber : null,
          });
          return partnerId ? { data: { ...newUser, referredByPartnerId: partnerId } } : undefined;
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await db.update(schema.user).set({ lastLoginAt: new Date() }).where(eq(schema.user.id, session.userId));
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;

/*===== Session Revocation =====*/
/** Signs a user out everywhere by deleting all their sessions, e.g. once they are blocked. */
export async function revokeUserSessions(userId: string): Promise<void> {
  const context = await auth.$context;
  await context.internalAdapter.deleteUserSessions(userId);
}
