import { cn } from "cn";

import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";
import { Pagination } from "~/components/pagination";
import type { PartnerPerson } from "~/orpc/partner/contract";
import { EdgeDog } from "~/routes/account_partner_leads/components/edge-dog";
import { LeadRow } from "~/routes/account_partner_leads/components/lead-row";
import { NobodyYet } from "~/routes/account_partner_leads/components/nobody-yet";
import { PlateHead } from "~/routes/account_partner_leads/components/plate-head";
import { StagePills } from "~/routes/account_partner_leads/components/stage-pills";
import { PLATE } from "~/routes/account_partner_leads/plate";
import type { LeadStageFilter } from "~/routes/account_partner_leads/search-params";

/*===== Leads List =====*/
/**
 * «هر کی کجای راهه»: the partner's people on one plate. The center's dog sits on its top edge with his magnifying glass,
 * the dimmed noticeboard behind him, and says «همه رو زیر نظر دارم!» once the plate scrolls into view. Inside: the stage
 * pills, the rows (each person's road, lined up in one column) and the pager. With nobody at all, the plate holds the
 * waiting dog instead, and only the blank noticeboard stands on the edge: nothing pinned yet, and one dog to a plate.
 *
 * The rows are one list keyed by the stage and the page, so picking a pill or a page brings the whole list in again,
 * staggered, while a row added to the same list arrives on its own.
 */
export function LeadsList({
  total,
  counts,
  stage,
  page,
  pageCount,
  visiblePeople,
  highlightedIds,
  pending,
  listRef,
  onStage,
  onPage,
}: {
  /** Everyone the partner has, whatever the filter. */
  total: number;
  counts: Record<LeadStageFilter, number>;
  stage: LeadStageFilter;
  /** 1-based, already clamped to the pages there are. */
  page: number;
  pageCount: number;
  visiblePeople: readonly PartnerPerson[];
  highlightedIds: ReadonlySet<string>;
  pending: boolean;
  listRef: React.RefObject<HTMLDivElement | null>;
  onStage: (stage: LeadStageFilter) => void;
  /** 1-based. */
  onPage: (page: number) => void;
}) {
  const nobody = total === 0;

  return (
    <section aria-labelledby="leads-list-title">
      {/*===== Heading and the Dog =====*/}
      <PlateHead
        id="leads-list-title"
        title="هر کی کجای راهه"
        figureClassName={nobody ? "me-6 sm:me-10" : "me-[5.5rem] sm:me-[6.25rem]"}
        figure={
          nobody ? (
            <EmptyBoard />
          ) : (
            <EdgeDog
              name="magnify"
              idle="lively-twitch"
              className="w-[4.5rem] sm:w-[5.25rem]"
              scenery={{ name: "board", className: "right-[70%] w-[150%] translate-y-[3%]" }}
            >
              {/* Beside his head, towards the heading and above its line; the tail (bottom left) dips towards his muzzle. */}
              <div className="lively-float absolute bottom-[64%] left-[80%]">
                <ChalkBubble
                  tail="left"
                  className="pl-view-pop max-w-none whitespace-nowrap [--pop-origin:2.25rem_100%]"
                >
                  همه رو زیر نظر دارم!
                </ChalkBubble>
              </div>
            </EdgeDog>
          )
        }
      />

      {/*===== The Plate =====*/}
      <div className={PLATE}>
        {nobody ? (
          <NobodyYet />
        ) : (
          <>
            {/*------ Stage Pills ------*/}
            <StagePills counts={counts} value={stage} onChange={onStage} />

            {/*------ The Rows ------*/}
            <div
              ref={listRef}
              aria-busy={pending}
              className={cn("mt-5 scroll-mt-28 transition-opacity", pending && "opacity-60")}
            >
              {visiblePeople.length === 0 ? (
                <p
                  key={stage}
                  className="pl-row rounded-2xl border border-dashed border-foreground/20 px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  کسی توی این مرحله نیست.
                </p>
              ) : (
                <ul key={`${stage}-${page}`} className="flex flex-col gap-3">
                  {visiblePeople.map((person, index) => (
                    <LeadRow
                      key={person.id}
                      person={person}
                      index={index}
                      highlighted={highlightedIds.has(person.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/*------ Pages ------*/}
            {pageCount > 1 && (
              <Pagination
                label="صفحه‌های شماره‌ها"
                page={page - 1}
                pageCount={pageCount}
                className="mt-6"
                onPick={(next) => onPage(next + 1)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/*===== Empty Board =====*/
/**
 * With nobody yet, the plate's edge keeps its noticeboard with nothing pinned on it, between two bushes, in a pool of
 * warm light: the board the magnifying dog will watch once there are people. Sunk 3% so its grass meets the edge.
 */
function EmptyBoard() {
  return (
    <div className="relative w-[7.5rem] translate-y-[3%] sm:w-[9rem]">
      <div className="absolute -inset-x-1/3 -top-1/3 bottom-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_70%,rgb(255_194_26/0.07),transparent)]" />
      <MascotCut name="board" className="relative block w-full" />
      <MascotCut name="plants" className="lively-sway absolute bottom-0 left-[88%] w-[34%]" />
      <MascotCut name="plants" className="lively-sway-2 absolute right-[90%] bottom-0 w-[26%] -scale-x-100" />
    </div>
  );
}
