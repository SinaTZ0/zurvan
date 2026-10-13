import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { commission, course, dog, enrollment, evaluation, partner, payment, paymentItem, user } from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { adminListPayments, completeGatewayPayment, payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== Checkout =====*/
// Runs against the real database, where the consequences are: the gateway's callback settles a payment once, a lost race
// leaves a paid item with no enrollment, and the partner's commission is written once per customer. Needs the schema
// (`npm run db:push`). The test makes its own courses, people and partners, so it doesn't depend on the demo seed.

const runId = randomUUID().slice(0, 8);
const phoneBase = `098${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "partner") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-checkout-${role}-${phoneCounter}-${runId}`, phone, role };
}

const partnerPerson = newPerson("partner");
const inactivePartnerPerson = newPerson("partner");
const plain = newPerson("customer");
const referred = newPerson("customer");
const referredToInactive = newPerson("customer");
const people = [partnerPerson, inactivePartnerPerson, plain, referred, referredToInactive];

// Not a round number, so the commission's rounding down shows: 10% of 7,000,005 is 700,000.5.
const PRICE = 7_000_005;
const gateway = getPaymentGateway();
const callbackUrl = "http://localhost/payment/callback";
const ids = { courseA: "", courseB: "" };
const slugs = { a: `test-a-${runId}`, b: `test-b-${runId}` };
const dogOf: Record<string, string> = {};

async function insertCourse(slug: string): Promise<string> {
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
      price: PRICE,
      position: 9999,
    })
    .returning({ id: course.id });
  if (!row) throw new Error("Could not insert the test course.");
  return row.id;
}

/** Starts a payment for the cart and returns what the gateway's callback would carry. */
async function startPayment({
  customerId,
  dogId,
  courseSlugs,
}: {
  customerId: string;
  dogId: string;
  courseSlugs: string[];
}) {
  const started = await payCart({
    db,
    gateway,
    customerId,
    input: { items: courseSlugs.map((courseSlug) => ({ courseSlug, dogId })) },
    callbackUrl,
  });
  if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
  return new URL(started.url, "http://localhost").searchParams;
}

function callBack(params: URLSearchParams) {
  return completeGatewayPayment({ db, gateway, authority: params.get("Authority") ?? "", callbackParams: params });
}

async function commissionsOf(customerId: string) {
  return db.select().from(commission).where(eq(commission.customerId, customerId));
}

