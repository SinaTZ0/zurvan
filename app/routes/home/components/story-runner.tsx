import { PawPrint } from "lucide-react";
import { ChalkBubble } from "~/components/chalk-bubble";
import { MascotCut } from "~/components/mascot-cut";

/*===== Timing =====*/
// One lap: Fandogh chases his ball across the lane in the first RUN share of the cycle, then the lane rests empty
// until the next lap. The cycle is shorter on phones (`--cycle`), so the narrower lane isn't crossed at a crawl.
const RUN = 0.55;
const PRINTS = 9;

// The lap lives in the lane's own <style>, and only moves without reduced motion.
// Positions are physical (left/right), as the run is right to left on screen whatever the page's direction.
const RUNNER_CSS = `
  .st-lane { --cycle: 7s; --dog-w: 5.5rem; }
  @media (min-width: 768px) { .st-lane { --cycle: 10s; --dog-w: 7rem; } }

  @media (prefers-reduced-motion: no-preference) {
    .st-lane .st-run { animation: st-run var(--cycle) linear infinite; }
    .st-lane .st-gallop { transform-origin: 50% 100%; animation: st-gallop .38s ease-in-out infinite; }
    .st-lane .st-ball { animation: st-ball .38s cubic-bezier(.3,0,.7,1) infinite alternate; }
    .st-lane .st-ball-spin { animation: st-spin .5s linear infinite; }
    .st-lane .st-puff { animation: st-puff .38s ease-out infinite; }
    .st-lane .st-lines { animation: st-lines .19s linear infinite alternate; }
    .st-lane .st-shout { transform-origin: 0 100%; animation: st-shout var(--cycle) ease-out infinite; }
    .st-lane .st-print {
      animation: st-print var(--cycle) linear infinite backwards;
      animation-delay: calc(var(--cycle) * ${RUN} * var(--at));
    }
  }

  /* The dog stands at 30% when still; a lap starts with him (and the ball ahead of him) just past the right edge and
     ends with his speed lines just past the left one. */
  @keyframes st-run {
    0% { transform: translateX(calc(72% + 2.5rem)); }
    ${RUN * 100}% { transform: translateX(calc(-30% - var(--dog-w) - 4rem)); }
    100% { transform: translateX(calc(-30% - var(--dog-w) - 4rem)); }
  }
  /* Facing left, a clockwise turn lifts his head: up on the push-off, nose down on the landing. */
  @keyframes st-gallop {
    0%, 100% { transform: translateY(0) rotate(-4deg) scale(1.03, .96); }
    45% { transform: translateY(-22%) rotate(6deg) scale(.98, 1.03); }
    70% { transform: translateY(-10%) rotate(1deg); }
  }
  @keyframes st-ball { from { transform: translateY(0) scale(1.15, .85); } 15% { transform: translateY(-4%); } to { transform: translateY(-260%); } }
  @keyframes st-spin { to { transform: rotate(-360deg); } }
  @keyframes st-puff {
    0% { opacity: .55; transform: translate(0, 0) scale(.4); }
    100% { opacity: 0; transform: translate(1.6rem, -.6rem) scale(1.4); }
  }
  @keyframes st-lines { from { opacity: .35; transform: translateX(0); } to { opacity: .8; transform: translateX(.35rem); } }
  /* The bubble pops up a little into the lap and is gone before he leaves the screen. */
  @keyframes st-shout {
    0%, 12% { opacity: 0; transform: scale(.4); }
    16% { opacity: 1; transform: scale(1.08); }
    18%, 36% { opacity: 1; transform: none; }
    40%, 100% { opacity: 0; transform: scale(.8); }
  }
  /* A print appears as he passes and fades over a few seconds. */
  @keyframes st-print { 0% { opacity: 0; } 1% { opacity: .5; } 30% { opacity: .3; } 55%, 100% { opacity: 0; } }
`;

/*===== Ball =====*/
/** A tennis ball in the palette's gold, with its seam in ink. */
function Ball() {
  return (
    <svg viewBox="0 0 20 20" className="st-ball-spin size-full">
      <circle cx="10" cy="10" r="9" className="fill-primary stroke-foreground" strokeWidth={1.4} />
      <path
        d="M3.5 4.5C7 7 7 13 3.5 15.5M16.5 4.5C13 7 13 13 16.5 15.5"
        fill="none"
        strokeWidth={1.3}
        className="stroke-background"
      />
    </svg>
  );
}

