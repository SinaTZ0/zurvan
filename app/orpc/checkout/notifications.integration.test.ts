import { randomUUID } from "node:crypto";

import { and, eq, inArray, like, or } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { course, dog, enrollment, evaluation, payment, paymentItem, smsOutbox, user } from "~/db/schema";
import { findAdminPhoneNumber } from "~/lib/notify.server";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { utcToTehranParts } from "~/lib/tehran-time";
import { completeGatewayPayment, payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated, requestEvaluation } from "~/orpc/evaluation/service";

/*===== Telling The Admin =====*/
// F9: the Admin hears about what he has to act on, by SMS (in showcase mode, into the outbox): a customer asking for the
// free evaluation, and a purchase that was paid (to call the customer). The customer gets the receipt. Runs against the
// real database. Needs the schema (`npm run db:push`). The test makes its own people and course, and only reads its own rows.

const runId = randomUUID().slice(0, 8);
const phoneBase = `089${Math.floor(10000 + Math.random() * 89999)}`;
const customer = { id: `test-notify-${runId}`, phone: `${phoneBase}001`, name: `مشتری اعلان ${runId}` };
const madeAdmin = { id: `test-notify-admin-${runId}`, phone: `${phoneBase}002` };
const courseTitle = `آزمایش اعلان ${runId}`;
const slug = `test-notify-${runId}`;
let courseId = "";
let adminPhone = "";
const dogs = { toEvaluate: "", evaluated: "" };
// What the first two cases leave for the later ones and for the cleanup.
let evaluationId = "";
let callbackParams = new URLSearchParams();

async function makeDog(name: string): Promise<string> {
  const created = await createDog({
    db,
    ownerId: customer.id,
    input: { name, sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  return created.dog.id;
}

beforeAll(async () => {
  await db.insert(user).values({
    id: customer.id,
    name: customer.name,
    email: phonePlaceholderEmail(customer.phone),
    phoneNumber: customer.phone,
    role: "customer",
  });
  // There is exactly one Admin in the product. If this database has none, this test makes one for the app to find.
  const existing = await findAdminPhoneNumber({ db });
  if (!existing) {
    await db.insert(user).values({
      id: madeAdmin.id,
      name: "Test admin",
      email: phonePlaceholderEmail(madeAdmin.phone),
      phoneNumber: madeAdmin.phone,
      role: "admin",
    });
  }
  adminPhone = (await findAdminPhoneNumber({ db })) ?? "";

  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: courseTitle,
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
  dogs.toEvaluate = await makeDog("لونا");
  dogs.evaluated = await makeDog("رکس");
  const evaluated = await markDogEvaluated({ db, dogId: dogs.evaluated });
  if (evaluated.kind !== "success") throw new Error("Could not evaluate the test dog.");
});

afterAll(async () => {
  const paymentIds = db.select({ id: payment.id }).from(payment).where(eq(payment.customerId, customer.id));
  await db
    .delete(smsOutbox)
    .where(
      or(
        eq(smsOutbox.phoneNumber, customer.phone),
        like(smsOutbox.body, `%${runId}%`),
        evaluationId ? like(smsOutbox.body, `%evaluation=${evaluationId}%`) : undefined,
      ),
    );
  await db.delete(enrollment).where(eq(enrollment.customerId, customer.id));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(eq(payment.customerId, customer.id));
  await db.delete(evaluation).where(eq(evaluation.customerId, customer.id));
  await db.delete(dog).where(eq(dog.ownerId, customer.id));
  await db.delete(course).where(eq(course.id, courseId));
  await db.delete(user).where(inArray(user.id, [customer.id, madeAdmin.id]));
  await db.$client.end();
});

const toAdmin = (kind: string) =>
  db
    .select()
    .from(smsOutbox)
    .where(and(eq(smsOutbox.phoneNumber, adminPhone), eq(smsOutbox.kind, kind)));

describe("a customer asks for the free evaluation", () => {
  it("tells the Admin, with the dog and a link that opens the request", async () => {
    const asked = await requestEvaluation({
      db,
      customerId: customer.id,
      input: {
        dogId: dogs.toEvaluate,
        earliestDate: utcToTehranParts(new Date()).date,
        availableDays: ["saturday"],
        availablePeriods: ["morning"],
        photoMediaIds: [],
        videoIds: [],
      },
    });
    if (asked.kind !== "success") throw new Error(`Could not ask for the evaluation: ${JSON.stringify(asked)}`);
    evaluationId = asked.evaluation.id;

    const ours = (await toAdmin("evaluation-requested")).filter((row) =>
      row.body.includes(`/admin/evaluations?evaluation=${evaluationId}`),
    );
    expect(ours).toHaveLength(1);
    expect(ours[0]?.body).toContain("لونا");
    expect(ours[0]?.body).toContain("با مشتری تماس بگیر");
  });
});

describe("a purchase is paid", () => {
  it("tells the Admin to call the customer, and gives the customer a receipt", async () => {
    const gateway = getPaymentGateway();
    const started = await payCart({
      db,
      gateway,
      customerId: customer.id,
      input: { items: [{ courseSlug: slug, dogId: dogs.evaluated }] },
      callbackUrl: "http://localhost/payment/callback",
    });
    if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
    callbackParams = new URL(started.url, "http://localhost").searchParams;

    // Nothing is said while the payment is only started.
    const before = (await toAdmin("payment-paid-admin")).filter((row) => row.body.includes(runId));
    expect(before).toEqual([]);

    const settled = await completeGatewayPayment({
      db,
      gateway,
      authority: callbackParams.get("Authority") ?? "",
      callbackParams,
    });
    expect(settled).toMatchObject({ kind: "paid", enrolled: 1 });

    const adminRows = (await toAdmin("payment-paid-admin")).filter((row) => row.body.includes(runId));
    expect(adminRows).toHaveLength(1);
    expect(adminRows[0]?.body).toContain(customer.name);
    expect(adminRows[0]?.body).toContain(courseTitle);
    expect(adminRows[0]?.body).toContain("با او تماس بگیر");

    const receipts = await db
      .select()
      .from(smsOutbox)
      .where(and(eq(smsOutbox.phoneNumber, customer.phone), eq(smsOutbox.kind, "payment-paid")));
    expect(receipts).toHaveLength(1);
    expect(receipts[0]?.body).toContain(courseTitle);
    expect(receipts[0]?.body).toContain("تماس می‌گیریم");
  });

  it("says nothing more when the gateway calls back a second time", async () => {
    const again = await completeGatewayPayment({
      db,
      gateway: getPaymentGateway(),
      authority: callbackParams.get("Authority") ?? "",
      callbackParams,
    });
    expect(again).toMatchObject({ kind: "already-settled" });

    const adminRows = (await toAdmin("payment-paid-admin")).filter((row) => row.body.includes(runId));
    expect(adminRows).toHaveLength(1);
  });
});
