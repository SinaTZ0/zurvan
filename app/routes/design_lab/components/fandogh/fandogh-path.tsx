import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { FandoghBubble } from "~/routes/design_lab/components/fandogh/fandogh-bubble";
import { LAB_FORMATS, LAB_LINKS, LAB_SERVICES, LAB_STEPS } from "~/routes/design_lab/lab-content";

/*===== Steps =====*/
/**
 * The evaluation path. It really is a sequence, so the steps are numbered and strung on a dashed leaf-green line (the
 * leash). Fandogh sits at the side, because he walked it himself.
 */
export function FandoghSteps() {
  return (
    <section aria-labelledby="fd-steps-title" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        {/*------ Fandogh sits and talks ------*/}
        <div className="mx-auto w-full max-w-sm">
          <FandoghBubble tone="sky" tail="bottom-start">
            من هم از همین راه رد شدم. اول کمی خجالتی بودم، ولی طلا آنقدر مهربان بود که دمم خودبه‌خود تکان خورد.
          </FandoghBubble>
          <div className="mx-auto mt-6 grid aspect-square w-72 place-items-center rounded-full bg-[var(--fd-sky)] sm:w-80">
            <img
              src="/photo/design-lab/fandogh-2.webp"
              alt="فندق با افتخار نشسته و سرش را بالا گرفته است"
              width={610}
              height={610}
              loading="lazy"
              className="size-full scale-110 mix-blend-multiply"
            />
          </div>
        </div>

        {/*------ The four steps ------*/}
        <div>
          <h2 id="fd-steps-title" className="font-['Lalezar'] text-4xl leading-snug text-[var(--fd-ink)] sm:text-5xl">
            از دم‌زدن تا آموزش، فقط چهار قدم
          </h2>
          <ol className="relative mt-10 grid gap-8">
            {/* The leash: runs through the centres of the number badges. */}
            <span
              aria-hidden="true"
              className="absolute inset-y-6 start-[1.375rem] border-s-[3px] border-dashed border-[var(--fd-leaf)]"
            />
            {LAB_STEPS.map((step, index) => (
              <li key={step.title} className="relative flex items-start gap-5">
                <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-[var(--fd-fawn)] font-['Lalezar'] text-2xl text-[var(--fd-ink)] ring-4 ring-white">
                  {formatNumberFa(index + 1)}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-[var(--fd-ink)]">{step.title}</h3>
                  <p className="mt-1 max-w-md leading-8 text-[var(--fd-ink)]/80">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            to={LAB_LINKS.evaluation}
            className="mt-10 inline-block rounded-full bg-[var(--fd-leaf-deep)] px-7 py-3.5 font-bold text-white outline-offset-4 transition-colors hover:bg-[var(--fd-ink)] focus-visible:outline-2 focus-visible:outline-[var(--fd-ink)]"
          >
            قدم اول را بردار
          </Link>
        </div>
      </div>
    </section>
  );
}

/*===== Services =====*/
/** Sky again, Fandogh mid-jump: "all breeds, all ages" is the happiest line on the page. */
export function FandoghServices() {
  return (
    <section aria-labelledby="fd-services-title" className="bg-[var(--fd-sky)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <h2
              id="fd-services-title"
              className="font-['Lalezar'] text-4xl leading-snug text-[var(--fd-ink)] sm:text-5xl"
            >
              هرچه سگ‌ها لازم دارند، اینجاست
            </h2>
            <FandoghBubble tail="bottom-end" className="mt-6 max-w-lg">
              نژادم مهم نیست، سن‌ام هم مهم نیست. من مالینوآی جوانم، ولی دوستانم از پودل تا ژرمن شپرد و از توله تا پیر
              آمده‌اند.
            </FandoghBubble>
          </div>
          <img
            src="/photo/design-lab/fandogh-4.webp"
            alt="فندق شاد و خوشحال از زمین پریده است"
            width={610}
            height={610}
            loading="lazy"
            className="order-first mx-auto size-60 mix-blend-multiply md:order-last md:size-72"
          />
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {LAB_SERVICES.map((service, index) => (
            <li
              key={service.title}
              className={
                "rounded-3xl border-2 border-[var(--fd-ink)] bg-white p-6 shadow-[5px_5px_0_var(--fd-ink)] " +
                (index < 2 ? "lg:col-span-3" : "lg:col-span-2")
              }
            >
              <h3 className="text-lg leading-8 font-bold text-[var(--fd-ink)]">{service.title}</h3>
              <p className="mt-2 leading-8 text-[var(--fd-ink)]/80">{service.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/*===== Formats =====*/
/** Three formats, plain white. Group classes are not running and boarding is by arrangement, so neither is a promise. */
export function FandoghFormats() {
  return (
    <section aria-labelledby="fd-formats-title" className="bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 id="fd-formats-title" className="font-['Lalezar'] text-4xl leading-snug text-[var(--fd-ink)] sm:text-5xl">
            کجا و چطور تمرین کنیم؟
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--fd-ink)]/80">
            آموزش بیشتر خصوصی است، مثل داشتن معلم سرخانه. هرکدام که به تو و سگت می‌آید.
          </p>
          <ul className="mt-8 grid gap-3">
            {LAB_FORMATS.map((format) => (
              <li
                key={format}
                className="flex items-center gap-4 rounded-2xl bg-[var(--fd-sky-soft)] px-5 py-4 text-lg font-semibold text-[var(--fd-ink)]"
              >
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-[var(--fd-leaf)]" />
                {format}
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-xs">
          <FandoghBubble tone="sky" tail="bottom-start">
            هر جا تو باشی، من با بند سبزم آماده‌ام!
          </FandoghBubble>
          <img
            src="/photo/design-lab/fandogh-1.webp"
            alt="فندق ایستاده و پنجه‌اش را بالا آورده است"
            width={610}
            height={610}
            loading="lazy"
            className="mt-4 size-64 -scale-x-100 mix-blend-multiply"
          />
        </div>
      </div>
    </section>
  );
}
