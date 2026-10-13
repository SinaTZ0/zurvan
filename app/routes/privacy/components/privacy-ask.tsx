import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Privacy Ask =====*/
/**
 * The page's closing ask, copied from the catalogue's pattern: a raised card with no dog. The main action is the free
 * evaluation; the quieter one goes to the help page, where most of the questions are answered.
 */
export function PrivacyAsk() {
  return (
    <section
      aria-labelledby="privacy-ask-title"
      className="rounded-4xl border border-border bg-card px-6 py-10 shadow-sm sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-12"
    >
      <div className="max-w-xl">
        <h2 id="privacy-ask-title" className="font-display text-h2 font-black text-balance">
          سؤال دیگه‌ای داری؟
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">جواب خیلی از سؤال‌ها توی «سؤال‌های پرتکرار» هست.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
        <Link
          to="/assessment"
          className={buttonVariants({ variant: "solid", size: "lg", className: "w-full sm:w-auto" })}
        >
          ارزیابی رایگان بگیر
        </Link>
        <Link to="/help" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
          سؤال‌های پرتکرار
        </Link>
      </div>
    </section>
  );
}
