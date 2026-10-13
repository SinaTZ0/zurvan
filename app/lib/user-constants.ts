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
