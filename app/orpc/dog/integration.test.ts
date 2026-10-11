import { randomUUID } from "node:crypto";

import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { dog, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import { createDog, getDog, listDogs, removeDog, updateDog } from "~/orpc/dog/service";

/*===== Dog Ownership =====*/
// Runs against the real database: the security boundary is the ownership scoping in the queries, which a mock would
// not exercise. Needs the `dog` table (`npm run db:push`).

const runId = randomUUID().slice(0, 8);
const ownerA = { id: `test-dog-a-${runId}`, phone: `0990${Math.floor(1000000 + Math.random() * 8999999)}` };
const ownerB = { id: `test-dog-b-${runId}`, phone: `0991${Math.floor(1000000 + Math.random() * 8999999)}` };

const dogInput = {
  name: "رکس",
  breed: "لابرادور",
  sex: "male",
  birthDate: "2023-05-01",
  weightKg: 28,
  isNeutered: true,
};

let dogId: string;

beforeAll(async () => {
  await db.insert(user).values(
    [ownerA, ownerB].map((owner) => ({
      id: owner.id,
      name: "Test owner",
      email: phonePlaceholderEmail(owner.phone),
      phoneNumber: owner.phone,
      role: "customer",
    })),
  );

  const created = await createDog({ db, ownerId: ownerA.id, input: dogInput });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  dogId = created.dog.id;
});

afterAll(async () => {
  const ids = [ownerA.id, ownerB.id];
  // Dogs first: they reference the users.
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

describe("dog ownership", () => {
  it("lets the owner read their dog, with no record until a trainer sets knownSince", async () => {
    const result = await getDog({ db, ownerId: ownerA.id, id: dogId });

    expect(result).toMatchObject({ kind: "success", dog: { name: "رکس", weightKg: 28, hasRecord: false } });
    expect(await listDogs({ db, ownerId: ownerA.id })).toHaveLength(1);
  });

  it("hides the dog from another owner for get, update and remove", async () => {
    expect(await getDog({ db, ownerId: ownerB.id, id: dogId })).toEqual({ kind: "not-found" });
    expect(await updateDog({ db, ownerId: ownerB.id, id: dogId, input: { ...dogInput, name: "دزد" } })).toEqual({
      kind: "not-found",
    });
    expect(await removeDog({ db, ownerId: ownerB.id, id: dogId })).toEqual({ kind: "not-found" });
    expect(await listDogs({ db, ownerId: ownerB.id })).toEqual([]);

    // Nothing changed for the real owner.
    expect(await getDog({ db, ownerId: ownerA.id, id: dogId })).toMatchObject({ dog: { name: "رکس" } });
  });

  it("treats a malformed id as not found", async () => {
    expect(await getDog({ db, ownerId: ownerA.id, id: "not-a-uuid" })).toEqual({ kind: "not-found" });
  });

  it("removes a dog from list and get once it is removed", async () => {
    expect(await removeDog({ db, ownerId: ownerA.id, id: dogId })).toEqual({ kind: "success", id: dogId });

    expect(await listDogs({ db, ownerId: ownerA.id })).toEqual([]);
    expect(await getDog({ db, ownerId: ownerA.id, id: dogId })).toEqual({ kind: "not-found" });
    expect(await removeDog({ db, ownerId: ownerA.id, id: dogId })).toEqual({ kind: "not-found" });
  });
});
