import { randomUUID } from "node:crypto";

import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  course,
  coursePrerequisite,
  dog,
  dogPassedCourse,
  enrollment,
  evaluation,
  media,
  payment,
  paymentItem,
  user,
} from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { payCart, reviewCart, completeGatewayPayment } from "~/orpc/checkout/service";
import type { CourseInput } from "~/orpc/course/contract";
import {
  adminCreateCourse,
  adminGetCourse,
  adminListCourses,
  adminMoveCourse,
  adminSetCourseStatus,
  adminUpdateCourse,
  getCourse,
  listCourses,
} from "~/orpc/course/service";
import { createDog, adminSetPassedCourse } from "~/orpc/dog/service";
import { finishEnrollment } from "~/orpc/enrollment/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== Course Admin =====*/
// Runs against the real database, where the consequences are: an archived course leaves the shop but keeps its
// enrollments, an edit reaches the public API at once, and a refused form writes nothing. Needs the schema
// (`npm run db:push`). The test makes its own courses and people (slugs end with a per-run id), so it doesn't depend on
// the demo seed.

const runId = randomUUID().slice(0, 8);
const phoneBase = `097${Math.floor(10000 + Math.random() * 89999)}`;
const slugOf = (name: string) => `t-${name}-${runId}`;

const admin = { id: `test-course-admin-${runId}`, phone: `${phoneBase}000` };
const buyerOne = { id: `test-course-buyer1-${runId}`, phone: `${phoneBase}001` };
const buyerTwo = { id: `test-course-buyer2-${runId}`, phone: `${phoneBase}002` };
const dogOf: Record<string, string> = {};

const coverId = randomUUID();
// An image of the wrong kind, uploaded by the same Admin.
const dogPhotoId = randomUUID();

const gateway = getPaymentGateway();
const callbackUrl = "http://localhost/payment/callback";
const PRICE = 5_000_000;

function courseInput(overrides: Partial<CourseInput> = {}): CourseInput {
  return {
    title: "دوره‌ی آزمایشی",
    latinName: "Test course",
    family: "basics",
    summary: "برای آزمایش.",
    highlights: ["  یک  ", "", "دو"],
    commands: ["بنشین"],
    coverAlt: "سگی در پارک",
    minAgeMonths: 3,
    maxAgeMonths: null,
    sessionCount: 8,
    // One place, so a purchase takes it without a pick (the pick is the checkout test's).
    places: ["home"],
    recommendedPlace: null,
    price: PRICE,
    prerequisites: [],
    ...overrides,
  };
}

/** Creates a course through the Admin service and fails the test when it is refused. */
async function makeCourse(name: string, overrides: Partial<CourseInput> = {}) {
  const result = await adminCreateCourse({
    db,
    userId: admin.id,
    input: { ...courseInput({ title: `دوره ${name}`, ...overrides }), slug: slugOf(name), coverMediaId: coverId },
  });
  if (result.kind !== "success") throw new Error(`Could not create ${name}: ${JSON.stringify(result)}`);
  return result.course;
}

async function startPayment({ customerId, courseSlug }: { customerId: string; courseSlug: string }) {
  const started = await payCart({
    db,
    gateway,
    customerId,
    input: { items: [{ courseSlug, dogId: dogOf[customerId] ?? "" }] },
    callbackUrl,
  });
  if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
  return new URL(started.url, "http://localhost").searchParams;
}

async function buy({ customerId, courseSlug }: { customerId: string; courseSlug: string }) {
  const params = await startPayment({ customerId, courseSlug });
  return completeGatewayPayment({ db, gateway, authority: params.get("Authority") ?? "", callbackParams: params });
}

function reviewOne({ customerId, courseSlug }: { customerId: string; courseSlug: string }) {
  return reviewCart({ db, customerId, input: { items: [{ courseSlug, dogId: dogOf[customerId] ?? "" }] } });
}

async function testCourseRows() {
  return db
    .select()
    .from(course)
    .where(like(course.slug, `%-${runId}`));
}

