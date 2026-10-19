/*===== Site Rules =====*/
// The rules a person accepts when they sign up and before they pay (docs/app-spec.md, F13). **No approved wording exists
// yet**, so nothing is published: `SITE_RULES` is `null`, and with it the «قوانین» page and its links, the tick at
// sign-up and the tick before payment are all absent, and nothing is recorded. Writing legal text is not an engineering
// call (`docs/overnight/03-DECISIONS-NEEDED.md`).
//
// To publish the rules once the owner has approved the wording: replace `null` with an object, give it a new `version`
// every time the text changes (the record of who accepted what names it), and deploy. From then on:
//   - the page `/rules` shows it and the header and footer link to it,
//   - a new customer ticks it on the name step and the acceptance is stored,
//   - a customer who has not accepted this version ticks it on the cart before «پرداخت».
// Nothing else needs changing in the app. Two end-to-end smoke tests (`e2e/smoke.spec.ts`) describe the state without
// rules and must be changed when this is set: `/rules` is expected to be a 404, and a new customer is expected to get
// past the name step without a tick.

export type SiteRules = {
  /** A new value whenever the wording changes, e.g. `"1405-07-01"`. Stored with each acceptance. */
  version: string;
  /** The page's heading. */
  title: string;
  /** When this version took effect, as the owner wants it written (e.g. a Jalali date). */
  effectiveFrom: string;
  /** The text, in order. A section is a heading and its paragraphs. */
  sections: readonly { heading: string; paragraphs: readonly string[] }[];
};

export const SITE_RULES: SiteRules | null = null;
