import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";

const FACTS = [
  { term: "سابقه", description: `${formatNumberFa(HEAD_TRAINER.years)} سال آموزش سگ` },
  { term: "سگ‌ها", description: "از توله‌ی دوماهه تا سگ‌های کار و ورزشی" },
  { term: "جلسه‌ها", description: "خصوصی، در خانه‌ی خودت یا بیرون. پانسیون اختیاری است." },
];

/*===== Trainer Intro =====*/
/**
 * The trainer right after the hero, because the center is him: people hire a person, not a catalog. The heading is
 * his own sentence about how he works, signed with his name, so the section reads as him speaking rather than as an
 * "about us" block. The facts are a short definition list, not stat tiles; the years are the only number worth one.
 */
export function TrainerIntro() {
  return (
    <section
      id="trainer"
      aria-labelledby="trainer-title"
      className="site-container grid scroll-mt-8 gap-10 pt-section-md lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-x-16 xl:gap-x-24"
    >
      {/*------ Portrait ------*/}
      <img
        src={HEAD_TRAINER.photo.src}
        alt={HEAD_TRAINER.photo.alt}
        width={HEAD_TRAINER.photo.width}
        height={HEAD_TRAINER.photo.height}
        loading="lazy"
        className="aspect-[4/5] w-full rounded-3xl object-cover object-[70%_50%] max-lg:aspect-[4/3] max-lg:max-h-[28rem]"
      />

      <div className="flex flex-col">
        {/*------ His Words ------*/}
        <h2 id="trainer-title" className="text-[clamp(1.875rem,1.4rem+1.9vw,3rem)] leading-[1.35] text-balance">
          سگ را در جای زندگی خودش آموزش می‌دهم، نه در کلاسی شلوغ.
        </h2>
        <p className="mt-5 flex flex-col">
          <span className="text-lg font-extrabold text-primary">{HEAD_TRAINER.name}</span>
          <span className="text-sm text-muted-foreground">{HEAD_TRAINER.role}</span>
        </p>
        <p className="mt-6 max-w-[34rem] text-lead leading-[1.9] text-pretty text-foreground/85">
          هر جلسه فقط من هستم، تو و سگت. تمرین را در خانه یا محله‌ی خودتان شروع می‌کنیم، همان‌جا که سگ هر روز زندگی
          می‌کند، و تا جلسه‌ی بعد با هم پیش می‌بریم. در بعضی جلسه‌ها دستیارم هم کنارم است.
        </p>

        {/*------ Facts ------*/}
        <dl className="mt-8 max-w-[34rem] divide-y border-y">
          {FACTS.map(({ term, description }) => (
            <div key={term} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-3.5">
              <dt className="text-sm font-bold text-saffron-text">{term}</dt>
              <dd className="text-sm text-pretty">{description}</dd>
            </div>
          ))}
        </dl>

        <Link to="/assessment" className={buttonVariants({ size: "lg", className: "mt-8 self-start px-8" })}>
          ارزیابی رایگان با {HEAD_TRAINER.firstName}
        </Link>
      </div>
    </section>
  );
}
