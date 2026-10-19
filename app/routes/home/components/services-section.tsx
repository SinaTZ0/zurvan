import { BrainIcon, GraduationCapIcon, MessagesSquareIcon, TargetIcon, TrophyIcon } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Services =====*/
const SERVICES = [
  {
    icon: GraduationCapIcon,
    title: "آموزش پایه و پیشرفته",
    detail: "آموزش عمومی و فرمان‌پذیری، از اولین فرمان‌ها تا مهارت‌های پیشرفته.",
  },
  {
    icon: BrainIcon,
    title: "رفتارشناسی و اصلاح رفتار",
    detail: "شناخت رفتار سگ و کمک به حل مشکلات رفتاری.",
  },
  {
    icon: TargetIcon,
    title: "آموزش تخصصی",
    detail: "دفاع، ردیابی، گارد، اطاعت و آموزش سگ‌های نگهبان و ورزشی.",
  },
  {
    icon: TrophyIcon,
    title: "آمادگی برای مسابقات داخلی و بین‌المللی",
    detail: "تمرین و آموزش تا سطوح مسابقاتی.",
  },
  {
    icon: MessagesSquareIcon,
    title: "مشاوره‌ی تخصصی قبل و بعد از آموزش",
    detail: "راهنمایی برای شروع آموزش و ادامه‌ی تمرین‌ها بعد از آن.",
  },
] as const;

/*===== Services Section =====*/
export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="site-container scroll-mt-24 pt-section-lg">
      <div className="grid gap-gutter lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div>
          <h2 id="services-title" className="max-w-lg font-display text-h1 font-black text-balance">
            از اولین «بشین» تا مسابقه
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
            قهرمان نباشم هم اشکالی نداره! {HEAD_TRAINER.firstName} با همه‌ی نژادها و توی همه‌ی سنین کار می‌کنه؛ از آداب
            زندگی روزمره تا آموزش تخصصی و آمادگی مسابقه. اول منو می‌شناسه، بعد مسیر آموزشمو با تو مشخص می‌کنه.
          </p>
          <p className="mt-6 font-bold text-primary">تجربه، دانش، نتیجه.</p>
        </div>

        <ul className="divide-y divide-border border-y border-border">
          {SERVICES.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex gap-4 py-5">
              <Icon aria-hidden strokeWidth={1.5} className="mt-1 size-7 shrink-0 text-primary" />
              <div>
                <h3 className="text-base font-extrabold">{title}</h3>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
