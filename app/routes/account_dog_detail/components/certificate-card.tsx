import { cn } from "cn";
import { CheckIcon } from "lucide-react";

import { MascotCut } from "~/components/mascot-cut";
import { formatTimestamp } from "~/lib/locale-format";
import type { Qr } from "~/lib/qr";
import type { Certificate } from "~/orpc/certificate/contract";
import { CopyLink } from "~/routes/account_dog_detail/components/copy-link";
import { m } from "~/paraglide/messages";

/*===== Certificate Card =====*/
/**
 * One certificate on the owner's page (it was the shared `CertificateCard`; this page was its only reader): the course,
 * the day it was issued, its number in gold, its state, and the link and QR code that let anyone check it. The code
 * sits on an ivory tile, since a dark code on a dark page would not scan. A revoked one says so and drops the link and
 * the code: there is nothing left to show a stranger.
 *
 * The card is the certificate check page's result card in small: a thin gold frame set in from its edge, and the seal
 * (the rosette with a drawn check) stamped over its top end corner, away from the QR at the start. The title row keeps
 * end padding wider than the seal. A revoked certificate's seal is greyed.
 */
export function CertificateCard({ certificate, link, qr }: { certificate: Certificate; link: string; qr: Qr }) {
  const revoked = certificate.revokedAt !== null;

  return (
    <li className="relative rounded-3xl border border-border bg-card paper-grain p-5 shadow-[0_18px_36px_-22px_rgb(0_0_0/0.95)] sm:p-6">
      {/* The frame: flat gold at low alpha, set in a few pixels. */}
      <div aria-hidden className="pointer-events-none absolute inset-1.5 rounded-[1.25rem] border border-primary/25" />

      {/*------ Seal ------*/}
      <div
        aria-hidden
        className="pointer-events-none absolute end-3 -top-6 z-10 size-[4.5rem] rotate-[-9deg] sm:end-5 sm:-top-7 sm:size-[5.25rem]"
      >
        <div className={cn("relative size-full", revoked && "opacity-70 grayscale")}>
          <MascotCut name="seal-disc" className="block size-full drop-shadow-[0_6px_10px_rgb(0_0_0/0.55)]" />
          <CheckIcon
            strokeWidth={3.2}
            className="absolute inset-[27%] size-[46%] text-[#8a5f00] drop-shadow-[0_1px_0_rgb(255_240_190/0.7)]"
          />
        </div>
      </div>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
        {/*------ QR ------*/}
        {!revoked && (
          <div className="w-28 shrink-0 self-center rounded-xl bg-foreground p-2 sm:self-start">
            <svg aria-hidden viewBox={`0 0 ${qr.size} ${qr.size}`} className="block h-auto w-full">
              <path fill="#000" d={qr.path} />
            </svg>
          </div>
        )}

        {/*------ Facts ------*/}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pe-16 sm:pe-20">
            <h3 className="font-display text-lg font-extrabold text-pretty">{certificate.course.title}</h3>
            {revoked ? (
              <span className="rounded-full bg-destructive/15 px-3 py-0.5 text-xs font-bold text-destructive">
                {m.account_dog_detail_certificate_revoked()}
              </span>
            ) : (
              <span className="rounded-full border border-success/40 bg-success/10 px-3 py-0.5 text-xs font-bold text-success">
                {m.account_dog_detail_certificate_valid()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {m.account_dog_detail_certificate_issued({ date: formatTimestamp(certificate.issuedAt) })}
          </p>
          <p dir="ltr" className="w-fit text-start font-mono font-bold tracking-wider text-primary">
            {certificate.number}
          </p>
          {!revoked && <CopyLink link={link} className="mt-2" />}
        </div>
      </div>
    </li>
  );
}
