import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { dog, evaluation, media, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import { adminUpdateDog, createDog, getDog, listDogs, updateDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

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
// A dog photo that ownerB uploaded: only the row exists, which is all the ownership check reads.
const strangerMediaId = randomUUID();

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

  await db.insert(media).values({
    id: strangerMediaId,
    kind: "dog",
    uploadedBy: ownerB.id,
    width: 800,
    height: 600,
    placeholder: "data:image/webp;base64,",
  });

  const created = await createDog({ db, ownerId: ownerA.id, input: dogInput });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  dogId = created.dog.id;
});

afterAll(async () => {
  const ids = [ownerA.id, ownerB.id];
  // Evaluations and dogs first: they reference the users.
  await db.delete(evaluation).where(inArray(evaluation.customerId, ids));
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(media).where(eq(media.id, strangerMediaId));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

describe("dog ownership", () => {
  it("lets the owner read their dog, which is not evaluated until an evaluation says so", async () => {
    const result = await getDog({ db, ownerId: ownerA.id, id: dogId });

    expect(result).toMatchObject({ kind: "success", dog: { name: "رکس", weightKg: 28, isEvaluated: false } });
    expect(await listDogs({ db, ownerId: ownerA.id })).toHaveLength(1);
  });

  it("hides the dog from another owner for get and update", async () => {
    expect(await getDog({ db, ownerId: ownerB.id, id: dogId })).toEqual({ kind: "not-found" });
    expect(await updateDog({ db, ownerId: ownerB.id, id: dogId, input: { ...dogInput, name: "دزد" } })).toEqual({
      kind: "not-found",
    });
    expect(await listDogs({ db, ownerId: ownerB.id })).toEqual([]);

    // Nothing changed for the real owner.
    expect(await getDog({ db, ownerId: ownerA.id, id: dogId })).toMatchObject({ dog: { name: "رکس" } });
  });

  it("refuses a photo another user uploaded, for create and update", async () => {
    const photoError = { kind: "invalid", fields: { photoMediaId: "عکس را دوباره بارگذاری کن." } };

    const created = await createDog({ db, ownerId: ownerA.id, input: { ...dogInput, photoMediaId: strangerMediaId } });
    const updated = await updateDog({
      db,
      ownerId: ownerA.id,
      id: dogId,
      input: { ...dogInput, photoMediaId: strangerMediaId },
    });

    expect(created).toMatchObject(photoError);
    expect(updated).toMatchObject(photoError);
    // The stranger's upload was not claimed, and the dog did not get it.
    const [row] = await db.select().from(media).where(eq(media.id, strangerMediaId));
    expect(row?.attachedAt).toBeNull();
    expect(await getDog({ db, ownerId: ownerA.id, id: dogId })).toMatchObject({ dog: { photo: null } });
  });

  it("treats a malformed id as not found", async () => {
    expect(await getDog({ db, ownerId: ownerA.id, id: "not-a-uuid" })).toEqual({ kind: "not-found" });
  });

  it("locks the birth date and breed once the dog is evaluated, for the customer but not the Admin", async () => {
    const evaluated = await markDogEvaluated({ db, dogId });
    expect(evaluated.kind).toBe("success");

    const moved = await updateDog({
      db,
      ownerId: ownerA.id,
      id: dogId,
      input: { ...dogInput, birthDate: "2020-01-01" },
    });
    expect(moved).toMatchObject({ kind: "invalid", fields: { birthDate: expect.any(String) } });
    const rebred = await updateDog({ db, ownerId: ownerA.id, id: dogId, input: { ...dogInput, breed: "پودل" } });
    expect(rebred).toMatchObject({ kind: "invalid", fields: { breed: expect.any(String) } });

    // Other fields still change, and so does the Admin's edit of the locked ones.
    expect(await updateDog({ db, ownerId: ownerA.id, id: dogId, input: { ...dogInput, weightKg: 30 } })).toMatchObject({
      kind: "success",
      dog: { weightKg: 30, isEvaluated: true },
    });
    const { photoMediaId: _photo, ...adminInput } = { ...dogInput, birthDate: "2020-01-01", photoMediaId: null };
    expect(await adminUpdateDog({ db, id: dogId, input: adminInput })).toMatchObject({
      kind: "success",
      dog: { birthDate: "2020-01-01" },
    });
  });
});
