import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatJalaliMonthYear } from "~/lib/jalali";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Record =====*/
/**
 * The dog's record (پرونده) as a vertical timeline, newest first. Today it has one kind of entry, «known since»; the
 * assessment, enrollment and test entries join it as those entities arrive (docs/customer-area-design.md).
 */
export function DogRecord({ dog }: { dog: Dog }) {
  const entries: { key: string; title: string; note: string }[] = [];
  if (dog.knownSince) {
    entries.push({
      key: "known-since",
      title: `${HEAD_TRAINER.firstName} ${dog.name} را از ${formatJalaliMonthYear(dog.knownSince)} می‌شناسد`,
      note: "این آشنایی از قبل از این سایت است.",
    });
  }

  return (
    <section aria-labelledby="record-title">
      <h2 id="record-title" className="border-b pb-3 text-lg font-extrabold">
        پرونده
      </h2>

      {entries.length === 0 ? (
        <p className="mt-4 text-pretty text-muted-foreground">پرونده‌ی {dog.name} بعد از ارزیابی رایگان باز می‌شود.</p>
      ) : (
        // The line is the list's own start border; each dot straddles it.
        <ol className="ms-1.5 mt-5 border-s">
          {entries.map((entry) => (
            <li key={entry.key} className="relative ps-6 pb-2">
              {/*------ Dot ------*/}
              <span
                aria-hidden
                className="absolute -start-[calc(0.375rem+0.5px)] top-2 size-3 rounded-full bg-primary"
              />
              <p className="font-bold text-pretty">{entry.title}</p>
              <p className="mt-1 text-sm text-pretty text-muted-foreground">{entry.note}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
