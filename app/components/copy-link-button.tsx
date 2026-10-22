import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { m } from "~/paraglide/messages";

/*===== Copy Link Button =====*/
/** How long «کپی شد» ("Copied") stays before the label goes back. */
const COPIED_MS = 2000;

/**
 * Copies a link (the partner's referral link, a dog's record) to the clipboard. The label flips to «کپی شد» for a moment and a toast says it too, since
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
      toast.add({ title: m.shared_copy_link_toast(), type: "success" });
    } catch {
      toast.add({ title: m.shared_copy_link_failed(), type: "error" });
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
      {copied ? m.shared_copy_link_done() : m.shared_copy_link()}
    </Button>
  );
}
