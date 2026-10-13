import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";

/*===== Copy Link Button =====*/
/** How long «کپی شد» stays before the label goes back. */
const COPIED_MS = 2000;

/**
 * Copies the referral link to the clipboard. The label flips to «کپی شد» for a moment and a toast says it too, since
 * the flip is easy to miss on a phone. A refused clipboard (no permission, an insecure origin) is said plainly so the
 * partner can select the link by hand.
 */
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  // The timer is cleared when the label goes back or the page changes, so a late timeout can't reset a newer copy.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.add({ title: "لینک کپی شد.", type: "success" });
    } catch {
      toast.add({ title: "کپی نشد؛ لینک را دستی انتخاب کن.", type: "error" });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopy}
      className="h-11 shrink-0 border-primary text-primary hover:text-primary"
    >
      {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
      {copied ? "کپی شد" : "کپی لینک"}
    </Button>
  );
}
