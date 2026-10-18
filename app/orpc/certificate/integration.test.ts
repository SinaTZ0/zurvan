import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { auditEvent, certificate, course, dog, enrollment, payment, paymentItem, user } from "~/db/schema";
import { CERTIFICATE_PREFIX } from "~/lib/certificate";
import { phonePlaceholderEmail } from "~/lib/phone";
import {
  adminIssueCertificate,
  adminListCertificates,
  adminRevokeCertificate,
  listMyCertificates,
  verifyCertificate,
} from "~/orpc/certificate/service";
import { createDog } from "~/orpc/dog/service";

/*===== Certificates =====*/
// Runs against the real database, where the consequences are: a certificate exists only for a completed enrollment and
// only once, a revoked one stays on record and says only that it is revoked, and the public check tells a stranger nothing
// private. Needs the schema (`npm run db:push`). The test makes its own courses, people and enrollments.

const runId = randomUUID().slice(0, 8);
const phoneBase = `094${Math.floor(10000 + Math.random() * 89999)}`;
const person = (role: string, index: number) => ({
  id: `test-cert-${role}-${index}-${runId}`,
  phone: `${phoneBase}00${index}`,
  role,
});
const ana = person("customer", 0);
const ben = person("customer", 1);
const admin = person("admin", 2);
const people = [ana, ben, admin];

const courseIds: string[] = [];
let anasDog = "";
let bensDog = "";
const enrollmentIds = { completed: "", active: "", cancelled: "", bens: "" };

async function insertCourse(label: string): Promise<string> {
  const slug = `test-cert-${label}-${runId}`;
  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: `آزمایش ${label}`,
      latinName: `Cert ${label}`,
      family: "basics",
      status: "approved",
      summary: "آزمایشی",
      coverImage: "/x.webp",
      coverAlt: "x",
      coverWidth: 1,
      coverHeight: 1,
      price: 1_000_000,
      position: 9999,
    })
    .returning({ id: course.id });
  if (!row) throw new Error("Could not insert the test course.");
  courseIds.push(row.id);
  return row.id;
}

/** An enrollment written the way a paid payment leaves one, then set to the status the test needs. */
async function makeEnrollment({
  customerId,
  dogId,
  courseId,
  status,
}: {
  customerId: string;
  dogId: string;
  courseId: string;
  status: "active" | "completed" | "cancelled";
}): Promise<string> {
  const [paid] = await db
    .insert(payment)
    .values({
      customerId,
      amount: 1_000_000,
      gateway: "demo",
      authority: `test-cert-${runId}-${courseId}-${dogId}`,
      status: "paid",
      paidAt: new Date(),
    })
    .returning({ id: payment.id });
  const [item] = await db
    .insert(paymentItem)
    .values({ paymentId: paid?.id ?? "", courseId, dogId, price: 1_000_000 })
    .returning({ id: paymentItem.id });
  const [row] = await db
    .insert(enrollment)
    .values({
      courseId,
      dogId,
      customerId,
      paymentItemId: item?.id ?? "",
      price: 1_000_000,
      status,
      completedAt: status === "completed" ? new Date() : null,
      cancelledAt: status === "cancelled" ? new Date() : null,
    })
    .returning({ id: enrollment.id });
  if (!row) throw new Error("Could not make the test enrollment.");
  return row.id;
}

