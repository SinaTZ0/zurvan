import type { Database, DatabaseOrTransaction, Transaction } from "~/db/client.server";
import {
  allocateDiscount,
  calculateEnrollmentRefund,
  DEFAULT_PARTNER_COMMISSION_PERCENT,
  splitPurchase,
  splitRefund,
  type EnrollmentRefund,
} from "~/lib/business-rules";
import { formatNumberFa } from "~/lib/digits";
import { ageInMonths } from "~/lib/dog-format";
import { utcToTehranParts } from "~/lib/tehran-time";
import type { PaymentGateway } from "~/lib/payment-gateway.server";
import { formatRecordNumber } from "~/lib/record-number";
import { issuesToErrorData } from "~/lib/schema-issues";
import { isUuid } from "~/lib/uuid";
import { sendSms, type SmsKind } from "~/lib/sms.server";
import { findApprovedCourseBySlug } from "~/orpc/course/repository";
import type { Dog } from "~/orpc/dog/contract";
import { listDogs } from "~/orpc/dog/service";
import type { CancelledByRole, EnrollmentKind } from "~/orpc/enrollment/constants";
import type { BookingOptions, CheckoutOrder } from "~/orpc/order/contract";
import type { IneligibilityKind } from "~/orpc/order/constants";
import { toCheckoutOrder } from "~/orpc/order/mapper";
import {
  addDiscountUse,
  cancelPendingOrders,
  cancelScheduledSessions,
  countCustomerUses,
  failPendingPayments,
  findCompletedAssessment,
  findCoursesByIds,
  findDiscountCode,
  findDiscountCodeById,
  findDogCourseHistory,
  findHeadTrainer,
  findOrderByCustomer,
  findOrderItems,
  findPeople,
  findRecommendingAssessments,
  findRequirements,
  findSessionUsage,
  findSupersededOrders,
  hasPaidOrder,
  insertEnrollment,
  insertOrder,
  insertOrderItems,
  insertPayment,
  lockDogsOfCustomer,
  lockEnrollment,
  lockOrder,
  lockPaymentByAuthority,
  nextOrderSequence,
  settlePayment,
  updateEnrollment,
  updateOrder,
  updateOrderItem,
  type CourseRecord,
  type DiscountCodeRecord,
  type DogCourseHistoryRow,
  type OrderItemRecord,
  type OrderRecord,
  type RequirementRecord,
} from "~/orpc/order/repository";
import {
  bookInputSchema,
  cancelInputSchema,
  discountCodeInputSchema,
  staffCancelInputSchema,
} from "~/orpc/order/validation";
import { findPurchaseOfOrderItem, findUserWallet, lockWallets } from "~/orpc/wallet/repository";
import { createTransaction, mergeLines, systemWalletIds, userWalletId, type NewLine } from "~/orpc/wallet/service";

/*===== Types =====*/
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };
type NotFoundResult = { kind: "not-found" };
/** The request is fine, but it contradicts the current state. `errors` is the Persian message for the user. */
type ConflictResult<Kind extends string> = { kind: Kind; errors: string[] };

/** `now` is a dependency so a test can stand at any moment; callers leave it out. */
type Clock = { now?: Date };

/*===== Notifications =====*/
/**
 * Sends an SMS after the change it reports has been committed. A failure is logged instead of failing the request: the
 * payment or the cancellation has happened and the screens show it.
 */
async function notify({ phoneNumber, kind, body }: { phoneNumber: string | null; kind: SmsKind; body: string }) {
  if (!phoneNumber) return;
  try {
    await sendSms({ phoneNumber, kind, body });
  } catch (error) {
    console.error(`[order] could not send the ${kind} SMS`, error);
  }
}

/** «دوره‌ی سگ همدم ۱» or «تست سگ همدم ۱», as SMS and transaction descriptions name a purchase. */
function purchaseName({ kind, title }: { kind: EnrollmentKind; title: string }): string {
  return kind === "test" ? `تست ${title}` : `دوره‌ی ${title}`;
}

/*===== Eligibility =====*/
// Spec 3.8, checked on the server whenever a dog is booked or an order is paid; the booking page shows the same
// sentences. Working defaults where the spec is silent:
//   - A test needs neither a record nor the course's prerequisites: it is an assessment itself (3.6), and it is how a
//     dog trained elsewhere joins a path midway. The age range and "not already enrolled" still apply.
//   - An age range is inclusive in whole months: BMC's 6–7 months takes a dog of 7 months and 20 days.

/** Why a course, or its test, can't be booked online at all. Null when it can. */
function courseUnavailableReason({ course, kind }: { course: CourseRecord; kind: EnrollmentKind }): string | null {
  if (course.bookingKind === "behavior-request") return "اصلاح رفتار با فرستادن درخواست و ویدیوی رفتار سگ شروع می‌شود.";
  if (kind === "test") return course.testPrice === null ? "این دوره تست ندارد." : null;
  if (course.price === null || course.sessionCount === null) {
    // TODO(business-logic): B17 — working and sport dogs are published without online booking.
    return "قیمت و برنامه‌ی این دوره بعد از ارزیابی رایگان گفته می‌شود.";
  }
  return null;
}

type DogVerdict = { problems: { kind: IneligibilityKind; message: string }[]; hasPassed: boolean };

