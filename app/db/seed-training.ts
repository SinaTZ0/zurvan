import { eq, inArray, or, sql } from "drizzle-orm";

import type { Database, Transaction } from "~/db/client.server";
import {
  course,
  customerOrder,
  discountCode,
  enrollment,
  orderItem,
  payment,
  trainingSession,
  wallet,
  walletTransaction,
  walletTransactionLine,
} from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { tehranToUtc, utcToTehranParts } from "~/lib/tehran-time";
import {
  applyDiscountCode,
  bookCourse,
  cancelEnrollment,
  completeGatewayPayment,
  payOrder,
} from "~/orpc/order/service";

/*===== Demo Training =====*/
// The demo's courses, orders and money, for `seed-demo.ts`. Everything is bought through the real order flow (book, pay
// through the demo gateway, cancel with a refund), so every transaction, balance and split is exactly what the app
// would have made. Only the sessions and the results are written directly, back-dated, since the trainer's procedures
// only accept the present.

const DAY_MS = 86_400_000;
const CALLBACK_URL = "http://localhost/payment/callback";

/*===== Discount Codes =====*/
// Upserted by code. Their use counts start again at 0 with each seed, then the demo's paid orders count up.
const DEMO_DISCOUNT_CODES = [
  {
    code: "MEHR1405",
    description: "تخفیف مهر برای همه‌ی دوره‌ها",
    type: "percentage",
    value: 10,
    // 500 thousand toman.
    maxDiscountAmount: 5_000_000,
    scope: "all",
  },
  {
    code: "WELCOME",
    description: "اولین خرید، ۳۰۰ هزار تومان",
    type: "fixed",
    value: 3_000_000,
    firstOrderOnly: true,
    scope: "all",
  },
] as const;

/*===== Reset =====*/
/**
 * Removes the demo customers' orders, payments, enrollments and sessions, and the transactions they made. A
 * transaction's lines are taken off every wallet they touched (trainers', the Admin's and the gateway's too), so the
 * cached balances stay true. Runs inside the demo seed's transaction, before the dogs go.
 */
export async function removeDemoTraining({ tx, customerIds }: { tx: Transaction; customerIds: string[] }) {
  if (customerIds.length === 0) return;

  const orders = await tx
    .select({ id: customerOrder.id })
    .from(customerOrder)
    .where(inArray(customerOrder.customerId, customerIds));
  const orderIds = orders.map((row) => row.id);

  /*------ Money ------*/
  // Purchases and refunds point at the order items, gateway payments at the payments; manual transactions with a demo
  // customer (none yet) would be the Admin's to undo.
  if (orderIds.length > 0) {
    const transactions = await tx
      .select({ id: walletTransaction.id })
      .from(walletTransaction)
      .leftJoin(orderItem, eq(walletTransaction.orderItemId, orderItem.id))
      .leftJoin(payment, eq(walletTransaction.paymentId, payment.id))
      .where(or(inArray(orderItem.orderId, orderIds), inArray(payment.orderId, orderIds)));
    const transactionIds = transactions.map((row) => row.id);

    if (transactionIds.length > 0) {
      const lines = await tx
        .select({ walletId: walletTransactionLine.walletId, amount: walletTransactionLine.amount })
        .from(walletTransactionLine)
        .where(inArray(walletTransactionLine.transactionId, transactionIds));
      for (const line of lines) {
        await tx
          .update(wallet)
          .set({ balance: sql`${wallet.balance} - ${line.amount}` })
          .where(eq(wallet.id, line.walletId));
      }
      // The balance trigger runs at commit, when the headers are gone with their lines.
      await tx.delete(walletTransactionLine).where(inArray(walletTransactionLine.transactionId, transactionIds));
      await tx.update(walletTransaction).set({ mirrorOfId: null }).where(inArray(walletTransaction.id, transactionIds));
      await tx.delete(walletTransaction).where(inArray(walletTransaction.id, transactionIds));
    }
  }

  /*------ Training and Orders ------*/
  const enrollments = await tx
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(inArray(enrollment.customerId, customerIds));
  const enrollmentIds = enrollments.map((row) => row.id);
  if (enrollmentIds.length > 0) {
    await tx.delete(trainingSession).where(inArray(trainingSession.enrollmentId, enrollmentIds));
    await tx.delete(enrollment).where(inArray(enrollment.id, enrollmentIds));
  }
  if (orderIds.length > 0) {
    await tx.delete(payment).where(inArray(payment.orderId, orderIds));
    await tx.delete(orderItem).where(inArray(orderItem.orderId, orderIds));
    await tx.delete(customerOrder).where(inArray(customerOrder.id, orderIds));
  }
}

/*===== Seed =====*/
type Purchase = {
  slug: string;
  kind?: "course" | "test";
  /** Days before today it was bought. */
  daysAgo: number;
  discountCode?: string;
  boarding?: boolean;
};