async function makeDog(ownerId: string, name: string): Promise<string> {
  const created = await createDog({
    db,
    ownerId,
    input: { name, sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  return created.dog.id;
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
  anasDog = await makeDog(ana.id, "رکس");
  bensDog = await makeDog(ben.id, "بنی");
  const [a, b, c, d] = [
    await insertCourse("a"),
    await insertCourse("b"),
    await insertCourse("c"),
    await insertCourse("d"),
  ] as [string, string, string, string];
  enrollmentIds.completed = await makeEnrollment({
    customerId: ana.id,
    dogId: anasDog,
    courseId: a,
    status: "completed",
  });
  enrollmentIds.active = await makeEnrollment({ customerId: ana.id, dogId: anasDog, courseId: b, status: "active" });
  enrollmentIds.cancelled = await makeEnrollment({
    customerId: ana.id,
    dogId: anasDog,
    courseId: c,
    status: "cancelled",
  });
  enrollmentIds.bens = await makeEnrollment({ customerId: ben.id, dogId: bensDog, courseId: d, status: "completed" });
});

afterAll(async () => {
  const ids = people.map((who) => who.id);
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, ids));
  await db.delete(auditEvent).where(inArray(auditEvent.actorId, ids));
  await db.delete(certificate).where(inArray(certificate.issuedBy, ids));
  await db.delete(enrollment).where(inArray(enrollment.customerId, ids));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, ids));
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(course).where(inArray(course.id, courseIds));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

const issue = (enrollmentId: string) => adminIssueCertificate({ db, issuerId: admin.id, enrollmentId });

/** The answer has exactly these keys, in any order: what a public answer may carry, and nothing else. */
function expectOnlyKeys(answer: object, keys: string[]) {
  const actual = Object.keys(answer);
  expect(actual).toHaveLength(keys.length);
  expect(actual).toEqual(expect.arrayContaining(keys));
}

describe("issuing a certificate", () => {
  it("is for a completed enrollment, once: issuing again returns the same one", async () => {
    const first = await issue(enrollmentIds.completed);
    const second = await issue(enrollmentIds.completed);

    expect(first).toMatchObject({ kind: "success", certificate: { revokedAt: null, dog: { id: anasDog } } });
    if (first.kind !== "success" || second.kind !== "success") throw new Error("Expected both to succeed.");
    expect(first.certificate.number.startsWith(CERTIFICATE_PREFIX)).toBe(true);
    expect(second.certificate.number).toBe(first.certificate.number);
    expect(
      await db.select().from(certificate).where(eq(certificate.enrollmentId, enrollmentIds.completed)),
    ).toHaveLength(1);
  });

  it("is refused for an enrollment that isn't completed, and not found for one that doesn't exist", async () => {
    expect(await issue(enrollmentIds.active)).toEqual({ kind: "not-completed" });
    expect(await issue(enrollmentIds.cancelled)).toEqual({ kind: "not-completed" });
    expect(await issue(randomUUID())).toEqual({ kind: "not-found" });
    expect(await issue("not-a-uuid")).toEqual({ kind: "not-found" });
    expect(await db.select().from(certificate).where(eq(certificate.enrollmentId, enrollmentIds.active))).toEqual([]);
  });
});

describe("who can list certificates", () => {
  it("is the dog's owner and the Admin; another customer gets the same not-found as for a dog that doesn't exist", async () => {
    await issue(enrollmentIds.completed);

    const mine = await listMyCertificates({ db, ownerId: ana.id, dogId: anasDog });
    expect(mine.kind === "success" ? mine.certificates.map((entry) => entry.enrollmentId) : []).toEqual([
      enrollmentIds.completed,
    ]);
    const admins = await adminListCertificates({ db, dogId: anasDog });
    expect(admins.kind).toBe("success");

    expect(await listMyCertificates({ db, ownerId: ben.id, dogId: anasDog })).toEqual({ kind: "not-found" });
    expect(await listMyCertificates({ db, ownerId: ana.id, dogId: randomUUID() })).toEqual({ kind: "not-found" });
    expect(await listMyCertificates({ db, ownerId: ana.id, dogId: "not-a-uuid" })).toEqual({ kind: "not-found" });
    expect(await adminListCertificates({ db, dogId: randomUUID() })).toEqual({ kind: "not-found" });
  });
});

