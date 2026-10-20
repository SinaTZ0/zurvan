import { EvaluationButton } from "~/routes/design_lab/components/rakhsh/rakhsh-cta";
import { RakhshTag } from "~/routes/design_lab/components/rakhsh/rakhsh-tag";

/*===== Hero =====*/
export function RakhshHero() {
  return (
    <section
      aria-labelledby="rk-hero-title"
      className="relative overflow-hidden bg-[var(--rk-olive)] px-4 pt-12 pb-20 md:px-8 md:pt-20 md:pb-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/*------ Words ------*/}
        <div className="max-w-xl">
          <h1
            id="rk-hero-title"
            className="font-display text-5xl leading-[1.25] font-black text-[var(--rk-bone)] md:text-7xl md:leading-[1.2]"
          >
            من رخشم.
            <br />
            تند می‌دوم،
            <br />
            تا آخرش وفادارم.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[var(--rk-bone)]/85">
            سگِ کاریِ این مرکزم. اگر سگی داری که انرژی‌اش زیاد است یا حرف تو را نمی‌شنود، پرونده‌اش را با هم باز کنیم.
            ارزیابی اولش رایگان است.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <EvaluationButton className="px-8 py-4 text-lg" />
            <span className="text-sm text-[var(--rk-sand)]">بدون تعهد؛ فقط یک آشنایی</span>
          </div>
        </div>

        {/*------ Photo + tag ------*/}
        <div className="relative mx-auto w-full max-w-[34rem] pb-4 sm:pb-8">
          <div className="overflow-hidden rounded-sm border-[10px] border-[var(--rk-bone)] bg-[var(--rk-bone)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
            <img
              src="/photo/design-lab/rakhsh-1.webp"
              width={610}
              height={610}
              alt="رخش، مالینویز بلژیکی، وسط پرش روی چمن، از پهلو"
              fetchPriority="high"
              className="aspect-square w-full object-cover"
            />
          </div>
          <RakhshTag />
        </div>
      </div>
    </section>
  );
}
