import { GroundStrip } from "~/components/ground-strip";
import { MascotCut } from "~/components/mascot-cut";
import { DISPLAY_HEADING } from "~/lib/display-heading";

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
/**
 * The list on a grained card. The heading row ends in the place the things are kept: the dimmed cabinet with a folder
 * peeking out, on a short path with a bush, standing on the card's top edge. The photo note is a separate plate
 * (`photo-note.tsx`) that `privacy.tsx` places beside or after this section.
 *
 * The cabinet's drawer opens towards the right, so his bush stands at his left (physical sides, tied to the picture).
 */
export function DataKept({ className }: { className?: string }) {
  return (
    <section id="kept" aria-labelledby="kept-title" className={`scroll-mt-24 ${className ?? ""}`}>
      {/*------ Heading and Cabinet ------*/}
      <div className="relative flex min-h-28 items-end pb-3 sm:min-h-32 lg:pb-4">
        <h2 id="kept-title" className={`${DISPLAY_HEADING} text-h2 text-balance`}>
          چی ذخیره می‌شه
        </h2>

        <div aria-hidden className="pointer-events-none absolute -bottom-[3px] left-0 h-[6.75rem] w-52 sm:h-[7.75rem] sm:w-64">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_60%_at_50%_80%,rgb(255_194_26/0.08),transparent)]" />
          <GroundStrip className="absolute inset-x-0 bottom-0 h-5 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)] md:h-6" />
          <MascotCut
            name="plants"
            className="lively-sway absolute bottom-[0.1rem] left-[2%] w-[26%] translate-y-[4%]"
          />
          <div className="pv-hop absolute bottom-[0.35rem] left-[32%] w-[42%] sm:w-[38%]">
            <MascotCut name="cabinet" className="block w-full" />
          </div>
          <MascotCut
            name="plants"
            className="lively-sway-2 absolute right-[2%] bottom-[0.1rem] w-[18%] translate-y-[4%] -scale-x-100"
          />
        </div>
      </div>

      {/*------ Rows ------*/}
      <dl className="divide-y divide-border rounded-3xl border border-border bg-card paper-grain px-5 shadow-sm sm:px-6">
        {ROWS.map(({ term, text }) => (
          <div key={term} className="grid gap-2 py-5 lg:grid-cols-3 lg:gap-8">
            <dt className="font-extrabold">{term}</dt>
            <dd className="text-pretty text-muted-foreground lg:col-span-2">{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
