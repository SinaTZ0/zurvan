import { randomUUID } from "node:crypto";

import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { formatNumberFa } from "~/lib/digits";
import { issuesToErrorData } from "~/lib/schema-issues";
import { formatRecordNumber } from "~/lib/record-number";
import { sendSms, type SmsKind } from "~/lib/sms.server";
import { deleteObjects, putObject, videoKey } from "~/lib/storage.server";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { UserRole } from "~/lib/user-constants";
import { isUuid } from "~/lib/uuid";
import {
  BEHAVIOR_PLAN_VALID_DAYS,
  BEHAVIOR_PROBLEM_CATEGORY_LABELS,
  BEHAVIOR_VIDEO_CONTENT_TYPES,
  BEHAVIOR_VIDEO_MAX_BYTES,
  BEHAVIOR_VIDEO_MAX_UNSENT,
  type BehaviorProblemCategory,
} from "~/orpc/behavior-request/constants";
import type {
  BehaviorRequestOptions,
  BehaviorVideo,
  CustomerBehaviorRequest,
  TrainerBehaviorRequest,
  TrainerBehaviorRequestSummary,
} from "~/orpc/behavior-request/contract";
import {
  toBehaviorVideo,
  toCustomerBehaviorRequest,
  toTrainerBehaviorRequest,
  toTrainerBehaviorRequestSummary,
} from "~/orpc/behavior-request/mapper";
import { planUnpayableReason } from "~/orpc/behavior-request/plan";
import {
  attachVideos,
  countUnsentVideos,
  deleteVideoRow,
  expireDueRequests,
  findBehaviorCourse,
  findLiveBehaviorEnrollmentsOfDogs,
  findOpenRequestsOfDogs,
  findPendingOrderIdsOfRequest,
  findRequestByTrainer,
  findRequestsByCustomer,
  findRequestsByTrainer,
  findVideoById,
  findVideoOwnership,
  findVideosByRequests,
  insertRequest,
  insertVideo,
  lockRequest,
  lockUnsentVideos,
  updateRequest,
  type BehaviorRequestRow,
  type BehaviorVideoRecord,
} from "~/orpc/behavior-request/repository";
import { detectVideoFormat, parseVideoFormat, VIDEO_SNIFF_BYTES } from "~/orpc/behavior-request/video";
import {
  declineInputSchema,
  proposeInputSchema,
  submitInputSchema,
  trainerListInputSchema,
} from "~/orpc/behavior-request/validation";
import { findDogWithPhoto } from "~/orpc/dog/repository";
import { listDogs } from "~/orpc/dog/service";
import { toPublicDog } from "~/orpc/dog/mapper";
import {
  cancelPendingOrders,
  findHeadTrainer,
  findPeople,
  findSupersededOrders,
  insertOrder,
  insertOrderItems,
  lockDogsOfCustomer,
  nextOrderSequence,
} from "~/orpc/order/repository";

/*===== Types =====*/
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };
/** The request is fine, but it contradicts the current state. `errors` is the Persian message for the user. */
type ConflictResult<Kind extends string> = { kind: Kind; errors: string[] };

/** `now` is a dependency so a test can stand at any moment; callers leave it out. */
type Clock = { now?: Date };

const DAY_MS = 86_400_000;

/** A behavior plan is home training: its sessions are with the dog at the owner's address (spec 3.7). */
const BEHAVIOR_TRAINING_GOAL = "home";

/*===== Notifications =====*/
type BehaviorSmsKind = Extract<
  SmsKind,
  "behavior-request-created" | "behavior-plan-proposed" | "behavior-request-declined"
>;

/**
 * Sends an SMS after the change it reports has been committed. A failure is logged instead of failing the request: the
 * answer has been recorded and the screens show it.
 */
async function notify({
  phoneNumber,
  kind,
  body,
}: {
  phoneNumber: string | null;
  kind: BehaviorSmsKind;
  body: string;
}) {
  if (!phoneNumber) return;
  try {
    await sendSms({ phoneNumber, kind, body });
  } catch (error) {
    console.error(`[behavior-request] could not send the ${kind} SMS`, error);
  }
}

