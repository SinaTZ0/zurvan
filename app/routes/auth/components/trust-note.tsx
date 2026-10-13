import { ShieldCheckIcon } from "lucide-react";

/*===== Trust Note =====*/
/** Privacy reassurance under the sign-in form: a hairline-topped line with a small gold shield, no box. */
export function TrustNote() {
  return (
    <aside className="flex items-start gap-3 border-t border-border pt-5">
      <ShieldCheckIcon className="mt-1 size-5 shrink-0 text-primary" strokeWidth={1.7} aria-hidden />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">شماره‌ات پیش ما می‌ماند.</p>
        <p className="text-xs text-pretty text-muted-foreground">
          فقط برای ورود و پیامک‌های آموزش سگت از آن استفاده می‌کنیم و به هیچ‌کس نمی‌دهیم.
        </p>
      </div>
    </aside>
  );
}