/** Checks one dog against a course. Pure: the caller has read the course's requirements and the dog's history. */
function judgeDog({
  dog,
  hasRecord,
  course,
  kind,
  requirements,
  history,
  today,
}: {
  dog: { id: string; name: string; birthDate: string };
  hasRecord: boolean;
  course: CourseRecord;
  kind: EnrollmentKind;
  requirements: RequirementRecord[];
  history: DogCourseHistoryRow[];
  /** `YYYY-MM-DD` in Tehran: age is checked on the day of booking. */
  today: string;
}): DogVerdict {
  const problems: DogVerdict["problems"] = [];
  const mine = history.filter((row) => row.dogId === dog.id);
  const passed = new Set(mine.filter((row) => row.status === "passed").map((row) => row.courseId));

  /*------ Record and Prerequisites ------*/
  if (kind === "course") {
    if (!hasRecord) {
      problems.push({
        kind: "no-record",
        message: `${dog.name} هنوز ارزیابی نشده. اول یک ارزیابی رایگان رزرو کن تا ببینم از کجا شروع کنیم.`,
      });
    }
    for (const requirement of requirements) {
      if (passed.has(requirement.requiredCourseId)) continue;
      problems.push({
        kind: "prerequisite",
        message: requirement.hasTest
          ? `${dog.name} اول باید «${requirement.title}» یا تست آن را بگذراند.`
          : `${dog.name} اول باید «${requirement.title}» را بگذراند.`,
      });
    }
  }

  /*------ Age ------*/
  const age = ageInMonths({ birthDate: dog.birthDate, today });
  if (course.minAgeMonths !== null && age < course.minAgeMonths) {
    problems.push({
      kind: "too-young",
      message: `این دوره برای سگ‌های دست‌کم ${formatNumberFa(course.minAgeMonths)} ماهه است؛ ${dog.name} هنوز کوچک است.`,
    });
  }
  if (course.maxAgeMonths !== null && age > course.maxAgeMonths) {
    problems.push({
      kind: "too-old",
      message: `این دوره برای سگ‌های تا ${formatNumberFa(course.maxAgeMonths)} ماه است؛ ${dog.name} از این سن گذشته.`,
    });
  }

  /*------ Already Enrolled ------*/
  if (mine.some((row) => row.courseId === course.id && row.status !== "passed")) {
    problems.push({ kind: "live-enrollment", message: `${dog.name} همین حالا در این دوره ثبت‌نام شده است.` });
  }

  return { problems, hasPassed: passed.has(course.id) };
}

/*===== Booking Options =====*/
type BookingOptionsResult = { kind: "success"; options: BookingOptions } | NotFoundResult;

/** What the booking page shows: the course or its test, and each of the customer's dogs with its eligibility. */
export async function getBookingOptions({
  db,
  customerId,
  courseSlug,
  kind,
  now = new Date(),
}: {
  db: Database;
  customerId: string;
  courseSlug: string;
  kind: EnrollmentKind;
} & Clock): Promise<BookingOptionsResult> {
  const found = await findApprovedCourseBySlug({ db, slug: courseSlug });
  if (!found) return { kind: "not-found" };
  const { course, refundPolicy } = found;

  const dogs = await listDogs({ db, ownerId: customerId });
  const dogIds = dogs.map((dog) => dog.id);
  const [requirements, history, recommendations] = await Promise.all([
    findRequirements({ db, courseId: course.id }),
    findDogCourseHistory({ db, dogIds }),
    findRecommendingAssessments({ db, dogIds, courseId: course.id }),
  ]);
  const today = utcToTehranParts(now).date;

  return {
    kind: "success",
    options: {
      course: {
        slug: course.slug,
        title: course.title,
        latinName: course.latinName,
        place:
          course.place === "home" || course.place === "outside" || course.place === "mostly-outside"
            ? course.place
            : null,
        sessionCount: course.sessionCount,
        minAgeMonths: course.minAgeMonths,
        maxAgeMonths: course.maxAgeMonths,
        price: kind === "test" ? course.testPrice : course.price,
        // Boarding is part of a course, not of a one-session test.
        boardingPrice: kind === "test" ? null : course.boardingPrice,
        hasTest: course.testPrice !== null,
        refundPolicy: {
          name: refundPolicy.name,
          description: refundPolicy.customerDescription,
          percent: refundPolicy.unheldRefundPercent,
        },
        prerequisites: requirements.map(({ slug, title, hasTest }) => ({ slug, title, hasTest })),
      },
      kind,
      unavailableReason: courseUnavailableReason({ course, kind }),
      dogs: dogs.map((dog) => {
        const verdict = judgeDog({ dog, hasRecord: dog.hasRecord, course, kind, requirements, history, today });
        const recommendation = recommendations.find((entry) => entry.dogId === dog.id);
        return {
          dog,
          eligible: verdict.problems.length === 0,
          problems: verdict.problems,
          hasPassed: verdict.hasPassed,
          recommendation: recommendation
            ? { assessmentId: recommendation.assessmentId, position: recommendation.position }
            : null,
        };
      }),
    },
  };
}

/*===== Book =====*/
type BookResult =
  { kind: "success"; orderId: string } | InvalidResult | NotFoundResult | ConflictResult<"not-eligible">;

/**
 * Books a course or its test for one of the customer's dogs: checks the dog (locked, so a payment can't enroll it
 * meanwhile), then creates a pending order with one item, its price and refund policy copied as they are now. Nothing
 * is paid and no enrollment exists until the order is paid. An earlier pending order for the same dog and course is
 * cancelled, so a customer who goes back and books again isn't left with two.
 *
 * @returns `invalid` with per-field messages (boarding, address, the retake confirmation); `not-found` for another
 * customer's dog, a removed one, a course that isn't approved, and malformed ids; `not-eligible` with the reasons.
 */
