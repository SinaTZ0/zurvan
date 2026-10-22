import { cn } from "cn";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { m } from "~/paraglide/messages";

/*===== Copy Link =====*/
/** How long «Copied» stays before the label goes back. */
const COPIED_MS = 2000;

/**
 * A link to paste (a certificate's, the dog's file) on a well, with its copy button. The shared `CopyLinkButton`
 * swaps its icon at once; here the copy icon turns into a check and back (both icons sit in one grid cell), which is
 * this page's answer to the press. A toast says it too, since the flip is easy to miss on a phone, and a refused
 * clipboard is said plainly so the link can be selected by hand.
 */
export function CopyLink({ link, className }: { link: string; className?: string }) {
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

  const icon = "transition duration-300 ease-out motion-reduce:transition-none";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-background py-1.5 ps-4 pe-1.5",
        className,
      )}
    >
      {/* Latin, left to right. */}
      <span dir="ltr" className="min-w-0 flex-1 truncate text-start text-sm text-muted-foreground tabular-nums">
        {link}
      </span>
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="h-10 shrink-0 border-primary/70 text-primary hover:text-primary"
      >
        <span aria-hidden className="grid *:col-start-1 *:row-start-1">
          <CopyIcon className={cn(icon, copied && "scale-50 rotate-90 opacity-0")} />
          <CheckIcon className={cn(icon, !copied && "scale-50 -rotate-90 opacity-0")} />
        </span>
        {copied ? m.shared_copy_link_done() : m.shared_copy_link()}
      </Button>
    </div>
  );
}
