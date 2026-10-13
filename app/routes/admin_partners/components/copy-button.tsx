import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";

/*===== Copy Button =====*/
/**
 * Copies `text` to the clipboard and says so for two seconds. The Admin pastes a Sheba into his bank app, so the
 * button is the whole point of showing it; if the browser refuses (no secure context), a toast says to select it by hand.
 */
export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  /** What the button says at rest, e.g. «کپی شبا». */
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      toast.add({ title: "کپی نشد؛ خودت انتخابش کن.", type: "error" });
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={() => void copy()}>
      {copied ? <CheckIcon aria-hidden strokeWidth={1.7} /> : <CopyIcon aria-hidden strokeWidth={1.7} />}
      <span aria-live="polite">{copied ? "کپی شد" : label}</span>
    </Button>
  );
}