/*===== Reading =====*/
/** The videos of several requests in one query, grouped by request. */
async function videosByRequest({
  db,
  rows,
}: {
  db: DatabaseOrTransaction;
  rows: BehaviorRequestRow[];
}): Promise<Map<string, BehaviorVideoRecord[]>> {
  const videos = await findVideosByRequests({ db, requestIds: rows.map((row) => row.request.id) });

  const grouped = new Map<string, BehaviorVideoRecord[]>();
  for (const video of videos) {
    if (!video.behaviorRequestId) continue;
    grouped.set(video.behaviorRequestId, [...(grouped.get(video.behaviorRequestId) ?? []), video]);
  }
  return grouped;
}

/** The trainer's view of one request, with the whole dog. The dog may have been removed since; the trainer still sees it. */
async function toTrainerView({
  db,
  row,
}: {
  db: DatabaseOrTransaction;
  row: BehaviorRequestRow;
}): Promise<TrainerBehaviorRequest> {
  const dogRecord = await findDogWithPhoto({ db, id: row.dog.id });
  if (!dogRecord) throw new Error(`Behavior request ${row.request.id} points at a dog that doesn't exist`);

  const videos = (await videosByRequest({ db, rows: [row] })).get(row.request.id) ?? [];
  return toTrainerBehaviorRequest({ row, videos, dog: toPublicDog(dogRecord) });
}

/*===== Options =====*/
/** What the request form shows: the customer's dogs, and which of them can't start a request now and why. */
export async function getBehaviorRequestOptions({
  db,
  customerId,
  now = new Date(),
}: { db: Database; customerId: string } & Clock): Promise<BehaviorRequestOptions> {
  await expireDueRequests({ db, now });

  const dogs = await listDogs({ db, ownerId: customerId });
  const dogIds = dogs.map((dog) => dog.id);
  const [open, live, behaviorCourse] = await Promise.all([
    findOpenRequestsOfDogs({ db, dogIds }),
    findLiveBehaviorEnrollmentsOfDogs({ db, dogIds }),
    findBehaviorCourse({ db }),
  ]);

  return {
    course: behaviorCourse ? { slug: behaviorCourse.course.slug, title: behaviorCourse.course.title } : null,
    dogs: dogs.map((dog) => {
      const openRequest = open.find((entry) => entry.dogId === dog.id);
      const liveEnrollment = live.find((entry) => entry.dogId === dog.id);
      return {
        dog,
        blocked: blockedReason({ dogName: dog.name, openRequest, liveEnrollment }),
      };
    }),
  };
}

function blockedReason({
  dogName,
  openRequest,
  liveEnrollment,
}: {
  dogName: string;
  openRequest: { requestId: string } | undefined;
  liveEnrollment: { enrollmentId: string } | undefined;
}): BehaviorRequestOptions["dogs"][number]["blocked"] {
  if (openRequest) {
    return {
      kind: "open-request",
      message: `برای ${dogName} همین حالا یک درخواست در جریان است.`,
      requestId: openRequest.requestId,
      enrollmentId: null,
    };
  }
  if (liveEnrollment) {
    return {
      kind: "live-enrollment",
      message: `${dogName} همین حالا در برنامه‌ی اصلاح رفتار است.`,
      requestId: null,
      enrollmentId: liveEnrollment.enrollmentId,
    };
  }
  return null;
}

/*===== Submit =====*/
type SubmitResult = { kind: "success"; id: string } | InvalidResult | NotFoundResult | ConflictResult<"not-eligible">;

const VIDEOS_INVALID: InvalidResult = {
  kind: "invalid",
  errors: [],
  fields: { videoIds: "ویدیوها را دوباره بفرست." },
};

/**
 * Sends a behavior request (spec 3.7): checks the dog (locked, so two requests for it run one after the other), claims
 * the uploaded videos and stores the request for the behavior course's owner trainer, the head trainer by default. The
 * trainer is told by SMS.
 *
 * @returns `invalid` with per-field messages (including videos that aren't the customer's or were sent before);
 * `not-found` for another customer's dog, a removed one and a malformed id; `not-eligible` when the dog already has a
 * request being worked on or is in a behavior plan, or when no behavior course is open.
 */
