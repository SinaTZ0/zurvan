import type { AdminPartner, PartnerPerson, PartnerPersonStage, PartnerProfile } from "~/orpc/partner/contract";
import type {
  LeadFact,
  LinkCustomerFact,
  PartnerCommissionSums,
  PartnerProfileRecord,
  PartnerRecord,
} from "~/orpc/partner/repository";

/*===== Profile =====*/
export function toPartnerProfile({
  record,
  commissionPercent,
}: {
  record: PartnerProfileRecord;
  commissionPercent: number;
}): PartnerProfile {
  return {
    shebaNumber: record.shebaNumber,
    code: record.code,
    isActive: record.isActive,
    commissionPercent,
  };
}

/*===== People =====*/
/**
 * A phone lead as its partner sees it. A `lost` person shows nothing of the customer (name, dates): the number went to
 * someone else, and who they are, or who won, is not this partner's to see (F12).
 */
export function toPhonePerson({ fact, stage }: { fact: LeadFact; stage: PartnerPersonStage }): PartnerPerson {
  const customer = stage === "registered" || stage === "bought" ? fact.customer : null;

  return {
    id: fact.id,
    source: "phone",
    phoneNumber: fact.phoneNumber,
    customerName: customer?.name ?? null,
    stage,
    createdAt: fact.createdAt,
    registeredAt: customer?.createdAt ?? null,
    boughtAt: stage === "bought" ? fact.boughtAt : null,
    commission: stage === "bought" ? toPersonCommission(fact) : null,
  };
}

/** A customer the partner's link brought: there is no number the partner typed, and the list date is when they registered. */
export function toLinkPerson({ fact }: { fact: LinkCustomerFact }): PartnerPerson {
  return {
    id: fact.id,
    source: "link",
    phoneNumber: null,
    customerName: fact.name,
    stage: fact.boughtAt ? "bought" : "registered",
    createdAt: fact.createdAt,
    registeredAt: fact.createdAt,
    boughtAt: fact.boughtAt,
    commission: fact.boughtAt ? toPersonCommission(fact) : null,
  };
}

/** The partner's own commission for a person who bought, as the list shows it. */
function toPersonCommission(fact: { commissionAmount: number | null; commissionPaidAt: Date | null }) {
  return fact.commissionAmount === null ? null : { amount: fact.commissionAmount, paidAt: fact.commissionPaidAt };
}

/*===== Admin =====*/
export function toAdminPartner({
  record,
  people,
  sums,
}: {
  record: PartnerRecord;
  people: PartnerPerson[];
  sums: PartnerCommissionSums | undefined;
}): AdminPartner {
  const counts = { lead: 0, registered: 0, bought: 0, lost: 0 };
  for (const person of people) counts[person.stage] += 1;

  return {
    id: record.id,
    name: record.name,
    phoneNumber: record.phoneNumber,
    code: record.code,
    shebaNumber: record.shebaNumber,
    isActive: record.isActive,
    createdAt: record.createdAt,
    counts,
    commissions: {
      unpaidCount: sums?.unpaidCount ?? 0,
      unpaidAmount: sums?.unpaidAmount ?? 0,
      paidCount: sums?.paidCount ?? 0,
      paidAmount: sums?.paidAmount ?? 0,
    },
    people,
  };
}
