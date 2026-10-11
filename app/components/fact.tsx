import type { LucideIcon } from "lucide-react";

/*===== Fact =====*/
/** An icon, a label and a value as one `<dt>`/`<dd>` pair. Must be used inside a `<dl>`. */
export function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden strokeWidth={1.7} className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-bold">{children}</dd>
      </div>
    </div>
  );
}
