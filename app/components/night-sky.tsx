import { cn } from "cn";

/*===== Night Sky =====*/
// The course photos are all night scenes under warm lamps, so a stage's sky is night too: a chalk crescent and a few
// faint stars. Positions are shares of the sky, so a short sky packs them close and a tall one spreads them out.
const STARS = [
  { at: "top-[12%] start-[30%]", size: "size-3", tilt: "rotate-12" },
  { at: "top-[48%] start-[8%]", size: "size-2", tilt: "" },
  { at: "top-[30%] start-[58%]", size: "size-2.5", tilt: "-rotate-12" },
  { at: "top-[70%] start-[38%]", size: "size-3.5", tilt: "rotate-6" },
  { at: "top-[86%] start-[72%]", size: "size-2", tilt: "" },
  { at: "top-[60%] start-[86%]", size: "size-2.5", tilt: "rotate-45" },
] as const;

/** The sky's box is placed by `className` (it is absolute); decoration only, hidden from assistive tech. */
export function NightSky({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute text-chalk", className)}>
      {/*------ Moon ------*/}
      <svg viewBox="0 0 40 40" className="absolute end-[4%] top-0 size-10 -rotate-12 opacity-50">
        <path
          d="M27 5.5C18 6.5 12 13.5 12.5 22c.5 8 7.5 13.6 15.5 13-4.5 3-11 3.2-16-.3C5 30.5 3.4 22 7.3 15.5 10.8 9.7 18.6 4 27 5.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      {/*------ Stars ------*/}
      {STARS.map((star) => (
        <svg key={star.at} viewBox="0 0 12 12" className={cn("absolute opacity-35", star.at, star.size, star.tilt)}>
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
