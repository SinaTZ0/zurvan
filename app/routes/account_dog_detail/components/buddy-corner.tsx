import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { NightSky } from "~/components/night-sky";

/*===== Buddy Corner =====*/
/**
 * Wide screens only: the room the main column leaves under its last plate when the side column beside it is taller (a
 * dog with no courses, no diary and no request yet). Instead of a black hole, the dog's own corner at the center: his
 * bed and his toy chest on a short path under the night sky, dimmed, with a pool of warm light. No drawn dog here: the
 * corner is the customer's dog's, and the mascot never stands for it.
 *
 * It takes whatever height is left (`flex-1` in the stretched column) and shows its pieces only when there is room for
 * them (a size container, page-motion.tsx's `dd-corner` rules), so a long column (Leo's) ends on its last plate.
 */
export function BuddyCorner() {
  return (
    <div aria-hidden className="dd-corner pointer-events-none relative hidden min-h-0 flex-1 lg:-mt-16 lg:block">
      {/* The scene is at most 13rem tall and shrinks with the room (`cqh`: the corner is a size container). */}
      <div className="dd-corner-scene absolute inset-x-0 bottom-0 h-[min(13rem,100cqh)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_60%_at_50%_92%,rgb(255_194_26/0.07),transparent)]" />
        <NightSky className="dd-corner-sky inset-x-[12%] top-0 h-16" />
        <GroundStrip className="absolute inset-x-0 bottom-0 h-8 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
        {/* Physical sides: a picture, not reading order. */}
        <div className="absolute inset-x-0 bottom-3 mx-auto aspect-[26/9] w-[min(26rem,calc(100cqh*2.4))]">
          <MascotCut name="plants" className="lively-sway absolute right-[0%] bottom-0 w-[13%] -scale-x-100" />
          <MascotCut name="dog-bed" className="absolute right-[10%] bottom-0 w-[44%] translate-y-[4%]" />
          <MascotCut name="toy-box" className="absolute bottom-0 left-[12%] w-[33%] translate-y-[4%]" />
          <MascotCut name="plants" className="lively-sway-2 absolute bottom-0 left-[0%] w-[11%]" />
        </div>
      </div>
    </div>
  );
}
