import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import {
  auditEvent,
  certificate,
  consent,
  course,
  dog,
  enrollment,
  logbookEntry,
  payment,
  paymentItem,
  user,
} from "~/db/schema";
import { FILE_NUMBER_PREFIX, normalizeFileNumber } from "~/lib/dog-file";
import { phonePlaceholderEmail } from "~/lib/phone";
import type { UserRole } from "~/lib/user-constants";
import { createDog, updateDog } from "~/orpc/dog/service";
import { adminIssueCertificate, adminRevokeCertificate, verifyCertificate } from "~/orpc/certificate/service";
import {
  adminAddEntry,
  adminListDogLogbook,
  adminUpdateEntry,
  getPublicRecord,
  getPublicStatus,
  listDogLogbook,
  locateDog,
  setRecordPublic,
} from "~/orpc/logbook/service";

/*===== Dog File =====*/
// Runs against the real database, where the consequences are: every dog gets a file number from the database, it never
// changes, and what a number leads to depends on who asks: the owner their own dog, the Admin any dog, nobody else
// anything, and a number that doesn't exist reads exactly like one that isn't theirs. Needs the schema (`npm run db:push`).

const runId = randomUUID().slice(0, 8);
const phoneBase = `095${Math.floor(10000 + Math.random() * 89999)}`;
const person = (role: UserRole, index: number) => ({
  id: `test-file-${role}-${index}-${runId}`,
  phone: `${phoneBase}00${index}`,
  role,
});
const ana = person("customer", 0);
const ben = person("customer", 1);
const admin = person("admin", 2);
const partner = person("partner", 3);
const people = [ana, ben, admin, partner];
let anasDog = { id: "", fileNumber: "" };
let bensDog = "";
const courseSlug = `test-logbook-${runId}`;
let courseId = "";
const enrollments = { ana: "", ben: "" };

