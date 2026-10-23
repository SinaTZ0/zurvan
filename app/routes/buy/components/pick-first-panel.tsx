import { CircleAlertIcon, PlusIcon } from "lucide-react";

import { StagePanel } from "~/routes/buy/components/stage-panel";
import { m } from "~/paraglide/messages";

/*===== Pick First Panel =====*/
/**
 * Several dogs and none picked: no list yet. The center's dog, by the stall's blank chalkboard, points up at the prints
 * above; the words say what will come here and how the two lists read, so the panel explains the page before the pick.
 */
export function PickFirstPanel() {
  return (
    <StagePanel
      titleId="pick-first-title"
      title={m.buy_pick_first_title()}
      scene={{
        box: [19, 25],
        scenery: { name: "chalkboard", width: [8.5, 12.5], left: [1, 1.5] },
        dog: { name: "point-up", height: [8.5, 12.5], left: [9.5, 13.25], head: 0.56 },
        bubble: m.buy_pick_first_bubble(),
      }}
    >
      <p className="mt-3 max-w-md text-lead text-pretty text-muted-foreground">{m.buy_pick_first_text()}</p>

      {/*------ How the Lists Read ------*/}
      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
        <li className="flex items-start gap-3 rounded-2xl border border-foreground/15 bg-card paper-grain p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <PlusIcon aria-hidden strokeWidth={2.4} className="size-4" />
          </span>
          <span className="text-sm text-pretty">
            <span className="block font-bold">{m.buy_pick_first_can_title()}</span>
            <span className="text-muted-foreground">{m.buy_pick_first_can_text()}</span>
          </span>
        </li>
        <li className="flex items-start gap-3 rounded-2xl border border-foreground/15 bg-card paper-grain p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-foreground/25 text-destructive">
            <CircleAlertIcon aria-hidden strokeWidth={2} className="size-4" />
          </span>
          <span className="text-sm text-pretty">
            <span className="block font-bold">{m.buy_pick_first_later_title()}</span>
            <span className="text-muted-foreground">{m.buy_pick_first_later_text()}</span>
          </span>
        </li>
      </ul>
    </StagePanel>
  );
}
