import { and, eq, isNull } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { consent } from "~/db/schema";
import type { ConsentKind } from "~/orpc/consent/constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type ConsentRecord = typeof consent.$inferSelect;

/*===== Reads =====*/
/** The person's standing consent of a kind (and for a dog, when it is per dog), if they gave one that is not withdrawn. */
export async function findStandingConsents({
  db,
  userId,
  kind,
  dogId,
}: Executor & { userId: string; kind: ConsentKind; dogId?: string }): Promise<ConsentRecord[]> {
  return db
    .select()
    .from(consent)
    .where(
      and(
        eq(consent.userId, userId),
        eq(consent.kind, kind),
        isNull(consent.revokedAt),
        dogId === undefined ? isNull(consent.dogId) : eq(consent.dogId, dogId),
      ),
    );
}

/*===== Writes =====*/
/**
 * Records an acceptance of one version. One that already stands is left as it is (a unique index decides), so accepting
 * twice records once. Returns whether a row was written.
 */
export async function insertConsent({
  db,
  userId,
  kind,
  version,
  dogId,
  acceptedAt,
}: Executor & {
  userId: string;
  kind: ConsentKind;
  version: string;
  dogId?: string;
  acceptedAt: Date;
}): Promise<boolean> {
  const rows = await db
    .insert(consent)
    .values({ userId, kind, version, dogId: dogId ?? null, acceptedAt })
    .onConflictDoNothing()
    .returning({ id: consent.id });
  return rows.length > 0;
}

/** Takes back every standing consent of a kind (for a dog, when it is per dog). The rows stay, marked withdrawn. */
export async function revokeStandingConsents({
  db,
  userId,
  kind,
  dogId,
  revokedAt,
}: Executor & { userId: string; kind: ConsentKind; dogId?: string; revokedAt: Date }): Promise<number> {
  const rows = await db
    .update(consent)
    .set({ revokedAt })
    .where(
      and(
        eq(consent.userId, userId),
        eq(consent.kind, kind),
        isNull(consent.revokedAt),
        dogId === undefined ? isNull(consent.dogId) : eq(consent.dogId, dogId),
      ),
    )
    .returning({ id: consent.id });
  return rows.length;
}