/** An enrollment written the way a paid payment leaves one, so the diary can tie a session to a course. */
async function makeEnrollment({ customerId, dogId }: { customerId: string; dogId: string }): Promise<string> {
  const [paid] = await db
    .insert(payment)
    .values({
      customerId,
      amount: 1_000_000,
      gateway: "demo",
      authority: `test-logbook-${runId}-${dogId}`,
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
    .values({ courseId, dogId, customerId, paymentItemId: item?.id ?? "", price: 1_000_000 })
    .returning({ id: enrollment.id });
  if (!row) throw new Error("Could not make the test enrollment.");
  return row.id;
}

const asUser = (who: (typeof people)[number]) => ({ id: who.id, role: who.role });

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
  const created = await createDog({
    db,
    ownerId: ana.id,
    input: { name: "رکس", sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  anasDog = { id: created.dog.id, fileNumber: created.dog.fileNumber };

  const bens = await createDog({
    db,
    ownerId: ben.id,
    input: { name: "بنی", sex: "male", birthDate: "2024-06-01", weightKg: 15, isNeutered: false },
  });
  if (bens.kind !== "success") throw new Error("Could not create Ben's test dog.");
  bensDog = bens.dog.id;

  const [row] = await db
    .insert(course)
    .values({
      slug: courseSlug,
      title: "آزمایش دفترچه",
      latinName: courseSlug,
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
  courseId = row?.id ?? "";
  enrollments.ana = await makeEnrollment({ customerId: ana.id, dogId: anasDog.id });
  enrollments.ben = await makeEnrollment({ customerId: ben.id, dogId: bensDog });
});

afterAll(async () => {
  const ids = people.map((who) => who.id);
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, ids));
  const dogIds = db.select({ id: dog.id }).from(dog).where(inArray(dog.ownerId, ids));
  await db.delete(auditEvent).where(inArray(auditEvent.actorId, ids));
  await db.delete(certificate).where(inArray(certificate.issuedBy, ids));
  await db.delete(consent).where(inArray(consent.userId, ids));
  await db.delete(logbookEntry).where(inArray(logbookEntry.dogId, dogIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, ids));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, ids));
  await db.delete(dog).where(
    inArray(
      dog.ownerId,
      people.map((who) => who.id),
    ),
  );
  await db.delete(user).where(
    inArray(
      user.id,
      people.map((who) => who.id),
    ),
  );
  await db.delete(course).where(eq(course.id, courseId));
  await db.$client.end();
});

describe("a dog's file number", () => {
  it("is made by the database in the agreed shape, is unique, and never changes when the dog is edited", async () => {
    expect(anasDog.fileNumber.startsWith(FILE_NUMBER_PREFIX)).toBe(true);
    expect(normalizeFileNumber(anasDog.fileNumber)).toBe(anasDog.fileNumber);

    const second = await createDog({
      db,
      ownerId: ana.id,
      input: { name: "لونا", sex: "female", birthDate: "2025-01-01", weightKg: 9, isNeutered: false },
    });
    if (second.kind !== "success") throw new Error("Could not create the second test dog.");
    expect(second.dog.fileNumber).not.toBe(anasDog.fileNumber);

    const edited = await updateDog({
      db,
      ownerId: ana.id,
      id: anasDog.id,
      input: { name: "رکس بزرگ", sex: "male", birthDate: "2024-05-01", weightKg: 22, isNeutered: true },
    });
    expect(edited.kind).toBe("success");
    const [row] = await db.select({ fileNumber: dog.fileNumber }).from(dog).where(eq(dog.id, anasDog.id));
    expect(row?.fileNumber).toBe(anasDog.fileNumber);
  });
});

describe("what a file number leads to", () => {
  it("is the owner's own dog page for the owner, and any dog's page for the Admin", async () => {
    expect(await locateDog({ db, user: asUser(ana), fileNumber: anasDog.fileNumber })).toEqual({
      path: `/account/dogs/${anasDog.id}`,
    });
    expect(await locateDog({ db, user: asUser(admin), fileNumber: anasDog.fileNumber })).toEqual({
      path: `/admin/dogs/${anasDog.id}`,
    });
    // However it was typed.
    expect(await locateDog({ db, user: asUser(ana), fileNumber: anasDog.fileNumber.toLowerCase() })).toEqual({
      path: `/account/dogs/${anasDog.id}`,
    });
  });

  it("is nothing for another customer or a partner, and the same nothing for a number that doesn't exist", async () => {
    const others = [
      await locateDog({ db, user: asUser(ben), fileNumber: anasDog.fileNumber }),
      await locateDog({ db, user: asUser(partner), fileNumber: anasDog.fileNumber }),
      await locateDog({ db, user: asUser(ana), fileNumber: "ZD-0000000000" }),
      await locateDog({ db, user: asUser(ana), fileNumber: "not a number" }),
    ];
    expect(others).toEqual([null, null, null, null]);
  });
});

/*===== The Diary =====*/
const session = (overrides: Record<string, unknown> = {}) => ({
  occurredOn: "2026-10-10",
  notes: "امروز نشستن و صبر کردن را تمرین کردیم؛ توی حیاط حواسش جمع بود.",
  exercises: ["نشستن", "صبر", "برگشت به صدا"],
  progress: "از هفته‌ی قبل بهتر شده.",
  isPublic: false,
  ...overrides,
});

describe("writing a session down", () => {
  it("is the Admin's, is private by default, and the owner reads it afterwards", async () => {
    const added = await adminAddEntry({ db, authorId: admin.id, input: { dogId: anasDog.id, ...session() } });
    expect(added).toMatchObject({
      kind: "success",
      entry: {
        dogId: anasDog.id,
        occurredOn: "2026-10-10",
        exercises: ["نشستن", "صبر", "برگشت به صدا"],
        isPublic: false,
        course: null,
      },
    });

    const owners = await listDogLogbook({ db, ownerId: ana.id, dogId: anasDog.id });
    expect(owners.kind).toBe("success");
    expect(owners.kind === "success" ? owners.entries.map((entry) => entry.notes) : []).toContain(session().notes);

    const [stored] = await db.select().from(logbookEntry).where(eq(logbookEntry.dogId, anasDog.id));
    expect(stored?.authorId).toBe(admin.id);
  });

  it("is refused field by field when it is wrong, and writes nothing", async () => {
    const before = (await adminListDogLogbook({ db, dogId: anasDog.id })).kind === "success";
    expect(before).toBe(true);
    const count = async () => {
      const result = await adminListDogLogbook({ db, dogId: anasDog.id });
      return result.kind === "success" ? result.entries.length : -1;
    };
    const start = await count();

    const bad = async (overrides: Record<string, unknown>) => {
      const result = await adminAddEntry({
        db,
        authorId: admin.id,
        input: { dogId: anasDog.id, ...session(overrides) },
      });
      return result.kind === "invalid" ? Object.keys(result.fields) : [result.kind];
    };

    expect(await bad({ notes: "   " })).toEqual(["notes"]);
    expect(await bad({ occurredOn: "2999-01-01" })).toEqual(["occurredOn"]);
    expect(await bad({ occurredOn: "2026-02-30" })).toEqual(["occurredOn"]);
    expect(await bad({ occurredOn: "not a date" })).toEqual(["occurredOn"]);
    expect(await bad({ exercises: Array.from({ length: 21 }, (_, index) => `تمرین ${index}`) })).toEqual(["exercises"]);
    expect(await bad({ exercises: ["x".repeat(81)] })).toEqual(["exercises.0"]);
    expect(await bad({ notes: "x".repeat(4001) })).toEqual(["notes"]);
    expect(await bad({ enrollmentId: enrollments.ben })).toEqual(["enrollmentId"]);
    expect(await bad({ enrollmentId: "not-a-uuid" })).toEqual(["enrollmentId"]);
    expect(await count()).toBe(start);
  });

  it("takes Persian digits in the date, drops blank and repeated exercise lines, and ties a session to the dog's own course", async () => {
    const added = await adminAddEntry({
      db,
      authorId: admin.id,
      input: {
        dogId: anasDog.id,
        ...session({
          occurredOn: "۲۰۲۶-۱۰-۱۱",
          exercises: ["  نشستن ", "", "نشستن", "صبر"],
          progress: "   ",
          enrollmentId: enrollments.ana,
        }),
      },
    });
    expect(added).toMatchObject({
      kind: "success",
      entry: { occurredOn: "2026-10-11", exercises: ["نشستن", "صبر"], progress: null, course: { slug: courseSlug } },
    });
  });

  it("lists the newest session first", async () => {
    await adminAddEntry({
      db,
      authorId: admin.id,
      input: { dogId: anasDog.id, ...session({ occurredOn: "2026-10-01" }) },
    });
    const listed = await adminListDogLogbook({ db, dogId: anasDog.id });
    const days = listed.kind === "success" ? listed.entries.map((entry) => entry.occurredOn) : [];
    // Each day is the same as or earlier than the one before it.
    expect(days.every((day, index) => index === 0 || (days[index - 1] ?? "") >= day)).toBe(true);
    expect(days[0]).toBe("2026-10-11");
  });
});

describe("correcting a session", () => {
  it("changes what it says, and keeps the dog and the author", async () => {
    const added = await adminAddEntry({ db, authorId: admin.id, input: { dogId: anasDog.id, ...session() } });
    if (added.kind !== "success") throw new Error("Could not add the entry.");

    const updated = await adminUpdateEntry({
      db,
      input: {
        id: added.entry.id,
        ...session({ notes: "تصحیح: امروز فقط راه رفتن کنار پا را تمرین کردیم.", isPublic: true }),
      },
    });
    expect(updated).toMatchObject({
      kind: "success",
      entry: {
        id: added.entry.id,
        dogId: anasDog.id,
        isPublic: true,
        notes: "تصحیح: امروز فقط راه رفتن کنار پا را تمرین کردیم.",
      },
    });
    const [stored] = await db.select().from(logbookEntry).where(eq(logbookEntry.id, added.entry.id));
    expect(stored?.authorId).toBe(admin.id);
  });

  it("is not found for an entry that doesn't exist or an id that isn't one", async () => {
    expect(await adminUpdateEntry({ db, input: { id: randomUUID(), ...session() } })).toEqual({ kind: "not-found" });
    expect(await adminUpdateEntry({ db, input: { id: "nope", ...session() } })).toEqual({ kind: "not-found" });
  });
});

describe("who can read a diary", () => {
  it("is the dog's owner; another customer gets the same not-found as for a dog that doesn't exist", async () => {
    expect(await listDogLogbook({ db, ownerId: ben.id, dogId: anasDog.id })).toEqual({ kind: "not-found" });
    expect(await listDogLogbook({ db, ownerId: ana.id, dogId: randomUUID() })).toEqual({ kind: "not-found" });
    expect(await listDogLogbook({ db, ownerId: ana.id, dogId: "not-a-uuid" })).toEqual({ kind: "not-found" });
    // Ben reads his own dog's (empty) diary.
    expect(await listDogLogbook({ db, ownerId: ben.id, dogId: bensDog })).toEqual({ kind: "success", entries: [] });
  });

  it("is nothing for the Admin's list when the dog doesn't exist", async () => {
    expect(await adminListDogLogbook({ db, dogId: randomUUID() })).toEqual({ kind: "not-found" });
    expect(await adminAddEntry({ db, authorId: admin.id, input: { dogId: randomUUID(), ...session() } })).toEqual({
      kind: "not-found",
    });
  });
});

/*===== The Public Record =====*/
// Public only when the owner agreed to the wording in force, and then only what the record may show.
const WORDING = { version: `p1-${runId}` };
const NEWER_WORDING = { version: `p2-${runId}` };

describe("the public record", () => {
  it("is private when no wording is approved, whatever else is true: every case gives the same answer", async () => {
    const isPrivate = { kind: "private" };

    expect(await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: null })).toEqual(isPrivate);
    // Not yet agreed to, even with wording approved.
    expect(await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING })).toEqual(isPrivate);
    expect(await getPublicRecord({ db, fileNumber: "ZD-0000000000", rules: WORDING })).toEqual(isPrivate);
    expect(await getPublicRecord({ db, fileNumber: "hello", rules: WORDING })).toEqual(isPrivate);
  });

  it("can't be turned on without approved wording, can't be turned on for someone else's dog", async () => {
    expect(await setRecordPublic({ db, ownerId: ana.id, dogId: anasDog.id, isPublic: true, rules: null })).toEqual({
      kind: "not-published",
    });
    expect(await db.select().from(consent).where(eq(consent.dogId, anasDog.id))).toEqual([]);

    expect(await setRecordPublic({ db, ownerId: ben.id, dogId: anasDog.id, isPublic: true, rules: WORDING })).toEqual({
      kind: "not-found",
    });
    expect(await getPublicStatus({ db, ownerId: ben.id, dogId: anasDog.id, rules: WORDING })).toEqual({
      kind: "not-found",
    });
    expect(await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING })).toEqual({ kind: "private" });
  });

  it("shows exactly what a public record may show, and nothing of what is private", async () => {
    // A private entry, a public one, a finished course with a valid certificate and one with a revoked certificate.
    await adminAddEntry({
      db,
      authorId: admin.id,
      input: { dogId: anasDog.id, ...session({ notes: "یادداشت خصوصی که نباید بیرون برود", isPublic: false }) },
    });
    await adminAddEntry({
      db,
      authorId: admin.id,
      input: {
        dogId: anasDog.id,
        ...session({ notes: "این جلسه قابل نمایش است", isPublic: true, occurredOn: "2026-10-12" }),
      },
    });
    await db
      .update(enrollment)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(enrollment.id, enrollments.ana));
    const issued = await adminIssueCertificate({ db, issuerId: admin.id, enrollmentId: enrollments.ana });
    expect(issued.kind).toBe("success");

    const turnedOn = await setRecordPublic({ db, ownerId: ana.id, dogId: anasDog.id, isPublic: true, rules: WORDING });
    expect(turnedOn).toMatchObject({
      kind: "success",
      status: { available: true, isPublic: true, version: WORDING.version },
    });

    const answer = await getPublicRecord({ db, fileNumber: anasDog.fileNumber.toLowerCase(), rules: WORDING });
    if (answer.kind !== "public") throw new Error("Expected a public record.");
    const { record } = answer;

    expectKeys(record, ["certificates", "courses", "dog", "entries", "fileNumber"]);
    expectKeys(record.dog, ["ageText", "breed", "name"]);
    expect(record.dog.name).toBe("رکس بزرگ");
    expect(record.courses.map((entry) => entry.title)).toEqual(["آزمایش دفترچه"]);
    expect(record.certificates).toHaveLength(1);
    // Exactly the entries marked public (an earlier test marked one too), never the others.
    const publicInDb = await db
      .select()
      .from(logbookEntry)
      .where(and(eq(logbookEntry.dogId, anasDog.id), eq(logbookEntry.isPublic, true)));
    expect(record.entries).toHaveLength(publicInDb.length);
    expect(record.entries.map((entry) => entry.notes)).toContain("این جلسه قابل نمایش است");
    expect(record.entries.map((entry) => entry.notes)).not.toContain("یادداشت خصوصی که نباید بیرون برود");

    // Nothing private is anywhere in what a stranger gets: not the owner, not the phone, not the other entry.
    const everything = JSON.stringify(record);
    for (const secret of [
      ana.id,
      ana.phone,
      "یادداشت خصوصی",
      "2024-05-01",
      "microchip",
      "weightKg",
      "behaviorNotes",
      "medicalNotes",
    ]) {
      expect({ secret, leaked: everything.includes(secret) }).toEqual({ secret, leaked: false });
    }
  });

  it("drops a revoked certificate and an unfinished course", async () => {
    const [row] = await db.select().from(certificate).where(eq(certificate.enrollmentId, enrollments.ana));
    await adminRevokeCertificate({ db, adminId: admin.id, id: row?.id ?? "", reason: "آزمایش" });

    const answer = await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING });
    if (answer.kind !== "public") throw new Error("Expected a public record.");
    expect(answer.record.certificates).toEqual([]);

    await db.update(enrollment).set({ status: "active", completedAt: null }).where(eq(enrollment.id, enrollments.ana));
    const after = await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING });
    if (after.kind !== "public") throw new Error("Expected a public record.");
    expect(after.record.courses).toEqual([]);
  });

  it("is private again at once when the owner takes it back, and the record of having agreed stays", async () => {
    expect(
      await setRecordPublic({ db, ownerId: ana.id, dogId: anasDog.id, isPublic: false, rules: WORDING }),
    ).toMatchObject({
      kind: "success",
      status: { isPublic: false, since: null },
    });
    expect(await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING })).toEqual({ kind: "private" });

    const rows = await db.select().from(consent).where(eq(consent.dogId, anasDog.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "public-logbook", version: WORDING.version });
    expect(rows[0]?.revokedAt).toBeInstanceOf(Date);
  });

  it("is private again when the wording changes, until the owner agrees to the new version", async () => {
    await setRecordPublic({ db, ownerId: ana.id, dogId: anasDog.id, isPublic: true, rules: WORDING });
    expect((await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: WORDING })).kind).toBe("public");

    expect(await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: NEWER_WORDING })).toEqual({
      kind: "private",
    });
    expect(await getPublicStatus({ db, ownerId: ana.id, dogId: anasDog.id, rules: NEWER_WORDING })).toMatchObject({
      kind: "success",
      status: { available: true, isPublic: false },
    });

    await setRecordPublic({ db, ownerId: ana.id, dogId: anasDog.id, isPublic: true, rules: NEWER_WORDING });
    expect((await getPublicRecord({ db, fileNumber: anasDog.fileNumber, rules: NEWER_WORDING })).kind).toBe("public");
  });
});

