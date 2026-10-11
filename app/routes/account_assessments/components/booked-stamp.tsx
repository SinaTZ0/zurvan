/*===== Booked Stamp =====*/
/**
 * The page's one moment: a round gold-leaf «رزرو شد» that lands on the card of the assessment just booked.
 *
 * The resting tilt is a plain `transform` (not Tailwind's `rotate`, which composes with it), so that the animation's
 * last frame and the reduced-motion state, where the stamp is simply there, show the same tilt.
 */
export function BookedStamp() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -end-3 -top-5 flex size-24 [transform:rotate(-9deg)] items-center justify-center rounded-full gold-leaf text-[#4a320c] shadow-md motion-safe:animate-slip-stamp sm:-end-5 sm:size-28"
    >
      <div className="flex size-[88%] items-center justify-center rounded-full border-2 border-[#4a320c]/55">
        <span className="text-center text-lg leading-tight font-black sm:text-xl">
          رزرو
          <br />
          شد
        </span>
      </div>
    </div>
  );
}
