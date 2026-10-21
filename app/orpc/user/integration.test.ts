import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { dog, partner, session, user } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import { adminListUsers, setUserStatus, updateUser } from "~/orpc/user/service";

/*===== Users =====*/
// Runs against the real database: the boundary is that blocking really deletes the user's sessions, and that the
// Admin can't lock himself or another admin out. A mock would exercise neither.

const runId = randomUUID().slice(0, 8);
const makeUser = (key: string, role: string, prefix: string) => ({
  id: `test-user-${key}-${runId}`,
  phone: `${prefix}${Math.floor(1000000 + Math.random() * 8999999)}`,
  role,
});

const admin = makeUser("admin", "admin", "0995");
const otherAdmin = makeUser("admin2", "admin", "0996");
const customer = makeUser("customer", "customer", "0997");
const bystander = makeUser("bystander", "customer", "0998");
const partnerUser = makeUser("partner", "partner", "0999");
const everyone = [admin, otherAdmin, customer, bystander, partnerUser];

const caller = { db, callerId: admin.id };

/** Two live sessions for a user, as a sign-in on two devices would leave. */
async function addSessions(userId: string) {
  await db.insert(session).values(
    [1, 2].map((index) => ({
      id: `test-session-${userId}-${index}`,
      token: `test-token-${userId}-${index}`,
      userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })),
  );
}

async function sessionCount(userId: string): Promise<number> {
  return (await db.select({ id: session.id }).from(session).where(eq(session.userId, userId))).length;
}

async function statusOf(userId: string): Promise<string | undefined> {
  const [row] = await db.select({ status: user.status }).from(user).where(eq(user.id, userId));
  return row?.status;
}

beforeAll(async () => {
  await db.insert(user).values(
    everyone.map((entry) => ({
      id: entry.id,
      name: "Test user",
      firstName: "Test",
      lastName: "User",
      email: phonePlaceholderEmail(entry.phone),
      phoneNumber: entry.phone,
      role: entry.role,
    })),
  );
  await db.insert(partner).values({ userId: partnerUser.id, code: `tu${runId}` });
  await db.insert(dog).values(
    ["Rex", "Luna"].map((name) => ({
      ownerId: customer.id,
      name,
      sex: "male",
      birthDate: "2022-01-01",
      weightKg: 20,
      isNeutered: false,
    })),
  );
});

