import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  course,
  coursePrerequisite,
  dog,
  dogPassedCourse,
  enrollment,
  evaluation,
  payment,
  paymentItem,
  user,
} from "~/db/schema";
import type { IneligibilityKind } from "~/lib/eligibility";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { completeGatewayPayment, getMyDogCourses, payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== The Purchase Page's Verdicts =====*/
// F5: the page that starts from the dog asks the server which courses that dog can take. Runs against the real database,
// where the consequences are: it is the same judgment as the cart and «پرداخت» (so nothing is offered that couldn't be
// bought), it is the owner's alone, and a dog that isn't theirs reads exactly like one that doesn't exist. Needs the
// schema (`npm run db:push`). The test makes its own courses and people, so it doesn't depend on the demo seed.

const runId = randomUUID().slice(0, 8);
const phoneBase = `099${Math.floor(10000 + Math.random() * 89999)}`;
const ana = { id: `test-mine-ana-${runId}`, phone: `${phoneBase}001` };
const ben = { id: `test-mine-ben-${runId}`, phone: `${phoneBase}002` };

const slugs = {
  basic: `test-mine-basic-${runId}`,
  advanced: `test-mine-advanced-${runId}`,
  unpriced: `test-mine-unpriced-${runId}`,
  draft: `test-mine-draft-${runId}`,
};
const courseIds: Record<keyof typeof slugs, string> = { basic: "", advanced: "", unpriced: "", draft: "" };
const dogs = { evaluated: "", fresh: "", ben: "" };

async function insertCourse({
  slug,
  price,
  status = "approved",
}: {
  slug: string;
  price: number | null;
  status?: "approved" | "draft";
}): Promise<string> {
  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: `آزمایش ${slug}`,
      latinName: slug,
      family: "basics",
      status,
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

async function makeDog(ownerId: string, name: string): Promise<string> {
  const created = await createDog({
    db,
    ownerId,
    input: { breedPurity: "mixed", name, sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
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
  courseIds.basic = await insertCourse({ slug: slugs.basic, price: 2_000_000 });
  courseIds.advanced = await insertCourse({ slug: slugs.advanced, price: 3_000_000 });
  courseIds.unpriced = await insertCourse({ slug: slugs.unpriced, price: null });
  courseIds.draft = await insertCourse({ slug: slugs.draft, price: 1_000_000, status: "draft" });
  await db.insert(coursePrerequisite).values({ courseId: courseIds.advanced, requiredCourseId: courseIds.basic });

  dogs.evaluated = await makeDog(ana.id, "رکس");
  dogs.fresh = await makeDog(ana.id, "لونا");
  dogs.ben = await makeDog(ben.id, "بنی");
  const evaluated = await markDogEvaluated({ db, dogId: dogs.evaluated });
  if (evaluated.kind !== "success") throw new Error("Could not evaluate the test dog.");
});

afterAll(async () => {
  const people = [ana.id, ben.id];
  const ids = Object.values(courseIds).filter(Boolean);
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, people));
  await db.delete(enrollment).where(inArray(enrollment.customerId, people));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, people));
  await db.delete(dogPassedCourse).where(inArray(dogPassedCourse.courseId, ids));
  await db.delete(evaluation).where(inArray(evaluation.customerId, people));
  await db.delete(dog).where(inArray(dog.ownerId, people));
  await db.delete(coursePrerequisite).where(inArray(coursePrerequisite.courseId, ids));
  await db.delete(course).where(inArray(course.id, ids));
  await db.delete(user).where(inArray(user.id, people));
  await db.$client.end();
});

/** The verdicts for the test's own courses (the shared database may hold others), keyed by slug. */
async function verdictsFor(customerId: string, dogId: string) {
  const result = await getMyDogCourses({ db, customerId, dogId });
  if (result.kind !== "success") throw new Error(`Expected the dog's courses: ${JSON.stringify(result)}`);
  const own = result.courses.filter((entry) => (Object.values(slugs) as string[]).includes(entry.courseSlug));
  return {
    all: result.courses,
    own: Object.fromEntries(
      own.map((entry) => [
        entry.courseSlug,
        { eligible: entry.eligible, kinds: entry.problems.map((problem): IneligibilityKind => problem.kind) },
      ]),
    ),
  };
}