export async function submitBehaviorRequest({
  db,
  customerId,
  input,
  now = new Date(),
}: { db: Database; customerId: string; input: unknown } & Clock): Promise<SubmitResult> {
  const parsed = submitInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const details = parsed.data;
  if (!isUuid(details.dogId)) return { kind: "not-found" };
  if (!details.videoIds.every(isUuid)) return VIDEOS_INVALID;

  const behaviorCourse = await findBehaviorCourse({ db });
  if (!behaviorCourse) return { kind: "not-eligible", errors: ["اصلاح رفتار فعلاً درخواست نمی‌گیرد."] };
  const head = await findHeadTrainer({ db });
  const trainerId = behaviorCourse.course.ownerTrainerId ?? head?.id;
  if (!trainerId) throw new Error("submitBehaviorRequest: there is no Admin to be the head trainer");

  const outcome = await db.transaction(
    async (tx): Promise<SubmitResult & { dogName?: string; category?: BehaviorProblemCategory }> => {
      /*------ Dog ------*/
      const [locked] = await lockDogsOfCustomer({ db: tx, customerId, ids: [details.dogId] });
      if (!locked || locked.deletedAt) return { kind: "not-found" };

      // A proposal that ran out would still hold the dog's one open slot.
      await expireDueRequests({ db: tx, now });
      const [open, live] = await Promise.all([
        findOpenRequestsOfDogs({ db: tx, dogIds: [locked.id] }),
        findLiveBehaviorEnrollmentsOfDogs({ db: tx, dogIds: [locked.id] }),
      ]);
      const blocked = blockedReason({ dogName: locked.name, openRequest: open[0], liveEnrollment: live[0] });
      if (blocked) return { kind: "not-eligible", errors: [blocked.message] };

      /*------ Videos ------*/
      const videos = await lockUnsentVideos({ db: tx, uploadedBy: customerId, ids: details.videoIds });
      if (videos.length !== details.videoIds.length) return VIDEOS_INVALID;

      /*------ Request ------*/
      const request = await insertRequest({
        db: tx,
        values: {
          dogId: locked.id,
          customerId,
          trainerId,
          problemCategory: details.problemCategory,
          description: details.description,
          address: details.address,
          preferredTimes: details.preferredTimes,
          createdAt: now,
        },
      });
      await attachVideos({ db: tx, requestId: request.id, ids: details.videoIds });

      return { kind: "success", id: request.id, dogName: locked.name, category: details.problemCategory };
    },
  );
  if (outcome.kind !== "success") return outcome;

  /*------ Notify ------*/
  const [trainer, customer] = await Promise.all([
    findPeople({ db, ids: [trainerId] }).then((people) => people[0]),
    findPeople({ db, ids: [customerId] }).then((people) => people[0]),
  ]);
  await notify({
    phoneNumber: trainer?.phoneNumber ?? null,
    kind: "behavior-request-created",
    body: `آموزش K9: ${customer?.name ?? "یک مشتری"} برای ${outcome.dogName} درخواست اصلاح رفتار فرستاد (${BEHAVIOR_PROBLEM_CATEGORY_LABELS[details.problemCategory]}). ویدیوها را ببین و برنامه بده.`,
  });

  return { kind: "success", id: outcome.id };
}

/*===== List Mine =====*/
/** The customer's own requests, newest first. */
export async function listMyBehaviorRequests({
  db,
  customerId,
  now = new Date(),
}: { db: Database; customerId: string } & Clock): Promise<CustomerBehaviorRequest[]> {
  await expireDueRequests({ db, now });

  const rows = await findRequestsByCustomer({ db, customerId });
  // One query for every request's videos, not one per row.
  const videos = await videosByRequest({ db, rows });

  return rows.map((row) => toCustomerBehaviorRequest({ row, videos: videos.get(row.request.id) ?? [], now }));
}

/*===== Withdraw =====*/
type WithdrawResult = { kind: "success"; id: string } | NotFoundResult | ConflictResult<"not-withdrawable">;

/**
 * Takes a request back while it is being worked on. An order already started from its plan is cancelled; a gateway
 * payment that is still in flight finds the request withdrawn when it comes back, and its money goes to the wallet.
 *
 * @returns `not-found` for another customer's request and a malformed id alike; `not-withdrawable` once it is answered
 * for good (paid, declined, withdrawn or expired).
 */
