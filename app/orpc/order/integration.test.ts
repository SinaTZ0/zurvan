import { randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  course,
  coursePrerequisite,
  customerOrder,
  dog,
  enrollment,
  orderItem,
  payment,
  refundPolicy,
  smsOutbox,
  trainingSession,
  user,
  wallet,
  walletTransaction,
  walletTransactionLine,
} from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { createDog } from "~/orpc/dog/service";
import { findHeadTrainer } from "~/orpc/order/repository";
import { bookCourse, cancelEnrollment, completeGatewayPayment, payOrder } from "~/orpc/order/service";
import { systemWalletIds, userWalletId } from "~/orpc/wallet/service";

/*===== Order Flow =====*/
// Runs against the real database, where the money is: booking, paying (from the wallet and through the demo gateway),
// the purchase split, a repeated gateway callback, and refunds. Needs the schema, the money triggers and the refund
// policies (`npm run db:push`, `npm run db:seed`). The test makes its own courses, so prices and shares are its own.

const runId = randomUUID().slice(0, 8);
const phoneBase = `097${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "trainer" | "admin") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-order-${role}-${phoneCounter}-${runId}`, phone, role };
}

const assistant = newPerson("trainer");
const customer = newPerson("customer");
const people = [assistant, customer];

/** Made only when the database has no Admin, so the test doesn't depend on the demo seed. */
let madeHeadTrainer: ReturnType<typeof newPerson> | null = null;

const PRICE = 7_000_000;
const gateway = getPaymentGateway();
const callbackUrl = "http://localhost/payment/callback";

const ids = { basics: "", headCourse: "", assistantCourse: "", dog: "", newDog: "", headOrder: "" };

async function balanceOf(walletId: string): Promise<number> {
  const [row] = await db.select({ balance: wallet.balance }).from(wallet).where(eq(wallet.id, walletId));
  return row?.balance ?? 0;
}

async function insertCourse({
  slug,
  ownerTrainerId,
  testPrice = null,
}: {
  slug: string;
  ownerTrainerId: string | null;
  testPrice?: number | null;
}): Promise<string> {
  const [policy] = await db.select().from(refundPolicy).where(eq(refundPolicy.unheldRefundPercent, 50));
  if (!policy) throw new Error("The 50% refund policy is missing: run `npm run db:seed`.");

  const [row] = await db
    .insert(course)
    .values({
      slug: `${slug}-${runId}`,
      title: `آزمایش ${slug}`,
      latinName: slug,
      family: "basics",
      status: "approved",
      summary: "آزمایش",
      coverImage: "/x.jpg",
      coverAlt: "آزمایش",
      coverWidth: 1,
      coverHeight: 1,
      sessionCount: 7,
      place: "home",
      price: PRICE,
      testPrice,
      refundPolicyId: policy.id,
      ownerTrainerId,
      trainerSharePercent: 70,
      position: 9000,
    })
    .returning({ id: course.id });
  return row!.id;
}

/** Books a course for the test dog and returns the order id, failing the test if it isn't booked. */
async function book({ slug, dogId = ids.dog, kind = "course" }: { slug: string; dogId?: string; kind?: string }) {
  const result = await bookCourse({
    db,
    customerId: customer.id,
    input: {
      courseSlug: `${slug}-${runId}`,
      kind,
      dogId,
      trainingGoal: "home",
      boarding: false,
      address: "تهران، خیابان آزمایش",
      preferredTimes: "عصرها",
    },
  });
  return result;
}

async function bookOrThrow(slug: string): Promise<string> {
  const result = await book({ slug });
  if (result.kind !== "success") throw new Error(`Expected a booking, got ${JSON.stringify(result)}.`);
  return result.orderId;
}

async function purchaseLinesOf(orderId: string) {
  return db
    .select({ walletId: walletTransactionLine.walletId, amount: walletTransactionLine.amount })
    .from(walletTransactionLine)
    .innerJoin(walletTransaction, eq(walletTransactionLine.transactionId, walletTransaction.id))
    .innerJoin(orderItem, eq(walletTransaction.orderItemId, orderItem.id))
    .where(and(eq(orderItem.orderId, orderId), eq(walletTransaction.type, "purchase")));
}

