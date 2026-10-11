import { DoodleWalk } from "~/components/doodles";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Training Empty =====*/
/** No course or test yet: points to the dogs, where each dog's next step lives (the free assessment or a course). */
export function TrainingEmpty() {
  return (
    <section
      aria-labelledby="training-empty-title"
      className="flex flex-col items-center rounded-3xl bg-sunken px-6 py-12 text-center lg:py-16"
    >
      <DoodleWalk className="h-24 w-auto" />

      <h2 id="training-empty-title" className="mt-6 text-xl font-extrabold text-balance">
        هنوز دوره‌ای نگرفته‌ای.
      </h2>
      <p className="mt-2 max-w-md text-balance text-muted-foreground">قدم بعدی هر سگ را در صفحه‌ی سگ‌هایت می‌بینی.</p>

      <Link to="/account/dogs" className={buttonVariants({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
        سگ‌های من
      </Link>
    </section>
  );
}
