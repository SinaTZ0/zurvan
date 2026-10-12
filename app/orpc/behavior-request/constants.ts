import { MAX_PLANNED_SESSIONS } from "~/orpc/enrollment/constants";

/*===== Behavior Request Constants =====*/
// Browser-safe values shared by the API, the seed and the behavior screens. Stored as plain text (see
// `app/db/schema.ts`). Spec 3.7 and entity 9; the rules are B13 and B15 in docs/business-logic.md.

/*===== Problem Category =====*/
/** The problems a request can be about, in the owner's order (spec 3.7). «سایر» is last. */
export const BEHAVIOR_PROBLEM_CATEGORIES = [
  "human-aggression",
  "animal-aggression",
  "owner-aggression",
  "unprovoked-biting",
  "play-biting",
  "separation-anxiety",
  "house-soiling",
  "stool-eating",
  "scavenging",
  "other",
] as const;

export type BehaviorProblemCategory = (typeof BEHAVIOR_PROBLEM_CATEGORIES)[number];

export const BEHAVIOR_PROBLEM_CATEGORY_LABELS: Record<BehaviorProblemCategory, string> = {
  "human-aggression": "پرخاشگری به انسان",
  "animal-aggression": "پرخاشگری به حیوان",
  "owner-aggression": "پرخاشگری به صاحب",
  "unprovoked-biting": "گاز گرفتن بی‌مورد",
  "play-biting": "گاز گرفتن بازیگوشانه",
  "separation-anxiety": "اضطراب جدایی",
  "house-soiling": "خطای دستشویی",
  "stool-eating": "مدفوع‌خواری",
  scavenging: "آشغال‌خواری",
  other: "سایر",
};

/*===== Status =====*/
// submitted → proposed → paid, or declined, withdrawn (by the customer) and expired (the plan wasn't paid in time).
export const BEHAVIOR_REQUEST_STATUSES = ["submitted", "proposed", "paid", "declined", "withdrawn", "expired"] as const;

export type BehaviorRequestStatus = (typeof BEHAVIOR_REQUEST_STATUSES)[number];

export const BEHAVIOR_REQUEST_STATUS_LABELS: Record<BehaviorRequestStatus, string> = {
  submitted: "در انتظار بررسی",
  proposed: "برنامه پیشنهاد شد",
  paid: "پرداخت شد",
  declined: "رد شد",
  withdrawn: "پس گرفته شد",
  expired: "منقضی شد",
};

/** The statuses in which a request is still being worked on. A dog has at most one such request. */
export const OPEN_BEHAVIOR_REQUEST_STATUSES = [
  "submitted",
  "proposed",
] as const satisfies readonly BehaviorRequestStatus[];

/*===== Plan =====*/
// TODO(business-logic): B13 — a plan can be paid for 7 days. A Platform Setting once those exist.
export const BEHAVIOR_PLAN_VALID_DAYS = 7;

/** A plan has at least one session and, like any enrollment, at most this many. */
export const BEHAVIOR_PLAN_MAX_SESSIONS = MAX_PLANNED_SESSIONS;

/** Rial. A floor against a typo (a price in toman typed as Rial), not a business rule. */
export const BEHAVIOR_PLAN_MIN_PRICE = 1_000_000;
/** Rial: 500 million toman. A ceiling against a typo. */
export const BEHAVIOR_PLAN_MAX_PRICE = 5_000_000_000;

/*===== Text Limits =====*/
export const BEHAVIOR_DESCRIPTION_MAX_LENGTH = 3000;
export const BEHAVIOR_ADDRESS_MAX_LENGTH = 300;
export const BEHAVIOR_PREFERRED_TIMES_MAX_LENGTH = 500;
export const BEHAVIOR_TRAINER_NOTE_MAX_LENGTH = 2000;

/*===== Videos =====*/
// B15: up to 3 videos, 100 MB each, in common phone formats, stored as uploaded (no transcoding).
export const BEHAVIOR_VIDEO_MAX_COUNT = 3;
export const BEHAVIOR_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
/** Videos a customer may have uploaded without sending them yet: a guard against filling the bucket from one form. */
export const BEHAVIOR_VIDEO_MAX_UNSENT = 6;

/** The formats accepted, by the extension the object is stored under. */
export const BEHAVIOR_VIDEO_FORMATS = ["mp4", "mov"] as const;

export type BehaviorVideoFormat = (typeof BEHAVIOR_VIDEO_FORMATS)[number];

export const BEHAVIOR_VIDEO_CONTENT_TYPES: Record<BehaviorVideoFormat, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** For the file input's `accept`. The server checks the real format, never this. */
export const BEHAVIOR_VIDEO_ACCEPTED_TYPES = "video/mp4,video/quicktime,.mp4,.mov";

/** Where the browser uploads a video and reads it back (`GET`, with the video's id appended). */
export const BEHAVIOR_VIDEOS_PATH = "/api/behavior-videos";

/*===== Reasons a Dog Can't Start a Request =====*/
export const BEHAVIOR_BLOCKED_KINDS = [
  /** The dog has a request that is still being worked on. */
  "open-request",
  /** The dog is in a behavior plan now (the one live enrollment per course and dog). */
  "live-enrollment",
] as const;

export type BehaviorBlockedKind = (typeof BEHAVIOR_BLOCKED_KINDS)[number];
