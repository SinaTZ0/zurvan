import { useAtomValue, useSetAtom } from "jotai";
import { CheckIcon } from "lucide-react";

import { addCartItemAtom, cartItemsAtom, isInCart } from "~/atoms/cart";
import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { describeSessions, formatTomanShort } from "~/lib/course-format";
import { getDogVerdict } from "~/lib/dog-verdict";
import { useHydrated } from "~/hooks/use-hydrated";
import type { MyDogCourse } from "~/orpc/checkout/contract";
import type { Course } from "~/orpc/course/contract";

/*===== Buy Course Row =====*/
/**
 * One course for the chosen dog: its name, what it costs and, depending on the server's verdict, a button that puts it in
 * the cart or the reasons it can't be bought and the way out of each (the free evaluation, the course to finish first).
 * A course with no price isn't sold online and says so, pointing at its page.
 */
export function BuyCourseRow({
  course,
  dog,
  verdict,
}: {
  course: Course;
  dog: { id: string; name: string };
  verdict: MyDogCourse | null;
}) {
  const hydrated = useHydrated();
  const items = useAtomValue(cartItemsAtom);
  const addToCart = useSetAtom(addCartItemAtom);
  const inCart = hydrated && isInCart(items, { courseSlug: course.slug, dogId: dog.id });
  const price = course.price;
  const reasons = verdict && !verdict.eligible ? getDogVerdict({ dogId: dog.id, ...verdict }).problems : [];

  function add() {
    const result = addToCart({ courseSlug: course.slug, dogId: dog.id });
    if (result === "full") toast.add({ title: "سبد پر است؛ اول پرداختش را انجام بده.", type: "error" });
  }

  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h3 className="font-bold text-pretty">
          <Link to={`/courses/${course.slug}`} className="underline-offset-4 hover:underline">
            {course.title}
          </Link>
        </h3>
        <p dir="ltr" className="mt-0.5 w-fit text-start text-sm text-muted-foreground">
          {course.latinName}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {describeSessions(course)}
          {price !== null && (
            <>
              {" · "}
              <span className="font-bold text-foreground">{formatTomanShort(price)}</span>
            </>
          )}
        </p>

        {reasons.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1.5">
            {reasons.map((problem) => (
              <li key={problem.message} className="text-sm text-pretty text-muted-foreground">
                {problem.message}
                {problem.way && (
                  <>
                    {" "}
                    <Link to={problem.way.to} className="font-bold text-primary underline-offset-4 hover:underline">
                      {problem.way.label}
                    </Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0">
        {price === null ? (
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-11 items-center rounded-lg border border-border px-4 text-sm font-bold"
          >
            ببین چطور می‌شود
          </Link>
        ) : inCart ? (
          <span className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary/50 px-4 text-sm font-bold text-primary">
            <CheckIcon aria-hidden className="size-4" />
            در سبد است
          </span>
        ) : verdict?.eligible ? (
          <Button type="button" onClick={add}>
            افزودن به سبد
          </Button>
        ) : null}
      </div>
    </li>
  );
}
