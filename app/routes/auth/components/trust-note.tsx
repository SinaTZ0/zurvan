import { ShieldCheckIcon } from "lucide-react";

/*===== Trust Note =====*/
/** Privacy reassurance under the auth forms (app-identity "mint note" pattern). */
export function TrustNote() {
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-mint-border bg-mint p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card text-success">
        <ShieldCheckIcon className="size-5" strokeWidth={1.7} aria-hidden />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-bold">اطلاعات شما امن و محرمانه است.</p>
        <p className="text-xs text-muted-foreground">
          رمز عبور شما رمزنگاری‌شده ذخیره می‌شود و هیچ‌کس، حتی ما، آن را نمی‌بیند.
        </p>
      </div>
    </aside>
  );
}
