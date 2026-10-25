import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { commission, course, dog, enrollment, partner, payment, paymentItem, user } from "~/db/schema";
import { jalaliToIso } from "~/lib/jalali";
import { phonePlaceholderEmail } from "~/lib/phone";
import { tehranJalaliMonthRange, tehranToUtc } from "~/lib/tehran-time";
import { overview } from "~/orpc/dashboard/service";
import { createDog } from "~/orpc/dog/service";

/*===== Dashboard =====*/
// Runs against the real database. The dashboard is only numbers, so what matters is that each one counts exactly what it
// promises: the right month, only paid money, only unpaid commissions. The database may hold other rows (the demo
// seed, other tests), so every case compares an overview read before inserting with one read after. Needs the schema
// (`npm run db:push`). The test makes its own people, courses and dogs.

const runId = randomUUID().slice(0, 8);
const phoneBase = `098${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "partner") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-dashboard-${role}-${phoneCounter}-${runId}`, phone, role };
}

const partnerPerson = newPerson("partner");
const customer = newPerson("customer");
const secondCustomer = newPerson("customer");
const people = [partnerPerson, customer, secondCustomer];

const PRICE_A = 4_000_000;
const PRICE_B = 6_500_000;
const ids = { courseA: "", courseB: "" };
const slugs = { a: `test-dash-a-${runId}`, b: `test-dash-b-${runId}` };
const dogOf: Record<string, string> = {};
let authorityCounter = 0;

async function insertCourse({ slug, price }: { slug: string; price: number }): Promise<string> {
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
      price,
      position: 9999,
    })
    .returning({ id: course.id });
  if (!row) throw new Error("Could not insert the test course.");
  return row.id;
}

type TestItem = { courseId: string; price: number; enrollment?: "active" | "completed" | "cancelled" };

/** A deposit takes this share of the full price (rounded up, as the checkout does); 100 is the whole price. */
const taken = (total: number, depositPercent: number) => Math.ceil((total * depositPercent) / 100);