async function enrollmentOf(orderId: string) {
  const [row] = await db
    .select({ enrollment })
    .from(enrollment)
    .innerJoin(orderItem, eq(enrollment.orderItemId, orderItem.id))
    .where(eq(orderItem.orderId, orderId));
  return row?.enrollment;
}

beforeAll(async () => {
  if (!(await findHeadTrainer({ db }))) {
    madeHeadTrainer = newPerson("admin");
    people.push(madeHeadTrainer);
  }
  await db.insert(user).values(
    people.map((person) => ({
      id: person.id,
      name: "Test person",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: person.role,
    })),
  );

  ids.basics = await insertCourse({ slug: "basics", ownerTrainerId: null });
  ids.headCourse = await insertCourse({ slug: "head", ownerTrainerId: null, testPrice: 1_000_000 });
  ids.assistantCourse = await insertCourse({ slug: "assistant", ownerTrainerId: assistant.id });
  await db.insert(coursePrerequisite).values({ courseId: ids.assistantCourse, requiredCourseId: ids.basics });

  const input = { name: "رکس", sex: "male", birthDate: "2023-01-01", weightKg: 20, isNeutered: true };
  for (const key of ["dog", "newDog"] as const) {
    const created = await createDog({ db, ownerId: customer.id, input });
    if (created.kind !== "success") throw new Error("Could not create a test dog.");
    ids[key] = created.dog.id;
  }
  // Arman knows the first dog, so it has a record; the second is new.
  await db.update(dog).set({ knownSince: "2024-01-01" }).where(eq(dog.id, ids.dog));
});

afterAll(async () => {
  const personIds = people.map((person) => person.id);
  const courseIds = [ids.basics, ids.headCourse, ids.assistantCourse];

  await db.transaction(async (tx) => {
    const orders = await tx
      .select({ id: customerOrder.id })
      .from(customerOrder)
      .where(inArray(customerOrder.customerId, personIds));
    const orderIds = orders.map((row) => row.id);
    const items = orderIds.length
      ? await tx.select({ id: orderItem.id }).from(orderItem).where(inArray(orderItem.orderId, orderIds))
      : [];
    const payments = orderIds.length
      ? await tx.select({ id: payment.id }).from(payment).where(inArray(payment.orderId, orderIds))
      : [];

    /*------ Money ------*/
    // The test's transactions touched the shared system wallets too, so their cached balances are put back as the lines
    // go. The balance trigger runs at commit, when the headers are gone with their lines.
    const transactions = await tx
      .select({ id: walletTransaction.id })
      .from(walletTransaction)
      .where(
        sql`${walletTransaction.orderItemId} in (${sql.join(
          [...items.map((row) => sql`${row.id}`), sql`null`],
          sql`, `,
        )}) or ${walletTransaction.paymentId} in (${sql.join([...payments.map((row) => sql`${row.id}`), sql`null`], sql`, `)})`,
      );
    const transactionIds = transactions.map((row) => row.id);
    if (transactionIds.length > 0) {
      const lines = await tx
        .select()
        .from(walletTransactionLine)
        .where(inArray(walletTransactionLine.transactionId, transactionIds));
      for (const line of lines) {
        await tx
          .update(wallet)
          .set({ balance: sql`${wallet.balance} - ${line.amount}` })
          .where(eq(wallet.id, line.walletId));
      }
      await tx.delete(walletTransactionLine).where(inArray(walletTransactionLine.transactionId, transactionIds));
      await tx.update(walletTransaction).set({ mirrorOfId: null }).where(inArray(walletTransaction.id, transactionIds));
      await tx.delete(walletTransaction).where(inArray(walletTransaction.id, transactionIds));
    }

    /*------ Orders and Training ------*/
    const enrollments = await tx
      .select({ id: enrollment.id })
      .from(enrollment)
      .where(inArray(enrollment.customerId, personIds));
    if (enrollments.length > 0) {
      await tx.delete(trainingSession).where(
        inArray(
          trainingSession.enrollmentId,
          enrollments.map((row) => row.id),
        ),
      );
      await tx.delete(enrollment).where(
        inArray(
          enrollment.id,
          enrollments.map((row) => row.id),
        ),
      );
    }
    if (orderIds.length > 0) {
      await tx.delete(payment).where(inArray(payment.orderId, orderIds));
      await tx.delete(orderItem).where(inArray(orderItem.orderId, orderIds));
      await tx.delete(customerOrder).where(inArray(customerOrder.id, orderIds));
    }
    await tx.delete(wallet).where(inArray(wallet.ownerUserId, personIds));
    await tx.delete(coursePrerequisite).where(inArray(coursePrerequisite.courseId, courseIds));
    await tx.delete(course).where(inArray(course.id, courseIds));
    await tx.delete(dog).where(inArray(dog.ownerId, personIds));
    await tx.delete(smsOutbox).where(
      inArray(
        smsOutbox.phoneNumber,
        people.map((person) => person.phone),
      ),
    );
    await tx.delete(user).where(inArray(user.id, personIds));
  });
  await db.$client.end();
});

