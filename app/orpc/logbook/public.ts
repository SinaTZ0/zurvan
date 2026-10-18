import type { DatabaseOrTransaction } from "~/db/client.server";
import { PUBLIC_RECORD_CONSENT, type PublicRecordConsent } from "~/lib/public-record";
import { findStandingConsents } from "~/orpc/consent/repository";

/*===== Is It Public =====*/
/** The consent wording in force, injectable so a test can publish some without editing the registry. */
export type PublicRecordRules = Pick<PublicRecordConsent, "version"> | null;

/**
 * Whether this dog's record is public **right now**: approved wording exists, and the dog's owner has a standing
 * agreement for **that version**. No wording, an agreement withdrawn, or one for an older version all mean private. This
 * is the one place that decides it; everything public (the record page, a certificate's check) asks here.
 */
export async function isRecordPublic({
  db,
  ownerId,
  dogId,
  rules = PUBLIC_RECORD_CONSENT,
}: {
  db: DatabaseOrTransaction;
  ownerId: string;
  dogId: string;
  rules?: PublicRecordRules;
}): Promise<boolean> {
  if (!rules) return false;
  const standing = await findStandingConsents({ db, userId: ownerId, kind: "public-logbook", dogId });
  return standing.some((agreement) => agreement.version === rules.version);
}
