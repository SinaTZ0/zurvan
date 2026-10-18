import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { db } from "~/db/client.server";
import { course, dog, enrollment, evaluation, payment, paymentItem, user } from "~/db/schema";
import { ageInMonths } from "~/lib/dog-format";
import { todayIso } from "~/lib/jalali";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { completeGatewayPayment, getDogEligibility, payCart, reviewCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";

/*===== The Early-age Exception, End to End =====*/
// The owner's exception is off in the product (its facts are unconfirmed). Here it is switched on with made-up facts
// through the real eligibility, cart, «پرداخت» and callback code, to prove the rule holds where it matters: a covered
// puppy can buy a covered course without the evaluation, and every other dog, course, breed and age is refused by the
// server, so the evaluation can't be skipped by changing the page or the request.

const hoisted = vi.hoisted(() => ({ runId: Math.random().toString(36).slice(2, 10) }));

vi.mock("~/lib/early-age-exception", () => ({
  EARLY_AGE_EXCEPTION: {
    minMonths: 2,
    maxMonths: 3,
    courseSlugs: [`test-early-intro-${hoisted.runId}`],
    workingBreeds: ["ژرمن شپرد"],
  },
}));

const runId = hoisted.runId;
const phoneBase = `093${Math.floor(10000 + Math.random() * 89999)}`;
const customer = { id: `test-early-${runId}`, phone: `${phoneBase}001` };
const introSlug = `test-early-intro-${runId}`;
const otherSlug = `test-early-other-${runId}`;
const courseIds: string[] = [];
const dogs: Record<"puppy" | "workingPuppy" | "noBreedPuppy" | "youngPuppy" | "oldDog", string> = {
  puppy: "",
  workingPuppy: "",
  noBreedPuppy: "",
  youngPuppy: "",
  oldDog: "",
};

/** A birth date this many whole months and a few days ago, in Tehran. */
function bornMonthsAgo(months: number): string {
  const [year = 0, month = 0, day = 0] = todayIso().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 - months, Math.min(day, 28)));
  return date.toISOString().slice(0, 10);
}

async function insertCourse(slug: string): Promise<void> {
  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: `آزمایش ${slug}`,
      latinName: slug,
      family: "basics",
      status: "approved",
      summary: "آزمایشی",
      coverImage: "/x.webp",
      coverAlt: "x",
      coverWidth: 1,
      coverHeight: 1,
      price: 2_000_000,
      position: 9999,
    })
    .returning({ id: course.id });
  if (row) courseIds.push(row.id);
}

async function makeDog({
  name,
  breed,
  months,
}: {
  name: string;
  breed: string | null;
  months: number;
}): Promise<string> {
  const created = await createDog({
    db,
    ownerId: customer.id,
    input: { name, breed, sex: "male", birthDate: bornMonthsAgo(months), weightKg: 3, isNeutered: false },
  });
  if (created.kind !== "success") throw new Error(`Could not create ${name}: ${JSON.stringify(created)}`);
  return created.dog.id;
}

beforeAll(async () => {
  await db.insert(user).values({
    id: customer.id,
    name: "Test customer",
    email: phonePlaceholderEmail(customer.phone),
    phoneNumber: customer.phone,
    role: "customer",
  });
  await insertCourse(introSlug);
  await insertCourse(otherSlug);
  dogs.puppy = await makeDog({ name: "پشمی", breed: "پودل", months: 2 });
  dogs.workingPuppy = await makeDog({ name: "ژرمی", breed: "ژرمن شپرد", months: 2 });
  dogs.noBreedPuppy = await makeDog({ name: "ناشناس", breed: null, months: 2 });
  dogs.youngPuppy = await makeDog({ name: "کوچولو", breed: "پودل", months: 0 });
  dogs.oldDog = await makeDog({ name: "بزرگ", breed: "پودل", months: 14 });
});

afterAll(async () => {
  const paymentIds = db.select({ id: payment.id }).from(payment).where(eq(payment.customerId, customer.id));
  await db.delete(enrollment).where(eq(enrollment.customerId, customer.id));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(eq(payment.customerId, customer.id));
  await db.delete(evaluation).where(eq(evaluation.customerId, customer.id));
  await db.delete(dog).where(eq(dog.ownerId, customer.id));
  await db.delete(course).where(inArray(course.id, courseIds));
  await db.delete(user).where(eq(user.id, customer.id));
  await db.$client.end();
});

/** Whether each of the customer's dogs may take the course, by dog id. */
async function verdicts(slug: string): Promise<Record<string, boolean>> {
  const result = await getDogEligibility({ db, customerId: customer.id, courseSlug: slug });
  if (result.kind !== "success") throw new Error("Expected the course.");
  return Object.fromEntries(result.dogs.map((entry) => [entry.dog.id, entry.eligible]));
}

const gateway = getPaymentGateway();
const pay = (dogId: string, courseSlug: string) =>
  payCart({
    db,
    gateway,
    customerId: customer.id,
    input: { items: [{ courseSlug, dogId }] },
    callbackUrl: "http://localhost/payment/callback",
  });

describe("a covered puppy", () => {
  it("is shown as able to take the covered course, and only that one", async () => {
    const intro = await verdicts(introSlug);
    expect(intro[dogs.puppy]).toBe(true);
    // Not the working breed, not the one with no breed written, not the one that is too young or too old.
    expect(intro[dogs.workingPuppy]).toBe(false);
    expect(intro[dogs.noBreedPuppy]).toBe(false);
    expect(intro[dogs.youngPuppy]).toBe(false);
    expect(intro[dogs.oldDog]).toBe(false);

    // The same puppy, a course the exception doesn't cover: the evaluation is needed.
    expect((await verdicts(otherSlug))[dogs.puppy]).toBe(false);
    expect(ageInMonths({ birthDate: bornMonthsAgo(2) })).toBe(2);
  });

  it("can pay for the covered course with no evaluation, and is enrolled when the payment settles", async () => {
    const started = await pay(dogs.puppy, introSlug);
    if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
    const params = new URL(started.url, "http://localhost").searchParams;

    const result = await completeGatewayPayment({
      db,
      gateway,
      authority: params.get("Authority") ?? "",
      callbackParams: params,
    });
    expect(result).toMatchObject({ kind: "paid", enrolled: 1, notEnrolled: 0 });
    const enrollments = await db.select().from(enrollment).where(eq(enrollment.dogId, dogs.puppy));
    expect(enrollments).toHaveLength(1);
  });
});

describe("everything else still needs the evaluation, enforced by the server", () => {
  it("refuses «پرداخت» for a course the exception doesn't cover", async () => {
    expect(await pay(dogs.puppy, otherSlug)).toMatchObject({ kind: "not-eligible" });
  });

  it("refuses a working breed, a dog with no breed written, a dog too young and a dog too old", async () => {
    for (const dogId of [dogs.workingPuppy, dogs.noBreedPuppy, dogs.youngPuppy, dogs.oldDog]) {
      const result = await pay(dogId, introSlug);
      expect({ dogId, kind: result.kind }).toEqual({ dogId, kind: "not-eligible" });
    }
    expect(await db.select().from(payment).where(eq(payment.customerId, customer.id))).toHaveLength(1);
  });

  it("shows the same verdicts in the cart's review", async () => {
    const review = await reviewCart({
      db,
      customerId: customer.id,
      input: {
        items: [
          { courseSlug: introSlug, dogId: dogs.workingPuppy },
          { courseSlug: introSlug, dogId: dogs.noBreedPuppy },
        ],
      },
    });
    expect(review.items.map((item) => item.eligible)).toEqual([false, false]);
    expect(review.total).toBe(0);
  });
});
