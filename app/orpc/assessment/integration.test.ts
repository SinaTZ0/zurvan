import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { assessment, assessmentSlot, dog, smsOutbox, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import {
  bookAssessment,
  cancelMyAssessment,
  completeAssessment,
  getTrainerAssessment,
  listMyAssessments,
} from "~/orpc/assessment/service";
import { createDog, getDog, removeDog } from "~/orpc/dog/service";

/*===== Assessment Booking =====*/
// Runs against the real database: double booking is stopped by a conditional update and two partial unique indexes,
// and ownership by the scoping in the queries, none of which a mock would exercise. Needs the assessment tables
// (`npm run db:push`) and the catalogue (`npm run db:seed`), whose CGC and Advanced courses the recommendations use.

const runId = randomUUID().slice(0, 8);
const phoneBase = `099${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "trainer") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-assessment-${role}-${phoneCounter}-${runId}`, phone, role };
}

const trainerA = newPerson("trainer");
const trainerB = newPerson("trainer");
const racers = Array.from({ length: 20 }, () => newPerson("customer"));
const [cancelFirst, cancelSecond, completing] = [newPerson("customer"), newPerson("customer"), newPerson("customer")];
const people = [trainerA, trainerB, ...racers, cancelFirst, cancelSecond, completing];

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

const dogIds = new Map<string, string>();

async function openSlot({ trainerId, startsAt }: { trainerId: string; startsAt: Date }): Promise<string> {
  const [slot] = await db.insert(assessmentSlot).values({ trainerId, startsAt }).returning({ id: assessmentSlot.id });
  if (!slot) throw new Error("Could not open the test slot.");
  return slot.id;
}

/** Books for the person's dog and returns the assessment, failing the test if it isn't booked. */
async function book({ customer, slotId }: { customer: { id: string }; slotId: string }) {
  const result = await bookAssessment({
    db,
    customerId: customer.id,
    input: {
      slotId,
      dogId: dogIds.get(customer.id),
      trainingGoal: "home",
      customerNote: "از موتور می‌ترسد.",
      placeKind: "home",
      place: "تهران، خیابان آزمایش",
    },
  });
  return result;
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

  for (const person of people.filter((candidate) => candidate.role === "customer")) {
    const created = await createDog({ db, ownerId: person.id, input: dogInput });
    if (created.kind !== "success") throw new Error("Could not create a test dog.");
    dogIds.set(person.id, created.dog.id);
  }
});

afterAll(async () => {
  const ids = people.map((person) => person.id);
  // Everything that points at the users, in dependency order: assessments (and their recommendations, which cascade),
  // slots, dogs, the SMS the bookings queued, then the users.
  await db.delete(assessment).where(inArray(assessment.customerId, ids));
  await db.delete(assessmentSlot).where(inArray(assessmentSlot.trainerId, ids));
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

describe("booking a slot", () => {
  it("gives a slot to exactly one of twenty customers booking it at once", async () => {
    const slotId = await openSlot({ trainerId: trainerA.id, startsAt: inHours(2) });

    const results = await Promise.all(racers.map((customer) => book({ customer, slotId })));

    expect(results.filter((result) => result.kind === "success")).toHaveLength(1);
    expect(results.filter((result) => result.kind === "slot-taken")).toHaveLength(19);

    const live = await db.select().from(assessment).where(eq(assessment.slotId, slotId));
    expect(live.filter((row) => row.status !== "cancelled")).toHaveLength(1);
    const [slot] = await db.select().from(assessmentSlot).where(eq(assessmentSlot.id, slotId));
    expect(slot?.status).toBe("booked");
  });

  it("opens the slot again when the customer cancels, and lets another customer book it", async () => {
    const slotId = await openSlot({ trainerId: trainerA.id, startsAt: inHours(3) });

    const first = await book({ customer: cancelFirst, slotId });
    if (first.kind !== "success") throw new Error(`Expected a booking, got ${first.kind}.`);

    const cancelled = await cancelMyAssessment({ db, customerId: cancelFirst.id, id: first.assessment.id, input: {} });
    expect(cancelled).toMatchObject({ kind: "success", assessment: { status: "cancelled", cancelledBy: "customer" } });
    const [reopened] = await db.select().from(assessmentSlot).where(eq(assessmentSlot.id, slotId));
    expect(reopened?.status).toBe("open");

    // It is cancelled, so cancelling again is refused instead of reopening anything twice.
    expect(
      await cancelMyAssessment({ db, customerId: cancelFirst.id, id: first.assessment.id, input: {} }),
    ).toMatchObject({ kind: "not-cancellable" });

    expect(await book({ customer: cancelSecond, slotId })).toMatchObject({ kind: "success" });
  });
});

describe("recording the outcome", () => {
  it("gives the dog a record, keeps the recommendations in order, and stops a dog with a record booking", async () => {
    const slotId = await openSlot({ trainerId: trainerA.id, startsAt: inHours(1) });
    const booked = await book({ customer: completing, slotId });
    if (booked.kind !== "success") throw new Error(`Expected a booking, got ${booked.kind}.`);
    const dogId = dogIds.get(completing.id) ?? "";

    expect(await getDog({ db, ownerId: completing.id, id: dogId })).toMatchObject({ dog: { hasRecord: false } });

    const input = { trainerNotes: "کار خوبی بود.", recommendedCourseSlugs: ["advanced", "cgc"] };
    // The meeting hasn't started, so there is nothing to record yet.
    expect(await completeAssessment({ db, trainerId: trainerA.id, id: booked.assessment.id, input })).toMatchObject({
      kind: "not-recordable",
    });

    const completed = await completeAssessment({
      db,
      trainerId: trainerA.id,
      id: booked.assessment.id,
      input,
      now: inHours(2),
    });
    expect(completed).toMatchObject({ kind: "success", assessment: { status: "completed" } });

    expect(await getDog({ db, ownerId: completing.id, id: dogId })).toMatchObject({ dog: { hasRecord: true } });

    const [mine] = await listMyAssessments({ db, customerId: completing.id });
    expect(mine?.recommendations.map((course) => course.slug)).toEqual(["advanced", "cgc"]);

    const nextSlot = await openSlot({ trainerId: trainerA.id, startsAt: inHours(30) });
    expect(await book({ customer: completing, slotId: nextSlot })).toMatchObject({ kind: "has-record" });
  });
});

describe("who can see and change an assessment", () => {
  it("hides an assessment from another trainer and another customer, and keeps its dog from being removed", async () => {
    const [booked] = await db.select().from(assessment).where(eq(assessment.customerId, cancelSecond.id));
    if (!booked) throw new Error("Expected the second customer's booking from the earlier test.");

    expect(await getTrainerAssessment({ db, trainerId: trainerB.id, id: booked.id })).toEqual({ kind: "not-found" });
    expect(
      await completeAssessment({
        db,
        trainerId: trainerB.id,
        id: booked.id,
        input: { trainerNotes: "x", recommendedCourseSlugs: [] },
        now: inHours(48),
      }),
    ).toEqual({ kind: "not-found" });
    expect(await cancelMyAssessment({ db, customerId: cancelFirst.id, id: booked.id, input: {} })).toEqual({
      kind: "not-found",
    });
    expect(await getTrainerAssessment({ db, trainerId: trainerA.id, id: booked.id })).toMatchObject({
      kind: "success",
    });

    // A dog that a trainer is expecting can't leave the account until the booking is cancelled.
    expect(await removeDog({ db, ownerId: cancelSecond.id, id: booked.dogId })).toMatchObject({ kind: "has-booking" });
  });
});
