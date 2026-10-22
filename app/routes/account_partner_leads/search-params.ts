import { z } from "zod";

/*===== Constants =====*/
/** People per page. A row is a whole card on a phone, so twenty is a few screens, not a wall. */
export const PAGE_SIZE = 20;

export const LEAD_STAGE_FILTERS = ["all", "lead", "registered", "bought", "lost"] as const;

export type LeadStageFilter = (typeof LEAD_STAGE_FILTERS)[number];

/*===== Schema =====*/
// UI-only, so the route has no `loaderDeps`: the loader reads the partner's whole list once and never these, and the
// pills and the pager only move the URL while the component filters. A value the URL doesn't have, or one that isn't
// valid, means the default (`stage` "all", `page` 1), and navigations leave the defaults out of the URL. `page` is
// 1-based.
export const partnerLeadsSearchSchema = z.object({
  stage: z.enum(LEAD_STAGE_FILTERS).optional().catch(undefined),
  page: z.number().int().optional().catch(undefined),
});