/**
 * Buys one course for a dog through the real flow, at a moment in the past, and returns its enrollment id.
 *
 * @throws Error when any step doesn't go through: the demo must not be seeded half-way.
 */
async function buy({
  db,
  customerId,
  dogId,
  address,
  preferredTimes,
  purchase,
}: {
  db: Database;
  customerId: string;
  dogId: string;
  address: string;
  preferredTimes: string;
  purchase: Purchase;
}): Promise<string> {
  const now = new Date(Date.now() - purchase.daysAgo * DAY_MS);
  const gateway = getPaymentGateway();

  const booked = await bookCourse({
    db,
    customerId,
    now,
    input: {
      courseSlug: purchase.slug,
      kind: purchase.kind ?? "course",
      dogId,
      trainingGoal: "home",
      boarding: purchase.boarding ?? false,
      address: purchase.boarding ? null : address,
      preferredTimes,
      confirmRetake: true,
    },
  });
  if (booked.kind !== "success") throw new Error(`seed: booking ${purchase.slug} failed: ${JSON.stringify(booked)}`);

  if (purchase.discountCode) {
    const applied = await applyDiscountCode({
      db,
      customerId,
      id: booked.orderId,
      input: { code: purchase.discountCode },
      now,
    });
    if (applied.kind !== "success") throw new Error(`seed: code ${purchase.discountCode}: ${JSON.stringify(applied)}`);
  }

  // Through the gateway, not the wallet: the demo keeps the refunded balance for the owner to spend at checkout.
  const paid = await payOrder({
    db,
    gateway,
    customerId,
    id: booked.orderId,
    useWallet: false,
    callbackUrl: CALLBACK_URL,
    now,
  });
  if (paid.kind === "redirect") {
    const params = new URL(paid.url, "http://localhost").searchParams;
    const settled = await completeGatewayPayment({
      db,
      gateway,
      authority: params.get("Authority") ?? "",
      callbackParams: params,
      now,
    });
    if (settled.kind !== "succeeded" || !settled.fulfilled) throw new Error(`seed: paying ${purchase.slug} failed`);
  } else if (paid.kind !== "paid") {
    throw new Error(`seed: paying ${purchase.slug} failed: ${JSON.stringify(paid)}`);
  }

  const [row] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .innerJoin(orderItem, eq(enrollment.orderItemId, orderItem.id))
    .where(eq(orderItem.orderId, booked.orderId));
  if (!row) throw new Error(`seed: ${purchase.slug} has no enrollment`);
  return row.id;
}

