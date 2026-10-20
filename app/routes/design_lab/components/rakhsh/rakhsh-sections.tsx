import { Link } from "~/components/link";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import { formatNumberFa } from "~/lib/digits";
import { EvaluationButton } from "~/routes/design_lab/components/rakhsh/rakhsh-cta";
import { LAB_FORMATS, LAB_LINKS, LAB_SERVICES, LAB_STEPS } from "~/routes/design_lab/lab-content";

const heading = "font-display text-3xl leading-snug font-black md:text-5xl md:leading-tight";

/*===== Steps =====*/
// Bone "paper" band: the steps are the pages of the dog's file, and they really are a sequence, so they are numbered.
export function RakhshSteps() {
  return (
    <section
      aria-labelledby="rk-steps-title"
      className="bg-[var(--rk-bone)] px-4 py-20 text-[var(--rk-ink)] md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id="rk-steps-title" className={`${heading} max-w-2xl`}>
          پرونده‌ی سگ تو هم همین‌طور باز می‌شود.
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--rk-ink)]/75">
          چهار قدم، از اولین درخواست تا اولین جلسه.
        </p>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-sm border border-[var(--rk-ink)]/20 bg-[var(--rk-ink)]/20 md:grid-cols-4">
          {LAB_STEPS.map((step, index) => (
            <li key={step.title} className="bg-[var(--rk-bone)] p-6">
              <span className="font-display text-4xl font-black text-[var(--rk-olive)]">
                {formatNumberFa(index + 1)}
              </span>
              <h3 className="mt-4 font-display text-xl leading-snug font-black">{step.title}</h3>
              <p className="mt-2 leading-7 text-[var(--rk-ink)]/75">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/*===== Services =====*/
export function RakhshServices() {
  return (
    <section aria-labelledby="rk-services-title" className="bg-[var(--rk-olive)] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 id="rk-services-title" className={`${heading} max-w-2xl`}>
            هر نژادی، هر سنی. من فقط به کار کردن اهمیت می‌دهم.
          </h2>
          <ul className="mt-10 divide-y divide-[var(--rk-sand)]/25 border-y border-[var(--rk-sand)]/25">
            {LAB_SERVICES.map((service) => (
              <li key={service.title} className="grid gap-1 py-5 md:grid-cols-[16rem_1fr] md:gap-8">
                <h3 className="font-display text-lg font-black text-[var(--rk-sand)]">{service.title}</h3>
                <p className="leading-7 text-[var(--rk-bone)]/80">{service.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        {/* Tight head crop: it is small on purpose, so the 610px source never gets stretched. */}
        <img
          src="/photo/design-lab/rakhsh-4.webp"
          width={610}
          height={610}
          loading="lazy"
          alt="نمای نزدیک از صورت رخش، مالینویز بلژیکی با پوزه‌ی مشکی"
          className="mx-auto aspect-[4/5] w-full max-w-sm rounded-sm border-[10px] border-[var(--rk-bone)] object-cover"
        />
      </div>
    </section>
  );
}

/*===== Formats =====*/
export function RakhshFormats() {
  return (
    <section
      aria-labelledby="rk-formats-title"
      className="bg-[var(--rk-sand)] px-4 py-20 text-[var(--rk-ink)] md:px-8 md:py-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[22rem_1fr]">
        <img
          src="/photo/design-lab/rakhsh-3.webp"
          width={610}
          height={610}
          loading="lazy"
          alt="رخش کنار پای راهنمایش با شلوار زیتونی و پوتین، در حال راه رفتن"
          className="mx-auto aspect-square w-full max-w-sm rounded-sm border-[10px] border-[var(--rk-bone)] object-cover"
        />
        <div>
          <h2 id="rk-formats-title" className={`${heading} max-w-2xl`}>
            کنار پایت راه می‌روم، هر جا که تمرین باشد.
          </h2>
          <ul className="mt-8 space-y-3">
            {LAB_FORMATS.map((format) => (
              <li key={format} className="flex items-start gap-3 text-lg leading-8">
                <span aria-hidden className="mt-3 h-0.5 w-6 shrink-0 bg-[var(--rk-olive)]" />
                {format}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-lg leading-7 text-[var(--rk-ink)]/75">
            آموزش بیشتر خصوصی است، مثل داشتن یک معلم برای سگ خودت. کلاس گروهی وقتی شروع می‌شود که یک کلاس برگزار شود.
          </p>
        </div>
      </div>
    </section>
  );
}

/*===== Trainer =====*/
export function RakhshTrainer() {
  const photo = HEAD_TRAINER.photos.withDog;
  return (
    <section aria-labelledby="rk-trainer-title" className="bg-[var(--rk-olive-deep)] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[18rem_1fr] lg:grid-cols-[22rem_1fr]">
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(min-width: 1024px) 352px, 288px"
          width={photo.width}
          height={photo.height}
          loading="lazy"
          alt={photo.alt}
          className="mx-auto aspect-[2/3] w-full max-w-xs rounded-sm border-[10px] border-[var(--rk-bone)] object-cover"
        />
        <div>
          <h2 id="rk-trainer-title" className={`${heading} max-w-2xl`}>
            سوارِ من {HEAD_TRAINER.firstName} است.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--rk-bone)]/85">
            {HEAD_TRAINER.name}، {HEAD_TRAINER.role}. بیش از {formatNumberFa(HEAD_TRAINER.years)} سال تجربه دارد و{" "}
            {HEAD_TRAINER.credential}. تنها مربیِ این مرکز است؛ ارزیابی و آموزش سگ تو را خودش انجام می‌دهد.
          </p>
          <Link
            to={LAB_LINKS.about}
            className="mt-6 inline-block rounded text-[var(--rk-sand)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rk-sand)]"
          >
            بیشتر درباره‌ی {HEAD_TRAINER.firstName}
          </Link>
        </div>
      </div>
    </section>
  );
}

/*===== Closing =====*/
export function RakhshClosing() {
  return (
    <section aria-labelledby="rk-closing-title" className="bg-[var(--rk-mask)] px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_16rem]">
        <div>
          <h2 id="rk-closing-title" className={heading}>
            بیا پرونده‌ی سگت را باز کنیم.
          </h2>
          <p className="mt-4 max-w-md text-lg leading-8 text-[var(--rk-bone)]/80">
            ارزیابی رایگان است. {HEAD_TRAINER.firstName} تماس می‌گیرد و سگت را از نزدیک می‌بیند.
          </p>
          <EvaluationButton className="mt-8 px-8 py-4 text-lg" />
        </div>
        <img
          src="/photo/design-lab/rakhsh-2.webp"
          width={610}
          height={610}
          loading="lazy"
          alt="رخش با هارنس مشکی نشسته و مستقیم به دوربین نگاه می‌کند"
          className="mx-auto aspect-square w-full max-w-xs rounded-sm border-[10px] border-[var(--rk-bone)] object-cover"
        />
      </div>
    </section>
  );
}
