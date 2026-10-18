import { and, eq, ne } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { account, session } from "~/db/schema";

/*===== Credential Account =====*/
// Better-Auth keeps a password on the person's `credential` account row (`account.password`, a hash). There is at most
// one such row per person. Nothing here reads or returns the hash: it only needs to know the row exists.

export async function findCredentialAccountId({
  db,
  userId,
}: {
  db: DatabaseOrTransaction;
  userId: string;
}): Promise<{ id: string; hasPassword: boolean } | null> {
  const [row] = await db
    .select({ id: account.id, password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  return row ? { id: row.id, hasPassword: row.password !== null && row.password !== "" } : null;
}

export async function insertCredentialAccount({
  db,
  userId,
  passwordHash,
}: {
  db: DatabaseOrTransaction;
  userId: string;
  passwordHash: string;
}): Promise<void> {
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });
}

export async function updateCredentialPassword({
  db,
  accountRowId,
  passwordHash,
}: {
  db: DatabaseOrTransaction;
  accountRowId: string;
  passwordHash: string;
}): Promise<void> {
  await db.update(account).set({ password: passwordHash }).where(eq(account.id, accountRowId));
}

/** Signs the person out everywhere except the session that is changing the password. */
export async function deleteOtherSessions({
  db,
  userId,
  keepToken,
}: {
  db: DatabaseOrTransaction;
  userId: string;
  keepToken: string;
}): Promise<void> {
  await db.delete(session).where(and(eq(session.userId, userId), ne(session.token, keepToken)));
}