/*===== Chalk Ground =====*/
// The lane's ground is drawn in chalk, like the bubbles, rather than the hero's photo-style path, so the two strips
// don't read as one tile repeated. It's two patterns of different widths (the line with its tufts, then the pebbles
// and scuffs under it), so their repeats drift apart instead of stamping one tile across the screen. The line sits
// 20px from the svg's top, where the dog's feet land (the svg is lifted 8px at md, as he is). A small displacement
// filter roughens every stroke into chalk; the ends fade out instead of stopping at the screen's edge.
function ChalkGround() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-10 w-full [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] text-foreground opacity-60 md:bottom-2"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <filter id="st-chalk" x="-2%" y="-20%" width="104%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>

        {/*------ The line, with tufts of grass growing up from it ------*/}
        <pattern id="st-chalk-line" width="260" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20C30 20 50 18 90 19.5S150 22 190 20.5S240 20 260 20" strokeWidth={2.4} />
          <path d="M6 22.5h22M44 21.5h30M112 22h14M150 23h34M210 22h20" strokeWidth={1.2} opacity={0.45} />
          <path d="M26 19l-4-7M30 19l1-10M34 19l4-6" strokeWidth={1.6} />
          <path d="M141 20l-2-5M144 20l2-6" strokeWidth={1.4} />
          <path d="M214 20l-3-6M218 20v-8M222 20l3-5" strokeWidth={1.5} />
        </pattern>

        {/*------ Pebbles and scuffs on the path below it ------*/}
        <pattern id="st-chalk-path" width="370" height="40" patternUnits="userSpaceOnUse">
          <ellipse cx="62" cy="28" rx="3.5" ry="2" strokeWidth={1.4} />
          <ellipse cx="70" cy="31" rx="1.6" ry="1.2" strokeWidth={1.2} />
          <ellipse cx="205" cy="30" rx="2.6" ry="1.8" strokeWidth={1.3} />
          <ellipse cx="318" cy="27" rx="1.8" ry="1.3" strokeWidth={1.2} />
          <path d="M14 31h9M120 34h14M168 27h6M250 33h11M340 31h8" strokeWidth={1.3} opacity={0.6} />
        </pattern>
      </defs>
      <g filter="url(#st-chalk)">
        <rect width="100%" height="100%" fill="url(#st-chalk-line)" stroke="none" />
        <rect width="100%" height="100%" fill="url(#st-chalk-path)" stroke="none" />
      </g>
    </svg>
  );
}

/*===== Story Runner =====*/
/**
 * A chalk-drawn strip of ground between the steps and «چی می‌تونم یاد بگیرم؟» where Fandogh gallops across after his ball, kicking up
 * dust and leaving paw prints. Decorative, so it's hidden from screen readers. With reduced motion he just stands on
 * the path with the ball by his nose.
 */
export function StoryRunner() {
  return (
    <div aria-hidden className="st-lane pointer-events-none relative h-28 overflow-x-clip md:h-40">
      <style>{RUNNER_CSS}</style>
      <ChalkGround />

      {/*------ Paw prints, laid where he passes ------*/}
      {Array.from({ length: PRINTS }, (_, index) => {
        // Spread across the lane; `--at` is how far into the run (0 = right edge) he reaches this print.
        const at = (index + 0.5) / PRINTS;
        return (
          <PawPrint
            key={at}
            style={{ "--at": at, left: `${(1 - at) * 100}%` } as React.CSSProperties}
            className={`st-print absolute bottom-3 size-3.5 -rotate-90 text-foreground opacity-0 md:bottom-4 md:size-4 ${index % 2 ? "translate-y-1.5" : ""}`}
          />
        );
      })}

      {/*------ The runner: everything that travels with him ------*/}
      <div className="st-run absolute inset-x-0 bottom-0 h-full">
        <div className="absolute bottom-5 left-[30%] w-(--dog-w) md:bottom-7">
          {/* The ball bounces ahead of his nose, on its own ground line. */}
          <div className="absolute right-[calc(100%+0.75rem)] bottom-0 size-4 md:size-5">
            <div className="st-ball size-full">
              <Ball />
            </div>
          </div>

          {/* Speed lines and dust behind him (to his right, as he runs left). */}
          <svg
            viewBox="0 0 30 24"
            fill="none"
            strokeLinecap="round"
            strokeWidth={2}
            className="st-lines absolute top-[30%] left-[calc(100%+0.25rem)] w-6 stroke-foreground opacity-60 md:w-8"
          >
            <path d="M2 4h20M8 12h20M4 20h16" />
          </svg>
          <span className="st-puff absolute bottom-0 left-[80%] size-4 rounded-full bg-foreground/25" />
          <span className="st-puff absolute bottom-1 left-[70%] size-3 rounded-full bg-foreground/20 [animation-delay:-.19s]" />

          <div className="st-gallop">
            <MascotCut name="teach-work" className="w-full -scale-x-100" />
          </div>

          <div className="st-shout absolute bottom-[calc(100%+0.5rem)] left-[-1rem]">
            <ChalkBubble tail="left" className="text-sm whitespace-nowrap md:text-base">
              وایسا توپ!
            </ChalkBubble>
          </div>
        </div>
      </div>
    </div>
  );
}
