import { and, desc, eq, inArray, sql } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { dog, user } from "~/db/schema";
import { USER_ROLES, type UserStatus } from "~/lib/user-constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

/** A user row with the number of dogs he owns. */
export type UserRecord = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  dogCount: number;
};

/*===== Read =====*/
/**
 * Users newest first (or the one `id`), each with his dog count from a single grouped join, so the list is one query
 * however many users there are. `id` as the tie-breaker keeps the order stable for users created in the same instant.
 *
 * Only users with a current role are read: an account of a retired role (the old trainer accounts) can't sign in and
 * would fail the output check, taking the whole list down with it.
 */
export async function findUsers({ db, id }: Executor & { id?: string }): Promise<UserRecord[]> {
  const dogCounts = db
    .select({ ownerId: dog.ownerId, dogCount: sql<number>`count(*)::int`.as("dog_count") })
    .from(dog)
    .groupBy(dog.ownerId)
    .as("dog_counts");

  return db
    .select({
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      dogCount: sql<number>`coalesce(${dogCounts.dogCount}, 0)`.mapWith(Number),
    })
    .from(user)
    .leftJoin(dogCounts, eq(dogCounts.ownerId, user.id))
    .where(and(inArray(user.role, USER_ROLES), id ? eq(user.id, id) : undefined))
    .orderBy(desc(user.createdAt), desc(user.id));
}

/*===== Write =====*/
/** Writes the two name parts and the full name together, so `name` never drifts from them. @returns Whether the user exists. */
export async function updateUserNames({
  db,
  id,
  firstName,
  lastName,
}: Executor & { id: string; firstName: string; lastName: string }): Promise<boolean> {
  const rows = await db
    .update(user)
    .set({ firstName, lastName, name: `${firstName} ${lastName}` })
    .where(eq(user.id, id))
    .returning({ id: user.id });
  return rows.length > 0;
}

/** Sets the status unconditionally (a reversible switch). @returns Whether the user exists. */
export async function updateUserStatus({
  db,
  id,
  status,
}: Executor & { id: string; status: UserStatus }): Promise<boolean> {
  const rows = await db.update(user).set({ status }).where(eq(user.id, id)).returning({ id: user.id });
  return rows.length > 0;
}