beforeAll(async () => {
  await db.insert(user).values(
    [admin, buyerOne, buyerTwo].map((person) => ({
      id: person.id,
      name: "Test person",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: person === admin ? "admin" : "customer",
    })),
  );
  await db.insert(media).values([
    { id: coverId, kind: "course", uploadedBy: admin.id, width: 2400, height: 1200, placeholder: "data:," },
    { id: dogPhotoId, kind: "dog", uploadedBy: admin.id, width: 800, height: 600, placeholder: "data:," },
  ]);

  for (const buyer of [buyerOne, buyerTwo]) {
    const created = await createDog({
      db,
      ownerId: buyer.id,
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
    dogOf[buyer.id] = created.dog.id;
    const evaluated = await markDogEvaluated({ db, dogId: created.dog.id });
    if (evaluated.kind !== "success") throw new Error("Could not evaluate the test dog.");
  }
});

afterAll(async () => {
  const buyerIds = [buyerOne.id, buyerTwo.id];
  const courseIds = (await testCourseRows()).map((row) => row.id);
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, buyerIds));

  await db.delete(enrollment).where(inArray(enrollment.customerId, buyerIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, buyerIds));
  await db.delete(dogPassedCourse).where(inArray(dogPassedCourse.dogId, Object.values(dogOf)));
  await db.delete(evaluation).where(inArray(evaluation.customerId, buyerIds));
  await db.delete(dog).where(inArray(dog.ownerId, buyerIds));
  if (courseIds.length > 0) {
    await db.delete(coursePrerequisite).where(inArray(coursePrerequisite.courseId, courseIds));
    await db.delete(course).where(inArray(course.id, courseIds));
  }
  await db.delete(media).where(eq(media.uploadedBy, admin.id));
  await db.delete(user).where(inArray(user.id, [admin.id, ...buyerIds]));
  await db.$client.end();
});

describe("archiving a course", () => {
  it("takes it off sale but keeps its enrollments, and a completed one still opens the next course", async () => {
    const x = await makeCourse("arch-x");
    const y = await makeCourse("arch-y", { prerequisites: [x.slug] });
    const customerId = buyerOne.id;

    expect(await buy({ customerId, courseSlug: x.slug })).toMatchObject({ kind: "paid", enrolled: 1 });
    // Y needs X, which the dog has bought but not passed.
    expect((await reviewOne({ customerId, courseSlug: y.slug })).items[0]).toMatchObject({ eligible: false });

    /*------ Archive ------*/
    const archived = await adminSetCourseStatus({ db, slug: x.slug, status: "archived" });
    expect(archived).toMatchObject({ kind: "success", course: { status: "archived", activeEnrollmentCount: 1 } });

    expect(await getCourse({ db, slug: x.slug })).toEqual({ kind: "not-found" });
    expect((await listCourses({ db })).map((entry) => entry.slug)).not.toContain(x.slug);
    const review = (await reviewOne({ customerId, courseSlug: x.slug })).items[0];
    expect(review?.eligible).toBe(false);
    expect(review?.problems.map((problem) => problem.kind)).toContain("not-for-sale");
    expect(
      await payCart({
        db,
        gateway,
        customerId,
        input: { items: [{ courseSlug: x.slug, dogId: dogOf[customerId] ?? "" }] },
        callbackUrl,
      }),
    ).toMatchObject({ kind: "not-eligible" });

    const [theEnrollment] = await db.select().from(enrollment).where(eq(enrollment.customerId, customerId));
    expect(theEnrollment).toMatchObject({ status: "active", price: PRICE });

    /*------ Completing it still passes the course ------*/
    const finished = await finishEnrollment({ db, id: theEnrollment?.id ?? "", status: "completed" });
    expect(finished.kind).toBe("success");
    expect((await reviewOne({ customerId, courseSlug: y.slug })).items[0]).toMatchObject({ eligible: true });

    /*------ Restore ------*/
    await adminSetCourseStatus({ db, slug: x.slug, status: "approved" });
    expect(await getCourse({ db, slug: x.slug })).toMatchObject({ kind: "success" });
    expect((await listCourses({ db })).map((entry) => entry.slug)).toContain(x.slug);
  });
});

