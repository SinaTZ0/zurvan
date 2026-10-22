import { AwardIcon } from "lucide-react";

import { Link } from "~/components/link";
import { formatTimestamp } from "~/lib/locale-format";
import type { PublicRecord } from "~/orpc/logbook/contract";
import { m } from "~/paraglide/messages";

/*===== Certificate Rows =====*/
/**
 * «گواهی‌ها»: one grained row per valid certificate, the whole row a link to its check page (`/certificate/<number>`),
 * the number in gold mono (LTR inside the RTL page). The row lifts a little on hover and on keyboard focus. Rows rise
 * in as they scroll into view, a little later each. Only rendered when there is a certificate.
 */
export function CertificateRows({ certificates }: { certificates: PublicRecord["certificates"] }) {
  return (
    <section aria-labelledby="record-certificates-title" className="pt-section-sm">
      <h2 id="record-certificates-title" className="font-display text-h2 font-extrabold tracking-tight text-balance">
        {m.logbook_certs_title()}
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
        {certificates.map((entry, index) => (
          <li key={entry.number} className={`lively-reveal lb-card-${(index % 3) + 1}`}>
            <Link
              to="/certificate/$number"
              params={{ number: entry.number }}
              className="lb-row flex items-center gap-4 rounded-3xl border border-border bg-card paper-grain p-5 shadow-[0_14px_30px_-18px_rgb(0_0_0/0.9)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-primary/50 text-primary"
              >
                <AwardIcon strokeWidth={1.8} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold text-pretty">{entry.courseTitle}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {m.logbook_certs_issued({ date: formatTimestamp(entry.issuedAt) })}
                </span>
                <span
                  dir="ltr"
                  className="mt-1 block text-start font-mono text-sm font-bold tracking-wider text-primary"
                >
                  {entry.number}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
