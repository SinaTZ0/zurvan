import { AwardIcon, CalendarHeartIcon, MapPinnedIcon } from "lucide-react";

import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Trainer Facts =====*/
/** The three facts printed on the owner's business card: years of experience, the credential and the service area. */
export function TrainerFacts() {
  const facts = [
    { icon: CalendarHeartIcon, label: `${formatNumberFa(HEAD_TRAINER.years)} سال سابقه و تجربه‌ی حرفه‌ای` },
    { icon: AwardIcon, label: HEAD_TRAINER.credential },
    { icon: MapPinnedIcon, label: `فعال در ${CENTER_SERVICE_AREA}` },
  ];

  return (
    <ul className="mt-8 space-y-4">
      {facts.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-3">
          <Icon aria-hidden strokeWidth={1.5} className="size-7 shrink-0 text-primary" />
          <span className="font-bold">{label}</span>
        </li>
      ))}
    </ul>
  );
}
