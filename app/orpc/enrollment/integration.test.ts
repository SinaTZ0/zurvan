import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { course, customerOrder, dog, enrollment, orderItem, smsOutbox, trainingSession, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import { createDog, getDog } from "~/orpc/dog/service";
import {
  cancelSession,
  getMyEnrollment,
  getTrainerEnrollment,
  markSession,
  recordResult,
  scheduleSession,
} from "~/orpc/enrollment/service";

/*===== Training Sessions =====*/
// Runs against the real database: the enrollment lock, the conditional updates and the scoping to the trainer are what
// keep two requests and two trainers apart, and a mock would exercise none of them. Needs the enrollment tables
// (`npm run db:push`) and the catalogue (`npm run db:seed`), whose CGC course the enrollments are for. The order and
// order item rows are inserted directly: the order flow that makes them is not what is tested here.

const runId = randomUUID().slice(0, 8);
const phoneBase = `099${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "trainer") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-enrollment-${role}-${phoneCounter}-${runId}`, phone, role };
}

const customer = newPerson("customer");
const trainerA = newPerson("trainer");
const trainerB = newPerson("trainer");
const people = [customer, trainerA, trainerB];

const dogInput = {
  name: "رکس",
  breed: "لابرادور",
  sex: "male",
  birthDate: "2023-05-01",
  weightKg: 28,
  isNeutered: true,
};

const hour = 3_600_000;
const inHours = (hours: number) => new Date(Date.now() + hours * hour);

const PAID = 10_000_000;
const place = "تهران، خیابان آزمایش";

let courseId: string;
const dogIds: string[] = [];
const enrollmentIds: string[] = [];

/** Inserts a paid order with one item, and the enrollment it would have made, waiting to be scheduled. */
async function insertEnrollment({ dogId, index }: { dogId: string; index: number }): Promise<string> {
  const [order] = await db
    .insert(customerOrder)
    .values({
      number: `TEST-${runId}-${index}`,
      customerId: customer.id,
      subtotal: PAID,
      totalAmount: PAID,
      paidFromWallet: PAID,
      paymentStatus: "paid",
      paidAt: new Date(),
    })
    .returning({ id: customerOrder.id });
  if (!order) throw new Error("Could not insert the test order.");

  const [item] = await db
    .insert(orderItem)
    .values({
      orderId: order.id,
      courseId,
      dogId,
      kind: "course",
      trainingGoal: "home",
      preferredTimes: "عصرها",
      unitPrice: PAID,
      paidAmount: PAID,
      refundPolicyName: "standard",
      refundPolicyPercent: 50,
    })
    .returning({ id: orderItem.id });
  if (!item) throw new Error("Could not insert the test order item.");

  const [created] = await db
    .insert(enrollment)
    .values({
      courseId,
      dogId,
      customerId: customer.id,
      trainerId: trainerA.id,
      kind: "course",
      orderItemId: item.id,
      trainingGoal: "home",
      preferredTimes: "عصرها",
      plannedSessions: 3,
    })
    .returning({ id: enrollment.id });
  if (!created) throw new Error("Could not insert the test enrollment.");
  return created.id;
}

beforeAll(async () => {
  await db.insert(user).values(
    people.map((person) => ({
      id: person.id,
      name: "Test person",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: person.role,
    })),
  );

  const [cgc] = await db.select({ id: course.id }).from(course).where(eq(course.slug, "cgc")).limit(1);
  if (!cgc) throw new Error("The catalogue has no CGC course; run `npm run db:seed`.");
  courseId = cgc.id;

  for (const index of [0, 1]) {
    const created = await createDog({ db, ownerId: customer.id, input: dogInput });
    if (created.kind !== "success") throw new Error("Could not create a test dog.");
    dogIds.push(created.dog.id);
    enrollmentIds.push(await insertEnrollment({ dogId: created.dog.id, index }));
  }
});

