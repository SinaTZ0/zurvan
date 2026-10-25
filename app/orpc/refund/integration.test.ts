import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { auditEvent, course, dog, payment, paymentItem, refund, smsOutbox, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import { createDog } from "~/orpc/dog/service";
import {
  adminCancelRefund,
  adminCreateRefund,
  adminListRefunds,
  adminMarkRefundPaid,
  listMyRefunds,
} from "~/orpc/refund/service";

/*===== Refunds =====*/
// Runs against the real database, where the consequences are: a refund is only for a paid payment, the refunds that stand
// never add up to more than the payment charged (even when two are made at once), each is answered once, every step leaves a
// line in the audit trail, and a customer sees only their own, without the Admin's reason. Needs the schema.

const runId = randomUUID().slice(0, 8);
const phoneBase = `091${Math.floor(10000 + Math.random() * 89999)}`;
const person = (role: string, index: number) => ({
  id: `test-refund-${role}-${index}-${runId}`,
  phone: `${phoneBase}00${index}`,
  role,
});
const ana = person("customer", 0);
const ben = person("customer", 1);
const admin = person("admin", 2);
const people = [ana, ben, admin];

const CHARGED = 3_000_000;
let courseId = "";
const dogs = { ana: "", ben: "" };
const payments = { paid: "", pending: "", failed: "", deposit: "", bens: "" };
const items = { paid: "", bens: "" };

async function insertPayment({
  customerId,
  status,
  amount,
  totalAmount,
}: {
  customerId: string;
  status: "paid" | "pending" | "failed";
  amount: number;
  totalAmount?: number;
}): Promise<string> {
  const [row] = await db
    .insert(payment)
    .values({
      customerId,
      amount,
      totalAmount: totalAmount ?? amount,
      gateway: "demo",
      authority: `test-refund-${runId}-${randomUUID()}`,
      status,
      paidAt: status === "paid" ? new Date() : null,
    })
    .returning({ id: payment.id });
  if (!row) throw new Error("Could not insert the test payment.");
  return row.id;
}

async function insertItem({ paymentId, dogId }: { paymentId: string; dogId: string }): Promise<string> {
  const [row] = await db
    .insert(paymentItem)
    .values({ paymentId, courseId, dogId, price: CHARGED })
    .returning({ id: paymentItem.id });
  if (!row) throw new Error("Could not insert the test item.");
  return row.id;
}

beforeAll(async () => {
  await db.insert(user).values(
    people.map((who) => ({
      id: who.id,
      name: `Test ${who.role}`,
      email: phonePlaceholderEmail(who.phone),
      phoneNumber: who.phone,
      role: who.role,
    })),
  );
  const [row] = await db
    .insert(course)
    .values({
      slug: `test-refund-${runId}`,
      title: "آزمایش بازپرداخت",
      latinName: `Refund ${runId}`,
      family: "basics",
      status: "approved",
      summary: "آزمایشی",
      coverImage: "/x.webp",
      coverAlt: "x",
      coverWidth: 1,
      coverHeight: 1,
      price: CHARGED,
      position: 9999,
    })
    .returning({ id: course.id });
  courseId = row?.id ?? "";

  for (const [key, owner] of [
    ["ana", ana],
    ["ben", ben],
  ] as const) {
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
    dogs[key] = created.dog.id;
  }

  payments.paid = await insertPayment({ customerId: ana.id, status: "paid", amount: CHARGED });
  payments.pending = await insertPayment({ customerId: ana.id, status: "pending", amount: CHARGED });
  payments.failed = await insertPayment({ customerId: ana.id, status: "failed", amount: CHARGED });
  // A payment that took half: the full price was 2,000,000 and 1,000,000 was charged.
  payments.deposit = await insertPayment({
    customerId: ana.id,
    status: "paid",
    amount: 1_000_000,
    totalAmount: 2_000_000,
  });
  payments.bens = await insertPayment({ customerId: ben.id, status: "paid", amount: CHARGED });
  items.paid = await insertItem({ paymentId: payments.paid, dogId: dogs.ana });
  items.bens = await insertItem({ paymentId: payments.bens, dogId: dogs.ben });
});

afterAll(async () => {
  const ids = people.map((who) => who.id);
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, ids));
  await db.delete(auditEvent).where(inArray(auditEvent.actorId, ids));
  await db.delete(refund).where(inArray(refund.paymentId, paymentIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, ids));
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(course).where(eq(course.id, courseId));
  await db.delete(smsOutbox).where(inArray(smsOutbox.phoneNumber, [ana.phone, ben.phone]));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

const create = (overrides: Partial<Parameters<typeof adminCreateRefund>[0]["input"]> = {}) =>
  adminCreateRefund({
    db,
    adminId: admin.id,
    input: { paymentId: payments.paid, amount: 500_000, reason: "دوره‌ای که ثبت نشد", ...overrides },
  });

/** The fields a refused refund names, or its kind when it was refused for another reason. */
const refusedFields = async (overrides: Parameters<typeof create>[0]) => {
  const result = await create(overrides);
  return result.kind === "invalid" ? Object.keys(result.fields) : [result.kind];
};

const standing = async (paymentId: string) => {
  const rows = await db.select().from(refund).where(eq(refund.paymentId, paymentId));
  return rows.filter((row) => row.status !== "cancelled").reduce((sum, row) => sum + row.amount, 0);
};

describe("recording a refund", () => {
  it("is for a paid payment, starts pending, and leaves a line in the audit trail", async () => {
    const made = await create({ paymentItemId: items.paid });
    expect(made).toMatchObject({
      kind: "success",
      refund: {
        paymentId: payments.paid,
        paymentItemId: items.paid,
        amount: 500_000,
        status: "pending",
        reference: null,
      },
    });
    if (made.kind !== "success") throw new Error("Expected a refund.");

    const audit = await db.select().from(auditEvent).where(eq(auditEvent.entityId, made.refund.id));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ actorId: admin.id, action: "refund.created", entityType: "refund" });
    expect(audit[0]?.data).toMatchObject({ amount: 500_000, paymentId: payments.paid });
  });

  it("is refused for a payment that isn't paid, and not found for one that doesn't exist", async () => {
    expect(await create({ paymentId: payments.pending })).toEqual({ kind: "not-paid" });
    expect(await create({ paymentId: payments.failed })).toEqual({ kind: "not-paid" });
    expect(await create({ paymentId: randomUUID() })).toEqual({ kind: "not-found" });
    expect(await create({ paymentId: "not-a-uuid" })).toEqual({ kind: "not-found" });
  });

  it("is refused field by field when it is wrong, writing nothing", async () => {
    const before = await standing(payments.paid);
    expect(await refusedFields({ amount: 0 })).toEqual(["amount"]);
    expect(await refusedFields({ amount: -5 })).toEqual(["amount"]);
    expect(await refusedFields({ amount: 1.5 })).toEqual(["amount"]);
    expect(await refusedFields({ amount: Number.NaN })).toEqual(["amount"]);
    expect(await refusedFields({ reason: "   " })).toEqual(["reason"]);
    expect(await refusedFields({ reason: "x".repeat(301) })).toEqual(["reason"]);
    // An item of someone else's payment, and a malformed one, aren't this payment's.
    expect(await refusedFields({ paymentItemId: items.bens })).toEqual(["paymentItemId"]);
    expect(await refusedFields({ paymentItemId: "not-a-uuid" })).toEqual(["paymentItemId"]);
    expect(await standing(payments.paid)).toBe(before);
  });
});

