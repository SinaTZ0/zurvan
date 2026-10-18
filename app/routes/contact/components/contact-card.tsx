import type { LucideIcon } from "lucide-react";

/*===== Contact Card =====*/
/**
 * One way to reach the center: a raised card that is a single link. An `external` card (a profile on another site)
 * opens in a new tab; a `tel:` card does not.
 */
export function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex h-full flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors outline-none hover:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="grid size-11 place-items-center rounded-full border border-primary/60 text-primary">
        <Icon aria-hidden strokeWidth={1.5} className="size-5" />
      </span>
      <span>
        <span className="block font-extrabold">{label}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{value}</span>
      </span>
    </a>
  );
}
