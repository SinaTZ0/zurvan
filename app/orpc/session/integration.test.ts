import { randomUUID } from "node:crypto";

import { makeSignature } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { session, user } from "~/db/schema";
import { env } from "~/env.server";
import { auth } from "~/lib/auth.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { readSessionState } from "~/orpc/session/service";

/*===== Session State =====*/
// Runs against the real database and Better-Auth's real cookie check: page guards and the storefront header trust this
// answer, and a blocked account must come out signed out everywhere, not only on the page that asked.

const runId = randomUUID().slice(0, 8);
const makeUser = (key: string, firstName: string | null, status: string) => ({
  id: `test-session-${key}-${runId}`,
  phone: `0991${Math.floor(1000000 + Math.random() * 8999999)}`,
  firstName,
  status,
});

const named = makeUser("named", "Test", "active");
const unnamed = makeUser("unnamed", null, "active");
const blocked = makeUser("blocked", "Test", "blocked");
const everyone = [named, unnamed, blocked];

/** Request headers carrying a signed session cookie for the user, as the browser would send after signing in. */
async function headersFor(userId: string): Promise<Headers> {
  const token = `test-token-${userId}`;
  const context = await auth.$context;
  const signature = await makeSignature(token, env.BETTER_AUTH_SECRET);
  return new Headers({
    cookie: `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${token}.${signature}`)}`,
  });
}

async function sessionCount(userId: string): Promise<number> {
  return (await db.select({ id: session.id }).from(session).where(eq(session.userId, userId))).length;
}

beforeAll(async () => {
  await db.insert(user).values(
    everyone.map((entry) => ({
      id: entry.id,
      name: "Test user",
      firstName: entry.firstName,
      lastName: entry.firstName ? "User" : null,
      email: phonePlaceholderEmail(entry.phone),
      phoneNumber: entry.phone,
      role: "customer",
      status: entry.status,
    })),
  );
  await db.insert(session).values(
    everyone.map((entry) => ({
      id: `test-session-${entry.id}`,
      token: `test-token-${entry.id}`,
      userId: entry.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    })),
  );
});

afterAll(async () => {
  const ids = everyone.map((entry) => entry.id);
  await db.delete(session).where(inArray(session.userId, ids));
  await db.delete(user).where(inArray(user.id, ids));
});

describe("session state", () => {
  it("is anonymous without a session", async () => {
    expect(await readSessionState({ headers: new Headers() })).toEqual({ status: "anonymous" });
  });

  it("is active for a named account, with what the pages show", async () => {
    expect(await readSessionState({ headers: await headersFor(named.id) })).toEqual({
      status: "active",
      user: { id: named.id, role: "customer", firstName: "Test", lastName: "User", phoneNumber: named.phone },
    });
  });

  it("is unnamed for an account that hasn't given its name yet", async () => {
    const state = await readSessionState({ headers: await headersFor(unnamed.id) });
    expect(state.status).toBe("unnamed");
  });

  it("signs a blocked account out everywhere and reads it as anonymous", async () => {
    expect(await readSessionState({ headers: await headersFor(blocked.id) })).toEqual({ status: "anonymous" });
    expect(await sessionCount(blocked.id)).toBe(0);
  });
});
