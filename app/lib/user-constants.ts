/*===== User Constants =====*/
// Browser-safe values shared by auth, the seeds and the sign-in page. Stored as plain text (see `app/db/schema.ts`).

/** Each phone number has exactly one role (F1). The Admin is the head trainer and the only staff account. */
export const USER_ROLES = ["admin", "partner", "customer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "مدیر و مربی ارشد",
  partner: "همکار",
  customer: "مشتری",
};

/** Blocked users can't sign in. */
export const USER_STATUSES = ["active", "blocked"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/*===== Sign-in Code =====*/
/** Digits in a sign-in code (F1). */
export const SIGN_IN_CODE_LENGTH = 5;

/** Seconds before a new code can be requested (F1). */
export const SIGN_IN_CODE_RESEND_SECONDS = 60;

/** Showcase mode sends no SMS, so this is the one code that signs anyone in . */
export const SHOWCASE_SIGN_IN_CODE = "12345";

/** Error code the sign-in endpoints return for a blocked account. */
export const ACCOUNT_BLOCKED_CODE = "ACCOUNT_BLOCKED";

/*===== Password Sign-in =====*/
// A person can set a password after signing in with a code, and then sign in with their number and that password. The
// code stays available: it is also how someone who forgot the password gets back in and sets a new one.

/** Characters a password must have at least, and at most (the hasher's own ceiling is 128). */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** A password can be set or replaced only this soon after signing in, so a stolen old session can't take the account. */
export const PASSWORD_CHANGE_FRESH_MINUTES = 30;

/** Wrong passwords for one number before it is paused, and how long the count looks back and the pause lasts. */
export const MAX_SIGN_IN_FAILURES = 5;
export const SIGN_IN_FAILURE_WINDOW_MINUTES = 15;

/** Error code the sign-in endpoint returns while a number is paused after too many wrong passwords. */
export const SIGN_IN_PAUSED_CODE = "TOO_MANY_SIGN_IN_ATTEMPTS";
