import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { TrainerFacts } from "~/routes/about/components/trainer-facts";

import type { Route } from "./+types/about";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: `درباره‌ی ${HEAD_TRAINER.name} | زروان` },
  {
    name: "description",
    content: `${HEAD_TRAINER.name}، ${HEAD_TRAINER.role}، با ${formatNumberFa(HEAD_TRAINER.years)} سال سابقه‌ی حرفه‌ای در ${CENTER_SERVICE_AREA}.`,
  },
];

/*===== Page =====*/
// Static: no loader. Every fact here comes from the owner's business card (`HEAD_TRAINER`); the page adds nothing to it,
// no biography and no claim about where or how training is held. The photo is the one the home page uses and is still
// an illustrative stand-in until the owner sends a real one.
export default function AboutPage() {
  return (
    <section
      aria-labelledby="about-title"
      className="site-container grid items-center gap-gutter pt-section-sm pb-section-md lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16"
    >
      {/*===== Words =====*/}
      <div className="order-2 lg:order-1">
        <h1 id="about-title" className="font-display text-h1 font-black text-balance">
          درباره‌ی {HEAD_TRAINER.name}
        </h1>
        <p className="mt-2 font-bold text-primary">{HEAD_TRAINER.role}</p>
        <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
          {HEAD_TRAINER.name} با {formatNumberFa(HEAD_TRAINER.years)} سال سابقه و تجربه‌ی حرفه‌ای توی آموزش سگ‌ها کار
          می‌کنه؛ از آموزش‌های پایه و عمومی تا دوره‌های تخصصی، نگهبانی، ورزشی و سطوح مسابقاتی.
        </p>

        <TrainerFacts />

        {/* One main action, one quieter alternative. */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/courses" className={buttonVariants({ size: "lg" })}>
            دوره‌ها را ببین
          </Link>
          <Link to="/contact" className={buttonVariants({ variant: "outline", size: "lg" })}>
            تماس با ما
          </Link>
        </div>
      </div>

      {/*===== Photo =====*/}
      <div className="order-1 lg:order-2">
        <div className="overflow-hidden rounded-4xl border border-border">
          <picture>
            <source media="(min-width: 64rem)" srcSet="/photo/home/trainer-1536.webp" />
            <img
              src="/photo/home/trainer-900.webp"
              alt={`${HEAD_TRAINER.firstName} روی زمین نشسته و می‌خندد، ژرمن‌شپردش گونه‌اش را می‌لیسد`}
              width={1536}
              height={1024}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover object-[30%_50%]"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
