import { DoodleWalk } from "~/components/doodles";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Dogs Empty =====*/
/**
 * A customer with no dogs yet: one centred panel that says why the first step is adding a dog. The doodle is the only
 * one in the account area.
 */
export function DogsEmpty() {
  return (
    <section
      aria-labelledby="dogs-empty-title"
      className="flex flex-col items-center rounded-3xl bg-sunken px-6 py-12 text-center lg:py-16"
    >
      {/*------ Doodle ------*/}
      {/* The figures face left, which is forward in RTL, so they walk the way the page reads. */}
      <DoodleWalk className="h-24 w-auto" />

      <h2 id="dogs-empty-title" className="mt-6 text-xl font-extrabold text-balance">
        هنوز سگی اضافه نکرده‌ای
      </h2>
      <p className="mt-2 max-w-md text-balance text-muted-foreground">
        {HEAD_TRAINER.firstName} هر سگ را اول رایگان می‌بیند. برای رزرو ارزیابی، اول سگت را معرفی کن.
      </p>

      <Link to="/account/dogs/new" className={buttonVariants({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
        سگت را اضافه کن
      </Link>
    </section>
  );
}
