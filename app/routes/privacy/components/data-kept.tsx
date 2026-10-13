import { Lock } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Data Kept =====*/
// The list of what the app stores, one row per kind of data. A definition list, so each term stays tied to its text on
// both layouts; the copy is final (`.tmp-claude/page13-brief.md`).
const ROWS = [
  { term: "شماره‌ی موبایل", text: "برای ورود و برای پیامک‌هایی که می‌فرستیم. رمز عبور نداریم." },
  { term: "اسم", text: "اسمی که توی حسابت می‌نویسی." },
  {
    term: "سگ‌هات",
    text: "اسم، نژاد، جنسیت، تاریخ تولد، وزن، عقیم بودن یا نبودن، شماره‌ی میکروچیپ، واکسن‌ها، یادداشت‌های رفتاری و پزشکی و عکس. هر کدوم رو که خودت پر کنی.",
  },
  {
    term: "درخواست ارزیابی",
    text: "اول‌ترین تاریخی که می‌تونی، ساعت‌هایی که معمولاً آزادی، عکس و فیلم‌هایی که می‌فرستی و نتیجه‌ی ارزیابی.",
  },
  {
    term: "پرداخت‌ها",
    text: "مبلغ، دوره و سگِ هر مورد، کد پیگیری درگاه و شماره‌ی کارت به‌صورت پوشیده. پرداخت توی صفحه‌ی درگاه بانکی انجام می‌شه؛ شماره‌ی کامل و رمز کارتت به سایت نمی‌رسه.",
  },
  { term: "دوره‌ها", text: "دوره‌هایی که خریدی و این‌که تموم شده یا لغو شده." },
  { term: "ورودها", text: "آخرین زمان ورود، نشانی IP و نوع مرورگر و دستگاهت." },
  {
    term: "پیامک‌ها",
    text: "شماره و متن پیامک‌هایی که برات می‌فرستیم (کد ورود، رسید، نتیجه‌ی ارزیابی…) ثبت می‌شه.",
  },
  {
    term: "لینک همکار",
    text: "اگه با لینک یا QR یه همکار اومده باشی، یه کوکی ۳۰ روزه کدش رو نگه می‌داره تا موقع ثبت‌نام بدونیم تو رو کی آورده. اگه یه همکار شماره‌ات رو قبل از ثبت‌نامت توی داشبوردش وارد کرده باشه، اون همکار ثبت می‌شه. بعد از ثبت‌نام، همکار برای همیشه به حساب تو وصله.",
  },
  {
    term: "توی مرورگرت",
    text: "سبد خرید فقط توی مرورگر خودته. وقتی سبد رو باز می‌کنی یا «پرداخت» رو می‌زنی، موردهاش برای بررسی به سایت فرستاده می‌شه.",
  },
];

/*===== Data Kept Section =====*/
/** The list plus the one note on photos, which is not private and must say so plainly. */
export function DataKept() {
  return (
    <section id="kept" aria-labelledby="kept-title" className="scroll-mt-24">
      <h2 id="kept-title" className="font-display text-h2 font-black text-balance">
        چی ذخیره می‌شه
      </h2>

      <dl className="mt-8 divide-y divide-border">
        {ROWS.map(({ term, text }) => (
          <div key={term} className="grid gap-2 py-5 first:pt-0 lg:grid-cols-3 lg:gap-8">
            <dt className="font-extrabold">{term}</dt>
            <dd className="text-pretty text-muted-foreground lg:col-span-2">{text}</dd>
          </div>
        ))}
      </dl>

      {/*------ Photo Note ------*/}
      <div className="mt-10 rounded-3xl border border-border p-5">
        <div className="flex items-start gap-3">
          <Lock aria-hidden strokeWidth={1.5} className="mt-1 size-6 shrink-0 text-primary" />
          <div>
            <h3 className="font-extrabold">درباره‌ی عکس‌ها و فیلم‌ها</h3>
            <p className="mt-2 text-pretty text-muted-foreground">
              عکس‌ها (عکس سگ و عکس‌های درخواست ارزیابی) با یه نشانی طولانی و غیرقابل حدس ذخیره می‌شن؛ هر کسی که نشانی
              دقیقش رو داشته باشه می‌تونه ببیندشون. فیلم‌های درخواست ارزیابی این‌طور نیستن: خصوصی‌ان و فقط خودت و
              {HEAD_TRAINER.firstName} می‌بینینشون.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