export async function withdrawBehaviorRequest({
  db,
  customerId,
  id,
  now = new Date(),
}: { db: Database; customerId: string; id: string } & Clock): Promise<WithdrawResult> {
  if (!isUuid(id)) return { kind: "not-found" };
  await expireDueRequests({ db, now });

  return db.transaction(async (tx): Promise<WithdrawResult> => {
    const request = await lockRequest({ db: tx, id });
    if (!request || request.customerId !== customerId) return { kind: "not-found" };
    if (request.status !== "submitted" && request.status !== "proposed") {
      return { kind: "not-withdrawable", errors: ["این درخواست دیگر پس گرفته نمی‌شود."] };
    }

    await updateRequest({ db: tx, id, values: { status: "withdrawn" } });
    await cancelPendingOrders({
      db: tx,
      ids: await findPendingOrderIdsOfRequest({ db: tx, requestId: id }),
      reason: "درخواست اصلاح رفتار پس گرفته شد.",
    });
    return { kind: "success", id };
  });
}

/*===== Checkout =====*/
type CheckoutResult = { kind: "success"; orderId: string } | NotFoundResult | ConflictResult<"not-payable">;

/**
 * Starts paying a proposed plan: a pending order with one item for the behavior course, at the plan's price, carrying
 * the request. From there it is the ordinary checkout, and paying it creates the enrollment with the plan's sessions.
 * An earlier pending order for the same plan is cancelled, so a customer who comes back isn't left with two.
 *
 * The deadline is checked here and again when the order is paid (B13), so it doesn't depend on any job.
 *
 * @returns `not-found` for another customer's request and a malformed id alike; `not-payable` with the reason when
 * there is no plan to pay, its time ran out, or the dog can't be enrolled any more.
 */
export async function checkoutBehaviorPlan({
  db,
  customerId,
  id,
  now = new Date(),
}: { db: Database; customerId: string; id: string } & Clock): Promise<CheckoutResult> {
  if (!isUuid(id)) return { kind: "not-found" };
  await expireDueRequests({ db, now });

  return db.transaction(async (tx): Promise<CheckoutResult> => {
    const request = await lockRequest({ db: tx, id });
    if (!request || request.customerId !== customerId) return { kind: "not-found" };

    const reason = planUnpayableReason({ plan: request, now });
    if (reason) return { kind: "not-payable", errors: [reason] };
    if (request.proposedPrice === null || request.proposedSessions === null) {
      return { kind: "not-payable", errors: ["این درخواست هنوز برنامه‌ای ندارد."] };
    }

    /*------ Dog and Course ------*/
    const [dog] = await lockDogsOfCustomer({ db: tx, customerId, ids: [request.dogId] });
    if (!dog || dog.deletedAt) return { kind: "not-payable", errors: ["سگ این درخواست از حسابت حذف شده."] };
    const [live] = await findLiveBehaviorEnrollmentsOfDogs({ db: tx, dogIds: [dog.id] });
    if (live) return { kind: "not-payable", errors: [`${dog.name} همین حالا در برنامه‌ی اصلاح رفتار است.`] };

    const behaviorCourse = await findBehaviorCourse({ db: tx });
    if (!behaviorCourse) return { kind: "not-payable", errors: ["اصلاح رفتار فعلاً باز نیست."] };
    const { course, refundPolicy } = behaviorCourse;

    /*------ Replace an Earlier Order ------*/
    const superseded = await findSupersededOrders({
      db: tx,
      customerId,
      exceptId: null,
      sameBooking: { dogId: dog.id, courseId: course.id },
      spendingWallet: false,
    });
    await cancelPendingOrders({ db: tx, ids: superseded, reason: "سفارش تازه‌تری جای آن را گرفت." });

    /*------ Order ------*/
    const order = await insertOrder({
      db: tx,
      values: {
        number: formatRecordNumber({ prefix: "ZR", sequence: await nextOrderSequence({ db: tx }), at: now }),
        customerId,
        subtotal: request.proposedPrice,
        totalAmount: request.proposedPrice,
        createdAt: now,
      },
    });
    await insertOrderItems({
      db: tx,
      values: [
        {
          orderId: order.id,
          courseId: course.id,
          dogId: dog.id,
          kind: "course",
          behaviorRequestId: request.id,
          trainingGoal: BEHAVIOR_TRAINING_GOAL,
          boarding: false,
          address: request.address,
          preferredTimes: request.preferredTimes,
          unitPrice: request.proposedPrice,
          boardingPrice: 0,
          paidAmount: request.proposedPrice,
          refundPolicyName: refundPolicy.name,
          refundPolicyPercent: refundPolicy.unheldRefundPercent,
        },
      ],
    });

    return { kind: "success", orderId: order.id };
  });
}