export async function bookCourse({
  db,
  customerId,
  input,
  now = new Date(),
}: { db: Database; customerId: string; input: unknown } & Clock): Promise<BookResult> {
  const parsed = bookInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  const details = parsed.data;
  if (!isUuid(details.dogId)) return { kind: "not-found" };

  const found = await findApprovedCourseBySlug({ db, slug: details.courseSlug });
  if (!found) return { kind: "not-found" };
  const { course, refundPolicy } = found;

  const unavailable = courseUnavailableReason({ course, kind: details.kind });
  if (unavailable) return { kind: "not-eligible", errors: [unavailable] };

  /*------ Booking Details ------*/
  const fields: Record<string, string> = {};
  if (details.boarding && course.boardingPrice === null) {
    fields.boarding = "پانسیون این دوره قیمت ثابت ندارد؛ برای آن با ما تماس بگیر.";
  }
  if (details.boarding && details.kind === "test") fields.boarding = "تست یک جلسه است و پانسیون ندارد.";
  if (!details.boarding && !details.address) fields.address = "نشانی محل جلسه‌ها را بنویس.";
  if (Object.keys(fields).length > 0) return { kind: "invalid", errors: [], fields };

  return db.transaction(async (tx): Promise<BookResult> => {
    /*------ Dog ------*/
    const [locked] = await lockDogsOfCustomer({ db: tx, customerId, ids: [details.dogId] });
    if (!locked || locked.deletedAt) return { kind: "not-found" };

    const dogs = await listDogs({ db: tx, ownerId: customerId });
    const dog = dogs.find((candidate) => candidate.id === details.dogId);
    if (!dog) return { kind: "not-found" };

    const verdict = await judgeDogNow({ db: tx, dog, course, kind: details.kind, now });
    if (verdict.problems.length > 0) {
      return { kind: "not-eligible", errors: verdict.problems.map((problem) => problem.message) };
    }
    if (verdict.hasPassed && !details.confirmRetake) {
      return {
        kind: "invalid",
        errors: [],
        fields: { confirmRetake: `${dog.name} این دوره را قبلاً با موفقیت گذرانده است. برای دوباره گرفتنش تأیید کن.` },
      };
    }

    // An assessment id that isn't this dog's completed one is dropped rather than refused: it only labels the booking.
    const assessmentId =
      details.assessmentId && isUuid(details.assessmentId)
        ? ((await findCompletedAssessment({ db: tx, customerId, dogId: dog.id, id: details.assessmentId }))?.id ?? null)
        : null;

    /*------ Replace an Earlier Booking ------*/
    const superseded = await findSupersededOrders({
      db: tx,
      customerId,
      exceptId: null,
      sameBooking: { dogId: dog.id, courseId: course.id },
      spendingWallet: false,
    });
    await cancelPendingOrders({ db: tx, ids: superseded, reason: "سفارش تازه‌تری جای آن را گرفت." });

    /*------ Order ------*/
    // `courseUnavailableReason` has made sure the price exists.
    const basePrice = (details.kind === "test" ? course.testPrice : course.price) ?? 0;
    const boardingPrice = details.boarding ? (course.boardingPrice ?? 0) : 0;
    const unitPrice = basePrice + boardingPrice;

    const order = await insertOrder({
      db: tx,
      values: {
        number: formatRecordNumber({ prefix: "ZR", sequence: await nextOrderSequence({ db: tx }), at: now }),
        customerId,
        subtotal: unitPrice,
        totalAmount: unitPrice,
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
          kind: details.kind,
          assessmentId,
          trainingGoal: details.trainingGoal,
          boarding: details.boarding,
          address: details.boarding ? null : details.address,
          preferredTimes: details.preferredTimes,
          isRetake: verdict.hasPassed,
          unitPrice,
          boardingPrice,
          paidAmount: unitPrice,
          refundPolicyName: refundPolicy.name,
          refundPolicyPercent: refundPolicy.unheldRefundPercent,
        },
      ],
    });

    return { kind: "success", orderId: order.id };
  });
}

/** Reads what `judgeDog` needs for one dog and judges it now. */
async function judgeDogNow({
  db,
  dog,
  course,
  kind,
  now,
}: {
  db: DatabaseOrTransaction;
  dog: Dog;
  course: CourseRecord;
  kind: EnrollmentKind;
  now: Date;
}): Promise<DogVerdict> {
  const [requirements, history] = await Promise.all([
    findRequirements({ db, courseId: course.id }),
    findDogCourseHistory({ db, dogIds: [dog.id] }),
  ]);
  return judgeDog({
    dog,
    hasRecord: dog.hasRecord,
    course,
    kind,
    requirements,
    history,
    today: utcToTehranParts(now).date,
  });
}

/*===== Get =====*/
type GetOrderResult = { kind: "success"; order: CheckoutOrder } | NotFoundResult;

/** One of the customer's orders, with their wallet balance for the checkout. */
export async function getOrder({
  db,
  customerId,
  id,
}: {
  db: DatabaseOrTransaction;
  customerId: string;
  id: string;
}): Promise<GetOrderResult> {
  if (!isUuid(id)) return { kind: "not-found" };
  const row = await findOrderByCustomer({ db, customerId, id });
  if (!row) return { kind: "not-found" };

  const wallet = await findUserWallet({ db, userId: customerId });
  return { kind: "success", order: toCheckoutOrder({ row, walletBalance: wallet?.balance ?? 0 }) };
}

/*===== Discount Codes =====*/
// Spec 3.10. A code is checked when it is applied and again when the order is paid, since it may have run out or
// expired in between. A use is counted when the order is paid.

type DiscountPricing = { kind: "success"; total: number; perItem: number[] } | { kind: "rejected"; message: string };

/**
 * Works out a code's discount on an order, or why it can't be used.
 *
 * - The order's subtotal must reach the code's minimum.
 * - A percentage applies to the items in the code's scope, capped by its maximum; a fixed amount is capped by them.
 * - The discount is spread over those items in proportion to their price (B6), so each enrollment has a known paid
 *   amount for refunds.
 */
