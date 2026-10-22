import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";

/*===== Rail Scene =====*/
/**
 * The foot of the rail's column, under the plates that stay sticky above it: a closed front door with the dog asleep
 * on its mat, so the column ends in a place and not in a hole beside the long list. Desktop only, like the rail.
 * He looks right, towards the door (physical sides, tied to the picture).
 */
export function RailScene() {
  return (
    <div aria-hidden className="pointer-events-none relative mt-8 hidden h-60 lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_40%_80%,rgb(255_194_26/0.08),transparent)]" />
      <MascotCut name="door" className="absolute right-[2%] bottom-[1.2rem] w-[66%] translate-y-[6%]" />
      <GroundStrip className="absolute inset-x-0 bottom-0 h-9 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]" />
      <MascotCut name="plants" className="lively-sway absolute bottom-[1.2rem] left-[-2%] w-[18%] translate-y-[6%]" />
      <MascotCut name="sleep" className="lively-breathe absolute bottom-[1.2rem] left-[14%] w-[36%] translate-y-[6%]" />
    </div>
  );
}

/*===== Contents Rail =====*/
/**
 * Anchors to the sections, beside them on desktop, on a small grained plate with the watchful dog lying along its top
 * edge, as if he were minding the list. It is hidden on phones, where the short sections are simply stacked, so the
 * rail never takes width the list needs. Links only: nothing here highlights the section in view.
 *
 * The dog's picture looks to the right, so he lies at the plate's right with his bushes behind (physical sides, tied to
 * the picture). The plate's wrapper leaves room above for him.
 */
const SECTIONS = [
  { id: "kept", label: "چی ذخیره می‌شه" },
  { id: "who-sees", label: "کی چی رو می‌بینه" },
  { id: "yours", label: "چی رو خودت عوض می‌کنی" },
  { id: "technical", label: "جزئیات فنی" },
] as const;

export function ContentsRail() {
  return (
    <nav aria-label="فهرست صفحه" className="relative mt-24 hidden lg:block">
      {/*------ Dog Lying on the Plate's Edge ------*/}
      <div aria-hidden className="pointer-events-none absolute bottom-[calc(100%-0.2rem)] left-10 z-10 w-44">
        <div className="absolute -inset-x-1/4 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="plants" className="lively-sway absolute right-[84%] bottom-0 w-[30%] translate-y-[4%]" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute bottom-0 left-[90%] w-[26%] translate-y-[4%] -scale-x-100"
        />
        <MascotCut name="watch" className="lively-breathe relative block w-full translate-y-[5%]" />
      </div>

      <div className="rounded-3xl border border-border bg-card paper-grain px-6 py-5 shadow-sm">
        <ul className="space-y-1 border-s border-border ps-5">
          {SECTIONS.map(({ id, label }) => (
            <li key={id}>
              <Link
                to="/privacy"
                hash={id}
                className="block rounded-sm py-1.5 font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