describe("the limit", () => {
  it("is what the payment charged: refunds that stand never add up to more, and a cancelled one gives its share back", async () => {
    // 500,000 stands from the first test; 2,500,000 is left.
    expect(await standing(payments.paid)).toBe(500_000);
    expect(await create({ amount: 2_500_001 })).toMatchObject({
      kind: "invalid",
      fields: { amount: expect.stringContaining("قابل بازپرداخت") },
    });

    const second = await create({ amount: 2_500_000 });
    expect(second.kind).toBe("success");
    expect(await standing(payments.paid)).toBe(CHARGED);
    expect(await create({ amount: 1 })).toMatchObject({
      kind: "invalid",
      fields: { amount: "برای این پرداخت چیزی برای بازپرداخت نمانده." },
    });

    // Cancelling the second gives its 2,500,000 back to the limit.
    if (second.kind !== "success") throw new Error("Expected a refund.");
    expect((await adminCancelRefund({ db, adminId: admin.id, id: second.refund.id })).kind).toBe("success");
    expect(await standing(payments.paid)).toBe(500_000);
    expect((await create({ amount: 2_500_000 })).kind).toBe("success");
  });

  it("holds when two refunds are made at the same moment: only one fits", async () => {
    // A fresh payment of 3,000,000: two refunds of 2,000,000 each can't both stand.
    const fresh = await insertPayment({ customerId: ana.id, status: "paid", amount: CHARGED });
    const results = await Promise.all([
      create({ paymentId: fresh, amount: 2_000_000 }),
      create({ paymentId: fresh, amount: 2_000_000 }),
    ]);
    expect(results.filter((result) => result.kind === "success")).toHaveLength(1);
    expect(results.filter((result) => result.kind === "invalid")).toHaveLength(1);
    expect(await standing(fresh)).toBe(2_000_000);
  });

  it("is what was charged for a payment that took a deposit, not the full price", async () => {
    expect(await create({ paymentId: payments.deposit, amount: 1_000_001 })).toMatchObject({ kind: "invalid" });
    expect((await create({ paymentId: payments.deposit, amount: 1_000_000 })).kind).toBe("success");
  });
});

