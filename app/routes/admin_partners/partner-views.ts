import type { AdminCommission } from "~/orpc/commission/contract";
import type { AdminPartner } from "~/orpc/partner/contract";

/*===== Types =====*/
/** One partner who is owed money, with the commissions to pay him (oldest first). */
export type UnpaidBlockData = {
  partnerId: string;
  name: string;
  /** From the partner list; null if the commission's partner is somehow missing from it. */
  partner: AdminPartner | null;
  lines: AdminCommission[];
  /** Rial. */
  total: number;
};

/*===== Unpaid =====*/
export function isUnpaid(commission: AdminCommission): boolean {
  return commission.paidAt === null;
}

/**
 * The pay sheet: unpaid commissions grouped by partner. The partner who has waited longest comes first, and inside a
 * block the oldest commission comes first, so the order he pays in is the order they were earned in.
 */
export function groupUnpaid({
  commissions,
  partners,
}: {
  commissions: readonly AdminCommission[];
  partners: readonly AdminPartner[];
}): UnpaidBlockData[] {
  const byId = new Map(partners.map((partner) => [partner.id, partner]));
  const blocks = new Map<string, UnpaidBlockData>();

  for (const commission of commissions) {
    if (!isUnpaid(commission)) continue;
    const existing = blocks.get(commission.partner.id);
    if (existing) {
      existing.lines.push(commission);
      existing.total += commission.amount;
    } else {
      blocks.set(commission.partner.id, {
        partnerId: commission.partner.id,
        name: commission.partner.name,
        partner: byId.get(commission.partner.id) ?? null,
        lines: [commission],
        total: commission.amount,
      });
    }
  }

  const oldest = (block: UnpaidBlockData) => Math.min(...block.lines.map((line) => line.createdAt.getTime()));
  const result = [...blocks.values()];
  for (const block of result) block.lines.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  // oxlint-disable-next-line unicorn/no-array-sort -- `result` is our own copy
  return result.sort((a, b) => oldest(a) - oldest(b));
}

/*===== Paid =====*/
/** The ledger: paid commissions, newest payment first. */
export function listPaid(commissions: readonly AdminCommission[]): AdminCommission[] {
  return (
    commissions
      .filter((commission) => commission.paidAt !== null)
      // oxlint-disable-next-line unicorn/no-array-sort -- `filter` made our own copy
      .sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0))
  );
}

/*===== Names =====*/
/** «بهرام کاظمی» → «بهرام», for the toast that says whom the SMS went to. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/*===== Sheba =====*/
/** `IR` + 24 digits as groups of four (`IR12`, `3456`, …), so a long number reads and copies without slips. */
export function shebaGroups(sheba: string): string[] {
  const compact = sheba.replace(/\s+/g, "").toUpperCase();
  return compact.match(/.{1,4}/g) ?? [compact];
}
