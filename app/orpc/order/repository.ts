import { and, asc, count, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";

import { alias } from "drizzle-orm/pg-core";

import type { DatabaseOrTransaction } from "~/db/client.server";
import {
  assessment,
  assessmentRecommendation,
  behaviorRequest,
  course,
  coursePrerequisite,
  customerOrder,
  discountCode,
  discountCodeCourse,
  dog,
  enrollment,
  media,
  orderItem,
  orderNumberSeq,
  payment,
  trainingSession,
  user,
} from "~/db/schema";
import type { MediaRecord } from "~/orpc/media/repository";

/*===== Types =====*/
export type OrderRecord = typeof customerOrder.$inferSelect;
export type OrderItemRecord = typeof orderItem.$inferSelect;
export type PaymentRecord = typeof payment.$inferSelect;
export type DiscountCodeRecord = typeof discountCode.$inferSelect;
export type EnrollmentRecord = typeof enrollment.$inferSelect;
export type CourseRecord = typeof course.$inferSelect;

/** An order item with what the checkout shows of its course and dog, and the enrollment it created once paid. */
export type OrderItemRow = {
  item: OrderItemRecord;
  course: { id: string; slug: string; title: string; latinName: string };
  dog: { id: string; name: string };
  photo: MediaRecord | null;
  enrollmentId: string | null;
  /** The sessions of the behavior plan this item pays for; null for any other item. */
  planSessions: number | null;
};

export type OrderRow = {
  order: OrderRecord;
  items: OrderItemRow[];
  discountCode: string | null;
  /** The newest attempt, which the payment result page reports. */
  latestPayment: PaymentRecord | null;
};

/** One of a dog's enrollments, reduced to what eligibility needs. */
export type DogCourseHistoryRow = { id: string; dogId: string; courseId: string; status: string };

export type PersonRecord = Pick<typeof user.$inferSelect, "id" | "name" | "role" | "phoneNumber">;

type Executor = { db: DatabaseOrTransaction };

/*===== People =====*/
/**
 * The head trainer: the Admin (docs/business-logic.md, B8). If there is ever more than one Admin, the first one made is
 * the owner. Courses with no owner trainer are his.
 */
export async function findHeadTrainer({ db }: Executor): Promise<PersonRecord | undefined> {
  const [row] = await db
    .select({ id: user.id, name: user.name, role: user.role, phoneNumber: user.phoneNumber })
    .from(user)
    .where(eq(user.role, "admin"))
    .orderBy(asc(user.createdAt), asc(user.id))
    .limit(1);
  return row;
}

export function findPeople({ db, ids }: Executor & { ids: string[] }): Promise<PersonRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select({ id: user.id, name: user.name, role: user.role, phoneNumber: user.phoneNumber })
    .from(user)
    .where(inArray(user.id, ids));
}

/*===== Courses and Dogs =====*/
/** A course this one requires, with what the ineligibility message names (spec 3.8). */
export type RequirementRecord = { requiredCourseId: string; slug: string; title: string; hasTest: boolean };

export function findRequirements({ db, courseId }: Executor & { courseId: string }): Promise<RequirementRecord[]> {
  const required = alias(course, "required_course");
  return db
    .select({
      requiredCourseId: coursePrerequisite.requiredCourseId,
      slug: required.slug,
      title: required.title,
      hasTest: sql<boolean>`${required.testPrice} is not null`,
    })
    .from(coursePrerequisite)
    .innerJoin(required, eq(coursePrerequisite.requiredCourseId, required.id))
    .where(eq(coursePrerequisite.courseId, courseId))
    .orderBy(asc(required.position));
}

/** The latest completed assessment of each dog that recommended this course, with its place in the order. */
export async function findRecommendingAssessments({
  db,
  dogIds,
  courseId,
}: Executor & { dogIds: string[]; courseId: string }): Promise<
  { dogId: string; assessmentId: string; position: number }[]
> {
  if (dogIds.length === 0) return [];
  return db
    .selectDistinctOn([assessment.dogId], {
      dogId: assessment.dogId,
      assessmentId: assessment.id,
      position: assessmentRecommendation.position,
    })
    .from(assessmentRecommendation)
    .innerJoin(assessment, eq(assessmentRecommendation.assessmentId, assessment.id))
    .where(
      and(
        inArray(assessment.dogId, dogIds),
        eq(assessment.status, "completed"),
        eq(assessmentRecommendation.courseId, courseId),
      ),
    )
    .orderBy(assessment.dogId, desc(assessment.completedAt));
}

