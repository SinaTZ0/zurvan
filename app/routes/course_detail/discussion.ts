/*===== Discussion =====*/
// A course page's reviews and questions in one list (spec 3.15): a review is an owner rating the course and the trainer
// after their dog finished it, a question can come from anyone before booking. Replies are one level deep.
//
// Sample data until the Review and Comment entities exist. Some courses have none on purpose, so the empty state shows.

export type DiscussionReply = {
  /** Only the head trainer replies for now; any trainer or the Admin can once trainer accounts exist. */
  text: string;
  date: string;
};

export type DiscussionEntry = {
  id: string;
  /** First name only, as the spec shows comments: «سارا، همراه لئو». */
  author: string;
  dog?: string;
  text: string;
  /** ISO date. */
  date: string;
  reply?: DiscussionReply;
} & (
  { kind: "review"; /** Whole stars, 1 to 5. */ courseRating: number; trainerRating: number } | { kind: "question" }
);

const DISCUSSIONS: Record<string, DiscussionEntry[]> = {
  cgc: [
    {
      id: "cgc-1",
      kind: "review",
      author: "سارا",
      dog: "لئو",
      courseRating: 5,
      trainerRating: 5,
      text: "لئو از صدای سشوار فرار می‌کرد و زیر تخت قایم می‌شد. هفته‌ی ششم خودش آمد کنار سشوار نشست. دامپزشکش هم فرقش را فهمید.",
      date: "2026-09-14",
    },
    {
      id: "cgc-2",
      kind: "question",
      author: "مهدی",
      dog: "راکی",
      text: "راکی هشت سالش است. برای سگ بزرگسال هم این دوره جواب می‌دهد یا دیر شده؟",
      date: "2026-09-02",
      reply: {
        text: "دیر نشده. سگ بزرگسال هم یاد می‌گیرد، فقط گاهی چند جلسه بیشتر طول می‌کشد. در ارزیابی رایگان می‌بینمش و دقیق‌تر می‌گویم.",
        date: "2026-09-03",
      },
    },
    {
      id: "cgc-3",
      kind: "review",
      author: "نازنین",
      dog: "هاپو",
      courseRating: 4,
      trainerRating: 5,
      text: "تمرین کنار جمعیت برای هاپو سخت بود و چند جلسه طول کشید، ولی حالا در پیاده‌رو آرام کنارم راه می‌رود.",
      date: "2026-08-21",
    },
    {
      id: "cgc-4",
      kind: "question",
      author: "پریسا",
      text: "تست CGC را جدا هم می‌شود داد، بدون این‌که دوره را برداریم؟",
      date: "2026-08-10",
      reply: {
        text: "بله. اگر سگت این‌ها را بلد است، تست را جدا رزرو کن. قبولی در تست همان اعتبار دوره را دارد.",
        date: "2026-08-10",
      },
    },
    {
      id: "cgc-5",
      kind: "review",
      author: "امیر",
      dog: "بلا",
      courseRating: 5,
      trainerRating: 5,
      text: "بلا حالا وقتی زنگ در را می‌زنند، پارس نمی‌کند و منتظر می‌ماند. جلسه‌ها در خانه‌ی خودمان بود و همین خیلی کمک کرد.",
      date: "2026-07-30",
    },
  ],
  "house-manner": [
    {
      id: "house-1",
      kind: "review",
      author: "نیلوفر",
      dog: "پسته",
      courseRating: 5,
      trainerRating: 5,
      text: "از هفته‌ی اول جای دستشویی‌اش را یاد گرفت. آرمان صبور بود و همه‌ی سؤال‌هایم را جواب داد.",
      date: "2026-09-20",
    },
    {
      id: "house-2",
      kind: "question",
      author: "علی",
      dog: "مشکی",
      text: "آپارتمان ما کوچک است. جلسه‌ها در همین فضا ممکن است؟",
      date: "2026-09-11",
      reply: {
        text: "بله، بیشتر قواعد خانه را همان‌جا که سگ زندگی می‌کند یاد می‌دهم. برای هم‌قدم چند دقیقه‌ای به راه‌پله یا کوچه می‌رویم.",
        date: "2026-09-12",
      },
    },
    {
      id: "house-3",
      kind: "review",
      author: "سارا",
      dog: "نخودی",
      courseRating: 5,
      trainerRating: 4,
      text: "نخودی دیگر روی مهمان‌ها نمی‌پرد و کنار در منتظر اجازه می‌ماند. فقط کاش جلسه‌ها کمی دیرتر شروع می‌شد.",
      date: "2026-08-05",
    },
  ],
  elementary: [
    {
      id: "elementary-1",
      kind: "review",
      author: "مریم",
      dog: "کوکی",
      courseRating: 5,
      trainerRating: 5,
      text: "جلسه‌ها کوتاه و دقیق بود و آرمان تمرین‌های خانه را هر هفته پیگیری می‌کرد.",
      date: "2026-09-08",
    },
    {
      id: "elementary-2",
      kind: "question",
      author: "حمید",
      text: "فرق این دوره با سگ همدم ۱ چیست؟ کدام را انتخاب کنم؟",
      date: "2026-08-28",
      reply: {
        text: "هر دو مسیر به یک نتیجه می‌رسند؛ مسیر همدم در چهار قدم کوتاه‌تر جلو می‌رود. در ارزیابی رایگان با هم یکی را انتخاب می‌کنیم.",
        date: "2026-08-29",
      },
    },
  ],
  "companion-1": [
    {
      id: "companion-1-1",
      kind: "review",
      author: "رضا",
      dog: "بادی",
      courseRating: 4,
      trainerRating: 5,
      text: "پیاده‌روی عصر دیگر کشتی گرفتن نیست. بادی حالا به من نگاه می‌کند، نه به هر گربه‌ای که رد می‌شود.",
      date: "2026-09-17",
    },
  ],
  bmc: [
    {
      id: "bmc-1",
      kind: "question",
      author: "کیان",
      dog: "تایسون",
      text: "تایسون نُه ماهه است. هنوز می‌تواند این دوره را بگیرد؟",
      date: "2026-09-25",
      reply: {
        text: "این دوره برای همان شش تا هفت ماهگی است. برای تایسون دوره‌ی دیگری هست که همین‌ها را بیرون تمرین می‌کند؛ در ارزیابی رایگان انتخابش می‌کنیم.",
        date: "2026-09-25",
      },
    },
  ],
  "behavior-modification": [
    {
      id: "behavior-1",
      kind: "question",
      author: "شیما",
      dog: "جکی",
      text: "ویدیو باید چقدر باشد؟ جکی فقط وقتی تنهاست پارس می‌کند و من آن موقع خانه نیستم.",
      date: "2026-09-19",
      reply: {
        text: "چند دقیقه کافی است. گوشی را روشن بگذار و از خانه برو؛ همان ویدیو بهترین چیزی است که می‌توانم ببینم.",
        date: "2026-09-19",
      },
    },
  ],
};

/** The course's reviews and questions, newest first. Empty for a course nobody has written about yet. */
export function getDiscussion(slug: string): DiscussionEntry[] {
  // Written newest first above, the order the page shows them in.
  return DISCUSSIONS[slug] ?? [];
}

/*===== Ratings =====*/
export type RatingSummary = { course: number; trainer: number; count: number };

/** The course and trainer averages from the reviews, or `null` before the first review. */
export function summarizeRatings(entries: DiscussionEntry[]): RatingSummary | null {
  const reviews = entries.filter((entry) => entry.kind === "review");
  if (reviews.length === 0) return null;
  const average = (pick: (review: (typeof reviews)[number]) => number) =>
    reviews.reduce((sum, review) => sum + pick(review), 0) / reviews.length;
  return {
    course: average((review) => review.courseRating),
    trainer: average((review) => review.trainerRating),
    count: reviews.length,
  };
}
