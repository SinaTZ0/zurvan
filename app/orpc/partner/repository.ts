import { eq } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { partner } from "~/db/schema";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

/*===== Reads =====*/
/** The partner's Sheba number: `undefined` when the user has no `partner` row, null when they have not written it yet. */
export async function findShebaNumber({
  db,
  userId,
}: Executor & { userId: string }): Promise<{ shebaNumber: string | null } | undefined> {
  const [row] = await db.select({ shebaNumber: partner.shebaNumber }).from(partner).where(eq(partner.userId, userId));
  return row;
}

/*===== Writes =====*/
/**
 * Writes the Sheba number of this user's own `partner` row, and only that row.
 *
 * @returns The stored value, or `undefined` when the user has no `partner` row.
 */
export async function updateShebaNumber({
  db,
  userId,
  shebaNumber,
}: Executor & { userId: string; shebaNumber: string }): Promise<{ shebaNumber: string | null } | undefined> {
  const [row] = await db
    .update(partner)
    .set({ shebaNumber })
    .where(eq(partner.userId, userId))
    .returning({ shebaNumber: partner.shebaNumber });
  return row;
}
