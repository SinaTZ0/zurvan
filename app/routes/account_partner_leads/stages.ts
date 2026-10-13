import type { PartnerPerson, PartnerPersonStage } from "~/orpc/partner/contract";
import type { LeadStageFilter } from "~/routes/account_partner_leads/search-params";

/*===== Words =====*/
/** The stage as a status chip and as the row's screen-reader sentence. */
export const STAGE_STATUS: Record<PartnerPersonStage, string> = {
  lead: "منتظر ثبت‌نام",
  registered: "ثبت‌نام کرد",
  bought: "خرید کرد",
  lost: "از دست رفت",
};

/** The pills' labels. «ثبت‌نام‌شده» counts people who registered and have not bought yet (the API's stages are exclusive). */
export const STAGE_FILTER_LABELS: Record<LeadStageFilter, string> = {
  all: "همه",
  lead: "در راه",
  registered: "ثبت‌نام‌شده",
  bought: "خریدار",
  lost: "از دست رفته",
};

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
