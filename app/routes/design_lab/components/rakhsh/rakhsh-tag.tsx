/*===== Dog Tag =====*/
/**
 * The memorable element: Rakhsh's file as a stamped metal tag hanging from an olive strap. It swings in once on load
 * (the page's single orchestrated moment) and stays still afterwards. Details are only facts about the dog's role;
 * no invented numbers.
 */
export function RakhshTag() {
  return (
    <>
      <style>{`
        @keyframes rk-swing {
          0% { transform: rotate(-9deg) translateY(-14px); opacity: 0; }
          55% { transform: rotate(5deg); opacity: 1; }
          80% { transform: rotate(-2deg); }
          100% { transform: rotate(-3deg); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .rk-tag { animation: rk-swing 1.4s cubic-bezier(.2,.7,.2,1) 0.3s both; transform-origin: 50% 0; }
        }
        .rk-tag { transform: rotate(-3deg); }
      `}</style>
      <aside
        aria-label="پرونده رخش"
        className="rk-tag relative z-10 mx-auto -mt-6 w-[17.5rem] sm:absolute sm:start-auto sm:end-[-2.5rem] sm:bottom-[-3rem] sm:mt-0 sm:w-[20rem] lg:end-[-3rem]"
      >
        {/*------ Strap ------*/}
        <div
          aria-hidden
          className="mx-auto h-8 w-5 bg-[var(--rk-mask)] shadow-[inset_0_0_0_2px_var(--rk-olive-deep)]"
        />
        {/*------ Plate ------*/}
        <div className="relative rounded-[1.4rem] bg-[linear-gradient(145deg,#EFE4CB_0%,#D9C7A3_45%,#BFAE88_100%)] p-5 text-[var(--rk-ink)] shadow-[0_24px_40px_-12px_rgba(0,0,0,0.75),inset_0_0_0_3px_rgba(255,255,255,0.35),inset_0_0_0_5px_rgba(47,58,42,0.35)]">
          <span
            aria-hidden
            className="absolute top-3 left-1/2 size-4 -translate-x-1/2 rounded-full bg-[var(--rk-olive)] shadow-[inset_0_2px_3px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.5)]"
          />
          <div className="mt-5 flex items-baseline justify-between border-b-2 border-dashed border-[var(--rk-ink)]/40 pb-2">
            <span className="font-display text-sm font-black tracking-wide">پرونده ۰۰۱</span>
            <span className="text-[11px] text-[var(--rk-ink)]/70">مرکز زروان</span>
          </div>
          <p className="mt-3 font-display text-6xl leading-none font-black [text-shadow:0_1px_0_rgba(255,255,255,0.55),0_-1px_0_rgba(0,0,0,0.25)]">
            رخش
          </p>
          <p className="mt-1 font-display text-lg font-black text-[var(--rk-olive)]">مالینویز بلژیکی</p>
          <dl className="mt-3 space-y-1 text-[13px] leading-6">
            <div className="flex gap-2">
              <dt className="font-bold">نقش:</dt>
              <dd>سگ کاریِ مرکز</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold">خصلت:</dt>
              <dd>سریع، وفادار، کمی مغرور</dd>
            </div>
          </dl>
          <p className="mt-3 border-t-2 border-dashed border-[var(--rk-ink)]/40 pt-2 text-[13px] leading-6 font-medium">
            «اسمم را از اسب رستم گرفته‌اند؛ تندم، و هر که را بپذیرم تا آخر کنارش می‌مانم.»
          </p>
        </div>
      </aside>
    </>
  );
}
