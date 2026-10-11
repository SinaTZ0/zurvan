/*===== Reviews =====*/
// Two shapes on purpose: some owners just leave a comment, others rate the course they took. Shown over the hero
// photo in this order.
export type Review =
  | { kind: "comment"; id: string; quote: string; author: string; pet: string }
  | {
      kind: "course";
      id: string;
      course: { title: string; photo: string };
      /** Whole stars, 1 to 5. */
      rating: number;
      quote: string;
      author: string;
      pet: string;
    };

// Sample data until owners can review the runs they attended.
export const REVIEWS: Review[] = [
  {
    kind: "comment",
    id: "tileh",
    quote: "تا زنگ در را می‌زدند، بیست دقیقه پارس می‌کرد. حالا یک بار پارس می‌کند و می‌رود روی تشکش.",
    author: "آرش مرادی",
    pet: "صاحب تیله، ژرمن‌شپرد سه‌ساله",
  },
  {
    kind: "course",
    id: "cookie",
    course: { title: "اطاعت‌پذیری مقدماتی سگ", photo: "/demo/course-obedience.jpg" },
    rating: 5,
    quote: "جلسه‌ها کوتاه و دقیق بود و مربی تمرین‌های خانه را هر هفته پیگیری می‌کرد.",
    author: "مریم کاظمی",
    pet: "صاحب کوکی",
  },
  {
    kind: "comment",
    id: "nokhodi",
    quote: "هر بار که مهمان می‌آمد، نخودی رویش می‌پرید. حالا کنار در می‌نشیند و منتظر اجازه می‌ماند.",
    author: "سارا جعفری",
    pet: "صاحب نخودی، لابرادور دوساله",
  },
  {
    kind: "course",
    id: "buddy",
    course: { title: "راه رفتن با قلاده، بدون کشیدن", photo: "/demo/course-leash.jpg" },
    rating: 4,
    quote: "پیاده‌روی عصر دیگر کشتی گرفتن نیست. فقط کاش ساعت کلاس کمی دیرتر بود.",
    author: "رضا توکلی",
    pet: "صاحب بادی",
  },
  {
    kind: "course",
    id: "pesteh",
    course: { title: "آموزش توله‌سگ، ۲ تا ۶ ماهگی", photo: "/demo/course-puppy.jpg" },
    rating: 5,
    quote: "از هفته‌ی اول جای دستشویی‌اش را یاد گرفت. مربی صبور بود و همه‌ی سؤال‌هایم را جواب داد.",
    author: "نیلوفر احمدی",
    pet: "صاحب پسته",
  },
];