/** A payment with its items, written straight to the tables so the status and `paidAt` are exactly what a case needs. */
async function insertPayment({
  customerId,
  status,
  paidAt,
  items,
  depositPercent = 100,
}: {
  customerId: string;
  status: "paid" | "failed" | "pending";
  paidAt: Date | null;
  items: TestItem[];
  depositPercent?: number;
}): Promise<string> {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const [row] = await db
    .insert(payment)
    .values({
      customerId,
      amount: taken(total, depositPercent),
      totalAmount: total,
      depositPercent,
      gateway: "demo",
      authority: `test-dash-${runId}-${authorityCounter++}`,
      status,
      paidAt,
    })
    .returning({ id: payment.id });
  if (!row) throw new Error("Could not insert the test payment.");

  const dogId = dogOf[customerId] ?? "";
  const itemRows = await db
    .insert(paymentItem)
    .values(items.map((item) => ({ paymentId: row.id, courseId: item.courseId, dogId, price: item.price })))
    .returning({ id: paymentItem.id, courseId: paymentItem.courseId });

  const enrollments = items.flatMap((item, index) => {
    const itemRow = itemRows[index];
    if (!item.enrollment || !itemRow) return [];
    return [
      {
        courseId: item.courseId,
        dogId,
        customerId,
        paymentItemId: itemRow.id,
        price: item.price,
        status: item.enrollment,
      },
    ];
  });
  if (enrollments.length > 0) await db.insert(enrollment).values(enrollments);

  return row.id;
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
  await db.insert(partner).values({ userId: partnerPerson.id, code: `td-${runId}`, isActive: true });

  ids.courseA = await insertCourse({ slug: slugs.a, price: PRICE_A });
  ids.courseB = await insertCourse({ slug: slugs.b, price: PRICE_B });

  for (const owner of [customer, secondCustomer]) {
    const created = await createDog({
      db,
      ownerId: owner.id,
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
    dogOf[owner.id] = created.dog.id;
  }
});

afterAll(async () => {
  const customerIds = [customer.id, secondCustomer.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(commission).where(inArray(commission.customerId, customerIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, customerIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(dog).where(inArray(dog.ownerId, customerIds));
  await db.delete(partner).where(inArray(partner.userId, [partnerPerson.id]));
  await db.delete(course).where(inArray(course.id, [ids.courseA, ids.courseB].filter(Boolean)));
  await db.delete(user).where(
    inArray(
      user.id,
      people.map((person) => person.id),
    ),
  );
  await db.$client.end();
});

function courseB(result: Awaited<ReturnType<typeof overview>>) {
  return result.courses.find((row) => row.slug === slugs.b);
}

describe("the dashboard", () => {
  it("counts money by the Tehran month: the last second of the month before is out, the first second is in", async () => {
    // 22 Mehr 1405, midday in Tehran.
    const now = tehranToUtc({ date: jalaliToIso({ year: 1405, month: 7, day: 22 }), time: "12:00" });
    const { start } = tehranJalaliMonthRange(now);
    const before = await overview({ db, now });

    const item = [{ courseId: ids.courseA, price: PRICE_A }];
    await insertPayment({
      customerId: customer.id,
      status: "paid",
      paidAt: new Date(start.getTime() - 1000),
      items: item,
    });
    await insertPayment({ customerId: customer.id, status: "paid", paidAt: start, items: item });
    // Unsettled money is in no total, even with a date inside the month.
    await insertPayment({ customerId: customer.id, status: "failed", paidAt: start, items: item });
    await insertPayment({ customerId: customer.id, status: "pending", paidAt: start, items: item });
    const after = await overview({ db, now });

    expect(after.money.month).toEqual({ year: 1405, month: 7 });
    expect(after.money.salesTotal - before.money.salesTotal).toBe(2 * PRICE_A);
    expect(after.money.salesThisMonth - before.money.salesThisMonth).toBe(PRICE_A);
  });

  it("rolls the month over the year: Esfand is month 12 and ends where Farvardin starts", async () => {
    const now = tehranToUtc({ date: jalaliToIso({ year: 1405, month: 12, day: 15 }), time: "12:00" });

    expect((await overview({ db, now })).money.month).toEqual({ year: 1405, month: 12 });
    expect(tehranJalaliMonthRange(now).end).toEqual(
      tehranToUtc({ date: jalaliToIso({ year: 1406, month: 1, day: 1 }), time: "00:00" }),
    );
  });

  it("flags a paid item with no enrollment, with its price, and shows it among the latest purchases", async () => {
    const before = await overview({ db });

    const paymentId = await insertPayment({
      customerId: customer.id,
      status: "paid",
      paidAt: new Date(),
      items: [
        { courseId: ids.courseA, price: PRICE_A, enrollment: "active" },
        { courseId: ids.courseB, price: PRICE_B },
      ],
    });
    const after = await overview({ db });

    expect(after.waiting.paidNotEnrolled.count - before.waiting.paidNotEnrolled.count).toBe(1);
    expect(after.waiting.paidNotEnrolled.amount - before.waiting.paidNotEnrolled.amount).toBe(PRICE_B);

    const latest = after.waiting.latestPurchases[0];
    expect(latest).toMatchObject({ paymentId, amount: PRICE_A + PRICE_B, customer: { id: customer.id } });
    const enrolledBySlug = Object.fromEntries(latest?.items.map((item) => [item.course.slug, item.enrolled]) ?? []);
    expect(enrolledBySlug).toEqual({ [slugs.a]: true, [slugs.b]: false });
  });

  it("counts, for a payment made with a deposit, only what was taken for the item that got no enrollment", async () => {
    const before = await overview({ db });

    // Half was charged: the unenrolled item's share of that, not its full price, is what could be sent back.
    await insertPayment({
      customerId: secondCustomer.id,
      status: "paid",
      paidAt: new Date(),
      depositPercent: 50,
      items: [
        { courseId: ids.courseA, price: PRICE_A, enrollment: "active" },
        { courseId: ids.courseB, price: PRICE_B },
      ],
    });
    const after = await overview({ db });

    const charged = taken(PRICE_A + PRICE_B, 50);
    const share = Math.floor((PRICE_B * charged) / (PRICE_A + PRICE_B));
    expect(after.waiting.paidNotEnrolled.count - before.waiting.paidNotEnrolled.count).toBe(1);
    expect(after.waiting.paidNotEnrolled.amount - before.waiting.paidNotEnrolled.amount).toBe(share);
    expect(share).toBeLessThan(PRICE_B);
    // What the Admin is told to send back never exceeds what the gateway took for the whole payment.
    expect(share).toBeLessThanOrEqual(charged);
  });

  it("counts a course's enrollments per status, and the totals move the same", async () => {
    const before = await overview({ db });

    await insertPayment({
      customerId: secondCustomer.id,
      status: "paid",
      paidAt: new Date(),
      items: [{ courseId: ids.courseB, price: PRICE_B, enrollment: "active" }],
    });
    await insertPayment({
      customerId: secondCustomer.id,
      status: "paid",
      paidAt: new Date(),
      items: [{ courseId: ids.courseB, price: PRICE_B, enrollment: "completed" }],
    });
    await insertPayment({
      customerId: secondCustomer.id,
      status: "paid",
      paidAt: new Date(),
      items: [{ courseId: ids.courseB, price: PRICE_B, enrollment: "cancelled" }],
    });
    const after = await overview({ db });

    // Course B already has the earlier case's unenrolled item, which is not "bought".
    expect(courseB(before)).toMatchObject({ bought: 0, active: 0, completed: 0 });
    expect(courseB(after)).toMatchObject({ bought: 3, active: 1, completed: 1 });
    expect(after.enrollments.active - before.enrollments.active).toBe(1);
    expect(after.enrollments.completed - before.enrollments.completed).toBe(1);
    expect(after.enrollments.cancelled - before.enrollments.cancelled).toBe(1);
  });

  it("counts only the commissions that are not paid yet", async () => {
    const before = await overview({ db });

    const owed = [
      { owner: customer, amount: 250_000, paidAt: null },
      { owner: secondCustomer, amount: 100_000, paidAt: new Date() },
    ];
    for (const { owner, amount, paidAt } of owed) {
      const paymentId = await insertPayment({
        customerId: owner.id,
        status: "paid",
        paidAt: new Date(),
        items: [{ courseId: ids.courseA, price: PRICE_A }],
      });
      await db.insert(commission).values({
        partnerId: partnerPerson.id,
        customerId: owner.id,
        paymentId,
        baseAmount: PRICE_A,
        percent: 10,
        amount,
        paidAt,
      });
    }
    const after = await overview({ db });

    expect(after.money.unpaidCommissions.count - before.money.unpaidCommissions.count).toBe(1);
    expect(after.money.unpaidCommissions.amount - before.money.unpaidCommissions.amount).toBe(250_000);
  });
});
