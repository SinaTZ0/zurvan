import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { dog, user } from "~/db/schema";
import { FILE_NUMBER_PREFIX, normalizeFileNumber } from "~/lib/dog-file";
import { phonePlaceholderEmail } from "~/lib/phone";
import type { UserRole } from "~/lib/user-constants";
import { createDog, updateDog } from "~/orpc/dog/service";
import { locateDog } from "~/orpc/logbook/service";

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
});

afterAll(async () => {
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
