import { randomInt, randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { account, session, signInFailure, user } from "~/db/schema";
import { auth } from "~/lib/auth.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { MAX_SIGN_IN_FAILURES } from "~/lib/user-constants";
import { getPasswordStatus, setPassword } from "~/orpc/password/service";

/*===== Password Sign-in =====*/
// Runs against the real database, where the consequences are: a password is stored only as a hash, a wrong guess and an
// unknown number look the same, guessing at one number is paused, a stale session can't set a password, a new password
// signs the other sessions out, and a blocked account can't use a password. Needs the schema (`npm run db:push`). Every
// person is made with a number unique to the run and removed afterwards.

const created: { userIds: string[]; phoneNumbers: string[] } = { userIds: [], phoneNumbers: [] };

/** A customer with a code-style account only (no password), as everyone starts out. */
async function makeUser({ status = "active" }: { status?: "active" | "blocked" } = {}) {
  const id = randomUUID();
  const phoneNumber = `09${randomInt(100_000_000, 999_999_999)}`;
  await db.insert(user).values({
    id,
    name: "تست رمز",
    email: phonePlaceholderEmail(phoneNumber),
    phoneNumber,
    phoneNumberVerified: true,
    firstName: "تست",
    lastName: "رمز",
    role: "customer",
    status,
  });
  created.userIds.push(id);
  created.phoneNumbers.push(phoneNumber);
  return { id, phoneNumber };
}

async function makeSession({ userId, createdAt = new Date() }: { userId: string; createdAt?: Date }) {
  const token = randomUUID();
  await db.insert(session).values({
    id: randomUUID(),
    token,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt,
    updatedAt: createdAt,
  });
  return { token, createdAt };
}

const hash = async (password: string) => (await auth.$context).password.hash(password);

/** Runs a password sign-in through Better-Auth, returning the failure's status and code instead of throwing. */
async function trySignIn({ phoneNumber, password }: { phoneNumber: string; password: string }) {
  try {
    const result = await auth.api.signInPhoneNumber({ body: { phoneNumber, password }, headers: new Headers() });
    return { ok: true as const, token: result.token };
  } catch (error) {
    const failure = error as { statusCode?: number; body?: { code?: string; message?: string } };
    return { ok: false as const, status: failure.statusCode, code: failure.body?.code, message: failure.body?.message };
  }
}

afterAll(async () => {
  if (created.phoneNumbers.length > 0) {
    await db.delete(signInFailure).where(inArray(signInFailure.phoneNumber, created.phoneNumbers));
  }
  if (created.userIds.length > 0) {
    await db.delete(session).where(inArray(session.userId, created.userIds));
    await db.delete(account).where(inArray(account.userId, created.userIds));
    await db.delete(user).where(inArray(user.id, created.userIds));
  }
});

describe("setting a password", () => {
  it("stores only a hash, and then the number and password sign in", async () => {
    const person = await makeUser();
    const current = await makeSession({ userId: person.id });
    expect(await getPasswordStatus({ db, userId: person.id })).toEqual({ hasPassword: false });

    const result = await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "kheyli-khoob-1405",
      sessionToken: current.token,
      sessionCreatedAt: current.createdAt,
      hash,
    });
    expect(result).toEqual({ kind: "success", replaced: false });
    expect(await getPasswordStatus({ db, userId: person.id })).toEqual({ hasPassword: true });

    const [stored] = await db.select({ password: account.password }).from(account).where(eq(account.userId, person.id));
    expect(stored?.password).toBeTruthy();
    expect(stored?.password).not.toContain("kheyli-khoob-1405");

    const signedIn = await trySignIn({ phoneNumber: person.phoneNumber, password: "kheyli-khoob-1405" });
    expect(signedIn.ok).toBe(true);
  });

  it("refuses weak passwords with a message on the field and writes nothing", async () => {
    const person = await makeUser();
    const current = await makeSession({ userId: person.id });
    const attempt = (newPassword: string) =>
      setPassword({
        db,
        userId: person.id,
        phoneNumber: person.phoneNumber,
        newPassword,
        sessionToken: current.token,
        sessionCreatedAt: current.createdAt,
        hash,
      });

    for (const weak of ["short1", person.phoneNumber, "00000000", "12345678", "aaaaaaaaaa", "   "]) {
      const result = await attempt(weak);
      expect(result.kind, `"${weak}" should be refused`).toBe("invalid");
      expect(
        result.kind === "invalid" ? result.fields.newPassword : undefined,
        `"${weak}" needs a reason`,
      ).toBeTruthy();
    }
    expect(await getPasswordStatus({ db, userId: person.id })).toEqual({ hasPassword: false });
  });

  it("is refused for a session older than half an hour", async () => {
    const person = await makeUser();
    const old = await makeSession({ userId: person.id, createdAt: new Date(Date.now() - 31 * 60 * 1000) });

    const result = await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "kheyli-khoob-1405",
      sessionToken: old.token,
      sessionCreatedAt: old.createdAt,
      hash,
    });
    expect(result).toEqual({ kind: "session-too-old" });
    expect(await getPasswordStatus({ db, userId: person.id })).toEqual({ hasPassword: false });
  });

  it("replaces the old password and signs the other sessions out", async () => {
    const person = await makeUser();
    const first = await makeSession({ userId: person.id });
    const other = await makeSession({ userId: person.id });

    const setNew = (newPassword: string, keep: { token: string; createdAt: Date }) =>
      setPassword({
        db,
        userId: person.id,
        phoneNumber: person.phoneNumber,
        newPassword,
        sessionToken: keep.token,
        sessionCreatedAt: keep.createdAt,
        hash,
      });

    expect(await setNew("avalin-ramz-1405", first)).toEqual({ kind: "success", replaced: false });
    // The forgotten-password path: a fresh session (here, any) sets a new one without the old.
    expect(await setNew("ramz-e-taze-1405", first)).toEqual({ kind: "success", replaced: true });

    expect((await trySignIn({ phoneNumber: person.phoneNumber, password: "avalin-ramz-1405" })).ok).toBe(false);
    expect((await trySignIn({ phoneNumber: person.phoneNumber, password: "ramz-e-taze-1405" })).ok).toBe(true);

    const tokens = (await db.select({ token: session.token }).from(session).where(eq(session.userId, person.id))).map(
      (row) => row.token,
    );
    expect(tokens).toContain(first.token);
    expect(tokens).not.toContain(other.token);
  });
});

