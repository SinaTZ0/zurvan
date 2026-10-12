import { randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  behaviorRequest,
  behaviorRequestVideo,
  course,
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
import {
  checkoutBehaviorPlan,
  findVideoForViewer,
  proposeBehaviorPlan,
  submitBehaviorRequest,
  withdrawBehaviorRequest,
} from "~/orpc/behavior-request/service";
import { createDog } from "~/orpc/dog/service";
import { findHeadTrainer } from "~/orpc/order/repository";
import { completeGatewayPayment, payOrder } from "~/orpc/order/service";
import { userWalletId } from "~/orpc/wallet/service";

/*===== Behavior Requests =====*/
// Runs against the real database, where the money is: a plan paid through the order flow, a plan that ran out (B13), and
// who may watch a video. Needs the schema, the money triggers and the refund policies (`npm run db:push`,
// `npm run db:seed`). The test makes its own behavior course, which sorts before the catalogue's so the services pick it,
// and its videos are database rows only (the bucket is not touched).

const runId = randomUUID().slice(0, 8);
const phoneBase = `096${Math.floor(10000 + Math.random() * 89999)}`;
let phoneCounter = 0;

function newPerson(role: "customer" | "trainer" | "admin") {
  const phone = `${phoneBase}${String(phoneCounter++).padStart(3, "0")}`;
  return { id: `test-behavior-${role}-${phoneCounter}-${runId}`, phone, role };
}

const trainer = newPerson("trainer");
const otherTrainer = newPerson("trainer");
const customer = newPerson("customer");
const otherCustomer = newPerson("customer");
const people = [trainer, otherTrainer, customer, otherCustomer];

/** Made only when the database has no Admin, so the test doesn't depend on the demo seed. */
let madeHeadTrainer: ReturnType<typeof newPerson> | null = null;

const PRICE = 8_000_000;
const SESSIONS = 5;
const DAY_MS = 86_400_000;
const gateway = getPaymentGateway();
const callbackUrl = "http://localhost/payment/callback";

const ids = { course: "", dogPaid: "", dogExpiring: "", dogWithdrawn: "", paidRequest: "", paidVideo: "" };

async function balanceOf(walletId: string): Promise<number> {
  const [row] = await db.select({ balance: wallet.balance }).from(wallet).where(eq(wallet.id, walletId));
  return row?.balance ?? 0;
}

async function insertVideoRow(uploadedBy: string): Promise<string> {
  const [row] = await db
    .insert(behaviorRequestVideo)
    .values({ uploadedBy, format: "mp4", fileName: "clip.mp4", sizeBytes: 1000 })
    .returning({ id: behaviorRequestVideo.id });
  return row!.id;
}

/** Sends a request for the dog with one fresh video, and returns the request id and the video id. */
async function sendRequest(dogId: string): Promise<{ requestId: string; videoId: string }> {
  const videoId = await insertVideoRow(customer.id);
  const result = await submitBehaviorRequest({
    db,
    customerId: customer.id,
    input: {
      dogId,
      problemCategory: "separation-anxiety",
      description: "وقتی تنها می‌ماند زوزه می‌کشد.",
      address: "تهران، خیابان آزمایش",
      preferredTimes: "عصرها",
      videoIds: [videoId],
    },
  });
  if (result.kind !== "success") throw new Error(`Expected a request, got ${JSON.stringify(result)}.`);
  return { requestId: result.id, videoId };
}

async function propose({ requestId, now }: { requestId: string; now?: Date }) {
  const result = await proposeBehaviorPlan({
    db,
    trainerId: trainer.id,
    id: requestId,
    input: { sessions: SESSIONS, price: PRICE, note: "پنج جلسه، اول تمرین تنها ماندن." },
    now,
  });
  if (result.kind !== "success") throw new Error(`Expected a plan, got ${JSON.stringify(result)}.`);
}

async function checkoutOrThrow({ requestId, now }: { requestId: string; now?: Date }): Promise<string> {
  const result = await checkoutBehaviorPlan({ db, customerId: customer.id, id: requestId, now });
  if (result.kind !== "success") throw new Error(`Expected an order, got ${JSON.stringify(result)}.`);
  return result.orderId;
}

async function startGatewayPayment(orderId: string, now?: Date) {
  const paid = await payOrder({
    db,
    gateway,
    customerId: customer.id,
    id: orderId,
    useWallet: false,
    callbackUrl,
    now,
  });
  if (paid.kind !== "redirect") throw new Error(`Expected a gateway redirect, got ${paid.kind}.`);
  const params = new URL(paid.url, "http://localhost").searchParams;
  return { params, authority: params.get("Authority") ?? "" };
}

async function enrollmentsOfRequest(requestId: string) {
  return db.select().from(enrollment).where(eq(enrollment.behaviorRequestId, requestId));
}

async function requestRow(requestId: string) {
  const [row] = await db.select().from(behaviorRequest).where(eq(behaviorRequest.id, requestId));
  return row!;
}

async function orderRow(orderId: string) {
  const [row] = await db.select().from(customerOrder).where(eq(customerOrder.id, orderId));
  return row!;
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

  const [policy] = await db.select().from(refundPolicy).where(eq(refundPolicy.unheldRefundPercent, 50));
  if (!policy) throw new Error("The 50% refund policy is missing: run `npm run db:seed`.");

  const [row] = await db
    .insert(course)
    .values({
      slug: `behavior-${runId}`,
      title: "آزمایش اصلاح رفتار",
      latinName: "behavior",
      family: "behavior",
      bookingKind: "behavior-request",
      status: "approved",
      summary: "آزمایش",
      coverImage: "/x.jpg",
      coverAlt: "آزمایش",
      coverWidth: 1,
      coverHeight: 1,
      // Priced per plan, and sessions come from the plan.
      price: null,
      sessionCount: null,
      refundPolicyId: policy.id,
      ownerTrainerId: trainer.id,
      trainerSharePercent: 70,
      // Before the catalogue's own behavior course, so the services pick this one.
      position: -9000,
    })
    .returning({ id: course.id });
  ids.course = row!.id;

  const input = { name: "رکس", sex: "male", birthDate: "2023-01-01", weightKg: 20, isNeutered: true };
  for (const key of ["dogPaid", "dogExpiring", "dogWithdrawn"] as const) {
    const created = await createDog({ db, ownerId: customer.id, input });
    if (created.kind !== "success") throw new Error("Could not create a test dog.");
    ids[key] = created.dog.id;
  }
});

