/*===== Public Record =====*/
// A dog's record is private. Its owner may make it public (docs/app-spec.md, F14), but only after reading and accepting
// wording about exactly what that shows and who can see it, and **no approved wording exists yet**: this is `null`, so
// no owner is offered the choice, the API refuses to turn it on, and every record stays private. Writing consent text is
// a legal call, not an engineering one (`docs/overnight/03-DECISIONS-NEEDED.md`).
//
// To turn the choice on once the owner has approved the wording: replace `null` with an object, give it a new `version`
// whenever the text changes, and deploy. An owner who agreed to an older version is private again until they agree to the
// new one.

export type PublicRecordConsent = {
  /** A new value whenever the wording changes. Stored with each owner's agreement. */
  version: string;
  /** The heading of the agreement. */
  title: string;
  /** The agreement's text, in order. */
  paragraphs: readonly string[];
};

export const PUBLIC_RECORD_CONSENT: PublicRecordConsent | null = null;
