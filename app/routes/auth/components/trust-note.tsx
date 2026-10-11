import { ShieldCheckIcon } from "lucide-react";

/*===== Trust Note =====*/
/** Privacy reassurance under the sign-in form (a success-tinted note). */
export function TrustNote() {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-success">
        <ShieldCheckIcon className="size-5" strokeWidth={1.7} aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">شماره‌ات پیش ما می‌ماند.</p>
        <p className="text-xs text-muted-foreground">
          فقط برای ورود و پیامک‌های آموزش سگت از آن استفاده می‌کنیم و به هیچ‌کس نمی‌دهیم.
        </p>
      </div>
    </aside>
  );
}