afterAll(async () => {
  const ids = everyone.map((entry) => entry.id);
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(session).where(inArray(session.userId, ids));
  await db.delete(partner).where(inArray(partner.userId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

describe("blocking a user", () => {
  it("revokes his sessions every time, leaves other users' sessions, and unblocking only flips the status", async () => {
    await addSessions(customer.id);
    await addSessions(bystander.id);

    const blocked = await setUserStatus({ ...caller, id: customer.id, status: "blocked" });
    expect(blocked).toMatchObject({ kind: "success", user: { id: customer.id, status: "blocked" } });
    expect(await sessionCount(customer.id)).toBe(0);
    expect(await sessionCount(bystander.id)).toBe(2);

    // A retry on an already blocked user succeeds and heals a failed revoke: a session left behind is deleted again.
    await addSessions(customer.id);
    const again = await setUserStatus({ ...caller, id: customer.id, status: "blocked" });
    expect(again).toMatchObject({ kind: "success", user: { status: "blocked" } });
    expect(await sessionCount(customer.id)).toBe(0);

    const unblocked = await setUserStatus({ ...caller, id: customer.id, status: "active" });
    expect(unblocked).toMatchObject({ kind: "success", user: { status: "active" } });
    expect(await statusOf(customer.id)).toBe("active");
    expect(await sessionCount(bystander.id)).toBe(2);
  });

  it("closes a partner's sign-in only, leaving his partner row alone", async () => {
    await setUserStatus({ ...caller, id: partnerUser.id, status: "blocked" });

    const rows = await db.select().from(partner).where(eq(partner.userId, partnerUser.id));
    expect(rows).toMatchObject([{ code: `tu${runId}`, isActive: true }]);

    await setUserStatus({ ...caller, id: partnerUser.id, status: "active" });
  });

  it("refuses an unknown id", async () => {
    expect(await setUserStatus({ ...caller, id: "no-such-user", status: "blocked" })).toEqual({ kind: "not-found" });
  });
});

describe("the Admin blocking himself or an admin", () => {
  it("is refused with the message, the status unchanged and the sessions kept", async () => {
    await addSessions(admin.id);
    await addSessions(otherAdmin.id);

    const self = await setUserStatus({ ...caller, id: admin.id, status: "blocked" });
    const other = await setUserStatus({ ...caller, id: otherAdmin.id, status: "blocked" });

    expect(self).toEqual({ kind: "invalid", errors: ["نمی‌شود حساب خودت را مسدود کنی."], fields: {} });
    expect(other).toEqual({ kind: "invalid", errors: ["حساب مدیر مسدود نمی‌شود."], fields: {} });
    expect(await statusOf(admin.id)).toBe("active");
    expect(await statusOf(otherAdmin.id)).toBe("active");
    expect(await sessionCount(admin.id)).toBe(2);
    expect(await sessionCount(otherAdmin.id)).toBe(2);
  });
});

describe("updating a name", () => {
  it("writes first name, last name and the full name together, trimmed", async () => {
    const result = await updateUser({
      ...caller,
      id: bystander.id,
      input: { firstName: "  سارا ", lastName: " احمدی  " },
    });

    expect(result).toMatchObject({
      kind: "success",
      user: { id: bystander.id, firstName: "سارا", lastName: "احمدی", name: "سارا احمدی" },
    });
    const [row] = await db.select().from(user).where(eq(user.id, bystander.id));
    expect(row).toMatchObject({ firstName: "سارا", lastName: "احمدی", name: "سارا احمدی" });
  });

  it("refuses a blank or too long name with the field message, storing nothing", async () => {
    const blank = await updateUser({ ...caller, id: bystander.id, input: { firstName: "   ", lastName: "احمدی" } });
    const tooLong = await updateUser({
      ...caller,
      id: bystander.id,
      input: { firstName: "سارا", lastName: "ا".repeat(41) },
    });

    expect(blank).toMatchObject({ kind: "invalid", fields: { firstName: expect.stringContaining("رو بنویس") } });
    expect(tooLong).toMatchObject({ kind: "invalid", fields: { lastName: expect.stringContaining("حداکثر") } });
    const [row] = await db.select().from(user).where(eq(user.id, bystander.id));
    expect(row?.name).toBe("سارا احمدی");
  });

  it("is not-found for an unknown id", async () => {
    const result = await updateUser({ ...caller, id: "no-such-user", input: { firstName: "الف", lastName: "ب" } });
    expect(result).toEqual({ kind: "not-found" });
  });
});

describe("listing users", () => {
  it("counts a customer's dogs and marks only the caller as himself", async () => {
    const users = await adminListUsers(caller);
    const byId = new Map(users.map((entry) => [entry.id, entry]));

    expect(byId.get(customer.id)).toMatchObject({ dogCount: 2, isSelf: false });
    expect(byId.get(bystander.id)).toMatchObject({ dogCount: 0, isSelf: false });
    expect(users.filter((entry) => entry.isSelf).map((entry) => entry.id)).toEqual([admin.id]);

    const times = users.map((entry) => entry.createdAt.getTime());
    // oxlint-disable-next-line unicorn/no-array-sort -- the project's TypeScript lib has no `toSorted`
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("skips an account of a retired role instead of failing the whole list", async () => {
    const retiredId = `test-retired-${runId}`;
    await db.insert(user).values({
      id: retiredId,
      name: "Retired trainer",
      firstName: "Retired",
      lastName: "Trainer",
      email: phonePlaceholderEmail(`0912${runId}`),
      role: "trainer",
    });

    try {
      const users = await adminListUsers(caller);
      expect(users.some((entry) => entry.id === retiredId)).toBe(false);
      expect(users.some((entry) => entry.id === customer.id)).toBe(true);
    } finally {
      await db.delete(user).where(eq(user.id, retiredId));
    }
  });
});