export function findCoursesByIds({ db, ids }: Executor & { ids: string[] }): Promise<CourseRecord[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db.select().from(course).where(inArray(course.id, ids));
}

/** The courses each dog has passed (either kind) or is enrolled in now: what eligibility needs (spec 3.8). */
export function findDogCourseHistory({ db, dogIds }: Executor & { dogIds: string[] }): Promise<DogCourseHistoryRow[]> {
  if (dogIds.length === 0) return Promise.resolve([]);
  return db
    .select({ id: enrollment.id, dogId: enrollment.dogId, courseId: enrollment.courseId, status: enrollment.status })
    .from(enrollment)
    .where(and(inArray(enrollment.dogId, dogIds), inArray(enrollment.status, ["passed", "scheduling", "active"])));
}

/**
 * Locks the customer's dogs for the rest of the database transaction, in id order. Paying an order locks its dogs
 * first, so two payments that would enroll the same dog in the same course run one after the other, and the second
 * sees the first one's enrollment.
 */
export function lockDogsOfCustomer({
  db,
  customerId,
  ids,
}: Executor & { customerId: string; ids: string[] }): Promise<{ id: string; name: string; deletedAt: Date | null }[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return db
    .select({ id: dog.id, name: dog.name, deletedAt: dog.deletedAt })
    .from(dog)
    .where(and(inArray(dog.id, ids), eq(dog.ownerId, customerId)))
    .orderBy(asc(dog.id))
    .for("update");
}

/** One of the customer's completed assessments of this dog, if `id` is one. */
export async function findCompletedAssessment({
  db,
  customerId,
  dogId,
  id,
}: Executor & { customerId: string; dogId: string; id: string }): Promise<{ id: string } | undefined> {
  const [row] = await db
    .select({ id: assessment.id })
    .from(assessment)
    .where(
      and(
        eq(assessment.id, id),
        eq(assessment.customerId, customerId),
        eq(assessment.dogId, dogId),
        eq(assessment.status, "completed"),
      ),
    );
  return row;
}

/*===== Orders =====*/
/** The next number of the order sequence. */
export async function nextOrderSequence({ db }: Executor): Promise<number> {
  const result = await db.execute<{ value: string }>(sql`select nextval(${orderNumberSeq.seqName}) as value`);
  return Number(result.rows[0]?.value);
}

export async function insertOrder({
  db,
  values,
}: Executor & { values: typeof customerOrder.$inferInsert }): Promise<OrderRecord> {
  const [row] = await db.insert(customerOrder).values(values).returning();
  if (!row) throw new Error("insertOrder: no row returned");
  return row;
}

export async function insertOrderItems({
  db,
  values,
}: Executor & { values: (typeof orderItem.$inferInsert)[] }): Promise<OrderItemRecord[]> {
  return db.insert(orderItem).values(values).returning();
}

/** One of the customer's orders with everything the checkout and the payment result show. */
export async function findOrderByCustomer({
  db,
  customerId,
  id,
}: Executor & { customerId: string; id: string }): Promise<OrderRow | undefined> {
  const [order] = await db
    .select()
    .from(customerOrder)
    .where(and(eq(customerOrder.id, id), eq(customerOrder.customerId, customerId)));
  if (!order) return undefined;

  const items = await db
    .select({
      item: orderItem,
      course: { id: course.id, slug: course.slug, title: course.title, latinName: course.latinName },
      dog: { id: dog.id, name: dog.name },
      photo: media,
      enrollmentId: enrollment.id,
      planSessions: behaviorRequest.proposedSessions,
    })
    .from(orderItem)
    .innerJoin(course, eq(orderItem.courseId, course.id))
    .innerJoin(dog, eq(orderItem.dogId, dog.id))
    .leftJoin(media, eq(dog.photoMediaId, media.id))
    .leftJoin(enrollment, eq(enrollment.orderItemId, orderItem.id))
    .leftJoin(behaviorRequest, eq(orderItem.behaviorRequestId, behaviorRequest.id))
    .where(eq(orderItem.orderId, id))
    .orderBy(asc(orderItem.createdAt), asc(orderItem.id));

  const [code] = order.discountCodeId
    ? await db.select({ code: discountCode.code }).from(discountCode).where(eq(discountCode.id, order.discountCodeId))
    : [];

  const [latestPayment] = await db
    .select()
    .from(payment)
    .where(eq(payment.orderId, id))
    .orderBy(desc(payment.createdAt))
    .limit(1);

  return { order, items, discountCode: code?.code ?? null, latestPayment: latestPayment ?? null };
}

