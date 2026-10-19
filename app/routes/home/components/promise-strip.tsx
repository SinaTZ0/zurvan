import { cn } from "cn";
import { DogIcon, HouseIcon, RouteIcon, ScanSearchIcon, type LucideIcon } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Promises =====*/
// What training here is like, in the dog's words. Each line is a fact about how the practice works, not a claim about
// results. The owner's notes (2026-10-19) shaped them: «فقط من و مربی‌م / کلاس شلوغ نداریم» was wrong (the owner of the dog
// is in a private class, and a group class may exist), and «خونه یا بیرون» is where a lesson happens, not what kind of
// class it is, so the first chip names the kinds of class the help page already words (no group class is announced
// as running: the help page says it starts when one is held). The free evaluation is asked for in the header, the
// hero, the quick actions and the evaluation panel, so it is not a chip as well.
const PROMISES: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: HouseIcon, title: "کلاس به شرایط ما می‌خوره", detail: "خصوصی در محل شما یا مجموعه؛ پانسیون با هماهنگی." },
  {
    icon: DogIcon,
    title: `مربی‌م خودِ ${HEAD_TRAINER.firstName}ـه`,
    detail: "ارزیابی و مسیر آموزشمو خودش مشخص می‌کنه.",
  },
  { icon: ScanSearchIcon, title: "هر سگ دوره‌های خودشو داره", detail: "توی صفحه‌ی دوره می‌بینی کدوم برای سگت بازه." },
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