beforeAll(async () => {
  await db.insert(user).values(
    people.map((person) => ({
      id: person.id,
      name: `Test ${person.role}`,
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: person.role,
    })),
  );
  await db.insert(partner).values([
    { userId: partnerPerson.id, code: `tp-${runId}`, isActive: true },
    { userId: inactivePartnerPerson.id, code: `ti-${runId}`, isActive: false },
  ]);
  await db.update(user).set({ referredByPartnerId: partnerPerson.id }).where(eq(user.id, referred.id));
  await db
    .update(user)
    .set({ referredByPartnerId: inactivePartnerPerson.id })
    .where(eq(user.id, referredToInactive.id));

  ids.courseA = await insertCourse(slugs.a);
  ids.courseB = await insertCourse(slugs.b);

  for (const customer of [plain, referred, referredToInactive]) {
    const created = await createDog({
      db,
      ownerId: customer.id,
      input: { name: "رکس", sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
    });
    if (created.kind !== "success") throw new Error("Could not create the test dog.");
    dogOf[customer.id] = created.dog.id;
    const evaluated = await markDogEvaluated({ db, dogId: created.dog.id });
    if (evaluated.kind !== "success") throw new Error("Could not evaluate the test dog.");
  }
});

afterAll(async () => {
  const customerIds = [plain.id, referred.id, referredToInactive.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(commission).where(inArray(commission.customerId, customerIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, customerIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(evaluation).where(inArray(evaluation.customerId, customerIds));
  await db.delete(dog).where(inArray(dog.ownerId, customerIds));
  await db.delete(partner).where(inArray(partner.userId, [partnerPerson.id, inactivePartnerPerson.id]));
  await db.update(user).set({ referredByPartnerId: null }).where(inArray(user.id, customerIds));
  await db.delete(course).where(inArray(course.id, [ids.courseA, ids.courseB].filter(Boolean)));
  await db.delete(user).where(
    inArray(
      user.id,
      people.map((person) => person.id),
    ),
  );
  await db.$client.end();
});

describe("the gateway callback", () => {
  it("settles a payment once: a repeated callback changes nothing", async () => {
    const dogId = dogOf[plain.id] ?? "";
    const params = await startPayment({ customerId: plain.id, dogId, courseSlugs: [slugs.a] });

    const first = await callBack(params);
    const second = await callBack(params);

    expect(first).toMatchObject({ kind: "paid", enrolled: 1, notEnrolled: 0 });
    expect(second).toMatchObject({ kind: "already-settled", status: "paid" });
    const enrollments = await db.select().from(enrollment).where(eq(enrollment.customerId, plain.id));
    expect(enrollments).toHaveLength(1);
    // The enrollment keeps the price that was saved at checkout.
    expect(enrollments[0]).toMatchObject({ status: "active", price: PRICE });
  });

  it("enrolls nothing for a payment that failed at the gateway", async () => {
    const dogId = dogOf[plain.id] ?? "";
    const params = await startPayment({ customerId: plain.id, dogId, courseSlugs: [slugs.b] });
    params.set("Status", "NOK");

    expect(await callBack(params)).toMatchObject({ kind: "failed" });
    const enrollments = await db.select().from(enrollment).where(eq(enrollment.customerId, plain.id));
    expect(enrollments).toHaveLength(1);
  });

  it("leaves one enrollment and one paid, not enrolled item when two payments race for the same course", async () => {
    const customer = referredToInactive;
    const dogId = dogOf[customer.id] ?? "";
    const first = await startPayment({ customerId: customer.id, dogId, courseSlugs: [slugs.a] });
    const second = await startPayment({ customerId: customer.id, dogId, courseSlugs: [slugs.a] });

    expect(await callBack(first)).toMatchObject({ kind: "paid", enrolled: 1 });
    expect(await callBack(second)).toMatchObject({ kind: "paid", enrolled: 0, notEnrolled: 1 });

    const enrollments = await db.select().from(enrollment).where(eq(enrollment.customerId, customer.id));
    expect(enrollments).toHaveLength(1);
    const payments = (await adminListPayments({ db, status: "paid" })).filter(
      (entry) => entry.customer.id === customer.id,
    );
    expect(payments).toHaveLength(2);
    // The money was taken in both, and the Admin sees exactly one item flagged.
    expect(payments.reduce((sum, entry) => sum + entry.paidNotEnrolledCount, 0)).toBe(1);
  });
});

describe("the partner's commission", () => {
  it("is written once, at the first paid purchase, rounded down", async () => {
    const dogId = dogOf[referred.id] ?? "";

    await callBack(await startPayment({ customerId: referred.id, dogId, courseSlugs: [slugs.a] }));
    const afterFirst = await commissionsOf(referred.id);
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0]).toMatchObject({
      partnerId: partnerPerson.id,
      baseAmount: PRICE,
      percent: 10,
      amount: 700_000,
      paidAt: null,
    });

    // A later purchase earns nothing.
    await callBack(await startPayment({ customerId: referred.id, dogId, courseSlugs: [slugs.b] }));
    expect(await commissionsOf(referred.id)).toHaveLength(1);
  });

  it("is not written for a customer without a partner, or whose partner is inactive", async () => {
    expect(await commissionsOf(plain.id)).toEqual([]);
    expect(await commissionsOf(referredToInactive.id)).toEqual([]);
  });
});
