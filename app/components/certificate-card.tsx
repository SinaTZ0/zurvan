import { CopyLinkButton } from "~/components/copy-link-button";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Qr } from "~/lib/qr.server";
import type { Certificate } from "~/orpc/certificate/contract";

/*===== Certificate Card =====*/
/**
 * One certificate on the owner's page: the course, the day it was issued, its number, and the link and QR code that
 * verify it. The code sits on white, since a dark code on a dark page would not scan. A revoked one says so and drops the
 * link and the code: there is nothing left to show a stranger.
 */
export function CertificateCard({ certificate, link, qr }: { certificate: Certificate; link: string; qr: Qr }) {
  const revoked = certificate.revokedAt !== null;

  return (
    <li className="flex flex-col gap-4 rounded-3xl border bg-card p-5 sm:flex-row sm:items-center">
      {!revoked && (
        <div className="w-28 shrink-0 self-center rounded-xl bg-white p-2 sm:self-start">
          <svg aria-hidden viewBox={`0 0 ${qr.size} ${qr.size}`} className="block h-auto w-full">
            <path fill="#000" d={qr.path} />
          </svg>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-sans font-bold text-pretty">{certificate.course.title}</h3>
          {revoked ? (
            <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
              باطل شده
            </span>
          ) : (
            <span className="rounded-full border border-primary/50 px-3 py-1 text-xs font-bold text-primary">
              معتبر
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">صادرشده در {formatJalaliTimestamp(certificate.issuedAt)}</p>
        <p dir="ltr" className="w-fit text-start font-mono text-sm font-bold tracking-wider">
          {certificate.number}
        </p>
        {!revoked && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background py-2 ps-4 pe-2">
            <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-sm text-muted-foreground tabular-nums">
              {link}
            </span>
            <CopyLinkButton link={link} />
          </div>
        )}
      </div>
    </li>
  );
}
