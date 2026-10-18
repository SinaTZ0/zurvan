import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { course, dog, enrollment, logbookEntry, payment, paymentItem, user } from "~/db/schema";
import { FILE_NUMBER_PREFIX, normalizeFileNumber } from "~/lib/dog-file";
import { phonePlaceholderEmail } from "~/lib/phone";
import type { UserRole } from "~/lib/user-constants";
import { createDog, updateDog } from "~/orpc/dog/service";
import {
  adminAddEntry,
  adminListDogLogbook,
  adminUpdateEntry,
  listDogLogbook,
  locateDog,
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