async function priceDiscount({
  db,
  code,
  courseIds,
  customerId,
  items,
  now,
}: {
  db: DatabaseOrTransaction;
  code: DiscountCodeRecord;
  courseIds: string[];
  customerId: string;
  items: Pick<OrderItemRecord, "courseId" | "unitPrice">[];
  now: Date;
}): Promise<DiscountPricing> {
  /*------ The Code Itself ------*/
  if (!code.isActive || now < code.startsAt || now > code.endsAt) {
    return { kind: "rejected", message: "این کد تخفیف فعال نیست یا تاریخش گذشته." };
  }
  if (code.totalUsageLimit !== null && code.usedCount >= code.totalUsageLimit) {
    return { kind: "rejected", message: "ظرفیت این کد تخفیف تمام شده." };
  }
  if (code.perCustomerLimit !== null) {
    const uses = await countCustomerUses({ db, discountCodeId: code.id, customerId });
    if (uses >= code.perCustomerLimit) return { kind: "rejected", message: "قبلاً از این کد تخفیف استفاده کرده‌ای." };
  }
  if (code.firstOrderOnly && (await hasPaidOrder({ db, customerId }))) {
    return { kind: "rejected", message: "این کد فقط برای اولین خرید است." };
  }

  /*------ The Order ------*/
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice, 0);
  if (code.minOrderAmount !== null && subtotal < code.minOrderAmount) {
    return {
      kind: "rejected",
      message: `این کد برای خریدهای از ${formatNumberFa(Math.round(code.minOrderAmount / 10))} تومان به بالاست.`,
    };
  }

  const inScope = items.map((item) => code.scope === "all" || courseIds.includes(item.courseId));
  const eligiblePrices = items.map((item, index) => (inScope[index] ? item.unitPrice : 0));
  const eligibleSubtotal = eligiblePrices.reduce((sum, price) => sum + price, 0);
  if (eligibleSubtotal === 0) return { kind: "rejected", message: "این کد تخفیف برای این دوره نیست." };

  let total =
    code.type === "percentage"
      ? Math.floor((eligibleSubtotal * code.value) / 100)
      : Math.min(code.value, eligibleSubtotal);
  if (code.type === "percentage" && code.maxDiscountAmount !== null) total = Math.min(total, code.maxDiscountAmount);

  return { kind: "success", total, perItem: allocateDiscount({ itemPrices: eligiblePrices, discount: total }) };
}

/** Writes a discount (or none) onto a pending order and its items. */
async function writeDiscount({
  db,
  order,
  items,
  discountCodeId,
  pricing,
}: {
  db: DatabaseOrTransaction;
  order: OrderRecord;
  items: OrderItemRecord[];
  discountCodeId: string | null;
  pricing: { total: number; perItem: number[] } | null;
}) {
  for (const [index, item] of items.entries()) {
    const discount = pricing?.perItem[index] ?? 0;
    await updateOrderItem({
      db,
      id: item.id,
      values: { discountAmount: discount, paidAmount: item.unitPrice - discount },
    });
  }
  const discountAmount = pricing?.total ?? 0;
  await updateOrder({
    db,
    id: order.id,
    values: { discountCodeId, discountAmount, totalAmount: order.subtotal - discountAmount },
  });
}

type DiscountResult =
  { kind: "success"; order: CheckoutOrder } | InvalidResult | NotFoundResult | ConflictResult<"not-payable">;

const NOT_PENDING_MESSAGE = "این سفارش دیگر در انتظار پرداخت نیست.";

/**
 * Applies a discount code to a pending order, replacing any code it had.
 *
 * @returns `invalid` with the reason in `fields.code` when the code can't be used.
 */
export async function applyDiscountCode({
  db,
  customerId,
  id,
  input,
  now = new Date(),
}: { db: Database; customerId: string; id: string; input: unknown } & Clock): Promise<DiscountResult> {
  const parsed = discountCodeInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  if (!isUuid(id)) return { kind: "not-found" };

  const outcome = await db.transaction(async (tx): Promise<DiscountResult | { kind: "applied" }> => {
    const order = await lockOrder({ db: tx, id });
    if (!order || order.customerId !== customerId) return { kind: "not-found" };
    if (order.paymentStatus !== "pending") return { kind: "not-payable", errors: [NOT_PENDING_MESSAGE] };

    const found = await findDiscountCode({ db: tx, code: parsed.data.code });
    if (!found) return { kind: "invalid", errors: [], fields: { code: "این کد تخفیف پیدا نشد." } };

    const items = await findOrderItems({ db: tx, orderId: order.id });
    const pricing = await priceDiscount({ db: tx, ...found, customerId, items, now });
    if (pricing.kind === "rejected") return { kind: "invalid", errors: [], fields: { code: pricing.message } };

    await writeDiscount({ db: tx, order, items, discountCodeId: found.code.id, pricing });
    return { kind: "applied" };
  });

  if (outcome.kind !== "applied") return outcome;
  const result = await getOrder({ db, customerId, id });
  if (result.kind !== "success") throw new Error(`applyDiscountCode: order ${id} could not be read back`);
  return result;
}

/** Takes the discount code off a pending order. */
export async function removeDiscountCode({
  db,
  customerId,
  id,
}: {
  db: Database;
  customerId: string;
  id: string;
}): Promise<DiscountResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const outcome = await db.transaction(async (tx): Promise<DiscountResult | { kind: "removed" }> => {
    const order = await lockOrder({ db: tx, id });
    if (!order || order.customerId !== customerId) return { kind: "not-found" };
    if (order.paymentStatus !== "pending") return { kind: "not-payable", errors: [NOT_PENDING_MESSAGE] };

    const items = await findOrderItems({ db: tx, orderId: order.id });
    await writeDiscount({ db: tx, order, items, discountCodeId: null, pricing: null });
    return { kind: "removed" };
  });

  if (outcome.kind !== "removed") return outcome;
  const result = await getOrder({ db, customerId, id });
  if (result.kind !== "success") throw new Error(`removeDiscountCode: order ${id} could not be read back`);
  return result;
}

/*===== Fulfilment =====*/
// What a paid order turns into (spec 3.12, "Paying for an order"): for each item, its enrollment and its purchase
// transaction, in the same database transaction as the payment. Shared by the wallet-only path and the gateway
// callback, so both run exactly the same steps.

type Fulfilment =
  | {
      kind: "fulfilled";
      enrollments: { title: string; kind: EnrollmentKind; dogName: string; trainerId: string }[];
    }
  | { kind: "not-fulfilled"; reason: string };

/**
 * Enrolls the order's dogs and splits each item's paid amount between the trainer, the Admin and the partner (B1–B8).
 *
 * Every dog is locked and checked again first. If one can't be enrolled any more (it was removed, or another order
 * enrolled it in the same course meanwhile), nothing is enrolled and the order is cancelled; money that came in
 * through the gateway stays in the customer's wallet, and the wallet part was never spent.
 */