describe("creating and editing a course", () => {
  it("shows a new course on the public API, and an edit at once, while an old enrollment keeps its price", async () => {
    const before = await adminListCourses({ db });
    const maxBefore = Math.max(0, ...before.map((entry) => entry.position));
    const x = await makeCourse("edit-x");
    const customerId = buyerTwo.id;
    const dogId = dogOf[customerId] ?? "";
    // The dog is one the Admin knows, so it has passed X without buying it.
    await adminSetPassedCourse({ db, adminId: admin.id, dogId, courseSlug: x.slug, passed: true });

    /*------ Create ------*/
    const created = await makeCourse("edit-z", { prerequisites: [x.slug] });
    expect(created).toMatchObject({
      status: "approved",
      price: PRICE,
      highlights: ["یک", "دو"],
      prerequisites: [{ slug: x.slug }],
    });
    expect(created.position).toBeGreaterThan(maxBefore);
    // The cover is built from the media row: the card variant, never a URL from the client.
    expect(created.cover).toMatchObject({ width: 960, height: 540 });
    expect(created.cover.src).toContain(`course/${coverId}/card.webp`);
    expect((await db.select().from(media).where(eq(media.id, coverId)))[0]?.attachedAt).not.toBeNull();

    expect(await getCourse({ db, slug: created.slug })).toMatchObject({
      kind: "success",
      course: { price: PRICE, prerequisites: [{ slug: x.slug }] },
    });

    /*------ Buy, then edit ------*/
    expect(await buy({ customerId, courseSlug: created.slug })).toMatchObject({ kind: "paid", enrolled: 1 });

    const newPrice = PRICE * 2;
    const updated = await adminUpdateCourse({
      db,
      userId: admin.id,
      input: { ...courseInput({ price: newPrice, title: "عنوان تازه", prerequisites: [] }), slug: created.slug },
    });
    expect(updated).toMatchObject({
      kind: "success",
      // No cover sent: the cover stays.
      course: { price: newPrice, title: "عنوان تازه", prerequisites: [], cover: { src: created.cover.src } },
    });

    expect(await getCourse({ db, slug: created.slug })).toMatchObject({
      kind: "success",
      course: { price: newPrice, title: "عنوان تازه", prerequisites: [] },
    });
    // The cart reads the current price; the enrollment keeps what was paid.
    expect((await reviewOne({ customerId, courseSlug: created.slug })).items[0]?.price).toBe(newPrice);
    const [theEnrollment] = await db.select().from(enrollment).where(eq(enrollment.customerId, customerId));
    expect(theEnrollment).toMatchObject({ price: PRICE, status: "active" });
    expect(await adminGetCourse({ db, slug: created.slug })).toMatchObject({
      kind: "success",
      course: { enrollmentCount: 1, activeEnrollmentCount: 1 },
    });
  });
});

describe("a refused form", () => {
  it("writes nothing", async () => {
    const a = await makeCourse("ref-a");
    const b = await makeCourse("ref-b");
    const rowsBefore = (await testCourseRows()).length;
    const create = (slug: string, overrides: Partial<CourseInput> = {}, coverMediaId: string = coverId) =>
      adminCreateCourse({ db, userId: admin.id, input: { ...courseInput(overrides), slug, coverMediaId } });

    /*------ Taken slug ------*/
    expect(await create(a.slug, { title: "تکراری" })).toMatchObject({
      kind: "invalid",
      fields: { slug: expect.stringContaining("قبلاً") },
    });
    expect(await adminGetCourse({ db, slug: a.slug })).toMatchObject({ course: { title: a.title } });

    /*------ Prerequisite cycle: A needs B, then B needs A ------*/
    const aNeedsB = await adminUpdateCourse({
      db,
      userId: admin.id,
      input: { ...courseInput({ title: a.title, prerequisites: [b.slug] }), slug: a.slug },
    });
    expect(aNeedsB.kind).toBe("success");
    const bNeedsA = await adminUpdateCourse({
      db,
      userId: admin.id,
      input: { ...courseInput({ title: b.title, prerequisites: [a.slug] }), slug: b.slug },
    });
    expect(bNeedsA).toMatchObject({
      kind: "invalid",
      fields: { prerequisites: expect.stringContaining(a.title) },
    });
    expect(await adminGetCourse({ db, slug: b.slug })).toMatchObject({ course: { prerequisites: [] } });

    /*------ Fields ------*/
    const newSlug = slugOf("ref-new");
    expect(await create(newSlug, { minAgeMonths: 12, maxAgeMonths: 6 })).toMatchObject({
      kind: "invalid",
      fields: { maxAgeMonths: expect.any(String) },
    });
    expect(await create(newSlug, { title: "ا".repeat(61) })).toMatchObject({
      kind: "invalid",
      fields: { title: expect.any(String) },
    });
    expect(await create(newSlug, { prerequisites: [slugOf("missing")] })).toMatchObject({
      kind: "invalid",
      fields: { prerequisites: expect.any(String) },
    });

    /*------ Cover ------*/
    for (const coverMediaId of [dogPhotoId, randomUUID(), "not-an-id", ""]) {
      expect(await create(newSlug, {}, coverMediaId)).toMatchObject({
        kind: "invalid",
        fields: { cover: expect.any(String) },
      });
    }
    expect(
      await adminUpdateCourse({
        db,
        userId: admin.id,
        input: { ...courseInput(), slug: a.slug, coverMediaId: dogPhotoId },
      }),
    ).toMatchObject({ kind: "invalid", fields: { cover: expect.any(String) } });

    expect((await testCourseRows()).length).toBe(rowsBefore);
    expect(await adminGetCourse({ db, slug: newSlug })).toEqual({ kind: "not-found" });
  });
});