describe("answering a refund", () => {
  it("marks it paid with the transfer's reference, once, tells the customer, and audits it", async () => {
    const made = await create({ paymentId: payments.bens, amount: 400_000 });
    if (made.kind !== "success") throw new Error("Expected a refund.");
    const id = made.refund.id;

    expect(await adminMarkRefundPaid({ db, adminId: admin.id, id, reference: "   " })).toMatchObject({
      kind: "invalid",
      fields: { reference: expect.any(String) },
    });
    expect(await adminMarkRefundPaid({ db, adminId: admin.id, id, reference: "x".repeat(101) })).toMatchObject({
      kind: "invalid",
    });

    const paid = await adminMarkRefundPaid({ db, adminId: admin.id, id, reference: "TRF-9981" });
    expect(paid).toMatchObject({
      kind: "success",
      refund: { id, status: "paid", reference: "TRF-9981", paidAt: expect.any(Date) },
    });

    // Once: neither paying again nor cancelling changes a refund that was answered.
    expect(await adminMarkRefundPaid({ db, adminId: admin.id, id, reference: "TRF-0000" })).toEqual({
      kind: "not-pending",
    });
    expect(await adminCancelRefund({ db, adminId: admin.id, id })).toEqual({ kind: "not-pending" });
    const [stored] = await db.select().from(refund).where(eq(refund.id, id));
    expect(stored).toMatchObject({ status: "paid", reference: "TRF-9981" });

    const sms = await db
      .select()
      .from(smsOutbox)
      .where(and(eq(smsOutbox.phoneNumber, ben.phone), eq(smsOutbox.kind, "refund-paid")));
    expect(sms).toHaveLength(1);
    expect(sms[0]?.body).toContain("TRF-9981");

    const actions = (await db.select().from(auditEvent).where(eq(auditEvent.entityId, id))).map((row) => row.action);
    expect(actions).toContain("refund.created");
    expect(actions).toContain("refund.paid");
    expect(actions).toHaveLength(2);
  });

  it("can be cancelled before it is paid, once, and a cancelled one can't be paid", async () => {
    const made = await create({ paymentId: payments.bens, amount: 100_000 });
    if (made.kind !== "success") throw new Error("Expected a refund.");

    const cancelled = await adminCancelRefund({ db, adminId: admin.id, id: made.refund.id });
    expect(cancelled).toMatchObject({
      kind: "success",
      refund: { status: "cancelled", cancelledAt: expect.any(Date) },
    });
    expect(await adminCancelRefund({ db, adminId: admin.id, id: made.refund.id })).toEqual({ kind: "not-pending" });
    expect(await adminMarkRefundPaid({ db, adminId: admin.id, id: made.refund.id, reference: "TRF-1" })).toEqual({
      kind: "not-pending",
    });
    const actions = (await db.select().from(auditEvent).where(eq(auditEvent.entityId, made.refund.id))).map(
      (row) => row.action,
    );
    expect(actions).toContain("refund.cancelled");
  });

  it("is not found for an id that doesn't exist or isn't one", async () => {
    expect(await adminMarkRefundPaid({ db, adminId: admin.id, id: randomUUID(), reference: "x" })).toEqual({
      kind: "not-found",
    });
    expect(await adminCancelRefund({ db, adminId: admin.id, id: "nope" })).toEqual({ kind: "not-found" });
  });
});

describe("who sees what", () => {
  it("shows the Admin every refund, or one payment's, newest first", async () => {
    const all = await adminListRefunds({ db });
    expect(all.length).toBeGreaterThan(3);
    const ofOne = await adminListRefunds({ db, paymentId: payments.bens });
    expect(ofOne.every((entry) => entry.paymentId === payments.bens)).toBe(true);
    expect(await adminListRefunds({ db, paymentId: "not-a-uuid" })).toEqual([]);
    expect(ofOne.map((entry) => entry.reason).length).toBeGreaterThan(0);
  });

  it("shows a customer only the refunds of their own payments, without the Admin's reason", async () => {
    const mine = await listMyRefunds({ db, customerId: ben.id });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((entry) => entry.paymentId === payments.bens)).toBe(true);
    for (const entry of mine) {
      expect(Object.keys(entry)).not.toContain("reason");
    }
    // A refund the Admin withdrew before paying it is never shown to the customer, however they ask: Ben's payment has
    // one (the cancelling test above), and it is on record, but not in his list.
    const withdrawn = await db
      .select()
      .from(refund)
      .where(and(eq(refund.paymentId, payments.bens), eq(refund.status, "cancelled")));
    expect(withdrawn.length).toBeGreaterThan(0);
    expect(mine.some((entry) => entry.status === "cancelled")).toBe(false);
    expect(mine.map((entry) => entry.id)).not.toContain(withdrawn[0]?.id);
    // Ana's refunds are not Ben's, and his are not hers.
    const anas = await listMyRefunds({ db, customerId: ana.id });
    expect(anas.some((entry) => entry.paymentId === payments.bens)).toBe(false);
    expect(await listMyRefunds({ db, customerId: "nobody" })).toEqual([]);
  });
});
