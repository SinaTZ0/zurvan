import { Lock } from "lucide-react";

import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Data Kept =====*/
// The list of what the app stores, one row per kind of data, in plain words (the owner found the first version too
// technical, 2026-10-19). A definition list, so each term stays tied to its text on both layouts. What was dropped from
// here (the IP address, the cookies, the SMS log, the sign-in code limits) is in `technical-details.tsx`, not gone.
const ROWS = [
  {
    term: "حساب",
    text: "شماره‌ی موبایل و اسمت. اگه رمز بذاری، فقط نسخه‌ی رمزنگاری‌شده‌اش نگه داشته می‌شه؛ خودِ رمزت جایی ذخیره نمی‌شه. با کد پیامکی هم همیشه می‌تونی وارد شی.",
  },
  {
    term: "سگ‌هات",
    text: "اطلاعاتی که خودت برای سگ می‌نویسی (اسم، نژاد، تاریخ تولد، واکسن‌ها، یادداشت‌ها و عکس)، و شماره‌ی پرونده‌ی هر سگ.",
  },
  {
    term: "ارزیابی و دفترچه‌ی تمرین",
    text: "درخواست ارزیابی (روزها و ساعت‌های آزادت، عکس و فیلم‌هایی که فرستادی و نتیجه‌اش) و چیزهایی که مربی بعد از هر جلسه توی دفترچه‌ی سگت می‌نویسه. دفترچه رو فقط تو و مربی می‌بینید.",
  },
  {
    term: "خرید و پرداخت",
    text: "دوره‌هایی که توی سبدت گذاشتی یا خریدی (و تموم شدن یا لغو شدنشون)، مبلغ و کد پیگیری. سبد توی حسابته و روی هر دستگاهی می‌بینیش. پرداخت توی صفحه‌ی بانک انجام می‌شه؛ شماره‌ی کامل و رمز کارتت به سایت نمی‌رسه.",
  },
  {
    term: "پیامک‌ها",
    text: "پیامک‌هایی که برات می‌فرستیم (کد ورود، رسید، نتیجه‌ی ارزیابی) ثبت می‌شه.",
  },
  {
    term: "شماره‌ی پرونده و گواهی",
    text: "هر سگ یه شماره‌ی پرونده و QR داره و گواهی پایان دوره هم شماره داره. هر کس شماره یا QR رو داشته باشه فقط می‌بینه که پرونده خصوصیه یا گواهی معتبره و برای کدوم دوره‌ست؛ اسم سگ و اسم و شماره‌ی تو رو نمی‌بینه.",
  },
  {
    term: "همکار",
    text: "اگه با لینک یا QR یه همکار اومده باشی، یا همکار شماره‌ات رو قبل از ثبت‌نامت وارد کرده باشه، موقع ثبت‌نام ثبت می‌شه که تو رو کی آورده، و بعدش همکار برای همیشه به حساب تو وصله. اون همکار چی می‌بینه؟ پایین‌تر نوشتیم.",
  },
  {
    term: "ورودها",
    text: "زمان آخرین ورودت و دستگاهی که باهاش وارد شدی؛ برای امنیت حسابت.",
  },
];

/*===== Data Kept Section =====*/
/** The list plus the one note on photos, which are not private and must say so plainly. */
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