describe("a certificate's check and the dog's name", () => {
  it("shows the dog's name only while its owner keeps the record public", async () => {
    await db
      .update(enrollment)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(enrollment.id, enrollments.ben));
    const issued = await adminIssueCertificate({ db, issuerId: admin.id, enrollmentId: enrollments.ben });
    if (issued.kind !== "success") throw new Error("Could not issue Ben's certificate.");
    const number = issued.certificate.number;

    const nameOf = async (rules: { version: string } | null) => {
      const result = await verifyCertificate({ db, number, rules });
      return result.kind === "valid" ? result.dogName : "not valid";
    };

    expect(await nameOf(WORDING)).toBeNull();
    await setRecordPublic({ db, ownerId: ben.id, dogId: bensDog, isPublic: true, rules: WORDING });
    expect(await nameOf(WORDING)).toBe("بنی");
    // With no approved wording the registry says private, however the rows stand.
    expect(await nameOf(null)).toBeNull();
    await setRecordPublic({ db, ownerId: ben.id, dogId: bensDog, isPublic: false, rules: WORDING });
    expect(await nameOf(WORDING)).toBeNull();
  });
});

/** The answer has exactly these keys, in any order. */
function expectKeys(answer: object, keys: string[]) {
  const actual = Object.keys(answer);
  expect(actual).toHaveLength(keys.length);
  expect(actual).toEqual(expect.arrayContaining(keys));
}