/*===== Trainer: List =====*/
type TrainerListResult = { kind: "success"; requests: TrainerBehaviorRequestSummary[] } | InvalidResult;

/**
 * Lists the trainer's requests in the order that needs them: waiting for an answer (longest first), then the ones with
 * a plan out, then the rest, newest first.
 */
export async function listTrainerBehaviorRequests({
  db,
  trainerId,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; input: unknown } & Clock): Promise<TrainerListResult> {
  const parsed = trainerListInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  await expireDueRequests({ db, now });

  const rows = await findRequestsByTrainer({ db, trainerId, status: parsed.data.status });
  const videos = await videosByRequest({ db, rows });

  const summaries = rows.map((row) =>
    toTrainerBehaviorRequestSummary({ row, videos: videos.get(row.request.id) ?? [] }),
  );
  const rank = { submitted: 0, proposed: 1 } as const;
  return {
    kind: "success",
    // Rows come newest first; the sort is stable, so inside a group they stay that way, except the waiting ones.
    requests: [...summaries].sort((a, b) => {
      const byStatus = (rank[a.status as keyof typeof rank] ?? 2) - (rank[b.status as keyof typeof rank] ?? 2);
      if (byStatus !== 0) return byStatus;
      return a.status === "submitted" ? a.createdAt.getTime() - b.createdAt.getTime() : 0;
    }),
  };
}

/*===== Trainer: Get =====*/
type TrainerGetResult = { kind: "success"; request: TrainerBehaviorRequest } | NotFoundResult;

/** @returns `not-found` for another trainer's request and a malformed id alike. */
export async function getTrainerBehaviorRequest({
  db,
  trainerId,
  id,
  now = new Date(),
}: { db: Database; trainerId: string; id: string } & Clock): Promise<TrainerGetResult> {
  if (!isUuid(id)) return { kind: "not-found" };
  await expireDueRequests({ db, now });

  const row = await findRequestByTrainer({ db, trainerId, id });
  if (!row) return { kind: "not-found" };
  return { kind: "success", request: await toTrainerView({ db, row }) };
}

/*===== Trainer: Propose =====*/
type AnswerResult =
  | { kind: "success"; request: TrainerBehaviorRequest }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-answerable">;

const NOT_ANSWERABLE_MESSAGE = "این درخواست دیگر در انتظار پاسخ نیست.";

/**
 * Proposes a plan (sessions, price and a note), or replaces the one already proposed. The customer has
 * `BEHAVIOR_PLAN_VALID_DAYS` days from now to pay it (B13). An order the customer already started from an earlier plan
 * is cancelled, since its price is no longer the plan's.
 *
 * @returns `invalid` with per-field messages; `not-found` for another trainer's request and a malformed id alike;
 * `not-answerable` once the request is paid, declined, withdrawn or expired.
 */