/** Locks an order row for the rest of the database transaction. */
export async function lockOrder({ db, id }: Executor & { id: string }): Promise<OrderRecord | undefined> {
  const [row] = await db.select().from(customerOrder).where(eq(customerOrder.id, id)).for("update");
  return row;
}

export async function updateOrder({
  db,
  id,
  values,
}: Executor & { id: string; values: Partial<typeof customerOrder.$inferInsert> }) {
  await db.update(customerOrder).set(values).where(eq(customerOrder.id, id));
}

export function findOrderItems({ db, orderId }: Executor & { orderId: string }): Promise<OrderItemRecord[]> {
  return db.select().from(orderItem).where(eq(orderItem.orderId, orderId)).orderBy(asc(orderItem.createdAt));
}

export async function updateOrderItem({
  db,
  id,
  values,
}: Executor & { id: string; values: Partial<typeof orderItem.$inferInsert> }) {
  await db.update(orderItem).set(values).where(eq(orderItem.id, id));
}

/**
 * The customer's other pending orders that the new one replaces: those booking the same dog in the same course, and,
 * when the new one spends the wallet, those that spend it too (one at a time, spec 3.12).
 */
export async function findSupersededOrders({
  db,
  customerId,
  exceptId,
  sameBooking,
  spendingWallet,
}: Executor & {
  customerId: string;
  exceptId: string | null;
  sameBooking: { dogId: string; courseId: string } | null;
  spendingWallet: boolean;
}): Promise<string[]> {
  const pending = and(
    eq(customerOrder.customerId, customerId),
    eq(customerOrder.paymentStatus, "pending"),
    exceptId ? ne(customerOrder.id, exceptId) : undefined,
  );
  const ids = new Set<string>();

  if (sameBooking) {
    const rows = await db
      .selectDistinct({ id: customerOrder.id })
      .from(customerOrder)
      .innerJoin(orderItem, eq(orderItem.orderId, customerOrder.id))
      .where(and(pending, eq(orderItem.dogId, sameBooking.dogId), eq(orderItem.courseId, sameBooking.courseId)));
    for (const row of rows) ids.add(row.id);
  }
  if (spendingWallet) {
    const rows = await db
      .select({ id: customerOrder.id })
      .from(customerOrder)
      .where(and(pending, sql`${customerOrder.paidFromWallet} > 0`));
    for (const row of rows) ids.add(row.id);
  }
  return [...ids];
}

/** Cancels pending orders and fails their pending payments. Orders that are no longer pending are left alone. */
export async function cancelPendingOrders({ db, ids, reason }: Executor & { ids: string[]; reason: string }) {
  if (ids.length === 0) return;
  await db
    .update(customerOrder)
    .set({ paymentStatus: "cancelled" })
    .where(and(inArray(customerOrder.id, ids), eq(customerOrder.paymentStatus, "pending")));
  await failPendingPayments({ db, orderIds: ids, reason });
}

/** Fails an order's payments that are still pending, e.g. when a new attempt replaces them. */
export async function failPendingPayments({ db, orderIds, reason }: Executor & { orderIds: string[]; reason: string }) {
  if (orderIds.length === 0) return;
  await db
    .update(payment)
    .set({ status: "failed", failureReason: reason })
    .where(and(inArray(payment.orderId, orderIds), eq(payment.status, "pending")));
}

/** Whether the customer has ever had an order paid, for first-order-only codes. */
export async function hasPaidOrder({ db, customerId }: Executor & { customerId: string }): Promise<boolean> {
  const [row] = await db
    .select({ one: sql`1` })
    .from(customerOrder)
    .where(and(eq(customerOrder.customerId, customerId), isNotNull(customerOrder.paidAt)))
    .limit(1);
  return row !== undefined;
}

/*===== Discount Codes =====*/
/** A code by its text, case-insensitively, with the courses it is limited to. */
export async function findDiscountCode({
  db,
  code,
}: Executor & { code: string }): Promise<{ code: DiscountCodeRecord; courseIds: string[] } | undefined> {
  const [row] = await db
    .select()
    .from(discountCode)
    .where(eq(sql`upper(${discountCode.code})`, code.toUpperCase()));
  if (!row) return undefined;

  const courses = await db
    .select({ courseId: discountCodeCourse.courseId })
    .from(discountCodeCourse)
    .where(eq(discountCodeCourse.discountCodeId, row.id));
  return { code: row, courseIds: courses.map((entry) => entry.courseId) };
}

export async function findDiscountCodeById({
  db,
  id,
}: Executor & { id: string }): Promise<{ code: DiscountCodeRecord; courseIds: string[] } | undefined> {
  const [row] = await db.select({ code: discountCode.code }).from(discountCode).where(eq(discountCode.id, id));
  return row && findDiscountCode({ db, code: row.code });
}

