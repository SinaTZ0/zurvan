import { cn } from "cn";

import { GroundStrip } from "~/components/ground-strip";
import { NightSky } from "~/components/night-sky";

/*===== Record Stage =====*/
/**
 * The picture beside (on phones, above) the words of every state of this page: night sky, a pool of warm light, a path
 * to stand on, and whatever the state puts on it (`children`, placed by the state with physical sides, since the pieces
 * are tied to the pictures and the dogs look to the right, towards the words).
 *
 * The box sets two sizes the pieces read: `--dog-h`, the height of the stage's dog, and `--ground`, how high the path
 * lifts the pieces off the box's bottom edge, so a bubble can sit just above his head whatever the screen is. On phones
 * the box is a band of 14.5rem on top, so the h1 below it stays on the first screen; from `lg` it is as tall as the
 * words beside it (at least 30rem) and the pieces stand at its bottom, so a taller column only adds sky.
 */
export function RecordStage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative order-1 h-[14.5rem] [--dog-h:7.75rem] [--ground:0.9rem] lg:order-2 lg:h-auto lg:min-h-[30rem] lg:[--dog-h:20.5rem] lg:[--ground:1.2rem]",
        className,
      )}
    >
      {/* A pool of warm light where he stands. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_46%_55%_at_54%_70%,rgb(255_194_26/0.08),transparent)]"
      />

      {/*------ Sky ------*/}
      <NightSky className="inset-x-[5%] top-1 h-24 lg:top-3 lg:h-36" />

      {/*------ Path ------*/}
      <GroundStrip className="absolute inset-x-0 bottom-0 h-7 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] lg:h-9" />

      {children}
    </div>
  );
}