describe("the courses one of my dogs can take", () => {
  it("gives an evaluated dog a verdict per sold course, with the course to finish first for the one that needs it", async () => {
    const { all, own } = await verdictsFor(ana.id, dogs.evaluated);

    expect(own).toEqual({
      [slugs.basic]: { eligible: true, kinds: [] },
      [slugs.advanced]: { eligible: false, kinds: ["prerequisite"] },
      // On sale in the catalogue but without a price: not sold online.
      [slugs.unpriced]: { eligible: false, kinds: ["not-for-sale"] },
    });
    // A draft isn't offered at all.
    expect(all.map((entry) => entry.courseSlug)).not.toContain(slugs.draft);

    const advanced = all.find((entry) => entry.courseSlug === slugs.advanced);
    expect(advanced?.problems[0]).toMatchObject({ kind: "prerequisite", courseSlug: slugs.basic });
  });

  it("asks a dog that hasn't had the free evaluation for it, before anything else", async () => {
    const { own, all } = await verdictsFor(ana.id, dogs.fresh);

    expect(own[slugs.basic]).toEqual({ eligible: false, kinds: ["not-evaluated"] });
    expect(own[slugs.advanced]).toEqual({ eligible: false, kinds: ["not-evaluated", "prerequisite"] });
    // The reason is the server's own sentence, in the dog's name.
    expect(all.find((entry) => entry.courseSlug === slugs.basic)?.problems[0]?.message).toContain("لونا");
  });

  it("opens the next course once the prerequisite is passed", async () => {
    const marked = await db
      .insert(dogPassedCourse)
      .values({ dogId: dogs.evaluated, courseId: courseIds.basic, markedBy: ana.id })
      .returning({ dogId: dogPassedCourse.dogId });
    expect(marked).toHaveLength(1);

    expect((await verdictsFor(ana.id, dogs.evaluated)).own[slugs.advanced]).toEqual({ eligible: true, kinds: [] });
    // Still closed to the dog that hasn't been evaluated.
    expect((await verdictsFor(ana.id, dogs.fresh)).own[slugs.advanced]?.eligible).toBe(false);
  });

  it("stops offering a course the dog is already in, once the payment settles", async () => {
    const gateway = getPaymentGateway();
    const started = await payCart({
      db,
      gateway,
      customerId: ana.id,
      input: { items: [{ courseSlug: slugs.basic, dogId: dogs.evaluated }] },
      callbackUrl: "http://localhost/payment/callback",
    });
    if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
    const params = new URL(started.url, "http://localhost").searchParams;

    // Until the money is taken, the dog is still offered the course.
    expect((await verdictsFor(ana.id, dogs.evaluated)).own[slugs.basic]?.eligible).toBe(true);

    const settled = await completeGatewayPayment({
      db,
      gateway,
      authority: params.get("Authority") ?? "",
      callbackParams: params,
    });
    expect(settled).toMatchObject({ kind: "paid", enrolled: 1 });
    expect((await verdictsFor(ana.id, dogs.evaluated)).own[slugs.basic]).toEqual({
      eligible: false,
      kinds: ["active-enrollment"],
    });
    expect(await db.select().from(enrollment).where(eq(enrollment.dogId, dogs.evaluated))).toHaveLength(1);
  });
});

describe("whose dog it is", () => {
  it("reads another owner's dog, a malformed id and an unknown dog all the same way", async () => {
    const notFound = { kind: "not-found" };

    // Ben's dog, asked by Ana: she learns nothing about it, not even that it exists.
    expect(await getMyDogCourses({ db, customerId: ana.id, dogId: dogs.ben })).toEqual(notFound);
    // And the other way round.
    expect(await getMyDogCourses({ db, customerId: ben.id, dogId: dogs.evaluated })).toEqual(notFound);
    expect(await getMyDogCourses({ db, customerId: ana.id, dogId: "not-a-uuid" })).toEqual(notFound);
    expect(await getMyDogCourses({ db, customerId: ana.id, dogId: randomUUID() })).toEqual(notFound);
    expect(await getMyDogCourses({ db, customerId: "nobody", dogId: dogs.evaluated })).toEqual(notFound);
  });

  it("judges each owner's dog on its own facts", async () => {
    // Ben's dog hasn't had the evaluation, whatever Ana's dogs have had.
    expect((await verdictsFor(ben.id, dogs.ben)).own[slugs.basic]).toEqual({
      eligible: false,
      kinds: ["not-evaluated"],
    });
  });
});