/** A session at `time` on the Tehran day `days` from today (negative for the past). */
function sessionAt({ days, time }: { days: number; time: string }): Date {
  const today = utcToTehranParts(new Date()).date;
  const date = new Date(new Date(`${today}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
  return tehranToUtc({ date, time });
}

type SessionPlan = { days: number; time: string; status: "scheduled" | "held" | "missed"; note?: string };

/** Writes an enrollment's sessions and moves it on: active with any session, or ended with a result. */
async function recordTraining({
  db,
  enrollmentId,
  trainerId,
  place,
  sessions,
  result,
}: {
  db: Database;
  enrollmentId: string;
  trainerId: string;
  place: string;
  sessions: SessionPlan[];
  result?: { status: "passed" | "failed"; note: string; days: number };
}) {
  await db.insert(trainingSession).values(
    sessions.map((session) => ({
      enrollmentId,
      trainerId,
      startsAt: sessionAt(session),
      durationMinutes: 60,
      placeKind: "home",
      place,
      status: session.status,
      trainerNote: session.note ?? null,
    })),
  );
  await db
    .update(enrollment)
    .set(
      result
        ? {
            status: result.status,
            trainerNote: result.note,
            completedAt: sessionAt({ days: result.days, time: "19:00" }),
          }
        : { status: "active" },
    )
    .where(eq(enrollment.id, enrollmentId));
}

/**
 * Leo's training, which shows every status: the assistant's house manners passed long ago; the Companion 1 test failed
 * and then passed (so Companion 2 is open to him); Elementary cancelled before it started, refunded in full into
 * Sara's wallet; CGC under way with a code applied; Advanced paid yesterday and waiting for its first session.
 */
export async function seedTraining({
  db,
  idByPhone,
  dogIds,
}: {
  db: Database;
  idByPhone: Map<string, string>;
  dogIds: Map<string, string>;
}): Promise<{ enrollments: number }> {
  const arman = idByPhone.get("09120000001");
  const negar = idByPhone.get("09120000002");
  const sara = idByPhone.get("09120000004");
  const leo = dogIds.get("لئو");
  if (!arman || !negar || !sara || !leo) throw new Error("seedTraining: a demo account or Leo is missing.");

  /*------ Discount Codes ------*/
  const now = new Date();
  for (const code of DEMO_DISCOUNT_CODES) {
    const values = {
      ...code,
      startsAt: new Date(now.getTime() - 365 * DAY_MS),
      endsAt: new Date(now.getTime() + 60 * DAY_MS),
      usedCount: 0,
      isActive: true,
    };
    // Codes are matched by their upper-case text, which a plain unique column can't be an upsert target for.
    const [existing] = await db
      .select({ id: discountCode.id })
      .from(discountCode)
      .where(eq(sql`upper(${discountCode.code})`, code.code));
    if (existing) await db.update(discountCode).set(values).where(eq(discountCode.id, existing.id));
    else await db.insert(discountCode).values(values);
  }

  /*------ Courses ------*/
  // House manners is the assistant's course: she gets its new enrollments and 70% of each sale.
  await db.update(course).set({ ownerTrainerId: negar }).where(eq(course.slug, "house-manner"));

  const address = "تهران، ونک، خیابان ملاصدرا، کوچه‌ی چهارم، پلاک ۱۲، واحد ۴";
  const preferredTimes = "شنبه‌ها و دوشنبه‌ها بعد از ساعت ۱۷. جمعه صبح هم می‌شود.";
  const buyForLeo = (purchase: Purchase) =>
    buy({ db, customerId: sara, dogId: leo, address, preferredTimes, purchase });

  /*------ House Manners, with Negar: passed ------*/
  const houseManner = await buyForLeo({ slug: "house-manner", daysAgo: 300 });
  await recordTraining({
    db,
    enrollmentId: houseManner,
    trainerId: negar,
    place: address,
    sessions: [-295, -288, -281, -274, -267].map((days) => ({ days, time: "17:00", status: "held" as const })),
    result: {
      status: "passed",
      days: -267,
      note: "لئو قواعد خانه را خوب یاد گرفت: جایش را می‌شناسد و دیگر روی مهمان نمی‌پرد. تمرین در را ادامه بدهید.",
    },
  });

  /*------ Companion 1 Test: failed, then passed ------*/
  const firstTest = await buyForLeo({ slug: "companion-1", kind: "test", daysAgo: 130 });
  await recordTraining({
    db,
    enrollmentId: firstTest,
    trainerId: arman,
    place: address,
    sessions: [{ days: -125, time: "10:00", status: "held" }],
    result: {
      status: "failed",
      days: -125,
      note: "لئو کنار پا را خوب رفت، اما «بمان» را با حواس‌پرتی نگه نداشت. دو هفته تمرین کنید و دوباره بیایید.",
    },
  });
  const secondTest = await buyForLeo({ slug: "companion-1", kind: "test", daysAgo: 100 });
  await recordTraining({
    db,
    enrollmentId: secondTest,
    trainerId: arman,
    place: address,
    sessions: [{ days: -95, time: "10:00", status: "held" }],
    result: { status: "passed", days: -95, note: "این بار «بمان» را کامل نگه داشت. لئو همراه‌سگ ۱ را گذراند." },
  });

  /*------ Elementary: cancelled before it started, refunded in full ------*/
  const elementary = await buyForLeo({ slug: "elementary", daysAgo: 24 });
  const cancelled = await cancelEnrollment({
    db,
    actor: { userId: sara, role: "customer" },
    id: elementary,
    input: { reason: "آرمان پیشنهاد کرد به‌جایش پیشرفته را بگیریم." },
    now: new Date(Date.now() - 22 * DAY_MS),
  });
  if (cancelled.kind !== "success") throw new Error(`seed: cancelling Elementary failed: ${JSON.stringify(cancelled)}`);

  /*------ CGC: under way ------*/
  const cgc = await buyForLeo({ slug: "cgc", daysAgo: 30, discountCode: "MEHR1405" });
  await recordTraining({
    db,
    enrollmentId: cgc,
    trainerId: arman,
    place: address,
    sessions: [
      { days: -26, time: "17:00", status: "held", note: "شروع خوبی بود. «نگاه کن» را روزی ده بار تمرین کنید." },
      { days: -19, time: "17:00", status: "held", note: "کنار موتورهای پارک‌شده آرام ماند. عالی بود." },
      { days: -12, time: "17:00", status: "missed" },
      { days: -5, time: "17:00", status: "held", note: "اولین بار از کنار اسکیت‌بورد بدون پارس رد شد." },
      { days: 2, time: "17:00", status: "scheduled" },
      { days: 9, time: "17:00", status: "scheduled" },
    ],
  });

  /*------ Advanced: paid yesterday, waiting for its first session ------*/
  await buyForLeo({ slug: "advanced", daysAgo: 1 });

  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollment)
    .where(eq(enrollment.dogId, leo));
  return { enrollments: count?.count ?? 0 };
}
