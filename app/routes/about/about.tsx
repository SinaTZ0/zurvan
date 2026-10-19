import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { CENTER_SERVICE_AREA } from "~/lib/contact";
import { formatNumberFa } from "~/lib/digits";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { TrainerFacts } from "~/components/trainer-facts";

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
// no biography and no claim about where or how training is held. The photo is one of the two the owner sent on
// 2026-10-19 (the home page shows the other); which of them is her chosen introduction is still open.
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
          {/* The frame is 4:5 and the picture 2:3: `object-top` keeps both faces and drops the dog's paws. */}
          <img
            src={HEAD_TRAINER.photos.standing.src}
            srcSet={HEAD_TRAINER.photos.standing.srcSet}
            sizes="(min-width: 64rem) 35rem, 100vw"
            alt={HEAD_TRAINER.photos.standing.alt}
            width={HEAD_TRAINER.photos.standing.width}
            height={HEAD_TRAINER.photos.standing.height}
            fetchPriority="high"
            decoding="async"
            className="aspect-[4/5] w-full object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