describe("eligibility", () => {
  it("sends a new dog to the assessment, and holds a dog back from a course whose prerequisite it hasn't passed", async () => {
    expect(await book({ slug: "head", dogId: ids.newDog })).toMatchObject({ kind: "not-eligible" });
    // A test is an assessment itself, so a new dog can book it.
    expect(await book({ slug: "head", dogId: ids.newDog, kind: "test" })).toMatchObject({ kind: "success" });

    const blocked = await book({ slug: "assistant" });
    expect(blocked).toMatchObject({ kind: "not-eligible" });
    expect(blocked.kind === "not-eligible" && blocked.errors[0]).toContain("آزمایش basics");
  });
});

describe("paying an order through the gateway", () => {
  it("splits the head trainer's sale into the Admin's wallet, and a repeated callback changes nothing", async () => {
    const orderId = await bookOrThrow("head");
    ids.headOrder = orderId;
    const paid = await payOrder({ db, gateway, customerId: customer.id, id: orderId, useWallet: true, callbackUrl });
    if (paid.kind !== "redirect") throw new Error(`Expected a gateway redirect, got ${paid.kind}.`);

    const params = new URL(paid.url, "http://localhost").searchParams;
    const authority = params.get("Authority") ?? "";
    expect(await completeGatewayPayment({ db, gateway, authority, callbackParams: params })).toMatchObject({
      kind: "succeeded",
      fulfilled: true,
    });

    /*------ The Split ------*/
    const system = await systemWalletIds({ db, kinds: ["admin"] });
    const customerWallet = await userWalletId({ db, userId: customer.id });
    const lines = await purchaseLinesOf(orderId);
    // The head trainer has no wallet of his own: his 70% joins the Admin's 30% (B8).
    expect(lines).toEqual(
      expect.arrayContaining([
        { walletId: customerWallet, amount: -PRICE },
        { walletId: system.admin, amount: PRICE },
      ]),
    );
    expect(lines).toHaveLength(2);
    expect(await enrollmentOf(orderId)).toMatchObject({ status: "scheduling", plannedSessions: 7 });
    // The gateway paid it in, and the purchase spent it.
    expect(await balanceOf(customerWallet)).toBe(0);

    /*------ The Same Callback Again ------*/
    expect(await completeGatewayPayment({ db, gateway, authority, callbackParams: params })).toMatchObject({
      kind: "already-settled",
    });
    const items = await db.select({ id: orderItem.id }).from(orderItem).where(eq(orderItem.orderId, orderId));
    const transactions = await db
      .select({ id: walletTransaction.id })
      .from(walletTransaction)
      .where(
        inArray(
          walletTransaction.orderItemId,
          items.map((item) => item.id),
        ),
      );
    expect(transactions).toHaveLength(1);
    expect(await purchaseLinesOf(orderId)).toHaveLength(2);
    expect(await balanceOf(customerWallet)).toBe(0);
  });
});

