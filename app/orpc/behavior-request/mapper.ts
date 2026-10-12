import {
  BEHAVIOR_PROBLEM_CATEGORIES,
  BEHAVIOR_REQUEST_STATUSES,
  BEHAVIOR_VIDEOS_PATH,
  type BehaviorProblemCategory,
  type BehaviorRequestStatus,
} from "~/orpc/behavior-request/constants";
import type {
  BehaviorPlan,
  BehaviorVideo,
  CustomerBehaviorRequest,
  TrainerBehaviorRequest,
  TrainerBehaviorRequestSummary,
} from "~/orpc/behavior-request/contract";
import { planUnpayableReason } from "~/orpc/behavior-request/plan";
import type { BehaviorRequestRow, BehaviorVideoRecord } from "~/orpc/behavior-request/repository";
import { parseVideoFormat } from "~/orpc/behavior-request/video";
import type { Dog } from "~/orpc/dog/contract";
import { fullName, isHeadTrainer } from "~/orpc/enrollment/mapper";
import { toPublicMedia } from "~/orpc/media/mapper";

/*===== Video =====*/
/** @throws When the stored format isn't one the pipeline writes (see `parseVideoFormat`). */
export function toBehaviorVideo(record: BehaviorVideoRecord): BehaviorVideo {
  return {
    id: record.id,
    format: parseVideoFormat(record.format),
    fileName: record.fileName,
    sizeBytes: record.sizeBytes,
    url: `${BEHAVIOR_VIDEOS_PATH}/${record.id}`,
  };
}

/*===== Plan =====*/
function toPlan(row: BehaviorRequestRow): BehaviorPlan | null {
  const { request } = row;
  // A plan is shown while it matters: waiting to be paid, paid, or run out. A declined or withdrawn request has none.
  const shown = request.status === "proposed" || request.status === "paid" || request.status === "expired";
  if (
    !shown ||
    request.proposedSessions === null ||
    request.proposedPrice === null ||
    !request.proposedAt ||
    !request.proposalExpiresAt
  ) {
    return null;
  }

  return {
    sessions: request.proposedSessions,
    price: request.proposedPrice,
    note: request.trainerNote ?? "",
    proposedAt: request.proposedAt,
    expiresAt: request.proposalExpiresAt,
  };
}

/** The parts both sides see. Narrows the plain-text columns; one the lists no longer know fails loudly. */
function toBase({ row, videos }: { row: BehaviorRequestRow; videos: BehaviorVideoRecord[] }) {
  const { request } = row;
  const status = narrow<BehaviorRequestStatus>(BEHAVIOR_REQUEST_STATUSES, request.status, "behavior request status");

  return {
    id: request.id,
    status,
    problemCategory: narrow<BehaviorProblemCategory>(
      BEHAVIOR_PROBLEM_CATEGORIES,
      request.problemCategory,
      "behavior problem category",
    ),
    description: request.description,
    address: request.address,
    preferredTimes: request.preferredTimes,
    dog: { id: row.dog.id, name: row.dog.name, photo: row.photo ? toPublicMedia(row.photo) : null },
    videos: videos.map(toBehaviorVideo),
    plan: toPlan(row),
    declineReason: status === "declined" ? request.trainerNote : null,
    enrollmentId: row.enrollmentId,
    createdAt: request.createdAt,
  };
}

/*===== Customer =====*/
export function toCustomerBehaviorRequest({
  row,
  videos,
  now,
}: {
  row: BehaviorRequestRow;
  videos: BehaviorVideoRecord[];
  now: Date;
}): CustomerBehaviorRequest {
  const base = toBase({ row, videos });

  return {
    ...base,
    trainer: { name: fullName(row.trainer), isHeadTrainer: isHeadTrainer(row.trainer) },
    canPay: base.status === "proposed" && planUnpayableReason({ plan: row.request, now }) === null,
    canWithdraw: base.status === "submitted" || base.status === "proposed",
  };
}

/*===== Trainer =====*/
export function toTrainerBehaviorRequestSummary({
  row,
  videos,
}: {
  row: BehaviorRequestRow;
  videos: BehaviorVideoRecord[];
}): TrainerBehaviorRequestSummary {
  const base = toBase({ row, videos });
  return { ...base, customer: { name: fullName(row.customer) }, needsAnswer: base.status === "submitted" };
}

export function toTrainerBehaviorRequest({
  row,
  videos,
  dog,
}: {
  row: BehaviorRequestRow;
  videos: BehaviorVideoRecord[];
  dog: Dog;
}): TrainerBehaviorRequest {
  const base = toBase({ row, videos });

  return {
    ...base,
    dog,
    customer: { name: fullName(row.customer), phoneNumber: row.customer.phoneNumber },
    needsAnswer: base.status === "submitted",
    canAnswer: base.status === "submitted" || base.status === "proposed",
  };
}

/*===== Type Guards =====*/
/** @throws When `value` isn't one of `allowed`: corrupted data that should surface. */
function narrow<T extends string>(allowed: readonly string[], value: string, what: string): T {
  if (!allowed.includes(value)) throw new Error(`Unknown ${what}: ${value}`);
  return value as T;
}
