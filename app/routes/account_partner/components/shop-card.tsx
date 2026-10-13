import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "~/components/brand-logo";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { CopyLinkButton } from "~/routes/account_partner/components/copy-link-button";
import type { ReferralQr } from "~/routes/account_partner/qr.server";
import { downloadQrPng } from "~/routes/account_partner/qr-png";

/*===== Caption =====*/
// The card's only line: it is for the partner's customers, so it carries the site's main action, not his name.
const CARD_CAPTION = "اسکن کن و با ارزیابی رایگان شروع کن";

/*===== Shop Card =====*/
/**
 * The printed card the partner lays on his counter: an ivory tile with the QR on pure white, since a dark code on a
 * black page would not scan. Beside it, the link to paste anywhere and a PNG to print.
 */
export function ShopCard({ link, qr }: { link: string; qr: ReferralQr }) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleDownload() {
    setIsSaving(true);
    try {
      await downloadQrPng({ path: qr.path, size: qr.size, caption: CARD_CAPTION, fileName: "k9-qr.png" });
    } catch {
      toast.add({ title: "دانلود نشد؛ دوباره امتحان کن.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section aria-labelledby="partner-shop-title" className="flex flex-col gap-6">
      <h2 id="partner-shop-title" className="font-display text-2xl font-black">
        لینک و QR تو
      </h2>

      {/*===== Tile =====*/}
      <div className="mx-auto flex w-full max-w-[18rem] flex-col items-center gap-5 rounded-2xl bg-foreground p-6 text-background ring-1 ring-background/15 ring-inset">
        <BrandLogo className="text-[1.25rem]" />
        <div className="w-full rounded-xl bg-white p-3">
          <svg aria-hidden viewBox={`0 0 ${qr.size} ${qr.size}`} className="block h-auto w-full">
            <path fill="#000" d={qr.path} />
          </svg>
        </div>
        <p className="text-center font-bold text-balance">{CARD_CAPTION}</p>
      </div>

      {/*===== Link And Actions =====*/}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card py-2 ps-4 pe-2">
          {/* The link is Latin: `ltr` keeps its slashes and dots in order, and the button stays outside it. */}
          <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-sm text-muted-foreground tabular-nums">
            {link}
          </span>
          <CopyLinkButton link={link} />
        </div>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={handleDownload} disabled={isSaving}>
          <DownloadIcon aria-hidden />
          دانلود QR
        </Button>
        <p className="text-sm text-muted-foreground">این کارت را کنار صندوق بگذار.</p>
      </div>
    </section>
  );
}
