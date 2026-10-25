import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { course, dog, evaluation, payment, paymentItem, user } from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { payInputSchema } from "~/orpc/checkout/contract";
import { adminListPayments, listMyPayments, payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== When The Customer Is Free, At Checkout =====*/
// F5: «پرداخت» can carry the weekdays and parts of the day the customer is usually free, for the call that arranges the
// lessons. Runs against the real database, where the consequences are: what is kept is only the known words, once each,
// in the order of the week; it is the customer's own and the Admin's to read; and it never decides whether anything can
// be bought. Needs the schema (`npm run db:push`). The test makes its own course and people.

const runId = randomUUID().slice(0, 8);
const phoneBase = `090${Math.floor(10000 + Math.random() * 89999)}`;
const ana = { id: `test-free-ana-${runId}`, phone: `${phoneBase}001` };
const ben = { id: `test-free-ben-${runId}`, phone: `${phoneBase}002` };
const slug = `test-free-${runId}`;
let courseId = "";
const dogs = { ana: "", ben: "" };
const callbackUrl = "http://localhost/payment/callback";

async function makeDog(ownerId: string, name: string): Promise<string> {
  const created = await createDog({
    db,
    ownerId,
    input: { breedPurity: "mixed", name, sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  const evaluated = await markDogEvaluated({ db, dogId: created.dog.id });
  if (evaluated.kind !== "success") throw new Error("Could not evaluate the test dog.");
  return created.dog.id;
}

beforeAll(async () => {
  await db.insert(user).values(
    [ana, ben].map((person) => ({
      id: person.id,
      name: "Test customer",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: "customer",
    })),
  );
  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: "آزمایش وقت آزاد",
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
  courseId = row?.id ?? "";
  dogs.ana = await makeDog(ana.id, "رکس");
  dogs.ben = await makeDog(ben.id, "بنی");
});

afterAll(async () => {
  const people = [ana.id, ben.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, people));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, people));
  await db.delete(evaluation).where(inArray(evaluation.customerId, people));
  await db.delete(dog).where(inArray(dog.ownerId, people));
  await db.delete(course).where(eq(course.id, courseId));
  await db.delete(user).where(inArray(user.id, people));
  await db.$client.end();
});

const pay = (
  customerId: string,
  dogId: string,
  extra: { availableDays?: string[]; availablePeriods?: string[] } = {},
) =>
  payCart({
    db,
    gateway: getPaymentGateway(),
    customerId,
    input: { items: [{ courseSlug: slug, dogId }], ...extra },
    callbackUrl,
  });

describe("what is kept with a payment", () => {
  it("is nothing when the customer gave nothing", async () => {
    expect((await pay(ana.id, dogs.ana)).kind).toBe("redirect");

    const [saved] = await listMyPayments({ db, customerId: ana.id });
    expect(saved).toMatchObject({ availableDays: [], availablePeriods: [] });
  });

  it("is the known days and times, once each, in the order of the week and of the day", async () => {
    const started = await pay(ben.id, dogs.ben, {
      availableDays: ["wednesday", "saturday", "wednesday", "monday"],
      availablePeriods: ["evening", "morning", "evening"],
    });
    expect(started.kind).toBe("redirect");

    const [mine] = await listMyPayments({ db, customerId: ben.id });
    expect(mine).toMatchObject({
      availableDays: ["saturday", "monday", "wednesday"],
      availablePeriods: ["morning", "evening"],
    });

    // The Admin reads the same, with the customer's name and number beside it, for the call.
    const adminSees = (await adminListPayments({ db })).find((entry) => entry.id === mine?.id);
    expect(adminSees).toMatchObject({
      availableDays: ["saturday", "monday", "wednesday"],
      availablePeriods: ["morning", "evening"],
      customer: { id: ben.id },
    });
  });

  it("is the customer's own: another customer's payment never carries it", async () => {
    const [anas] = await listMyPayments({ db, customerId: ana.id });
    expect(anas).toMatchObject({ availableDays: [], availablePeriods: [] });
  });

  it("never reaches a page as a value that isn't a day or a time of day", async () => {
    const [mine] = await listMyPayments({ db, customerId: ben.id });
    await db
      .update(payment)
      .set({ availableDays: ["someday", "friday"], availablePeriods: ["midnight"] })
      .where(eq(payment.id, mine?.id ?? ""));

    const [read] = await listMyPayments({ db, customerId: ben.id });
    expect(read).toMatchObject({ availableDays: ["friday"], availablePeriods: [] });
  });
});

describe("what «پرداخت» accepts", () => {
  const items = [{ courseSlug: "a", dogId: "b" }];

  it("takes the items alone, or with the days and times", () => {
    expect(payInputSchema.safeParse({ items }).success).toBe(true);
    expect(
      payInputSchema.safeParse({ items, availableDays: ["saturday"], availablePeriods: ["morning"] }).success,
    ).toBe(true);
  });

  it("refuses a word that isn't a day or a time, and a list padded past the week", () => {
    expect(payInputSchema.safeParse({ items, availableDays: ["someday"] }).success).toBe(false);
    expect(payInputSchema.safeParse({ items, availablePeriods: ["midnight"] }).success).toBe(false);
    expect(payInputSchema.safeParse({ items, availableDays: Array.from({ length: 8 }, () => "monday") }).success).toBe(
      false,
    );
    expect(payInputSchema.safeParse({ items, somethingElse: true }).success).toBe(false);
  });
});
