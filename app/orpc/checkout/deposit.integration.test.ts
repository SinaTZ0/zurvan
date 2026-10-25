import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  commission,
  course,
  dog,
  enrollment,
  evaluation,
  partner,
  payment,
  paymentItem,
  platformSetting,
  user,
} from "~/db/schema";
import { getPaymentGateway, type PaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { completeGatewayPayment, listMyPayments, payCart, reviewCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";
import { DEPOSIT_PERCENT_KEY } from "~/orpc/setting/constants";
import { updateSetting } from "~/orpc/setting/service";

/*===== Deposit =====*/
// Runs against the real database, where the consequences are: with a deposit set, the gateway is charged the deposit and
// no more, the items and the enrollment keep their full price, a failed payment enrolls nothing, the balance is recorded
// and shown, and a payment keeps the percent it was made with. With no deposit set nothing changes: the whole price is
// charged. The setting is shared state, so its row is saved up front and put back afterwards.

const runId = randomUUID().slice(0, 8);
const phoneBase = `092${Math.floor(10000 + Math.random() * 89999)}`;
const partnerPerson = { id: `test-dep-partner-${runId}`, phone: `${phoneBase}001` };
const buyer = { id: `test-dep-buyer-${runId}`, phone: `${phoneBase}002` };
const referred = { id: `test-dep-referred-${runId}`, phone: `${phoneBase}003` };
const people = [partnerPerson, buyer, referred];

// Not a round number, so rounding up shows: half of 7,000,005 is 3,500,002.5.
const PRICE = 7_000_005;
const slugs = { a: `test-dep-a-${runId}`, b: `test-dep-b-${runId}` };
const courseIds: string[] = [];
const dogOf: Record<string, string> = {};
let savedSetting: (typeof platformSetting.$inferSelect)[] = [];

/** The real demo gateway that also remembers what it was asked to charge. */
const chargedAtGateway: number[] = [];
const gateway: PaymentGateway = {
  ...getPaymentGateway(),
  start: async (input) => {
    chargedAtGateway.push(input.amount);
    return getPaymentGateway().start(input);
  },
};

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
      price: PRICE,
      position: 9999,
    })
    .returning({ id: course.id });
  if (row) courseIds.push(row.id);
}

beforeAll(async () => {
  savedSetting = await db.select().from(platformSetting).where(eq(platformSetting.key, DEPOSIT_PERCENT_KEY));
  await db.insert(user).values(
    people.map((person, index) => ({
      id: person.id,
      name: `Test ${index}`,
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: person === partnerPerson ? "partner" : "customer",
    })),
  );
  await db.insert(partner).values({ userId: partnerPerson.id, code: `tdp-${runId}`, isActive: true });
  await db.update(user).set({ referredByPartnerId: partnerPerson.id }).where(eq(user.id, referred.id));
  await insertCourse(slugs.a);
  await insertCourse(slugs.b);

  for (const customer of [buyer, referred]) {
    const created = await createDog({
      db,
      ownerId: customer.id,
      input: {
        breedPurity: "mixed",
        name: "رکس",
        sex: "male",
        birthDate: "2024-05-01",
        weightKg: 20,
        isNeutered: true,
      },
    });
    if (created.kind !== "success") throw new Error("Could not create the test dog.");
    dogOf[customer.id] = created.dog.id;
    await markDogEvaluated({ db, dogId: created.dog.id });
  }
});

