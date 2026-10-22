import { m } from "~/paraglide/messages";
import type { PartnerPerson, PartnerPersonStage } from "~/orpc/partner/contract";
import type { LeadStageFilter } from "~/routes/account_partner_leads/search-params";

/*===== Words =====*/
/**
 * The stage as a status chip and as the row's screen-reader sentence. Functions, not constants: a message is read when
 * it is shown, so it follows the page's language instead of the one the module first loaded in.
 */
export function stageStatus(stage: PartnerPersonStage): string {
  const labels: Record<PartnerPersonStage, () => string> = {
    lead: m.account_partner_leads_stage_lead,
    registered: m.account_partner_leads_stage_registered,
    bought: m.account_partner_leads_stage_bought,
    lost: m.account_partner_leads_stage_lost,
  };
  return labels[stage]();
}

/** The pills' labels. «ثبت‌نام‌شده» counts people who registered and have not bought yet (the API's stages are exclusive). */
export function stageFilterLabel(stage: LeadStageFilter): string {
  const labels: Record<LeadStageFilter, () => string> = {
    all: m.account_partner_leads_filter_all,
    lead: m.account_partner_leads_filter_lead,
    registered: m.account_partner_leads_filter_registered,
    bought: m.account_partner_leads_filter_bought,
    lost: m.account_partner_leads_filter_lost,
  };
  return labels[stage]();
}

/*===== Counting and Filtering =====*/
/** How many people each pill holds; a pill with none stays on screen with a zero. */
export function countPeople({ people }: { people: readonly PartnerPerson[] }): Record<LeadStageFilter, number> {
  const counts: Record<LeadStageFilter, number> = { all: people.length, lead: 0, registered: 0, bought: 0, lost: 0 };
  for (const person of people) counts[person.stage] += 1;
  return counts;
}

export function filterPeople({
  people,
  stage,
}: {
  people: readonly PartnerPerson[];
  stage: LeadStageFilter;
}): PartnerPerson[] {
  return stage === "all" ? [...people] : people.filter((person) => person.stage === stage);
}
