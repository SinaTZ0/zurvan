import { LogbookEntryCard } from "~/components/logbook-entry-card";
import type { LogbookEntry } from "~/orpc/logbook/contract";

/*===== Logbook Section =====*/
/**
 * F14 on the dog's page: the diary the head trainer writes after each session, newest first. Read-only for the owner. It
 * is private: only the owner and the trainer see it.
 */
export function LogbookSection({ entries }: { entries: LogbookEntry[] }) {
  return (
    <section aria-labelledby="logbook-title">
      {/* «لاگ‌بوک» is the owner's word for the dog's file (2026-10-19): it is named first so it can be found by it. */}
      <h2 id="logbook-title" className="font-sans text-xl font-extrabold">
        لاگ‌بوک؛ دفترچه‌ی تمرین
      </h2>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-3xl border bg-card p-5 sm:p-6">
          <p className="font-bold">هنوز جلسه‌ای ثبت نشده</p>
          <p className="mt-1 text-sm text-pretty text-muted-foreground">
            بعد از هر جلسه، مربی همین‌جا می‌نویسه چه کار کردید و پیشرفت چطور بود.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {entries.map((entry) => (
            <LogbookEntryCard key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
