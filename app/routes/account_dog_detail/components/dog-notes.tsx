import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Notes =====*/
/** What the owner told the trainer about the dog's behavior and health, as quotes; an empty one invites adding. */
export function DogNotes({ dog, editPath }: { dog: Dog; editPath: string }) {
  const notes = [
    { label: "رفتار", text: dog.behaviorNotes },
    { label: "سلامت", text: dog.medicalNotes },
  ];

  return (
    <section aria-labelledby="notes-title">
      <div className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 id="notes-title" className="text-lg font-extrabold">
          برای مربی
        </h2>
        <Link to={editPath} className="rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline">
          ویرایش
        </Link>
      </div>
      <p className="mt-3 text-sm text-pretty text-muted-foreground">
        فقط {HEAD_TRAINER.firstName} و مربی سگت این‌ها را می‌بینند.
      </p>

      <div className="mt-5 flex flex-col gap-5">
        {notes.map(({ label, text }) => (
          <div key={label}>
            <h3 className="mb-2 text-sm font-bold">{label}</h3>
            {text ? (
              // The owner's own words, line breaks included.
              <p className="border-s-2 border-primary/40 ps-3 text-pretty whitespace-pre-line">{text}</p>
            ) : (
              <p className="text-muted-foreground">
                چیزی ننوشته‌ای.{" "}
                <Link to={editPath} className="rounded-sm font-bold text-primary underline-offset-4 hover:underline">
                  اضافه‌اش کن
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