describe("ordering and status", () => {
  it("moves a course past its neighbour, renumbers from ties to 1..n, and does nothing at the ends", async () => {
    const first = await makeCourse("mv-1");
    const second = await makeCourse("mv-2");
    const third = await makeCourse("mv-3");
    // One position for all three: ties, which `move` has to heal.
    await db
      .update(course)
      .set({ position: 100_000 })
      .where(inArray(course.slug, [first.slug, second.slug, third.slug]));

    const mine = new Set([first.slug, second.slug, third.slug]);
    const order = (list: { slug: string }[]) => list.map((entry) => entry.slug).filter((slug) => mine.has(slug));
    const tied = order(await adminListCourses({ db }));
    const [one, two, three] = tied;
    if (!one || !two || !three) throw new Error("Expected three test courses.");

    const moved = await adminMoveCourse({ db, slug: three, direction: "up" });
    if (moved.kind !== "success") throw new Error("move failed");
    expect(order(moved.courses)).toEqual([one, three, two]);
    expect(moved.courses.map((entry) => entry.position)).toEqual(moved.courses.map((_, index) => index + 1));

    const down = await adminMoveCourse({ db, slug: one, direction: "down" });
    if (down.kind !== "success") throw new Error("move failed");
    expect(order(down.courses)).toEqual([three, one, two]);

    /*------ The ends ------*/
    const top = down.courses[0]?.slug ?? "";
    const stillTop = await adminMoveCourse({ db, slug: top, direction: "up" });
    if (stillTop.kind !== "success") throw new Error("move failed");
    expect(stillTop.courses.map((entry) => entry.slug)).toEqual(down.courses.map((entry) => entry.slug));

    const bottom = stillTop.courses.at(-1)?.slug ?? "";
    const stillBottom = await adminMoveCourse({ db, slug: bottom, direction: "down" });
    if (stillBottom.kind !== "success") throw new Error("move failed");
    expect(stillBottom.courses.map((entry) => entry.slug)).toEqual(stillTop.courses.map((entry) => entry.slug));

    expect(await adminMoveCourse({ db, slug: slugOf("nobody"), direction: "up" })).toEqual({ kind: "not-found" });
  });

  it("gives the same result when a status is set twice", async () => {
    const target = await makeCourse("st-1");

    const once = await adminSetCourseStatus({ db, slug: target.slug, status: "archived" });
    const twice = await adminSetCourseStatus({ db, slug: target.slug, status: "archived" });
    expect(twice).toEqual(once);
    expect(twice).toMatchObject({ kind: "success", course: { status: "archived" } });

    const back = await adminSetCourseStatus({ db, slug: target.slug, status: "approved" });
    expect(back).toMatchObject({ kind: "success", course: { status: "approved" } });
    expect(await adminSetCourseStatus({ db, slug: slugOf("nobody"), status: "archived" })).toEqual({
      kind: "not-found",
    });
  });
});
