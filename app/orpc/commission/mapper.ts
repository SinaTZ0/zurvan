import type { AdminCommission, PartnerCommission } from "~/orpc/commission/contract";
import type { CommissionRow } from "~/orpc/commission/repository";

/** A partner sees what they earned and from whom, not what the customer paid (F12). */
export function toPartnerCommission(row: CommissionRow): PartnerCommission {
  return {
    id: row.commission.id,
    customerName: row.customer.name,
    amount: row.commission.amount,
    paidAt: row.commission.paidAt,
    createdAt: row.commission.createdAt,
  };
}

export function toAdminCommission(row: CommissionRow): AdminCommission {
  return {
    ...toPartnerCommission(row),
    partner: row.partner,
    customer: row.customer,
    baseAmount: row.commission.baseAmount,
    percent: row.commission.percent,
  };
}
