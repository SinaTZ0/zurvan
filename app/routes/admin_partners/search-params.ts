import { createSerializer, parseAsString, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** The three views, in the order the pills show. «unpaid» first: paying is what he comes here to do. */
export const PARTNER_VIEWS = ["unpaid", "paid", "partners"] as const;

export type PartnerView = (typeof PARTNER_VIEWS)[number];

/** The page's own path, which the row links are built on. */
export const ADMIN_PARTNERS_PATH = "/admin/partners";

/*===== Parsers =====*/
// All shallow: the loader fetches both lists once and the page filters them, so a change never needs a loader run.
// `partner` (the open drawer) and `new` (the create sheet) push a history entry so Back closes them; neither has a
// default because "absent" means closed. `new` is the literal «1» (`?new=1`), not nuqs's boolean «true».
export const adminPartnersSearchParams = {
  view: parseAsStringLiteral(PARTNER_VIEWS).withDefault("unpaid").withOptions({ shallow: true }),
  partner: parseAsString.withOptions({ shallow: true, history: "push" }),
  new: parseAsStringLiteral(["1"] as const).withOptions({ shallow: true, history: "push" }),
};

/*===== Links =====*/
export const serializeAdminPartnersSearchParams = createSerializer(adminPartnersSearchParams);
