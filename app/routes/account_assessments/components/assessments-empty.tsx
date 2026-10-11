import { DoodleWalk } from "~/components/doodles";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Assessments Empty =====*/
/** No assessment ever: one panel that offers the first one, with the page's gold-leaf button. */
export function AssessmentsEmpty() {
  return (
    <section
      aria-labelledby="assessments-empty-title"
      className="flex flex-col items-center rounded-3xl bg-sunken px-6 py-12 text-center lg:py-16"
    >
      <DoodleWalk className="h-24 w-auto" />

      <h2 id="assessments-empty-title" className="mt-6 text-xl font-extrabold text-balance">
        هنوز ارزیابی‌ای رزرو نکرده‌ای
      </h2>
      <p className="mt-2 max-w-md text-balance text-muted-foreground">
        {HEAD_TRAINER.firstName} هر سگ را اول رایگان می‌بیند.
      </p>

      <Link to="/assessment" className={buttonVariants({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
        ارزیابی رایگان رزرو کن
      </Link>
    </section>
  );
}
