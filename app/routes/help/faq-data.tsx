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
              اول با شماره‌ی موبایلت ثبت‌نام می‌کنی. بعد سگ‌هات رو یکی‌یکی اضافه می‌کنی (توی «سگ‌های من» دکمه‌ی «+ معرفی
              سگ تازه» هست) و برای هر سگ جدا ارزیابی رایگان رو درخواست می‌دی. تا ارزیابی انجام نشده، دوره‌های اون سگ قفل
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
        question: "ارزیابی رایگان چیه؟",
        answer: (
          <>
            <p>قبل از شروع بعضی دوره‌ها باید ببینیم سگت الان توی چه مرحله‌ایه و چه آموزش‌هایی براش مناسب‌تره.</p>
            <p className="mt-3">
              ارزیابی یه آزمون و بررسی اولیه‌ست و دو بخش داره. بخش اول با توئه: توی درخواستت یکی از سگ‌هات رو انتخاب
              می‌کنی و می‌گی از چه تاریخی و چه ساعت‌هایی وقت داری؛ عکس و فیلم هم اگه خواستی (اختیاریه). بخش دوم با
              {TRAINER}ـه: باهات تماس می‌گیره، هماهنگ می‌کنید، سگت رو از نزدیک می‌بینه و نتیجه رو توی سایت ثبت می‌کنه.
            </p>
            <p className="mt-3">
              با نتیجه‌ی این ارزیابی مشخص می‌شه کدوم دوره‌ها برای سگت مناسبن. خود ارزیابی هم رایگانه. 🐾
            </p>
          </>
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
            رو می‌دی که موقع زدن «پرداخت» دیدی. تعداد جلسات به سگ و نوع دوره بستگی داره.
          </p>
        ),
      },
      {
        id: "no-price",
        question: "قیمت دوره‌های کاری و ورزشی چطور مشخص می‌شه؟",
        answer: (
          <>
            <p>
              این دوره‌ها قیمت دارن، اما هزینه‌ی نهایی به زمان شروع، سطح آموزش و شرایط سگ بستگی داره. برای همین، قبل از
              اینکه مبلغ قطعی اعلام کنیم، شرایط سگ و برنامه‌ی آموزشی رو بررسی می‌کنیم.
            </p>
            <p className="mt-3">از سایت خریده نمی‌شن؛ برای هماهنگی با مرکز تماس بگیر: {PHONE_LINK}</p>
          </>
        ),
      },
    ],
  },

  /*------ 3: Paying ------*/
  {
    id: "paying",
    step: 3,
    // The dog's heading. It used to lead with the payment («اول پرداخت، بعد تماس»), which the owner said feels bad. The
    // order itself is unchanged and the answers below say it plainly: the purchase comes first, then the call.
    title: "دوره‌مو برمی‌دارم، بعدش هماهنگ می‌کنیم",
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
            <p className="mt-4">
              بعد از ثبت درخواستت، {HEAD_TRAINER.name} باهات تماس می‌گیره تا درباره‌ی زمان برگزاری کلاس هماهنگ کنین.
            </p>
          </>
        ),
      },
      {
        id: "cart",
        question: "سبدم توی گوشی دیگه‌م هم هست؟",
        answer: (
          <p>
            آره. سبد توی حسابته، نه فقط توی یه مرورگر؛ با همون شماره وارد شی، هر دستگاهی که باشی می‌بینیش. اگه تازه یه
            چیزی جای دیگه اضافه کردی و اینجا نیست، صفحه رو یه بار تازه کن. دوره‌ای که می‌خری خودش از سبد می‌ره.
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
        // Exactly this and nothing more: no timing, no policy. The money goes back outside the site; the site records it.
        answer: (
          <p>
            اگه وقتش پر باشه یا معلوم بشه سگ برای این دوره مناسب نیست، {TRAINER} دوره رو لغو می‌کنه و پولت رو بیرون از
            سایت بهت برمی‌گردونه. بازپرداخت توی صفحه‌ی «خریدها»ی حسابت هم نشون داده می‌شه.
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
        question: "کلاس‌ها چه جوری برگزار می‌شن؟",
        answer: (
          <>
            <p>بسته به شرایط شما و سگتون، چند مدل کلاس داریم:</p>
            <ul className="mt-3 list-disc space-y-2 ps-6 marker:text-primary">
              <li>
                <strong>خصوصی در محل شما:</strong> {TRAINER} میاد پیشتون و آموزش به‌صورت اختصاصی انجام می‌شه.
              </li>
              <li>
                <strong>خصوصی در مجموعه:</strong> شما و سگتون به مجموعه میاید و آموزش اختصاصی دریافت می‌کنید.
              </li>
              <li>
                <strong>گروهی در مجموعه:</strong> چند سگ و صاحبشون کنار هم تمرین می‌کنن. این مدل هر وقت کلاس گروهی
                برگزار بشه فعاله.
              </li>
              <li>
                <strong>آموزش پانسیونی:</strong> سگتون برای مدتی در پانسیون می‌مونه و آموزش‌ها توسط مربی انجام می‌شن.
                برای این مدل هماهنگی قبلی لازمه.
              </li>
            </ul>
            <p className="mt-4">
              کجا تمرین می‌کنیم؟ این بستگی به دوره‌ی سگت داره! مثلاً بعضی آموزش‌ها داخل خونه انجام می‌شن و بعضی تمرین‌ها
              باید توی محیط بیرون انجام بشن. این موضوع با خصوصی یا گروهی بودن کلاس فرق داره: ممکنه کلاس کاملاً خصوصی
              باشه، ولی بخشی از تمرین‌هاش در خونه و بخشی بیرون برگزار بشه.
            </p>
            <p className="mt-4">
              جای هر دوره توی صفحه‌ش نوشته شده. زمان جلسه‌ها رو {TRAINER} تلفنی باهات هماهنگ می‌کنه.
            </p>
          </>
        ),
      },
      {
        id: "boarding",
        question: "پانسیون هم هست؟",
        answer: (
          <p>
            اختیاریه و قیمتش جدا از قیمت دوره‌ست. قیمتش توی صفحه‌ی دوره نوشته شده (یا نوشته «برای قیمتش تماس بگیر»)، ولی
            از سایت خریده نمی‌شه. برای آموزش پانسیونی، هماهنگی قبلی لازمه؛ چون فعلاً این خدمات با کمک مجموعه همکار انجام
            می‌شه. برای هماهنگی با مرکز تماس بگیر.
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
            دوره‌های گذرونده‌ی سگت می‌نشینه، دوره‌هایی که پیش‌نیازشون همین بود باز می‌شن و بهت پیامک می‌رسه. وقتی
            آموزش‌های دوره تموم بشه و سگت مراحل لازم رو با موفقیت پشت سر بذاره، یه گواهینامه اتمام دوره هم دریافت
            می‌کنه. 🏅
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
            <p>با شماره‌ی موبایل و کد پیامکی. اولین باری که وارد می‌شی حسابت ساخته می‌شه و بعدش اسمتو می‌پرسیم.</p>
            <p>
              اگه نمی‌خوای هر بار منتظر پیامک بمونی، بعد از ورود از «تنظیمات حساب» یه رمز عبور بذار؛ از اون به بعد با
              شماره و رمز هم وارد می‌شی. رمزت یادت رفت؟ با کد پیامکی وارد شو و همون‌جا رمز تازه بذار.
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
