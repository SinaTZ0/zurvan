/*===== Evaluation Constants =====*/
// Browser-safe values shared by the API, the seed and the evaluation screens. Stored as plain text (see
// `app/db/schema.ts`). docs/app-spec.md, F3.

/*===== Status =====*/
// requested → evaluated | rejected | withdrawn (by the customer, while it is still requested). All three are final.
export const EVALUATION_STATUSES = ["requested", "evaluated", "rejected", "withdrawn"] as const;

export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const EVALUATION_STATUS_LABELS: Record<EvaluationStatus, string> = {
  requested: "در انتظار ارزیابی",
  evaluated: "ارزیابی شد",
  rejected: "رد شد",
  withdrawn: "پس گرفته شد",
};

/*===== When the Customer Is Free =====*/
/** In the order of the Persian week. */
export const EVALUATION_WEEKDAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type EvaluationWeekday = (typeof EVALUATION_WEEKDAYS)[number];

export const EVALUATION_WEEKDAY_LABELS: Record<EvaluationWeekday, string> = {
  saturday: "شنبه",
  sunday: "یکشنبه",
  monday: "دوشنبه",
  tuesday: "سه‌شنبه",
  wednesday: "چهارشنبه",
  thursday: "پنجشنبه",
  friday: "جمعه",
};

export const EVALUATION_PERIODS = ["morning", "afternoon", "evening"] as const;

export type EvaluationPeriod = (typeof EVALUATION_PERIODS)[number];

export const EVALUATION_PERIOD_LABELS: Record<EvaluationPeriod, string> = {
  morning: "صبح",
  afternoon: "بعدازظهر",
  evening: "عصر و شب",
};

/*===== Limits =====*/
export const EVALUATION_REASON_MAX_LENGTH = 300;
export const EVALUATION_MAX_PHOTOS = 6;
export const EVALUATION_MAX_VIDEOS = 3;

/*===== Videos =====*/
// Up to 100 MB each, in common phone formats, stored as uploaded (no transcoding).
export const EVALUATION_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
/** Videos a customer may have uploaded without sending them yet: a guard against filling the bucket from one form. */
export const EVALUATION_VIDEO_MAX_UNSENT = 6;

/** The formats accepted, by the extension the object is stored under. */
export const EVALUATION_VIDEO_FORMATS = ["mp4", "mov"] as const;

export type EvaluationVideoFormat = (typeof EVALUATION_VIDEO_FORMATS)[number];

export const EVALUATION_VIDEO_CONTENT_TYPES: Record<EvaluationVideoFormat, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
};

/** For the file input's `accept`. The server checks the real format, never this. */
export const EVALUATION_VIDEO_ACCEPTED_TYPES = "video/mp4,video/quicktime,.mp4,.mov";

/** Where the browser uploads a video and reads it back (`GET`, with the video's id appended). */
export const EVALUATION_VIDEOS_PATH = "/api/evaluation-videos";
