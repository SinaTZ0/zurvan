import { cn } from "cn";
import { DogIcon, GiftIcon, HouseIcon, RouteIcon, type LucideIcon } from "lucide-react";

/*===== Promises =====*/
// What training here is like, in the dog's words. Each line is a fact about how the practice works (app-spec: private,
// at home or outside, a free first meeting, courses that open one after another), not a claim about results.
const PROMISES: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: HouseIcon, title: "توی خونه‌ی خودمون یا بیرون", detail: "همون‌جایی که زندگی می‌کنم، یاد می‌گیرم." },
  {
    icon: DogIcon,
    title: "فقط من و مربی‌م",
    detail: "کلاس شلوغ نداریم؛ هر جلسه مال خودمه.",
  },
  { icon: GiftIcon, title: "اولش رایگان آشنا می‌شیم", detail: "قبل از هر دوره، یه ارزیابی رایگان." },
  { icon: RouteIcon, title: "از سگ خونگی تا سگ کار", detail: "قدم‌به‌قدم؛ هر دوره بعد از قبلی باز می‌شه." },
];

/*===== Promise Strip =====*/
/** Four short facts under the hero, divided by hairlines: one row on desktop, two by two on phones. */
export function PromiseStrip() {
  return (
    <section aria-label="آموزش اینجا چطوریه" className="border-y border-border bg-sunken">
      <ul className="site-container grid grid-cols-2 lg:grid-cols-4">
        {PROMISES.map(({ icon: Icon, title, detail }, index) => (
          <li
            key={title}
            // Hairlines between cells only: the start column on phones and every column but the first on desktop.
            className={cn(
              "flex flex-col gap-3 py-6 pe-4 lg:flex-row lg:items-center lg:gap-4 lg:px-6 lg:py-7",
              index % 2 === 1 && "border-s border-border ps-4",
              index >= 2 && "max-lg:border-t max-lg:border-border",
              index === 2 && "lg:border-s lg:border-border",
              index === 0 && "lg:ps-0",
            )}
          >
            <Icon aria-hidden strokeWidth={1.5} className="size-9 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-extrabold lg:text-base">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground lg:text-sm">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
