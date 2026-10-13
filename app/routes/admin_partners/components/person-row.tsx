import { toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { StageChip } from "~/routes/admin_partners/components/stage-chip";

/*===== Person Row =====*/
/**
 * One phone lead or link customer in a partner's drawer. The first line is what identifies them (the typed number, or
 * the customer's name for someone his link brought), then the stage, and under it the dates they reached. A lost person
 * carries no name and no date past the entry: the API gives none (F12), and this adds nothing.
 */
export function PersonRow({ person }: { person: PartnerPerson }) {
  const dates = [
    person.source === "link"
      ? `ثبت‌نام ${formatJalaliTimestamp(person.createdAt)}`
      : `ثبت شماره ${formatJalaliTimestamp(person.createdAt)}`,
    person.source === "phone" && person.registeredAt ? `ثبت‌نام ${formatJalaliTimestamp(person.registeredAt)}` : null,
    person.boughtAt ? `خرید ${formatJalaliTimestamp(person.boughtAt)}` : null,
  ].filter(Boolean);

  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold">
          {person.phoneNumber && (
            <bdi dir="ltr" className="tabular-nums">
              {toPersianDigits(person.phoneNumber)}
            </bdi>
          )}
          {person.customerName && (
            <span className={person.phoneNumber ? "font-normal text-muted-foreground" : undefined}>
              <bdi>{person.customerName}</bdi>
            </span>
          )}
          {person.source === "link" && <span className="text-xs font-normal text-muted-foreground">از لینک</span>}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
          {dates.map((date) => (
            <span key={date} className="whitespace-nowrap">
              {date}
            </span>
          ))}
        </p>
      </div>
      <StageChip stage={person.stage} />
    </li>
  );
}
