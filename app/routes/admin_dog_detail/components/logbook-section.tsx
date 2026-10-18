import { LogbookEntryCard } from "~/components/logbook-entry-card";
import { Button } from "~/components/ui/button";
import type { LogbookEntry } from "~/orpc/logbook/contract";
import { DetailSection } from "~/routes/admin_dog_detail/components/detail-section";

/*===== Logbook Section =====*/
/**
 * The dog's diary (F14), newest session first, with «ثبت جلسه» to write one and «ویرایش» to correct one. Nothing here is
 * ever deleted, so a correction is an edit.
 */
export function LogbookSection({
  entries,
  onAdd,
  onEdit,
}: {
  entries: LogbookEntry[];
  onAdd: () => void;
  onEdit: (entry: LogbookEntry) => void;
}) {
  return (
    <DetailSection
      id="logbook"
      title="دفترچه‌ی تمرین"
      action={
        <Button type="button" size="sm" onClick={onAdd}>
          ثبت جلسه
        </Button>
      }
    >
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          هنوز جلسه‌ای ثبت نشده
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <LogbookEntryCard
              key={entry.id}
              entry={entry}
              action={
                <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(entry)}>
                  ویرایش
                </Button>
              }
            />
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