async function fulfilOrder({
  tx,
  order,
  now,
}: {
  tx: Transaction;
  order: OrderRecord;
  now: Date;
}): Promise<Fulfilment> {
  const items = await findOrderItems({ db: tx, orderId: order.id });
  const courses = await findCoursesByIds({ db: tx, ids: [...new Set(items.map((item) => item.courseId))] });
  const dogs = await lockDogsOfCustomer({
    db: tx,
    customerId: order.customerId,
    ids: [...new Set(items.map((item) => item.dogId))],
  });
  const history = await findDogCourseHistory({ db: tx, dogIds: dogs.map((dog) => dog.id) });

  /*------ Still Possible? ------*/
  for (const item of items) {
    const dog = dogs.find((candidate) => candidate.id === item.dogId);
    if (!dog || dog.deletedAt) return cancelUnfulfillable({ tx, order, reason: "سگ این سفارش از حسابت حذف شده." });
    const live = history.some(
      (row) => row.dogId === item.dogId && row.courseId === item.courseId && row.status !== "passed",
    );
    if (live) {
      return cancelUnfulfillable({ tx, order, reason: `${dog.name} همین حالا در این دوره ثبت‌نام شده است.` });
    }
  }

  /*------ Wallets ------*/
  const headTrainer = await findHeadTrainer({ db: tx });
  if (!headTrainer) throw new Error("fulfilOrder: there is no Admin to be the head trainer");
  const system = await systemWalletIds({ db: tx, kinds: ["admin"] });
  const customerWalletId = await userWalletId({ db: tx, userId: order.customerId });
  // TODO(business-logic): B3 — the partner snapshot joins when referrals exist (Partner Profile).
  const partnerWalletId = order.partnerId ? await userWalletId({ db: tx, userId: order.partnerId }) : null;

  /*------ Enrollments and Purchases ------*/
  const enrolled: Extract<Fulfilment, { kind: "fulfilled" }>["enrollments"] = [];
  for (const item of items) {
    const course = courses.find((candidate) => candidate.id === item.courseId);
    const dog = dogs.find((candidate) => candidate.id === item.dogId);
    if (!course || !dog) throw new Error(`fulfilOrder: order item ${item.id} lost its course or dog`);

    const trainerId = course.ownerTrainerId ?? headTrainer.id;
    const [trainer] = await findPeople({ db: tx, ids: [trainerId] });
    const kind = item.kind === "test" ? "test" : "course";

    await insertEnrollment({
      db: tx,
      values: {
        courseId: course.id,
        dogId: dog.id,
        customerId: order.customerId,
        trainerId,
        kind,
        orderItemId: item.id,
        assessmentId: item.assessmentId,
        trainingGoal: item.trainingGoal,
        boarding: item.boarding,
        address: item.address,
        preferredTimes: item.preferredTimes,
        // A test is one session; a course starts from its approximate count, which the trainer can change.
        plannedSessions: kind === "test" ? 1 : (course.sessionCount ?? 1),
        isRetake: item.isRetake,
        createdAt: now,
      },
    });

    // A 100% discount leaves nothing to split, and lines can't be 0 (B4).
    if (item.paidAmount > 0) {
      const split = splitPurchase({
        paidAmount: item.paidAmount,
        trainerSharePercent: course.trainerSharePercent,
        partnerCommissionPercent: DEFAULT_PARTNER_COMMISSION_PERCENT,
        hasPartner: partnerWalletId !== null,
      });
      // The head trainer has no wallet of his own: his part joins the Admin's line (B8).
      const trainerWalletId =
        trainer?.role === "admin" ? system.admin : await userWalletId({ db: tx, userId: trainerId });
      await createTransaction({
        db: tx,
        now,
        transaction: {
          type: "purchase",
          description: `خرید ${purchaseName({ kind, title: course.title })} برای ${dog.name}`,
          orderItemId: item.id,
          lines: mergeLines([
            { walletId: customerWalletId, amount: split.customer },
            { walletId: trainerWalletId, amount: split.trainer },
            { walletId: system.admin, amount: split.admin },
            ...(partnerWalletId ? [{ walletId: partnerWalletId, amount: split.partner }] : []),
          ]),
        },
      });
    }

    enrolled.push({ title: course.title, kind, dogName: dog.name, trainerId });
  }

  /*------ Order ------*/
  if (order.discountCodeId) await addDiscountUse({ db: tx, id: order.discountCodeId, delta: 1 });
  await updateOrder({ db: tx, id: order.id, values: { paymentStatus: "paid", paidAt: now } });

  return { kind: "fulfilled", enrollments: enrolled };
}

async function cancelUnfulfillable({
  tx,
  order,
  reason,
}: {
  tx: Transaction;
  order: OrderRecord;
  reason: string;
}): Promise<Fulfilment> {
  await updateOrder({ db: tx, id: order.id, values: { paymentStatus: "cancelled" } });
  return { kind: "not-fulfilled", reason };
}

/** Tells the customer and each trainer about a fulfilled order, after it has been committed. */
async function notifyFulfilment({
  db,
  order,
  fulfilment,
}: {
  db: DatabaseOrTransaction;
  order: OrderRecord;
  fulfilment: Fulfilment;
}) {
  const people = await findPeople({
    db,
    ids: [
      order.customerId,
      ...(fulfilment.kind === "fulfilled" ? fulfilment.enrollments.map((entry) => entry.trainerId) : []),
    ],
  });
  const customer = people.find((person) => person.id === order.customerId);

  if (fulfilment.kind === "not-fulfilled") {
    await notify({
      phoneNumber: customer?.phoneNumber ?? null,
      kind: "enrollment-cancelled",
      body: `آموزش K9: سفارش ${order.number} انجام نشد: ${fulfilment.reason} مبلغ پرداختی در کیف پولت است.`,
    });
    return;
  }

  for (const entry of fulfilment.enrollments) {
    const trainer = people.find((person) => person.id === entry.trainerId);
    const name = purchaseName(entry);
    await notify({
      phoneNumber: customer?.phoneNumber ?? null,
      kind: "enrollment-created",
      body: `آموزش K9: ${name} برای ${entry.dogName} ثبت شد. ${trainer?.name ?? "مربی"} برای اولین جلسه با تو هماهنگ می‌کند.`,
    });
    await notify({
      phoneNumber: trainer?.phoneNumber ?? null,
      kind: "enrollment-created",
      body: `آموزش K9: ${customer?.name ?? "یک مشتری"} ${name} را برای ${entry.dogName} خرید. اولین جلسه را هماهنگ کن.`,
    });
  }
}