export async function proposeBehaviorPlan({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<AnswerResult> {
  const parsed = proposeInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  if (!isUuid(id)) return { kind: "not-found" };
  await expireDueRequests({ db, now });

  const outcome = await db.transaction(async (tx): Promise<AnswerResult | { kind: "proposed"; expiresAt: Date }> => {
    const request = await lockRequest({ db: tx, id });
    if (!request || request.trainerId !== trainerId) return { kind: "not-found" };
    if (request.status !== "submitted" && request.status !== "proposed") {
      return { kind: "not-answerable", errors: [NOT_ANSWERABLE_MESSAGE] };
    }

    const expiresAt = new Date(now.getTime() + BEHAVIOR_PLAN_VALID_DAYS * DAY_MS);
    await updateRequest({
      db: tx,
      id,
      values: {
        status: "proposed",
        proposedSessions: parsed.data.sessions,
        proposedPrice: parsed.data.price,
        trainerNote: parsed.data.note,
        proposedAt: now,
        proposalExpiresAt: expiresAt,
        declinedAt: null,
      },
    });
    await cancelPendingOrders({
      db: tx,
      ids: await findPendingOrderIdsOfRequest({ db: tx, requestId: id }),
      reason: "برنامه‌ی اصلاح رفتار عوض شد.",
    });
    return { kind: "proposed", expiresAt };
  });
  if (outcome.kind !== "proposed") return outcome;

  /*------ Notify ------*/
  const row = await findRequestByTrainer({ db, trainerId, id });
  if (!row) throw new Error(`proposeBehaviorPlan: request ${id} could not be read back`);
  await notify({
    phoneNumber: row.customer.phoneNumber,
    kind: "behavior-plan-proposed",
    body: `آموزش K9: ${row.trainer.name} برای ${row.dog.name} برنامه‌ی اصلاح رفتار فرستاد: ${formatNumberFa(parsed.data.sessions)} جلسه، ${formatNumberFa(Math.round(parsed.data.price / 10))} تومان. تا ${formatSlotDay(outcome.expiresAt)} ساعت ${formatSlotTime(outcome.expiresAt)} فرصت پرداخت داری.`,
  });

  return { kind: "success", request: await toTrainerView({ db, row }) };
}

/*===== Trainer: Decline =====*/
/**
 * Declines a request with a reason the customer sees (e.g. «اول ارزیابی رایگان، حضوری»). An order started from a plan
 * is cancelled.
 *
 * @returns As {@link proposeBehaviorPlan}.
 */
export async function declineBehaviorRequest({
  db,
  trainerId,
  id,
  input,
  now = new Date(),
}: { db: Database; trainerId: string; id: string; input: unknown } & Clock): Promise<AnswerResult> {
  const parsed = declineInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  if (!isUuid(id)) return { kind: "not-found" };
  await expireDueRequests({ db, now });

  const outcome = await db.transaction(async (tx): Promise<AnswerResult | { kind: "declined" }> => {
    const request = await lockRequest({ db: tx, id });
    if (!request || request.trainerId !== trainerId) return { kind: "not-found" };
    if (request.status !== "submitted" && request.status !== "proposed") {
      return { kind: "not-answerable", errors: [NOT_ANSWERABLE_MESSAGE] };
    }

    await updateRequest({
      db: tx,
      id,
      values: { status: "declined", trainerNote: parsed.data.reason, declinedAt: now },
    });
    await cancelPendingOrders({
      db: tx,
      ids: await findPendingOrderIdsOfRequest({ db: tx, requestId: id }),
      reason: "درخواست اصلاح رفتار رد شد.",
    });
    return { kind: "declined" };
  });
  if (outcome.kind !== "declined") return outcome;

  const row = await findRequestByTrainer({ db, trainerId, id });
  if (!row) throw new Error(`declineBehaviorRequest: request ${id} could not be read back`);
  await notify({
    phoneNumber: row.customer.phoneNumber,
    kind: "behavior-request-declined",
    body: `آموزش K9: ${row.trainer.name} درخواست اصلاح رفتار ${row.dog.name} را نپذیرفت: ${parsed.data.reason}`,
  });

  return { kind: "success", request: await toTrainerView({ db, row }) };
}

/*===== Videos =====*/
// Stored as uploaded under `behavior-video/{id}/original.{mp4|mov}` and never served by nginx: only the app streams
// them, to the people who may see them (docs/media.md, "Videos").

const VIDEO_MESSAGES = {
  empty: "این فایل خالی است. ویدیوی دیگری را امتحان کن.",
  tooBig: `حجم ویدیو باید کمتر از ${formatNumberFa(BEHAVIOR_VIDEO_MAX_BYTES / 1024 / 1024)} مگابایت باشد.`,
  unsupported: "فرمت ویدیو پشتیبانی نمی‌شود. ویدیو را با فرمت MP4 یا MOV بفرست.",
  tooMany: "ویدیوهای فرستاده‌نشده زیاد شده. اول درخواستت را بفرست یا چند ویدیو را حذف کن.",
};

const FILE_NAME_MAX_LENGTH = 120;

type UploadVideoResult =
  { kind: "success"; video: BehaviorVideo } | { kind: "forbidden" } | { kind: "invalid"; message: string };

/**
 * Stores an uploaded video before its request exists: the form uploads each video as soon as it is picked. The real
 * format is read from the bytes, never from the name or `Content-Type`.
 *
 * Nothing attaches the video to a request yet; {@link submitBehaviorRequest} does when the form is sent.
 *
 * @returns `forbidden` unless the uploader is a customer; `invalid` with a Persian message when the file is empty, too
 * big, not an MP4 or MOV, or the customer has too many unsent videos.
 * @throws When the bucket or the database fails. The object already written is deleted first.
 */
export async function uploadBehaviorVideo({
  db,
  user,
  file,
}: {
  db: Database;
  user: { id: string; role: UserRole };
  file: File;
}): Promise<UploadVideoResult> {
  if (user.role !== "customer") return { kind: "forbidden" };
  if (file.size === 0) return { kind: "invalid", message: VIDEO_MESSAGES.empty };
  if (file.size > BEHAVIOR_VIDEO_MAX_BYTES) return { kind: "invalid", message: VIDEO_MESSAGES.tooBig };

  const format = detectVideoFormat(new Uint8Array(await file.slice(0, VIDEO_SNIFF_BYTES).arrayBuffer()));
  if (!format) return { kind: "invalid", message: VIDEO_MESSAGES.unsupported };
  if ((await countUnsentVideos({ db, uploadedBy: user.id })) >= BEHAVIOR_VIDEO_MAX_UNSENT) {
    return { kind: "invalid", message: VIDEO_MESSAGES.tooMany };
  }

  const videoId = randomUUID();
  const key = videoKey({ videoId, format });

  try {
    await putObject({
      key,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: BEHAVIOR_VIDEO_CONTENT_TYPES[format],
      // Private: only the app serves it, and an id is never reused.
      cacheControl: "private, max-age=0",
    });
    const record = await insertVideo({
      db,
      values: {
        id: videoId,
        uploadedBy: user.id,
        format,
        fileName: file.name.split(/[\\/]/).pop()?.slice(0, FILE_NAME_MAX_LENGTH) || `video.${format}`,
        sizeBytes: file.size,
      },
    });
    return { kind: "success", video: toBehaviorVideo(record) };
  } catch (error) {
    // Deleting a key that was never written is fine. A failing cleanup must not hide the original error.
    await deleteObjects({ keys: [key] }).catch((cleanupError: unknown) =>
      console.error(`[behavior-request] could not clean up the video ${videoId}`, cleanupError),
    );
    throw error;
  }
}

type FindVideoResult = { kind: "success"; video: BehaviorVideoRecord } | NotFoundResult;

/**
 * Finds a video for someone who wants to watch it. Only these may: whoever uploaded it, while it is unsent; once it
 * belongs to a request, the request's customer and trainer, and the Admin. Everyone else gets `not-found`, the same
 * answer as for a video that doesn't exist.
 */
export async function findVideoForViewer({
  db,
  viewer,
  id,
}: {
  db: Database;
  viewer: { id: string; role: UserRole };
  id: string;
}): Promise<FindVideoResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const video = await findVideoById({ db, id });
  if (!video) return { kind: "not-found" };
  if (video.uploadedBy === viewer.id) return { kind: "success", video };

  const ownership = await findVideoOwnership({ db, id });
  if (!ownership) return { kind: "not-found" };
  const allowed = viewer.role === "admin" || viewer.id === ownership.customerId || viewer.id === ownership.trainerId;
  return allowed ? { kind: "success", video } : { kind: "not-found" };
}

type DiscardVideoResult = { kind: "success" } | NotFoundResult;

/**
 * Deletes a video the customer uploaded and hasn't sent (they took it off the form). A video that is part of a request
 * stays: the trainer may be reading it.
 *
 * @returns `not-found` for someone else's video, one already sent, and a malformed id alike.
 * @throws When the bucket fails; the row stays, so the delete can be retried.
 */
export async function discardBehaviorVideo({
  db,
  userId,
  id,
}: {
  db: Database;
  userId: string;
  id: string;
}): Promise<DiscardVideoResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const video = await findVideoById({ db, id });
  if (!video || video.uploadedBy !== userId || video.behaviorRequestId !== null) return { kind: "not-found" };

  // The bucket first: if it fails the row stays and the delete can be retried; the other order could leave an object
  // nothing points to.
  await deleteObjects({ keys: [videoKey({ videoId: video.id, format: parseVideoFormat(video.format) })] });
  await deleteVideoRow({ db, id });
  return { kind: "success" };
}