describe("refunds", () => {
  it("gives everything back before the first session, into the wallet, and the wallet then pays the next order", async () => {
    const enrolled = await enrollmentOf(ids.headOrder);
    if (!enrolled) throw new Error("Expected the enrollment from the gateway test.");

    const cancelled = await cancelEnrollment({
      db,
      actor: { userId: customer.id, role: "customer" },
      id: enrolled.id,
      input: {},
    });
    expect(cancelled).toMatchObject({ kind: "success", refund: { amount: PRICE, rule: "before-first-session" } });
    const customerWallet = await userWalletId({ db, userId: customer.id });
    expect(await balanceOf(customerWallet)).toBe(PRICE);

    // The basics course costs the same, so the refund pays all of it, with no gateway.
    const orderId = await bookOrThrow("basics");
    expect(await payOrder({ db, gateway, customerId: customer.id, id: orderId, useWallet: true, callbackUrl })).toEqual(
      {
        kind: "paid",
        orderId,
      },
    );
    expect(await balanceOf(customerWallet)).toBe(0);
  });

  it("refunds the policy's share of the unheld sessions after one is held, and the trainer gives back theirs", async () => {
    // The assistant's course needs basics passed: the dog has just been enrolled in it, so record the pass.
    await db.update(enrollment).set({ status: "passed" }).where(eq(enrollment.courseId, ids.basics));
    const orderId = await bookOrThrow("assistant");
    const paid = await payOrder({ db, gateway, customerId: customer.id, id: orderId, useWallet: false, callbackUrl });
    if (paid.kind !== "redirect") throw new Error(`Expected a gateway redirect, got ${paid.kind}.`);
    const params = new URL(paid.url, "http://localhost").searchParams;
    await completeGatewayPayment({ db, gateway, authority: params.get("Authority") ?? "", callbackParams: params });

    const assistantWallet = await userWalletId({ db, userId: assistant.id });
    expect(await purchaseLinesOf(orderId)).toEqual(
      expect.arrayContaining([{ walletId: assistantWallet, amount: (PRICE * 70) / 100 }]),
    );

    /*------ One of Seven Sessions Held ------*/
    const enrolled = await enrollmentOf(orderId);
    if (!enrolled) throw new Error("Expected an enrollment.");
    await db.insert(trainingSession).values({
      enrollmentId: enrolled.id,
      trainerId: assistant.id,
      startsAt: new Date(Date.now() - 86_400_000),
      durationMinutes: 60,
      placeKind: "home",
      place: "تهران",
      status: "held",
    });

    const before = await balanceOf(assistantWallet);
    const cancelled = await cancelEnrollment({
      db,
      actor: { userId: customer.id, role: "customer" },
      id: enrolled.id,
      input: { reason: "سفر" },
    });
    // 6 of 7 sessions unheld, and the policy gives back half of their share (B11).
    const refund = Math.floor((PRICE * 6 * 50) / (7 * 100));
    expect(cancelled).toMatchObject({ kind: "success", refund: { amount: refund, rule: "policy" } });
    // The trainer returns the same fraction of their 70%, rounded down (B5, B6).
    expect(before - (await balanceOf(assistantWallet))).toBe(Math.floor((((PRICE * 70) / 100) * refund) / PRICE));

    const [order] = await db.select().from(customerOrder).where(eq(customerOrder.id, orderId));
    expect(order).toMatchObject({ paymentStatus: "partially-refunded", refundedAmount: refund });

    // It is cancelled now, so it can't be cancelled (and refunded) again.
    expect(
      await cancelEnrollment({ db, actor: { userId: customer.id, role: "customer" }, id: enrolled.id, input: {} }),
    ).toMatchObject({ kind: "not-cancellable" });
  });
});
