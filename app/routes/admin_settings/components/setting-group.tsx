import { useId } from "react";

/*===== Setting Group =====*/
/**
 * A titled group of setting cards. Wide screens put the group's name at the start and its cards at the end, like a
 * settings screen; phones stack the name above its cards. Not `lg`: beside the Admin rail the content is only about
 * 740px wide at 1024, too narrow for two columns.
 */
export function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="grid gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] xl:gap-8">
      <h2 id={titleId} className="text-lg font-extrabold">
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