afterAll(async () => {
  const personIds = people.map((person) => person.id);

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

    /*------ Orders, Training and Requests ------*/
    // Requests and order items point at each other: the request's link goes first.
    await tx.update(behaviorRequest).set({ orderItemId: null }).where(inArray(behaviorRequest.customerId, personIds));
    const enrollments = await tx
      .select({ id: enrollment.id })
      .from(enrollment)
      .where(inArray(enrollment.customerId, personIds));
    if (enrollments.length > 0) {
      const enrollmentIds = enrollments.map((row) => row.id);
      await tx.delete(trainingSession).where(inArray(trainingSession.enrollmentId, enrollmentIds));
      await tx.delete(enrollment).where(inArray(enrollment.id, enrollmentIds));
    }
    if (orderIds.length > 0) {
      await tx.delete(payment).where(inArray(payment.orderId, orderIds));
      await tx.delete(orderItem).where(inArray(orderItem.orderId, orderIds));
      await tx.delete(customerOrder).where(inArray(customerOrder.id, orderIds));
    }
    await tx.delete(behaviorRequestVideo).where(inArray(behaviorRequestVideo.uploadedBy, personIds));
    await tx.delete(behaviorRequest).where(inArray(behaviorRequest.customerId, personIds));
    await tx.delete(wallet).where(inArray(wallet.ownerUserId, personIds));
    await tx.delete(course).where(eq(course.id, ids.course));
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

describe("paying a plan", () => {
  it("creates one enrollment with the plan's sessions and price, taught by the trainer who wrote it", async () => {
    const { requestId, videoId } = await sendRequest(ids.dogPaid);
    ids.paidRequest = requestId;
    ids.paidVideo = videoId;
    await propose({ requestId });

    const orderId = await checkoutOrThrow({ requestId });
    const { params, authority } = await startGatewayPayment(orderId);
    expect(await completeGatewayPayment({ db, gateway, authority, callbackParams: params })).toMatchObject({
      kind: "succeeded",
      fulfilled: true,
    });

    /*------ The Enrollment ------*/
    const enrollments = await enrollmentsOfRequest(requestId);
    expect(enrollments).toHaveLength(1);
    expect(enrollments[0]).toMatchObject({
      courseId: ids.course,
      dogId: ids.dogPaid,
      trainerId: trainer.id,
      kind: "course",
      status: "scheduling",
      plannedSessions: SESSIONS,
      address: "تهران، خیابان آزمایش",
    });

    /*------ The Item and the Request ------*/
    const [item] = await db.select().from(orderItem).where(eq(orderItem.orderId, orderId));
    expect(item).toMatchObject({ behaviorRequestId: requestId, unitPrice: PRICE, paidAmount: PRICE });
    expect(enrollments[0]?.orderItemId).toBe(item?.id);
    expect(await requestRow(requestId)).toMatchObject({ status: "paid", orderItemId: item?.id });

    /*------ The Money ------*/
    const lines = await db
      .select({ walletId: walletTransactionLine.walletId, amount: walletTransactionLine.amount })
      .from(walletTransactionLine)
      .innerJoin(walletTransaction, eq(walletTransactionLine.transactionId, walletTransaction.id))
      .where(and(eq(walletTransaction.orderItemId, item!.id), eq(walletTransaction.type, "purchase")));
    expect(lines.reduce((sum, line) => sum + line.amount, 0)).toBe(0);
    expect(lines).toEqual(
      expect.arrayContaining([
        { walletId: await userWalletId({ db, userId: customer.id }), amount: -PRICE },
        { walletId: await userWalletId({ db, userId: trainer.id }), amount: (PRICE * 70) / 100 },
      ]),
    );
  });

  it("can't be paid twice: a paid request has no plan to check out", async () => {
    expect(await checkoutBehaviorPlan({ db, customerId: customer.id, id: ids.paidRequest })).toMatchObject({
      kind: "not-payable",
    });
    expect(await enrollmentsOfRequest(ids.paidRequest)).toHaveLength(1);
  });
});

describe("a plan that ran out", () => {
  it("can't be paid, however the order was started, and money that arrives late goes to the wallet", async () => {
    const { requestId } = await sendRequest(ids.dogExpiring);
    await propose({ requestId });
    const afterDeadline = new Date(Date.now() + 8 * DAY_MS);

    /*------ An Order Started in Time, Paid Too Late ------*/
    const early = await checkoutOrThrow({ requestId });
    expect(
      await payOrder({
        db,
        gateway,
        customerId: customer.id,
        id: early,
        useWallet: false,
        callbackUrl,
        now: afterDeadline,
      }),
    ).toMatchObject({ kind: "not-payable" });
    expect(await enrollmentsOfRequest(requestId)).toHaveLength(0);

    /*------ The Gateway Answers After the Deadline ------*/
    // The customer was already at the gateway when the time ran out: the order is cancelled, nothing is enrolled, and
    // what they paid stays in their wallet.
    const late = await checkoutOrThrow({ requestId });
    const { params, authority } = await startGatewayPayment(late);
    const customerWallet = await userWalletId({ db, userId: customer.id });
    const before = await balanceOf(customerWallet);

    expect(
      await completeGatewayPayment({ db, gateway, authority, callbackParams: params, now: afterDeadline }),
    ).toMatchObject({ kind: "succeeded", fulfilled: false });
    expect(await balanceOf(customerWallet)).toBe(before + PRICE);
    expect(await enrollmentsOfRequest(requestId)).toHaveLength(0);
    expect(await orderRow(late)).toMatchObject({ paymentStatus: "cancelled" });

    /*------ A New Checkout ------*/
    expect(
      await checkoutBehaviorPlan({ db, customerId: customer.id, id: requestId, now: afterDeadline }),
    ).toMatchObject({
      kind: "not-payable",
    });
    expect(await requestRow(requestId)).toMatchObject({ status: "expired" });
  });
});

describe("withdrawing", () => {
  it("is refused for a second request on the same dog, cancels the plan's order, and frees the dog", async () => {
    const { requestId } = await sendRequest(ids.dogWithdrawn);

    // One request at a time per dog.
    const secondVideo = await insertVideoRow(customer.id);
    expect(
      await submitBehaviorRequest({
        db,
        customerId: customer.id,
        input: {
          dogId: ids.dogWithdrawn,
          problemCategory: "play-biting",
          description: "گاز می‌گیرد.",
          address: "تهران",
          preferredTimes: "صبح‌ها",
          videoIds: [secondVideo],
        },
      }),
    ).toMatchObject({ kind: "not-eligible" });

    await propose({ requestId });
    const orderId = await checkoutOrThrow({ requestId });

    expect(await withdrawBehaviorRequest({ db, customerId: customer.id, id: requestId })).toMatchObject({
      kind: "success",
    });
    expect(await requestRow(requestId)).toMatchObject({ status: "withdrawn" });
    expect(await orderRow(orderId)).toMatchObject({ paymentStatus: "cancelled" });
    expect(await checkoutBehaviorPlan({ db, customerId: customer.id, id: requestId })).toMatchObject({
      kind: "not-payable",
    });
    expect(await withdrawBehaviorRequest({ db, customerId: customer.id, id: requestId })).toMatchObject({
      kind: "not-withdrawable",
    });

    // The dog is free to start another.
    const again = await submitBehaviorRequest({
      db,
      customerId: customer.id,
      input: {
        dogId: ids.dogWithdrawn,
        problemCategory: "play-biting",
        description: "گاز می‌گیرد.",
        address: "تهران",
        preferredTimes: "صبح‌ها",
        videoIds: [secondVideo],
      },
    });
    expect(again).toMatchObject({ kind: "success" });
  });
});

describe("videos", () => {
  it("are watched only by the request's customer and trainer, and the Admin", async () => {
    const viewers = {
      customer: { id: customer.id, role: "customer" as const },
      trainer: { id: trainer.id, role: "trainer" as const },
      admin: { id: `not-a-user-${runId}`, role: "admin" as const },
      otherCustomer: { id: otherCustomer.id, role: "customer" as const },
      otherTrainer: { id: otherTrainer.id, role: "trainer" as const },
    };
    const see = (viewer: keyof typeof viewers) =>
      findVideoForViewer({ db, viewer: viewers[viewer], id: ids.paidVideo });

    expect(await see("customer")).toMatchObject({ kind: "success" });
    expect(await see("trainer")).toMatchObject({ kind: "success" });
    expect(await see("admin")).toMatchObject({ kind: "success" });
    expect(await see("otherCustomer")).toEqual({ kind: "not-found" });
    expect(await see("otherTrainer")).toEqual({ kind: "not-found" });
  });

  it("are seen only by their uploader until they are sent with a request", async () => {
    const unsent = await insertVideoRow(customer.id);
    const see = (viewer: { id: string; role: "customer" | "trainer" | "admin" }) =>
      findVideoForViewer({ db, viewer, id: unsent });

    expect(await see({ id: customer.id, role: "customer" })).toMatchObject({ kind: "success" });
    expect(await see({ id: otherCustomer.id, role: "customer" })).toEqual({ kind: "not-found" });
    expect(await see({ id: trainer.id, role: "trainer" })).toEqual({ kind: "not-found" });
    expect(await see({ id: `not-a-user-${runId}`, role: "admin" })).toEqual({ kind: "not-found" });
  });
});
