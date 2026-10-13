import { Link } from "~/components/link";
import { CENTER_PHONE } from "~/lib/contact";
import { HEAD_TRAINER } from "~/lib/head-trainer";

/*===== Types =====*/
export type FaqQuestion = {
  /** The URL anchor (`/help#how-buying-works`). Other pages link to these, so never rename one. */
  id: string;
  question: string;
  /** Plain body copy: the dog speaks in the headings and the bubble, never in the answers. */
  answer: React.ReactNode;
};

export type FaqGroupData = {
  /** The URL anchor of the group, and the road stop that leads to it. */
  id: string;
  /** The road step this group is, or `null` for a group that isn't a step (the account). */
  step: number | null;
  /** The dog's heading. */
  title: string;
  questions: FaqQuestion[];
};

/*===== Shared Pieces =====*/
// Not components: the answers are plain JSX, and the same few links come up again and again.
const TRAINER = HEAD_TRAINER.firstName;

/** A link inside an answer, below the text it belongs to. */
const LINK_CLASS = "inline-block font-bold text-primary underline underline-offset-4";

const PHONE_LINK = (
  <a href={`tel:${CENTER_PHONE.tel}`} dir="ltr" className="font-bold text-primary underline underline-offset-4">
    {CENTER_PHONE.display}
  </a>
);

