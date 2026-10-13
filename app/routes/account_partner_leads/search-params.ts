import { parseAsInteger, parseAsStringLiteral } from "nuqs/server";

/*===== Constants =====*/
/** People per page. A row is a whole card on a phone, so twenty is a few screens, not a wall. */
export const PAGE_SIZE = 20;

export const LEAD_STAGE_FILTERS = ["all", "lead", "registered", "bought", "lost"] as const;

export type LeadStageFilter = (typeof LEAD_STAGE_FILTERS)[number];

/*===== Parsers =====*/
// Shallow: the loader returns the partner's whole list once and never reads these, so the pills and the pager only move
// the URL and the component filters. `page` is 1-based in the URL.
export const partnerLeadsSearchParams = {
  stage: parseAsStringLiteral(LEAD_STAGE_FILTERS).withDefault("all").withOptions({ shallow: true }),
  page: parseAsInteger.withDefault(1).withOptions({ shallow: true }),
};
