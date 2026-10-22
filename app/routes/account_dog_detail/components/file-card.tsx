import { cn } from "cn";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "~/components/brand-logo";
import { ChalkBubble } from "~/components/chalk-bubble";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { downloadQrPng } from "~/lib/qr-png";
import type { Qr } from "~/lib/qr";
import { CopyLink } from "~/routes/account_dog_detail/components/copy-link";
import { EdgeDog } from "~/routes/account_dog_detail/components/edge-dog";
import { SectionHead } from "~/routes/account_dog_detail/components/section-head";
import { PLATE } from "~/routes/account_dog_detail/plate";
import { m } from "~/paraglide/messages";

/*===== File Card =====*/
/**
 * The dog's file (docs/app-spec.md, F14): its number, the QR code that opens its record, the link to paste, and a PNG
 * to print for the collar or the certificate. Built from the shared `DogFileCard`'s pieces (that card stays the
 * Admin's, unchanged): here the number and the note sit beside the code, so the side column stays short, and the copy
 * button is the page's own (its icon turns). The code sits on pure white inside the ivory tile, since a dark code on a
 * dark page would not scan.
 *
 * The `tag` dog sits on the plate's top edge with a paw on his collar's tag: he has one too.
 *
 * `note` says what a stranger who scans it sees; the page words it, since that depends on whether the record is public.
 */
export function FileCard({
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
      toast.add({ title: m.account_dog_detail_file_download_failed(), type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="dog-file-title">
      <SectionHead id="dog-file-title" title={m.account_dog_detail_file_title({ dogName })}>
        <EdgeDog name="tag" className="w-[4.5rem] sm:w-[5rem]">
          <ChalkBubble
            tail="left"
            className="lively-reveal-pop absolute bottom-[93%] left-[38%] max-w-[11rem] text-pretty"
          >
            {m.account_dog_detail_file_bubble()}
          </ChalkBubble>
        </EdgeDog>
      </SectionHead>

      <div className={cn(PLATE, "flex flex-col gap-5 p-5 sm:p-6")}>
        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-start gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          {/*------ Number and Note ------*/}
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{m.account_dog_detail_file_number()}</p>
            {/* Latin letters and digits read left to right. */}
            <p
              dir="ltr"
              className="mt-1 w-fit text-start font-mono text-lg font-bold tracking-wider break-all text-primary tabular-nums sm:text-xl"
            >
              {fileNumber}
            </p>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">{note}</p>
          </div>

          {/*------ QR ------*/}
          <div className="flex flex-col items-center gap-2 rounded-xl bg-foreground p-2.5 text-background shadow-[0_12px_26px_-14px_rgb(0_0_0/0.9)]">
            <BrandLogo className="text-[0.95rem]" />
            <div className="w-full rounded-lg bg-white p-1.5">
              <svg aria-hidden viewBox={`0 0 ${qr.size} ${qr.size}`} className="block h-auto w-full">
                <path fill="#000" d={qr.path} />
              </svg>
            </div>
          </div>
        </div>

        {/*------ Link and Download ------*/}
        <div className="flex flex-col gap-3">
          <CopyLink link={link} />
          <Button type="button" variant="outline" className="h-11 w-full" onClick={handleDownload} disabled={isSaving}>
            <DownloadIcon aria-hidden />
            {m.account_dog_detail_file_download()}
          </Button>
        </div>
      </div>
    </section>
  );
}
