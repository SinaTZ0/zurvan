import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "~/components/brand-logo";
import { CopyLinkButton } from "~/components/copy-link-button";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { downloadQrPng } from "~/lib/qr-png";
import type { Qr } from "~/lib/qr.server";

/*===== Dog File Card =====*/
/**
 * The dog's file (docs/app-spec.md, F14): its number, the QR code that opens its record, the link to paste, and a PNG to
 * print for the collar or the certificate. The code sits on pure white, since a dark code on a dark page would not scan.
 *
 * `note` says what a stranger who scans it sees; the caller words it, because that depends on whether the record can be
 * made public at all.
 */
export function DogFileCard({
  dogName,
  fileNumber,
  link,
  qr,
  note,
}: {
  dogName: string;
  fileNumber: string;
  link: string;
  qr: Qr;
  note: string;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleDownload() {
    setIsSaving(true);
    try {
      await downloadQrPng({
        path: qr.path,
        size: qr.size,
        caption: `${dogName} · ${fileNumber}`,
        fileName: `${fileNumber}.png`,
      });
    } catch {
      toast.add({ title: "دانلود نشد؛ دوباره امتحان کن.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="dog-file-title"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5"
    >
      <div>
        <h2 id="dog-file-title" className="text-lg font-extrabold">
          پرونده‌ی {dogName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">شماره‌ی پرونده</p>
        {/* Latin letters and digits read left to right. */}
        <p dir="ltr" className="mt-1 w-fit text-start font-mono text-xl font-bold tracking-wider tabular-nums">
          {fileNumber}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-[14rem] flex-col items-center gap-3 rounded-xl bg-foreground p-4 text-background">
        <BrandLogo className="text-[1.125rem]" />
        <div className="w-full rounded-lg bg-white p-2.5">
          <svg aria-hidden viewBox={`0 0 ${qr.size} ${qr.size}`} className="block h-auto w-full">
            <path fill="#000" d={qr.path} />
          </svg>
        </div>
      </div>

      <p className="text-sm text-pretty text-muted-foreground">{note}</p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background py-2 ps-4 pe-2">
          <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-sm text-muted-foreground tabular-nums">
            {link}
          </span>
          <CopyLinkButton link={link} />
        </div>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={handleDownload} disabled={isSaving}>
          <DownloadIcon aria-hidden />
          دانلود QR برای چاپ
        </Button>
      </div>
    </section>
  );
}