/*===== Pay =====*/
type PayResult =
  | { kind: "paid"; orderId: string }
  | { kind: "redirect"; orderId: string; url: string }
  | NotFoundResult
  | ConflictResult<"not-payable">;

/**
 * Pays a pending order (spec 3.12): a positive wallet balance first when `useWallet`, the rest through the gateway.
 *
 * The order is locked and checked again (the dogs can still be enrolled, the discount code still holds). The amounts
 * are then fixed on the order, and a customer's other pending order that spends the wallet is cancelled, since the
 * same balance can't be spent twice. When the wallet (or a 0 total) covers everything, the order is fulfilled at once;
 * otherwise a gateway payment is started and the customer is sent to it, and the callback finishes the job.
 *
 * @returns `paid`, or `redirect` with the gateway's URL; `not-found` for another customer's order; `not-payable` with
 * the reason when it isn't pending or can't be fulfilled any more. A code that lapsed is removed, and the customer is
 * asked to look at the new total.
 */
export async function payOrder({
  db,
  gateway,
  customerId,
  id,
  useWallet,
  callbackUrl,
  now = new Date(),
}: {
  db: Database;
  gateway: PaymentGateway;
  customerId: string;
  id: string;
  useWallet: boolean;
  /** The absolute URL of the payment callback route. */
  callbackUrl: string;
} & Clock): Promise<PayResult> {
  if (!isUuid(id)) return { kind: "not-found" };

  const prepared = await db.transaction(
    async (
      tx,
    ): Promise<
      | NotFoundResult
      | ConflictResult<"not-payable">
      | { kind: "fulfilled"; order: OrderRecord; fulfilment: Fulfilment }
      | { kind: "to-gateway"; order: OrderRecord }
    > => {
      const order = await lockOrder({ db: tx, id });
      if (!order || order.customerId !== customerId) return { kind: "not-found" };
      if (order.paymentStatus !== "pending") return { kind: "not-payable", errors: [NOT_PENDING_MESSAGE] };

      /*------ Still Eligible ------*/
      const items = await findOrderItems({ db: tx, orderId: order.id });
      const blocking = await findBlockingProblem({ tx, customerId, items, now });
      if (blocking) return { kind: "not-payable", errors: [blocking] };

      /*------ Discount Still Valid ------*/
      let total = order.totalAmount;
      if (order.discountCodeId) {
        const found = await findDiscountCodeById({ db: tx, id: order.discountCodeId });
        const pricing = found ? await priceDiscount({ db: tx, ...found, customerId, items, now }) : null;
        if (!pricing || pricing.kind === "rejected" || pricing.total !== order.discountAmount) {
          await writeDiscount({ db: tx, order, items, discountCodeId: null, pricing: null });
          return {
            kind: "not-payable",
            errors: [
              `${pricing?.kind === "rejected" ? pricing.message : "کد تخفیف دیگر معتبر نیست."} مبلغ دوباره حساب شد.`,
            ],
          };
        }
        total = order.subtotal - pricing.total;
      }

      /*------ Wallet ------*/
      const walletId = await userWalletId({ db: tx, userId: customerId });
      const [wallet] = await lockWallets({ db: tx, ids: [walletId] });
      const fromWallet = useWallet ? Math.min(Math.max(wallet?.balance ?? 0, 0), total) : 0;
      if (fromWallet > 0) {
        const others = await findSupersededOrders({
          db: tx,
          customerId,
          exceptId: order.id,
          sameBooking: null,
          spendingWallet: true,
        });
        await cancelPendingOrders({ db: tx, ids: others, reason: "سفارش دیگری از کیف پول پرداخت شد." });
      }
      // A new attempt replaces any earlier one that never came back from the gateway.
      await failPendingPayments({ db: tx, orderIds: [order.id], reason: "پرداخت تازه‌تری شروع شد." });
      await updateOrder({
        db: tx,
        id: order.id,
        values: { paidFromWallet: fromWallet, paidViaGateway: total - fromWallet },
      });
      const updated = { ...order, totalAmount: total, paidFromWallet: fromWallet, paidViaGateway: total - fromWallet };

      if (updated.paidViaGateway > 0) return { kind: "to-gateway", order: updated };
      return { kind: "fulfilled", order: updated, fulfilment: await fulfilOrder({ tx, order: updated, now }) };
    },
  );

  if (prepared.kind === "not-found" || prepared.kind === "not-payable") return prepared;
  if (prepared.kind === "fulfilled") {
    await notifyFulfilment({ db, order: prepared.order, fulfilment: prepared.fulfilment });
    if (prepared.fulfilment.kind === "not-fulfilled")
      return { kind: "not-payable", errors: [prepared.fulfilment.reason] };
    return { kind: "paid", orderId: prepared.order.id };
  }

  /*------ Gateway ------*/
  // Started outside the database transaction: a real gateway is an HTTP call, and no lock should wait on it.
  const started = await gateway.start({ amount: prepared.order.paidViaGateway, callbackUrl });
  await insertPayment({
    db,
    values: {
      userId: customerId,
      orderId: prepared.order.id,
      amount: prepared.order.paidViaGateway,
      gateway: gateway.name,
      authority: started.authority,
      createdAt: now,
    },
  });
  return { kind: "redirect", orderId: prepared.order.id, url: started.redirectUrl };
}

/** The first reason an order's items can't be enrolled now, or null. */
async function findBlockingProblem({
  tx,
  customerId,
  items,
  now,
}: {
  tx: Transaction;
  customerId: string;
  items: OrderItemRecord[];
  now: Date;
}): Promise<string | null> {
  const dogs = await listDogs({ db: tx, ownerId: customerId });
  const courses = await findCoursesByIds({ db: tx, ids: items.map((item) => item.courseId) });

  for (const item of items) {
    const dog = dogs.find((candidate) => candidate.id === item.dogId);
    const course = courses.find((candidate) => candidate.id === item.courseId);
    if (!dog) return "سگ این سفارش از حسابت حذف شده.";
    if (!course || course.status !== "approved") return "این دوره دیگر رزرو نمی‌شود.";

    const kind = item.kind === "test" ? "test" : "course";
    const verdict = await judgeDogNow({ db: tx, dog, course, kind, now });
    const [problem] = verdict.problems;
    if (problem) return problem.message;
  }
  return null;
}