describe("signing in with a password", () => {
  it("treats an unknown number and a wrong password the same, so numbers can't be probed", async () => {
    const person = await makeUser();
    const current = await makeSession({ userId: person.id });
    await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "kheyli-khoob-1405",
      sessionToken: current.token,
      sessionCreatedAt: current.createdAt,
      hash,
    });

    // A number nobody has, new each run: its wrong passwords are counted like any other's, so it is cleaned up with the rest.
    const unknownNumber = `09${randomInt(100_000_000, 999_999_999)}`;
    created.phoneNumbers.push(unknownNumber);

    const wrong = await trySignIn({ phoneNumber: person.phoneNumber, password: "ramz-e-eshtebah-1" });
    const unknown = await trySignIn({ phoneNumber: unknownNumber, password: "ramz-e-eshtebah-1" });
    expect(wrong).toMatchObject({ ok: false, status: 401 });
    expect(unknown).toMatchObject({ ok: false, status: 401 });
    expect(unknown).toEqual(wrong);
  });

  it("pauses a number after repeated wrong passwords, even for the right password, and forgives after a good sign-in", async () => {
    const person = await makeUser();
    const current = await makeSession({ userId: person.id });
    await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "kheyli-khoob-1405",
      sessionToken: current.token,
      sessionCreatedAt: current.createdAt,
      hash,
    });

    // A good sign-in in between clears the count: this many wrong ones, then a right one, starts again from zero.
    for (let i = 0; i < MAX_SIGN_IN_FAILURES - 1; i++) {
      expect((await trySignIn({ phoneNumber: person.phoneNumber, password: `eshtebah-${i}-xxxx` })).ok).toBe(false);
    }
    expect((await trySignIn({ phoneNumber: person.phoneNumber, password: "kheyli-khoob-1405" })).ok).toBe(true);
    const rows = await db.select().from(signInFailure).where(eq(signInFailure.phoneNumber, person.phoneNumber));
    expect(rows).toHaveLength(0);

    // Now the full number of wrong ones: the next try is paused, whatever the password.
    for (let i = 0; i < MAX_SIGN_IN_FAILURES; i++) {
      await trySignIn({ phoneNumber: person.phoneNumber, password: `eshtebah-${i}-yyyy` });
    }
    const paused = await trySignIn({ phoneNumber: person.phoneNumber, password: "kheyli-khoob-1405" });
    expect(paused).toMatchObject({ ok: false, status: 429, code: "TOO_MANY_SIGN_IN_ATTEMPTS" });

    // The way out is a code: signing in with one and setting a new password starts the count again.
    const fresh = await makeSession({ userId: person.id });
    const result = await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "ramz-e-taze-1405",
      sessionToken: fresh.token,
      sessionCreatedAt: fresh.createdAt,
      hash,
    });
    expect(result).toEqual({ kind: "success", replaced: true });
    expect((await trySignIn({ phoneNumber: person.phoneNumber, password: "ramz-e-taze-1405" })).ok).toBe(true);
  });

  it("is refused for a blocked account, and the password isn't even tried", async () => {
    const person = await makeUser({ status: "blocked" });
    const current = await makeSession({ userId: person.id });
    await setPassword({
      db,
      userId: person.id,
      phoneNumber: person.phoneNumber,
      newPassword: "kheyli-khoob-1405",
      sessionToken: current.token,
      sessionCreatedAt: current.createdAt,
      hash,
    });

    const result = await trySignIn({ phoneNumber: person.phoneNumber, password: "kheyli-khoob-1405" });
    expect(result).toMatchObject({ ok: false, status: 403, code: "ACCOUNT_BLOCKED" });
  });
});