/*===== Groups =====*/
// In road order (`road.tsx`). Facts only from docs/app-spec.md F1 to F6, as the approved brief words them: no refund
// rules or timings, no calendar, no deadlines, nothing about groups or a venue.
export const FAQ_GROUPS: FaqGroupData[] = [
  /*------ 1: Evaluation ------*/
  {
    id: "evaluation",
    step: 1,
    title: "اول با هم آشنا می‌شیم",
    questions: [
      {
        id: "first-step",
        question: "از کجا شروع کنم؟",
        answer: (
          <>
            <p>
              اول سگتو توی حسابت اضافه کن، بعد ارزیابی رایگان رو درخواست بده. تا ارزیابی انجام نشده، دوره‌های سگت قفل
              می‌مونه.
            </p>
            <Link to="/assessment" className={LINK_CLASS}>
              ارزیابی رایگان بگیر
            </Link>
          </>
        ),
      },
      {
        id: "what-is-evaluation",
        question: "ارزیابی رایگان یعنی چی؟",
        answer: (
          <p>
            یه دیدار اوله با سگت، نه آزمون. توی درخواست یکی از سگ‌هات رو انتخاب می‌کنی، اگه خواستی عکس و فیلم می‌فرستی و
            می‌گی از چه تاریخی و چه ساعت‌هایی وقت داری. {TRAINER} باهات تماس می‌گیره و هماهنگ می‌کنید. هیچ پولی توش
            نیست.
          </p>
        ),
      },
      {
        id: "evaluation-rejected",
        question: "اگه ارزیابی انجام نشد یا رد شد چی؟",
        answer: (
          <p>
            {TRAINER} نتیجه رو توی سایت ثبت می‌کنه. اگه سگ مناسب نباشه یا دیدار انجام نشه، درخواست «رد» می‌شه و دلیلش
            بهت پیامک می‌شه. هر وقت خواستی دوباره درخواست بده. تا وقتی یه درخواست منتظره نمی‌شه درخواست تازه داد، ولی
            می‌تونی همون رو پس بگیری.
          </p>
        ),
      },
    ],
  },

  /*------ 2: Courses ------*/
  {
    id: "courses",
    step: 2,
    title: "کدوم دوره‌ها مال منه؟",
    questions: [
      {
        id: "which-courses",
        question: "کدوم دوره‌ها رو می‌تونم بخرم؟",
        answer: (
          <>
            <p>
              سگی که ارزیابی شده، دوره‌هایی رو می‌تونه بخره که پیش‌نیازهاشو گذرونده و سنش توی بازه‌ی دوره باشه. توی
              صفحه‌ی هر دوره می‌بینی هر کدوم از سگ‌هات می‌تونه اون دوره رو بگیره یا نه، و اگه نه، چرا.
            </p>
            <Link to="/courses" className={LINK_CLASS}>
              همه‌ی دوره‌ها
            </Link>
          </>
        ),
      },
      {
        id: "why-locked",
        question: "چرا یه دوره برای سگم قفله؟",
        answer: (
          <>
            <p>چند دلیل داره:</p>
            <ul className="mt-3 list-disc space-y-2 ps-6 marker:text-primary">
              <li>هنوز ارزیابی نشده</li>
              <li>دوره‌ی قبلش رو تموم نکرده. دوره‌ای که فقط خریده شده یا توی سبده حساب نمی‌شه</li>
              <li>سنش با بازه‌ی دوره نمی‌خونه</li>
              <li>همین دوره رو همین الان داره می‌گذرونه</li>
            </ul>
          </>
        ),
      },
      {
        id: "price",
        question: "قیمت دوره‌ها ثابته؟",
        answer: (
          <p>
            آره. هر دوره یه قیمت ثابت داره که توی صفحه‌ی خودش نوشته شده. سبد همیشه قیمت روز رو نشون می‌ده و همون قیمتی
            رو می‌دی که موقع زدن «پرداخت» دیدی. تعداد جلسه‌ها تقریبیه («حدوداً ۵ جلسه»)؛ سایت جلسه‌ها رو نمی‌شمره.
          </p>
        ),
      },
      {
        id: "no-price",
        question: "چرا دوره‌های سگ کار و ورزشی قیمت ندارن؟",
        answer: (
          <p>
            قیمت این دوره‌ها بعد از ارزیابی مشخص می‌شه و از سایت خریده نمی‌شن. بعد از ارزیابی با مرکز تماس بگیر:{" "}
            {PHONE_LINK}
          </p>
        ),
      },
    ],
  },

  /*------ 3: Paying ------*/
  {
    id: "paying",
    step: 3,
    title: "اول پرداخت، بعد تماس",
    questions: [
      {
        id: "how-buying-works",
        question: "خرید چطوری کار می‌کنه؟",
        answer: (
          <>
            <ol className="list-[persian] space-y-2 ps-6 marker:font-bold marker:text-primary">
              <li>
                توی صفحه‌ی دوره یکی از سگ‌هات رو انتخاب می‌کنی و «افزودن به سبد» رو می‌زنی. برای انتخاب سگ باید وارد شده
                باشی.
              </li>
              <li>توی سبد قیمت و قابل‌خرید بودن هر مورد رو می‌بینی.</li>
              <li>«پرداخت» تو رو به درگاه بانکی می‌بره.</li>
              <li>بعد از پرداخت موفق، {TRAINER} باهات تماس می‌گیره و آموزش رو هماهنگ می‌کنید.</li>
            </ol>
            <p className="mt-4 font-extrabold text-foreground">اول پرداخت، بعد تماس.</p>
          </>
        ),
      },
      {
        id: "cart",
        question: "سبدم توی گوشی دیگه‌م نیست، چرا؟",
        answer: (
          <p>
            سبد فقط توی همین مرورگر ذخیره می‌شه، نه توی حسابت. توی یه دستگاه یا مرورگر دیگه باید دوره‌ها رو دوباره اضافه
            کنی.
          </p>
        ),
      },
      {
        id: "several",
        question: "می‌تونم چند دوره رو با هم بخرم؟",
        answer: (
          <p>
            آره، حتی برای چند سگ، با یک پرداخت. فقط یه دوره رو برای یه سگ دو بار نمی‌شه توی سبد گذاشت. اگه یه مورد دیگه
            قابل‌خرید نباشه علامت می‌خوره، پرداخت نمی‌شه و توی جمع سبد حساب نمی‌شه.
          </p>
        ),
      },
      {
        id: "payment-failed",
        question: "پرداخت انجام نشد، چی می‌شه؟",
        answer: (
          <p>به سبد برمی‌گردی و نتیجه رو بالای صفحه می‌بینی. سبدت همون‌طور می‌مونه و می‌تونی دوباره پرداخت کنی.</p>
        ),
      },
      {
        id: "after-paying",
        question: "بعد از پرداخت چی می‌شه؟",
        answer: (
          <>
            <p>
              پیامک رسید برات می‌آد و {TRAINER} هم خبردار می‌شه. باهات تماس می‌گیره و آموزش رو هماهنگ می‌کنه. پرداخت‌ها
              و دوره‌هایی که خریدی توی «خریدها»ی حسابت هست.
            </p>
            <Link to="/account/purchases" className={LINK_CLASS}>
              خریدهای من
            </Link>
          </>
        ),
      },
      {
        id: "cant-take",
        question: `اگه ${TRAINER} نتونه سگمو بپذیره چی؟`,
        // Exactly this and nothing more: no timing, no policy. The site doesn't record refunds.
        answer: (
          <p>
            اگه وقتش پر باشه یا معلوم بشه سگ برای این دوره مناسب نیست، {TRAINER} دوره رو لغو می‌کنه و پولت رو بیرون از
            سایت بهت برمی‌گردونه. سایت برگشت پول رو ثبت نمی‌کنه.
          </p>
        ),
      },
    ],
  },

  /*------ 4: Training ------*/
  {
    id: "training",
    step: 4,
    title: "جلسه‌ها چطوریه؟",
    questions: [
      {
        id: "lessons",
        question: "جلسه‌ها کجا و کی برگزار می‌شه؟",
        answer: (
          <p>
            تمرین خصوصیه: یه سگ و مربی‌ش، توی خونه‌ی خودت یا بیرون. جای هر دوره توی صفحه‌ش نوشته شده. زمان جلسه‌ها رو{" "}
            {TRAINER} تلفنی باهات هماهنگ می‌کنه؛ سایت وقت نمی‌گیره و جلسه‌ها رو دنبال نمی‌کنه.
          </p>
        ),
      },
      {
        id: "boarding",
        question: "پانسیون هم هست؟",
        answer: (
          <p>
            اختیاریه و قیمتش جدا از قیمت دوره‌ست. قیمتش توی صفحه‌ی دوره نوشته شده (یا نوشته «برای قیمتش تماس بگیر»)، ولی
            از سایت خریده نمی‌شه. برای هماهنگی با مرکز تماس بگیر.
          </p>
        ),
      },
    ],
  },

  /*------ 5: Done ------*/
  {
    id: "done",
    step: 5,
    title: "وقتی دوره تموم شد",
    questions: [
      {
        id: "course-done",
        question: "دوره کی تموم می‌شه؟",
        answer: (
          <p>
            وقتی آموزش تموم شد، {TRAINER} دوره رو توی سایت «تمام‌شده» ثبت می‌کنه؛ تو کاری نمی‌کنی. بعدش دوره بین
            دوره‌های گذرونده‌ی سگت می‌نشینه، دوره‌هایی که پیش‌نیازشون همین بود باز می‌شن و بهت پیامک می‌رسه.
          </p>
        ),
      },
    ],
  },

  /*------ Account (not a step) ------*/
  {
    id: "account",
    step: null,
    title: "ورود و شماره‌ات",
    questions: [
      {
        id: "sign-in",
        question: "چطوری وارد می‌شم؟",
        answer: (
          <>
            <p>
              فقط با شماره‌ی موبایل و کد پیامکی؛ رمز عبور نداری. اولین باری که وارد می‌شی حسابت ساخته می‌شه و بعدش اسمتو
              می‌پرسیم.
            </p>
            <Link to="/privacy" className={LINK_CLASS}>
              حریم خصوصی
            </Link>
          </>
        ),
      },
      {
        id: "code-not-arrived",
        question: "کد پیامک نرسید، چیکار کنم؟",
        // No numbers for the hourly request limits: those are Admin settings.
        answer: (
          <p>
            کد پنج‌رقمیه و دو دقیقه اعتبار داره. بعد از ۶۰ ثانیه می‌تونی کد تازه بگیری. بعد از پنج بار اشتباه، اون کد
            باطل می‌شه و باید کد تازه بگیری. اگه باز هم نرسید با مرکز تماس بگیر.
          </p>
        ),
      },
    ],
  },
];

/** Every question's anchor, for the hash hook. */
export const QUESTION_IDS = FAQ_GROUPS.flatMap((group) => group.questions.map((question) => question.id));