/*===== Gateway Callback =====*/
type CallbackResult =
  | { kind: "unknown" }
  | { kind: "already-settled"; orderId: string }
  | { kind: "failed"; orderId: string }
  | { kind: "succeeded"; orderId: string; fulfilled: boolean };

/**
 * Handles the gateway's callback: verifies the payment server-side, then, in one database transaction, settles the
 * Payment, moves the money in (`Gateway −g, Customer +g`) and fulfils the order.
 *
 * Idempotent: the payment is locked and must still be pending, so a repeated or concurrent callback finds it settled
 * and changes nothing. Money that arrives for an order that was cancelled meanwhile stays in the customer's wallet.
 */
export async function completeGatewayPayment({
  db,
  gateway,
  authority,
  callbackParams,
  now = new Date(),
}: {
  db: Database;
  gateway: PaymentGateway;
  authority: string;
  callbackParams: URLSearchParams;
} & Clock): Promise<CallbackResult> {
  const known = await lockPaymentByAuthority({ db, authority });
  if (!known) return { kind: "unknown" };
  if (known.status !== "pending") return { kind: "already-settled", orderId: known.orderId };

  const verification = await gateway.verify({ authority, amount: known.amount, callbackParams });

  const outcome = await db.transaction(
    async (tx): Promise<CallbackResult & { order?: OrderRecord; fulfilment?: Fulfilment }> => {
      const payment = await lockPaymentByAuthority({ db: tx, authority });
      if (!payment || payment.status !== "pending") return { kind: "already-settled", orderId: known.orderId };

      if (!verification.ok) {
        await settlePayment({
          db: tx,
          id: payment.id,
          values: {
            status: "failed",
            failureReason: verification.reason,
            referenceId: null,
            cardNumberMasked: null,
            paidAt: null,
          },
        });
        return { kind: "failed", orderId: payment.orderId };
      }

      /*------ Money In ------*/
      await settlePayment({
        db: tx,
        id: payment.id,
        values: {
          status: "succeeded",
          referenceId: verification.referenceId,
          cardNumberMasked: verification.cardNumberMasked,
          failureReason: null,
          paidAt: now,
        },
      });
      const system = await systemWalletIds({ db: tx, kinds: ["gateway"] });
      const customerWalletId = await userWalletId({ db: tx, userId: payment.userId });
      const order = await lockOrder({ db: tx, id: payment.orderId });
      await createTransaction({
        db: tx,
        now,
        transaction: {
          type: "gateway-payment",
          description: `پرداخت آنلاین سفارش ${order?.number ?? ""}`.trim(),
          paymentId: payment.id,
          lines: [
            { walletId: system.gateway, amount: -payment.amount },
            { walletId: customerWalletId, amount: payment.amount },
          ],
        },
      });

      /*------ Fulfil ------*/
      // Only an order still waiting for exactly this amount. Otherwise the money stays in the wallet, where the
      // customer can spend it or withdraw it.
      if (!order || order.paymentStatus !== "pending" || order.paidViaGateway !== payment.amount) {
        return { kind: "succeeded", orderId: payment.orderId, fulfilled: false };
      }
      const fulfilment = await fulfilOrder({ tx, order, now });
      return {
        kind: "succeeded",
        orderId: order.id,
        fulfilled: fulfilment.kind === "fulfilled",
        order,
        fulfilment,
      };
    },
  );

  if (outcome.order && outcome.fulfilment) {
    await notifyFulfilment({ db, order: outcome.order, fulfilment: outcome.fulfilment });
  }
  const { order: _order, fulfilment: _fulfilment, ...result } = outcome;
  return result;
}

/*===== Cancel an Enrollment =====*/
/** Who is cancelling. A customer cancels their own; a trainer their own students'; the Admin anyone's. */
export type CancelActor = { userId: string; role: "customer" | "trainer" | "admin" };

type CancelResult =
  | { kind: "success"; enrollmentId: string; refund: EnrollmentRefund }
  | InvalidResult
  | NotFoundResult
  | ConflictResult<"not-cancellable">;

/**
 * Cancels a live enrollment and refunds it (spec 3.9, B11, B12), in one database transaction: the enrollment and its
 * upcoming sessions are cancelled, and the refund is a proportional mirror of the item's purchase transaction (B5),
 * landing in the customer's wallet at once. The order's refunded amount and status follow, and a code's use is given
 * back when the order is fully refunded.
 *
 * @returns `invalid` for a missing or too-long reason (trainers and the Admin must give one); `not-found` when the
 * enrollment isn't the actor's; `not-cancellable` when it has ended or was cancelled already.
 */
