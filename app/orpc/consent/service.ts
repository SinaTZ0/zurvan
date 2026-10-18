import type { DatabaseOrTransaction } from "~/db/client.server";
import { SITE_RULES, type SiteRules } from "~/lib/site-rules";
import type { ConsentStatus } from "~/orpc/consent/contract";
import { findStandingConsents, insertConsent, revokeStandingConsents } from "~/orpc/consent/repository";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

/** The rules in force, injectable so a test can publish some without editing the registry. */
type RulesOption = { rules?: Pick<SiteRules, "version"> | null };

/*===== Site Rules =====*/
/** Whether this person has accepted exactly the version in force. With no rules published there is nothing to accept. */
export async function hasAcceptedSiteRules({
  db,
  userId,
  rules = SITE_RULES,
}: Executor & RulesOption & { userId: string }): Promise<boolean> {
  if (!rules) return true;
  const standing = await findStandingConsents({ db, userId, kind: "site-rules" });
  return standing.some((record) => record.version === rules.version);
}

export async function getConsentStatus({
  db,
  userId,
  rules = SITE_RULES,
}: Executor & RulesOption & { userId: string }): Promise<ConsentStatus> {
  if (!rules) return { siteRules: null };
  return { siteRules: { version: rules.version, accepted: await hasAcceptedSiteRules({ db, userId, rules }) } };
}

type AcceptResult = { kind: "success"; version: string } | { kind: "not-published" };

/** Records the acceptance of the rules in force now, with the time. Again is the same as once. */
export async function acceptSiteRules({
  db,
  userId,
  rules = SITE_RULES,
  now = new Date(),
}: Executor & RulesOption & { userId: string; now?: Date }): Promise<AcceptResult> {
  if (!rules) return { kind: "not-published" };
  await insertConsent({ db, userId, kind: "site-rules", version: rules.version, acceptedAt: now });
  return { kind: "success", version: rules.version };
}

/*===== Per-dog Consent =====*/
// The same record for a consent that is given for one dog and can be taken back (F14's public logbook). The caller has
// already checked that the dog is the person's.

export async function giveDogConsent({
  db,
  userId,
  dogId,
  kind,
  version,
  now = new Date(),
}: Executor & { userId: string; dogId: string; kind: "public-logbook"; version: string; now?: Date }): Promise<void> {
  await insertConsent({ db, userId, kind, version, dogId, acceptedAt: now });
}

/** Takes back the person's consent for this dog. The record of having given it stays. Returns whether one stood. */
export async function withdrawDogConsent({
  db,
  userId,
  dogId,
  kind,
  now = new Date(),
}: Executor & { userId: string; dogId: string; kind: "public-logbook"; now?: Date }): Promise<boolean> {
  return (await revokeStandingConsents({ db, userId, kind, dogId, revokedAt: now })) > 0;
}

/** Whether a consent for this dog stands now, and the version it was given for. */
export async function findDogConsent({
  db,
  userId,
  dogId,
  kind,
}: Executor & { userId: string; dogId: string; kind: "public-logbook" }): Promise<{
  version: string;
  acceptedAt: Date;
} | null> {
  const [standing] = await findStandingConsents({ db, userId, kind, dogId });
  return standing ? { version: standing.version, acceptedAt: standing.acceptedAt } : null;
}
