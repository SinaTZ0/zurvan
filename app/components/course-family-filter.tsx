import { cn } from "cn";

import type { CourseFamily } from "~/orpc/course/constants";

/*===== Course Family Filter =====*/
/** A row of pills, «همه» first, that filters the courses by family. The caller sets the spacing through `className`. */
export function CourseFamilyFilter({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { family: CourseFamily; label: string }[];
  value: CourseFamily | "all";
  onChange: (family: CourseFamily | "all") => void;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex min-w-0 [scrollbar-width:none] gap-2 overflow-x-auto pb-1", className)}>
      <legend className="sr-only">نوع دوره</legend>
      {[{ family: "all" as const, label: "همه" }, ...tabs].map((tab) => (
        <button
          key={tab.family}
          type="button"
          aria-pressed={value === tab.family}
          onClick={() => onChange(tab.family)}
          className={cn(
            "h-10 shrink-0 rounded-full border px-5 text-sm font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === tab.family
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </fieldset>
  );
}
