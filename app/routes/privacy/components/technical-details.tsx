import { m } from "~/paraglide/messages";

/*===== Technical Details =====*/
// The facts the first version of this page put in plain sight and the owner found too technical (2026-10-19). They are
// still true and still disclosed, collapsed under one heading for whoever wants them. Keep each line in step with what
// the app does: the IP address and browser are the session's (`session` table), the wrong-password record is
// `sign_in_failure`, the SMS log is `sms_outbox`, the referral cookie is `zurvan_ref` (30 days, `referral.server.ts`), the
// code limits are the Admin's settings plus the rules in `auth.server.ts`.
const DETAILS = () => [
  { term: m.privacy_tech_ip_term(), text: m.privacy_tech_ip_text() },
  { term: m.privacy_tech_wrong_term(), text: m.privacy_tech_wrong_text() },
  { term: m.privacy_tech_code_term(), text: m.privacy_tech_code_text() },
  { term: m.privacy_tech_log_term(), text: m.privacy_tech_log_text() },
  { term: m.privacy_tech_cookie_term(), text: m.privacy_tech_cookie_text() },
  { term: m.privacy_tech_cart_term(), text: m.privacy_tech_cart_text() },
];

/*===== Technical Details Section =====*/
/**
 * Collapsed by default: a native `<details>`, so it works before hydration and from the keyboard, on a grained plate.
 * The plus turns into a cross, and the rows rise in when it opens (`details[open]`, so every opening replays them);
 * where the browser supports `::details-content`, the panel also grows and shrinks, so closing is a motion too.
 * All of it is off for reduced motion, which just shows or hides the list.
 */
export function TechnicalDetails() {
  return (
    <section id="technical" aria-labelledby="technical-title" className="scroll-mt-24">
      <details className="pv-details group/details rounded-3xl border border-border bg-card paper-grain shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl p-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-6 [&::-webkit-details-marker]:hidden">
          <h2 id="technical-title" className="font-display text-h3 font-black text-balance">
            {m.privacy_tech_title()}
          </h2>
          <span
            aria-hidden
            className="text-xl leading-none text-primary transition-transform group-open/details:rotate-45 motion-reduce:transition-none"
          >
            +
          </span>
        </summary>

        <dl className="divide-y divide-border border-t border-border px-5 sm:px-6">
          {DETAILS().map(({ term, text }, index) => (
            <div
              key={term}
              style={{ "--answer-delay": `${Math.min(index, 4) * 60}ms` } as React.CSSProperties}
              className="pv-row grid gap-2 py-4 lg:grid-cols-3 lg:gap-8"
            >
              <dt className="font-extrabold">{term}</dt>
              <dd className="text-pretty text-muted-foreground lg:col-span-2">{text}</dd>
            </div>
          ))}
        </dl>
      </details>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .pv-details[open] .pv-row { animation: answer-in .32s cubic-bezier(.2,.8,.2,1) var(--answer-delay, 0s) both; }
          @supports (selector(::details-content)) {
            .pv-details { interpolate-size: allow-keywords; }
            .pv-details::details-content {
              block-size: 0;
              overflow: clip;
              transition: block-size .35s cubic-bezier(.2,.8,.2,1), content-visibility .35s allow-discrete;
            }
            .pv-details[open]::details-content { block-size: auto; }
          }
        }
      `}</style>
    </section>
  );
}
