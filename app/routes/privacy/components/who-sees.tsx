import { Check, X } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Viewer Cards =====*/
// One card per person who can see the account's data: the visitor, the head trainer and a partner. Each lists what that
// person sees; the partner's card also lists what they don't, because that is the question a customer asks. The copy is
// final (`.tmp-claude/page13-brief.md`).
const SEES = ["شماره و اسمت", "سگ‌هات، ارزیابی‌ها، دوره‌ها و پرداخت‌هات"];

const TRAINER_SEES = [
  "همه‌ی چیزهایی که مشتری‌ها وارد می‌کنن: شماره و اسم، سگ‌ها، ارزیابی‌ها با عکس و فیلمشون",
  "پرداخت‌ها و دوره‌ها",
  "پیامک‌های فرستاده‌شده",
];

const PARTNER_SEES = [
  "شماره‌هایی که خودش وارد کرده",
  "این‌که کدوم مشتری‌هاش ثبت‌نام کرده و خرید کرده",
  "کمیسیون‌های خودش",
];

const PARTNER_DOES_NOT_SEE = ["سگ‌هات و ارزیابی‌هاشون", "پرداخت‌ها و دوره‌هایی که خریدی", "همکارهای دیگه"];

/*===== Viewer Card =====*/
function ViewerCard({
  title,
  sees,
  doesNotSee,
  children,
}: {
  title: string;
  sees: string[];
  doesNotSee?: string[];
  children?: React.ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-3xl bg-card p-6 shadow-sm">
      <h3 className="font-display text-h3 font-black text-balance">{title}</h3>

      <p className="sr-only">می‌بینه:</p>
      <ul className="mt-5 space-y-3">
        {sees.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check aria-hidden strokeWidth={2} className="mt-1 size-4 shrink-0 text-primary" />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>

      {doesNotSee && (
        <>
          <p className="mt-6 text-sm font-bold text-muted-foreground">نمی‌بینه</p>
          <ul className="mt-3 space-y-3">
            {doesNotSee.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <X aria-hidden strokeWidth={2} className="mt-1 size-4 shrink-0" />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {children}
    </article>
  );
}

/*===== Who Sees Section =====*/
export function WhoSees() {
  return (
    <section id="who-sees" aria-labelledby="who-sees-title" className="scroll-mt-24">
      <h2 id="who-sees-title" className="font-display text-h2 font-black text-balance">
        کی چی رو می‌بینه
      </h2>

      <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <ViewerCard title="تو" sees={SEES} />

        <ViewerCard title={`${HEAD_TRAINER.firstName}، مدیر سایت`} sees={TRAINER_SEES}>
          <p className="mt-6 text-sm text-muted-foreground">توی سایت فقط {HEAD_TRAINER.firstName} حساب مدیریت داره.</p>
        </ViewerCard>

        <ViewerCard title="همکار، اگه از طریق اون اومده باشی" sees={PARTNER_SEES} doesNotSee={PARTNER_DOES_NOT_SEE} />
      </div>
    </section>
  );
}