export async function cancelEnrollment({
  db,
  actor,
  id,
  input,
  now = new Date(),
}: { db: Database; actor: CancelActor; id: string; input: unknown } & Clock): Promise<CancelResult> {
  const parsed = (actor.role === "customer" ? cancelInputSchema : staffCancelInputSchema).safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };
  if (!isUuid(id)) return { kind: "not-found" };
  const reason = parsed.data.reason;

  const outcome = await db.transaction(
    async (
      tx,
    ): Promise<
      | NotFoundResult
      | ConflictResult<"not-cancellable">
      | { kind: "cancelled"; refund: EnrollmentRefund; customerId: string; trainerId: string; label: string }
    > => {
      const locked = await lockEnrollment({ db: tx, id });
      const mine =
        locked &&
        (actor.role === "admin" ||
          (actor.role === "customer" && locked.enrollment.customerId === actor.userId) ||
          (actor.role === "trainer" && locked.enrollment.trainerId === actor.userId));
      if (!locked || !mine) return { kind: "not-found" };
      const { enrollment, item } = locked;

      if (enrollment.status !== "scheduling" && enrollment.status !== "active") {
        return { kind: "not-cancellable", errors: ["این آموزش دیگر لغو نمی‌شود."] };
      }

      /*------ Refund Amount ------*/
      const usage = await findSessionUsage({ db: tx, enrollmentId: enrollment.id });
      const kind = enrollment.kind === "test" ? "test" : "course";
      const refund = calculateEnrollmentRefund({
        kind,
        paidAmount: item.paidAmount - item.refundedAmount,
        plannedSessions: enrollment.plannedSessions,
        usedSessions: usage.usedSessions,
        policyPercent: item.refundPolicyPercent,
        cancelledBy: actor.role === "customer" ? "customer" : "staff",
        nextSessionStartsAt: usage.nextSessionStartsAt,
        now,
      });

      /*------ Enrollment ------*/
      const cancelledByRole: CancelledByRole = actor.role;
      await updateEnrollment({
        db: tx,
        id: enrollment.id,
        values: {
          status: "cancelled",
          cancelledById: actor.userId,
          cancelledByRole,
          cancellationReason: reason,
          cancelledAt: now,
        },
      });
      await cancelScheduledSessions({ db: tx, enrollmentId: enrollment.id });

      const [course] = await findCoursesByIds({ db: tx, ids: [enrollment.courseId] });
      const [dog] = await lockDogsOfCustomer({ db: tx, customerId: enrollment.customerId, ids: [enrollment.dogId] });
      const label = `${purchaseName({ kind, title: course?.title ?? "" })} برای ${dog?.name ?? "سگ"}`;

      /*------ Refund ------*/
      if (refund.amount > 0)
        await refundOrderItem({ tx, item, amount: refund.amount, customerId: enrollment.customerId, label, now });

      return { kind: "cancelled", refund, customerId: enrollment.customerId, trainerId: enrollment.trainerId, label };
    },
  );

  if (outcome.kind !== "cancelled") return outcome;

  /*------ Notify ------*/
  const people = await findPeople({ db, ids: [outcome.customerId, outcome.trainerId] });
  const customer = people.find((person) => person.id === outcome.customerId);
  const trainer = people.find((person) => person.id === outcome.trainerId);
  const refundText =
    outcome.refund.amount > 0
      ? ` ${formatNumberFa(Math.round(outcome.refund.amount / 10))} تومان به کیف پولت برگشت.`
      : "";
  await notify({
    phoneNumber: customer?.phoneNumber ?? null,
    kind: "enrollment-cancelled",
    body: `آموزش K9: ${outcome.label} لغو شد.${reason && actor.role !== "customer" ? ` دلیل: ${reason}` : ""}${refundText}`,
  });
  if (actor.role === "customer") {
    await notify({
      phoneNumber: trainer?.phoneNumber ?? null,
      kind: "enrollment-cancelled",
      body: `آموزش K9: ${customer?.name ?? "مشتری"} ${outcome.label} را لغو کرد.`,
    });
  }

  return { kind: "success", enrollmentId: id, refund: outcome.refund };
}

/**
 * Gives `amount` of an item's paid amount back as a proportional mirror of its purchase (B5, B6): the customer gets
 * `amount`, the trainer and the partner return the same fraction of what they received, rounded down, and the Admin's
 * wallet the rest. Then the item's and the order's refunded amounts and the order's status follow.
 */
async function refundOrderItem({
  tx,
  item,
  amount,
  customerId,
  label,
  now,
}: {
  tx: Transaction;
  item: OrderItemRecord;
  amount: number;
  customerId: string;
  label: string;
  now: Date;
}) {
  const purchase = await findPurchaseOfOrderItem({ db: tx, orderItemId: item.id });
  if (!purchase) throw new Error(`refundOrderItem: order item ${item.id} was paid but has no purchase transaction`);

  /*------ Lines by Role ------*/
  const order = await lockOrder({ db: tx, id: item.orderId });
  if (!order) throw new Error(`refundOrderItem: order item ${item.id} has no order`);
  const system = await systemWalletIds({ db: tx, kinds: ["admin"] });
  const customerWalletId = await userWalletId({ db: tx, userId: customerId });
  const partnerWalletId = order.partnerId ? await userWalletId({ db: tx, userId: order.partnerId }) : null;

  const amountOf = (walletId: string | null) => purchase.lines.find((line) => line.walletId === walletId)?.amount ?? 0;
  const trainerLine = purchase.lines.find(
    (line) => line.walletId !== customerWalletId && line.walletId !== system.admin && line.walletId !== partnerWalletId,
  );

  // An enrollment is cancelled once, so its item is refunded at most once and the purchase's lines are whole.
  const refundShare = splitRefund({
    purchase: {
      customer: amountOf(customerWalletId),
      trainer: trainerLine?.amount ?? 0,
      admin: amountOf(system.admin),
      partner: amountOf(partnerWalletId),
    },
    refundAmount: amount,
  });

  const lines: NewLine[] = mergeLines([
    { walletId: customerWalletId, amount: refundShare.customer },
    ...(trainerLine ? [{ walletId: trainerLine.walletId, amount: refundShare.trainer }] : []),
    { walletId: system.admin, amount: refundShare.admin },
    ...(partnerWalletId ? [{ walletId: partnerWalletId, amount: refundShare.partner }] : []),
  ]);

  await createTransaction({
    db: tx,
    now,
    transaction: {
      type: "refund",
      description: `بازگشت وجه ${label}`,
      mirrorOfId: purchase.transaction.id,
      orderItemId: item.id,
      lines,
    },
  });

  /*------ Item and Order ------*/
  await updateOrderItem({ db: tx, id: item.id, values: { refundedAmount: item.refundedAmount + amount } });
  const refundedAmount = order.refundedAmount + amount;
  const fullyRefunded = refundedAmount >= order.totalAmount;
  await updateOrder({
    db: tx,
    id: order.id,
    values: { refundedAmount, paymentStatus: fullyRefunded ? "refunded" : "partially-refunded" },
  });
  if (fullyRefunded && order.discountCodeId) await addDiscountUse({ db: tx, id: order.discountCodeId, delta: -1 });
}
