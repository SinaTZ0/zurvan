import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { formatNumberFa } from "~/lib/digits";
import type { SiteRules } from "~/lib/site-rules";

/*===== Rules Contents =====*/
/**
 * The contents plate: one numbered gold disc and link per section, in the text's own order. Wide, it is the sticky
 * column at the start; on phones it is a compact «فهرست» plate under the header, its links wrapping as chips. Links
 * only: nothing here highlights the section in view.
 *
 * The dog lies along the plate's top edge reading a book, with a bush either side; his picture looks right, so he lies
 * at the plate's right with the bushes behind him (physical sides, tied to the picture). The wrapper leaves room above
 * the plate for him.
 */
export function RulesContents({ sections }: { sections: SiteRules["sections"] }) {
  return (
    <nav aria-label="فهرست قوانین" className="relative mt-16 lg:mt-20">
      {/*------ Dog Reading on the Plate's Edge ------*/}
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 bottom-[calc(100%-0.2rem)] z-10 w-32 lg:right-10 lg:w-44"
      >
        <div className="absolute -inset-x-1/4 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="plants" className="lively-sway absolute right-[86%] bottom-0 w-[30%] translate-y-[4%]" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute bottom-0 left-[92%] w-[26%] translate-y-[4%] -scale-x-100"
        />
        <MascotCut name="read" className="lively-breathe relative block w-full translate-y-[5%]" />
      </div>

      <div className="rounded-3xl border border-border bg-card paper-grain px-5 py-5 shadow-sm lg:px-6">
        <p className="font-display text-lg font-extrabold">فهرست</p>
        <ol className="mt-3 flex flex-wrap gap-2 lg:max-h-[calc(100svh-18rem)] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:border-s lg:border-border lg:ps-4">
          {sections.map((section, index) => (
            <li key={index}>
              <Link
                to="/rules"
                hash={`rule-${index + 1}`}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none lg:rounded-xl lg:border-transparent lg:px-1 lg:py-1.5 lg:text-base"
              >
                <span
                  aria-hidden
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-extrabold text-primary-foreground"
                >
                  {formatNumberFa(index + 1)}
                </span>
                {section.heading}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/*===== Rail Scene =====*/
/**
 * The foot of the rail's column, under the plate that stays sticky above it: the open book on its lectern with a bush
 * either side, so the column ends in a place and not in a hole beside the long text. Desktop only, like the rail's
 * column.
 */
export function RailScene() {
  return (
    <div aria-hidden className="pointer-events-none relative mt-10 hidden h-64 lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_75%,rgb(255_194_26/0.08),transparent)]" />
      <MascotCut name="lectern" className="absolute inset-x-0 bottom-[1.2rem] mx-auto w-[58%] translate-y-[6%]" />
      <GroundStrip className="absolute inset-x-0 bottom-0 h-9 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]" />
      <MascotCut name="plants" className="lively-sway absolute bottom-[1.2rem] left-[2%] w-[17%] translate-y-[6%]" />
      <MascotCut
        name="plants"
        className="lively-sway-2 absolute right-[2%] bottom-[1.2rem] w-[14%] translate-y-[6%] -scale-x-100"
      />
    </div>
  );
}
