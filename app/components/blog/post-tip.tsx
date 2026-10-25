import { MascotCut } from "~/components/mascot-cut";
import { m } from "~/paraglide/messages";

/*===== Post Tip =====*/
/**
 * «سگ می‌گه», the article's signature block: the author's aside said by the mascot. His chalk bubble holds the words in
 * his hand (Marhey), and he sits at its end corner pointing up at it, in a small pool of warm light. The bubble's tail
 * is on its bottom edge at that corner, aimed at his head.
 *
 * The layout follows the page's direction (the dog at the end side), and the picture, which faces right, is mirrored on
 * the English pages so he still looks at his bubble. The words carry `dir="auto"`, so an English tip in a Persian post
 * runs left to right inside the same bubble. The bubble pops in as it scrolls into view where the browser can.
 */
export function PostTip({ children }: { children: React.ReactNode }) {
  return (
    <aside aria-label={m.blog_body_tip_label()} className="mt-10 flex items-end gap-1 first:mt-0 sm:gap-3">
      {/*------ Bubble ------*/}
      <div className="lively-reveal-pop relative mb-[4.6rem] min-w-0 flex-1 rounded-[1.6rem] border-2 border-foreground bg-background px-5 py-4 sm:mb-[5.6rem] sm:px-6 sm:py-5">
        <p
          dir="auto"
          className="font-hand text-[1.0625rem] leading-[1.95] text-pretty [overflow-wrap:anywhere] text-foreground md:text-lg"
        >
          {children}
        </p>
        <span
          aria-hidden
          className="absolute end-9 -bottom-[9px] size-4 rotate-45 border-r-2 border-b-2 border-foreground bg-background"
        />
      </div>

      {/*------ Dog ------*/}
      <div aria-hidden className="relative w-[4.5rem] shrink-0 sm:w-24">
        <div className="absolute -inset-x-1/2 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_42%_42%_at_50%_55%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="point-up" className="lively-breathe relative block w-full ltr:-scale-x-100" />
      </div>
    </aside>
  );
}
