import { cn } from "cn";

import type { PartnerPersonStage } from "~/orpc/partner/contract";

/*===== Stage Chip =====*/
const LABELS: Record<PartnerPersonStage, string> = {
  lead: "شماره‌ی ثبت‌شده",
  registered: "ثبت‌نام کرد",
  bought: "خرید کرد",
  lost: "از دست رفت",
};

// No gold and no red: the Admin only reads where a person stands. The further along, the more it stands out; a lost
// person recedes.
const TONES: Record<PartnerPersonStage, string> = {
  lead: "border-border text-muted-foreground",
  registered: "border-foreground/40 text-foreground",
  bought: "border-foreground bg-muted font-extrabold text-foreground",
  lost: "border-border/60 text-muted-foreground/70",
};

/** Where one person stands on a partner's road (F7), as a small outlined chip. */
export function StageChip({ stage }: { stage: PartnerPersonStage }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[stage],
      )}
    >
      {LABELS[stage]}
    </span>
  );
}