describe("the public check", () => {
  it("says which course and when for a valid certificate, however the number was typed, and nothing private", async () => {
    const issued = await issue(enrollmentIds.bens);
    if (issued.kind !== "success") throw new Error("Could not issue Ben's certificate.");
    const { number } = issued.certificate;

    for (const typed of [number, number.toLowerCase(), number.slice(3), ` ${number} `]) {
      const result = await verifyCertificate({ db, number: typed });
      expect(result).toMatchObject({ kind: "valid", number, course: { title: "آزمایش d" }, dogName: null });
    }
    // No owner, no phone, no dog name, no id: only what the page needs.
    const result = await verifyCertificate({ db, number });
    expectOnlyKeys(result, ["course", "dogName", "issuedAt", "kind", "number"]);
  });

  it("says «unknown» for a number that isn't a certificate's, and the same for text that isn't a number", async () => {
    expect(await verifyCertificate({ db, number: "ZC-0000000000" })).toEqual({ kind: "unknown" });
    expect(await verifyCertificate({ db, number: "hello" })).toEqual({ kind: "unknown" });
    // A dog's file number is not a certificate number.
    expect(await verifyCertificate({ db, number: "ZD-0000000000" })).toEqual({ kind: "unknown" });
  });
});

describe("revoking a certificate", () => {
  it("needs a reason, keeps the record, and the check then says only that it is revoked", async () => {
    const issued = await issue(enrollmentIds.completed);
    if (issued.kind !== "success") throw new Error("Could not issue the certificate.");
    const { id, number } = issued.certificate;

    const refused = await adminRevokeCertificate({ db, adminId: admin.id, id, reason: "   " });
    expect(refused).toMatchObject({ kind: "invalid", fields: { reason: expect.any(String) } });
    expect((await verifyCertificate({ db, number })).kind).toBe("valid");

    const revoked = await adminRevokeCertificate({ db, adminId: admin.id, id, reason: "صادر شدن اشتباهی" });
    expect(revoked).toMatchObject({ kind: "success", certificate: { id, revokedAt: expect.any(Date) } });

    const check = await verifyCertificate({ db, number });
    expect(check).toMatchObject({ kind: "revoked", number });
    // The reason, the course and the dog are not in a revoked certificate's public answer.
    expectOnlyKeys(check, ["kind", "number", "revokedAt"]);

    const [row] = await db.select().from(certificate).where(eq(certificate.id, id));
    expect(row?.revokedReason).toBe("صادر شدن اشتباهی");

    // The trail says it was issued and revoked, by the Admin, and keeps the reason out.
    const trail = await db.select().from(auditEvent).where(eq(auditEvent.entityId, id));
    expect(trail.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["certificate.issued", "certificate.revoked"]),
    );
    expect(trail).toHaveLength(2);
    expect(JSON.stringify(trail)).not.toContain("اشتباهی");
  });

  it("keeps the first time and reason when revoked again, is not found for an unknown id, and can't be issued anew", async () => {
    const [row] = await db.select().from(certificate).where(eq(certificate.enrollmentId, enrollmentIds.completed));
    const before = row?.revokedAt?.getTime();
    expect(before).toBeDefined();

    const again = await adminRevokeCertificate({ db, adminId: admin.id, id: row?.id ?? "", reason: "دلیل دوم" });
    expect(again.kind).toBe("success");
    const [after] = await db
      .select()
      .from(certificate)
      .where(eq(certificate.id, row?.id ?? ""));
    expect(after?.revokedAt?.getTime()).toBe(before);
    expect(after?.revokedReason).toBe("صادر شدن اشتباهی");

    expect(await adminRevokeCertificate({ db, adminId: admin.id, id: randomUUID(), reason: "x" })).toEqual({
      kind: "not-found",
    });
    expect(await adminRevokeCertificate({ db, adminId: admin.id, id: "nope", reason: "x" })).toEqual({
      kind: "not-found",
    });

    // Issuing again returns the revoked certificate: revocation is final.
    const reissued = await issue(enrollmentIds.completed);
    expect(reissued).toMatchObject({ kind: "success", certificate: { id: row?.id, revokedAt: expect.any(Date) } });
  });
});
