import { cn } from "cn";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";

/*===== Copy Button =====*/
/**
 * Copies `text` to the clipboard and says so for two seconds: the icon turns into a check that pops in, the words say
 * «کپی شد», then both turn back. The Admin pastes a Sheba into his bank app, so the button is the whole point of
 * showing it; if the browser refuses (no secure context), a toast says to select it by hand.
 *
 * Ink, never gold: on the pay slip the one gold button per line is «پرداخت شد».
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
  // Only a press answers: the first render's icon never pops.
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setPressed(true);
      setCopied(true);
    } catch {
      toast.add({ title: "کپی نشد؛ خودت انتخابش کن.", type: "error" });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-copied={copied || undefined}
      className={cn(
        "border-foreground/15 bg-transparent transition-colors dark:bg-transparent",
        copied && "border-success/50 text-success",
        className,
      )}
      onClick={() => void copy()}
    >
      {/* Keyed by the state, so each change remounts the icon and replays its pop. */}
      <span
        key={copied ? "check" : "copy"}
        className={cn("inline-flex", pressed && "answer-pop [--pop-origin:50%_50%]")}
      >
        {copied ? (
          <CheckIcon aria-hidden strokeWidth={2} className="size-4" />
        ) : (
          <CopyIcon aria-hidden strokeWidth={1.7} className="size-4" />
        )}
      </span>
      <span aria-live="polite">{copied ? "کپی شد" : label}</span>
    </Button>
  );
}