afterAll(async () => {
  const ids = people.map((person) => person.id);
  // Everything that points at the users, in dependency order: sessions, enrollments, order items, orders, dogs, the SMS
  // the sessions queued, then the users.
  await db.delete(trainingSession).where(inArray(trainingSession.enrollmentId, enrollmentIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, ids));
  const orders = await db
    .select({ id: customerOrder.id })
    .from(customerOrder)
    .where(inArray(customerOrder.customerId, ids));
  await db.delete(orderItem).where(
    inArray(
      orderItem.orderId,
      orders.map((order) => order.id),
    ),
  );
  await db.delete(customerOrder).where(inArray(customerOrder.customerId, ids));
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(smsOutbox).where(
    inArray(
      smsOutbox.phoneNumber,
      people.map((person) => person.phone),
    ),
  );
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

const sessionInput = (startsAt: Date) => ({ startsAt, placeKind: "home", place });

describe("scheduling a session", () => {
  it("activates the enrollment with its first session, and warns, not refuses, about a clash", async () => {
    const [first = "", second = ""] = enrollmentIds;
    const start = inHours(2);

    const scheduled = await scheduleSession({
      db,
      trainerId: trainerA.id,
      enrollmentId: first,
      input: sessionInput(start),
    });
    expect(scheduled).toMatchObject({
      kind: "success",
      enrollment: { status: "active", canSchedule: true, canRecordResult: false, usedSessions: 0 },
      overlaps: [],
    });

    // Half an hour into the first session: placed all the same, with the first one reported.
    const clashing = await scheduleSession({
      db,
      trainerId: trainerA.id,
      enrollmentId: second,
      input: sessionInput(new Date(start.getTime() + hour / 2)),
    });
    expect(clashing).toMatchObject({
      kind: "success",
      enrollment: { status: "active" },
      overlaps: [{ kind: "session" }],
    });

    // The customer sees the sessions, and what cancelling the one that hasn't started would give back.
    const mine = await getMyEnrollment({ db, customerId: customer.id, id: second });
    expect(mine).toMatchObject({
      kind: "success",
      enrollment: { canCancel: true, refundPreview: { amount: PAID, rule: "before-first-session" } },
    });
  });

  it("stays out of reach of another trainer", async () => {
    const [first = ""] = enrollmentIds;
    const session = await db.select().from(trainingSession).where(eq(trainingSession.enrollmentId, first));
    const sessionId = session[0]?.id ?? "";

    expect(await getTrainerEnrollment({ db, trainerId: trainerB.id, id: first })).toEqual({ kind: "not-found" });
    expect(
      await scheduleSession({
        db,
        trainerId: trainerB.id,
        enrollmentId: first,
        input: sessionInput(inHours(5)),
      }),
    ).toEqual({ kind: "not-found" });
    expect(
      await markSession({ db, trainerId: trainerB.id, sessionId, input: { status: "held" }, now: inHours(4) }),
    ).toEqual({ kind: "not-found" });
    expect(await cancelSession({ db, trainerId: trainerB.id, sessionId })).toEqual({ kind: "not-found" });
  });
});

describe("recording a session", () => {
  it("waits for the session to start, then gives the dog a record", async () => {
    const [first = ""] = enrollmentIds;
    const [dogId = ""] = dogIds;
    const [session] = await db.select().from(trainingSession).where(eq(trainingSession.enrollmentId, first));
    if (!session) throw new Error("Expected the first enrollment's session from the earlier test.");

    expect(await getDog({ db, ownerId: customer.id, id: dogId })).toMatchObject({ dog: { hasRecord: false } });

    // Its time hasn't come, so there is nothing to record yet.
    expect(
      await markSession({ db, trainerId: trainerA.id, sessionId: session.id, input: { status: "held" } }),
    ).toMatchObject({ kind: "not-recordable" });

    const held = await markSession({
      db,
      trainerId: trainerA.id,
      sessionId: session.id,
      input: { status: "held", trainerNote: "خوب پیش رفت." },
      now: inHours(4),
    });
    expect(held).toMatchObject({
      kind: "success",
      enrollment: { usedSessions: 1, canRecordResult: true, sessions: [{ status: "held" }] },
    });

    // Recorded once: marking it again, or cancelling it, is refused instead of counting it twice.
    expect(
      await markSession({
        db,
        trainerId: trainerA.id,
        sessionId: session.id,
        input: { status: "missed" },
        now: inHours(4),
      }),
    ).toMatchObject({ kind: "not-recordable" });
    expect(await cancelSession({ db, trainerId: trainerA.id, sessionId: session.id })).toMatchObject({
      kind: "not-schedulable",
    });

    expect(await getDog({ db, ownerId: customer.id, id: dogId })).toMatchObject({ dog: { hasRecord: true } });
  });
});

describe("recording the result", () => {
  it("needs a used session, then closes the enrollment and cancels what is still scheduled", async () => {
    const [first = "", second = ""] = enrollmentIds;
    const input = { result: "passed", trainerNote: "قبول شد." };

    // No session of the second enrollment has been held.
    expect(await recordResult({ db, trainerId: trainerA.id, id: second, input })).toMatchObject({
      kind: "not-recordable",
    });
    expect(await recordResult({ db, trainerId: trainerB.id, id: first, input })).toEqual({ kind: "not-found" });

    const extra = await scheduleSession({
      db,
      trainerId: trainerA.id,
      enrollmentId: first,
      input: sessionInput(inHours(30)),
    });
    expect(extra).toMatchObject({ kind: "success" });

    const recorded = await recordResult({ db, trainerId: trainerA.id, id: first, input });
    expect(recorded).toMatchObject({
      kind: "success",
      enrollment: { status: "passed", canSchedule: false, trainerNote: "قبول شد." },
    });
    if (recorded.kind !== "success") return;
    expect(recorded.enrollment.sessions.map((session) => session.status)).toEqual(["held", "cancelled"]);

    // Finished: no more sessions, no second result, and nothing left to cancel for a refund.
    expect(
      await scheduleSession({ db, trainerId: trainerA.id, enrollmentId: first, input: sessionInput(inHours(40)) }),
    ).toMatchObject({ kind: "not-schedulable" });
    expect(await recordResult({ db, trainerId: trainerA.id, id: first, input })).toMatchObject({
      kind: "not-recordable",
    });
    expect(await getMyEnrollment({ db, customerId: customer.id, id: first })).toMatchObject({
      enrollment: { canCancel: false, refundPreview: null },
    });
  });
});
