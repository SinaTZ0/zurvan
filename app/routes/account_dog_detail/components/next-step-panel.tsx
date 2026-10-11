import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { Dog } from "~/orpc/dog/contract";

/*===== Next Step Panel =====*/
/**
 * What to do with this dog now, in one sentence from the trainer and one button. A dog without a record starts with the
 * free assessment; one with a record books its next course directly (the courses list, until booking exists).
 */
export function NextStepPanel({ dog }: { dog: Dog }) {
  return (
    <section
      aria-labelledby="next-step-title"
      className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-sm ring-1 ring-border lg:p-6"
    >
      <h2 id="next-step-title" className="text-sm font-bold text-muted-foreground">
        قدم بعدی
      </h2>

      {/* The dog's name is the subject; the trainer is "I" because the sentence is his. */}
      <p className="max-w-lg text-lg leading-relaxed text-pretty">
        {dog.hasRecord
          ? `${dog.name} پرونده دارد؛ می‌توانی دوره‌ی بعدی‌اش را مستقیم رزرو کنی.`
          : `${dog.name} را اول رایگان می‌بینم تا بگویم از کجا شروع کنید.`}
      </p>
      <p className="-mt-2 text-sm text-muted-foreground">— {HEAD_TRAINER.firstName}</p>

      <Link
        to={dog.hasRecord ? "/courses" : `/assessment?dog=${dog.id}`}
        className={buttonVariants({ size: "lg", className: "w-full sm:w-fit" })}
      >
        {dog.hasRecord ? "دوره‌ها را ببین" : "ارزیابی رایگان رزرو کن"}
      </Link>
    </section>
  );
}