afterAll(async () => {
  // Put the setting back exactly as it was.
  await db.delete(platformSetting).where(eq(platformSetting.key, DEPOSIT_PERCENT_KEY));
  if (savedSetting.length > 0) await db.insert(platformSetting).values(savedSetting);

  const customerIds = [buyer.id, referred.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(commission).where(inArray(commission.customerId, customerIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, customerIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(evaluation).where(inArray(evaluation.customerId, customerIds));
  await db.delete(dog).where(inArray(dog.ownerId, customerIds));
  await db.update(user).set({ referredByPartnerId: null }).where(inArray(user.id, customerIds));
  await db.delete(partner).where(eq(partner.userId, partnerPerson.id));
  await db.delete(course).where(inArray(course.id, courseIds));
  await db.delete(user).where(
    inArray(
      user.id,
      people.map((person) => person.id),
    ),
  );
  await db.$client.end();
});

async function start({ customerId, courseSlug }: { customerId: string; courseSlug: string }) {
  const started = await payCart({
    db,
    gateway,
    customerId,
    input: { items: [{ courseSlug, dogId: dogOf[customerId] ?? "" }] },
    callbackUrl: "http://localhost/payment/callback",
  });
  if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
  return new URL(started.url, "http://localhost").searchParams;
}

const settle = (params: URLSearchParams) =>
  completeGatewayPayment({ db, gateway, authority: params.get("Authority") ?? "", callbackParams: params });

async function latestPayment(customerId: string) {
  const [row] = await listMyPayments({ db, customerId });
  if (!row) throw new Error("Expected a payment.");
  return row;
}

describe("with no deposit set", () => {
  it("charges the whole price: nothing changes", async () => {
    await db.delete(platformSetting).where(eq(platformSetting.key, DEPOSIT_PERCENT_KEY));
    const review = await reviewCart({
      db,
      customerId: buyer.id,
      input: { items: [{ courseSlug: slugs.a, dogId: dogOf[buyer.id] ?? "" }] },
    });
    expect(review).toMatchObject({ total: PRICE, depositPercent: 100, dueNow: PRICE });

    const before = chargedAtGateway.length;
    const params = await start({ customerId: buyer.id, courseSlug: slugs.a });
    expect(chargedAtGateway.slice(before)).toEqual([PRICE]);
    expect(await settle(params)).toMatchObject({ kind: "paid", enrolled: 1 });
    expect(await latestPayment(buyer.id)).toMatchObject({ amount: PRICE, totalAmount: PRICE, depositPercent: 100 });
  });
});

describe("with a 50% deposit", () => {
  it("shows what is due now, rounded up to the Rial, and the full price", async () => {
    await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value: 50 });
    const review = await reviewCart({
      db,
      customerId: buyer.id,
      input: { items: [{ courseSlug: slugs.b, dogId: dogOf[buyer.id] ?? "" }] },
    });
    expect(review).toMatchObject({ total: PRICE, depositPercent: 50, dueNow: 3_500_003 });
  });

  it("charges the gateway the deposit only, keeps the full price on the item, the enrollment and the commission, and records the balance", async () => {
    await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value: 50 });
    const before = chargedAtGateway.length;
    const params = await start({ customerId: referred.id, courseSlug: slugs.a });
    expect(chargedAtGateway.slice(before)).toEqual([3_500_003]);

    expect(await settle(params)).toMatchObject({ kind: "paid", enrolled: 1, notEnrolled: 0 });

    const paid = await latestPayment(referred.id);
    expect(paid).toMatchObject({ status: "paid", amount: 3_500_003, totalAmount: PRICE, depositPercent: 50 });
    expect(paid.totalAmount - paid.amount).toBe(3_500_002);
    expect(paid.items[0]).toMatchObject({ price: PRICE });

    const [enrolled] = await db.select().from(enrollment).where(eq(enrollment.customerId, referred.id));
    expect(enrolled).toMatchObject({ status: "active", price: PRICE });

    // The commission is on the price of what was bought (the existing rule), not on the deposit.
    const [earned] = await db.select().from(commission).where(eq(commission.customerId, referred.id));
    expect(earned).toMatchObject({ baseAmount: PRICE, percent: 10, amount: 700_000 });
  });

  it("enrolls nothing when the deposit's payment fails, and still records both amounts", async () => {
    await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value: 50 });
    const params = await start({ customerId: buyer.id, courseSlug: slugs.b });
    params.set("Status", "NOK");

    expect(await settle(params)).toMatchObject({ kind: "failed" });
    const failed = await latestPayment(buyer.id);
    expect(failed).toMatchObject({ status: "failed", amount: 3_500_003, totalAmount: PRICE, depositPercent: 50 });
    const enrollments = await db.select().from(enrollment).where(eq(enrollment.customerId, buyer.id));
    // Only the first test's enrollment (the whole-price payment), none for this failed one.
    expect(enrollments).toHaveLength(1);
  });

  it("leaves a payment made earlier at the whole price as it was when the setting changes", async () => {
    await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value: 25 });
    const all = await listMyPayments({ db, customerId: buyer.id });
    const whole = all.find((entry) => entry.status === "paid");
    expect(whole).toMatchObject({ amount: PRICE, totalAmount: PRICE, depositPercent: 100 });
  });
});