/** How many of the customer's paid orders used the code, fully refunded ones not counted (spec 3.10). */
export async function countCustomerUses({
  db,
  discountCodeId,
  customerId,
}: Executor & { discountCodeId: string; customerId: string }): Promise<number> {
  const [row] = await db
    .select({ uses: count() })
    .from(customerOrder)
    .where(
      and(
        eq(customerOrder.discountCodeId, discountCodeId),
        eq(customerOrder.customerId, customerId),
        inArray(customerOrder.paymentStatus, ["paid", "partially-refunded"]),
      ),
    );
  return row?.uses ?? 0;
}

/** Moves a code's use count by one, never below 0. */
export async function addDiscountUse({ db, id, delta }: Executor & { id: string; delta: 1 | -1 }) {
  await db
    .update(discountCode)
    .set({ usedCount: sql`greatest(${discountCode.usedCount} + ${delta}, 0)` })
    .where(eq(discountCode.id, id));
}

/*===== Payments =====*/
export async function insertPayment({
  db,
  values,
}: Executor & { values: typeof payment.$inferInsert }): Promise<PaymentRecord> {
  const [row] = await db.insert(payment).values(values).returning();
  if (!row) throw new Error("insertPayment: no row returned");
  return row;
}

/** Locks a payment by the gateway's authority token, so a repeated callback waits for the first and then sees it. */
export async function lockPaymentByAuthority({
  db,
  authority,
}: Executor & { authority: string }): Promise<PaymentRecord | undefined> {
  const [row] = await db.select().from(payment).where(eq(payment.authority, authority)).for("update");
  return row;
}

/** Settles a pending payment, exactly once: a payment that isn't pending any more is left as it is. */
export async function settlePayment({
  db,
  id,
  values,
}: Executor & {
  id: string;
  values: Pick<typeof payment.$inferInsert, "status" | "referenceId" | "cardNumberMasked" | "failureReason" | "paidAt">;
}) {
  await db
    .update(payment)
    .set(values)
    .where(and(eq(payment.id, id), eq(payment.status, "pending")));
}

/*===== Enrollments =====*/
export async function insertEnrollment({
  db,
  values,
}: Executor & { values: typeof enrollment.$inferInsert }): Promise<EnrollmentRecord> {
  const [row] = await db.insert(enrollment).values(values).returning();
  if (!row) throw new Error("insertEnrollment: no row returned");
  return row;
}

/** An enrollment locked for the rest of the database transaction, with its order item. */
export async function lockEnrollment({
  db,
  id,
}: Executor & { id: string }): Promise<{ enrollment: EnrollmentRecord; item: OrderItemRecord } | undefined> {
  const [row] = await db
    .select({ enrollment, item: orderItem })
    .from(enrollment)
    .innerJoin(orderItem, eq(enrollment.orderItemId, orderItem.id))
    .where(eq(enrollment.id, id))
    .for("update", { of: enrollment });
  return row;
}

/** An enrollment's sessions that count towards a refund: how many are used up, and when the next one starts. */
export async function findSessionUsage({
  db,
  enrollmentId,
}: Executor & { enrollmentId: string }): Promise<{ usedSessions: number; nextSessionStartsAt: Date | null }> {
  const [row] = await db
    .select({
      usedSessions: sql<number>`count(*) filter (where ${trainingSession.status} in ('held', 'missed'))::int`,
      nextSessionStartsAt: sql<Date | null>`min(${trainingSession.startsAt}) filter (where ${trainingSession.status} = 'scheduled')`,
    })
    .from(trainingSession)
    .where(eq(trainingSession.enrollmentId, enrollmentId));
  const next = row?.nextSessionStartsAt;
  return {
    usedSessions: row?.usedSessions ?? 0,
    // A raw `min()` comes back from the driver as text.
    nextSessionStartsAt: next ? new Date(next) : null,
  };
}

export async function updateEnrollment({
  db,
  id,
  values,
}: Executor & { id: string; values: Partial<typeof enrollment.$inferInsert> }) {
  await db.update(enrollment).set(values).where(eq(enrollment.id, id));
}

/** Cancels an enrollment's sessions that haven't happened yet. */
export async function cancelScheduledSessions({ db, enrollmentId }: Executor & { enrollmentId: string }) {
  await db
    .update(trainingSession)
    .set({ status: "cancelled" })
    .where(and(eq(trainingSession.enrollmentId, enrollmentId), eq(trainingSession.status, "scheduled")));
}
