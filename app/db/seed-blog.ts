import { readFile } from "node:fs/promises";
import path from "node:path";

import { inArray } from "drizzle-orm";

import { db } from "~/db/client.server";
import { blogPost } from "~/db/schema";
import { TEXT_BOLD, bodyFigures, type BlogBlock, type BlogBody, type BlogInline } from "~/lib/blog-body";
import type { BlogInput } from "~/orpc/blog/contract";
import { adminCreatePost, adminSetPostStatus } from "~/orpc/blog/service";
import { deleteMedia, uploadMedia } from "~/orpc/media/service";

/*===== Demo Blog =====*/
// Three published posts for the owner's showcase (F16), written through the Admin's own service like the rest of the
// demo, with their images through the real pipeline. General dog-keeping advice in the head trainer's voice; the owner
// replaces them with her own. Run by `npm run db:seed:demo`; `seedBlogPosts` replaces earlier demo posts, so it can run
// on its own too.

/*------ Body Builders ------*/
type Run = string | { bold: string };

function line(runs: Run[]): BlogInline[] {
  return runs.map((run) =>
    typeof run === "string"
      ? { type: "text", text: run, format: 0 }
      : { type: "text", text: run.bold, format: TEXT_BOLD },
  );
}

const p = (...runs: Run[]): BlogBlock => ({ type: "paragraph", children: line(runs) });
const h2 = (text: string): BlogBlock => ({ type: "heading", tag: "h2", children: line([text]) });
const h3 = (text: string): BlogBlock => ({ type: "heading", tag: "h3", children: line([text]) });
const tip = (...runs: Run[]): BlogBlock => ({ type: "tip", children: line(runs) });
const quote = (text: string): BlogBlock => ({ type: "quote", children: line([text]) });
const list = (listType: "bullet" | "number", items: Run[][]): BlogBlock => ({
  type: "list",
  listType,
  children: items.map((runs) => ({ type: "listitem", children: line(runs) })),
});
const doc = (...children: BlogBlock[]): BlogBody => ({ root: { type: "root", children } });

/*------ Images ------*/
const PUBLIC_PHOTOS = path.resolve(import.meta.dirname, "../../public/photo/home");
const SEED_IMAGES = path.resolve(import.meta.dirname, "seed-images");

async function upload({ adminId, file, kind }: { adminId: string; file: string; kind: "post" | "figure" }) {
  const bytes = await readFile(file);
  const type = file.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const uploaded = await uploadMedia({
    db,
    user: { id: adminId, role: "admin" },
    kind,
    file: new File([new Uint8Array(bytes)], path.basename(file), { type }),
  });
  if (uploaded.kind !== "success") throw new Error(`seedBlog: could not upload ${file}: ${JSON.stringify(uploaded)}`);
  return uploaded.media.id;
}

/*------ Posts ------*/
const DEMO_SLUGS = ["excited-urination-in-puppies", "first-week-with-a-puppy", "choosing-a-collar-and-leash"];

function excitedUrination(figureId: string): Omit<BlogInput, "coverMediaId"> {
  return {
    slug: "excited-urination-in-puppies",
    category: "puppy",
    title: "چرا توله‌ام موقع دیدن مهمان خودش را خیس می‌کند؟",
    excerpt:
      "ادرار هیجانی در توله‌ها رایج است و معمولاً با بزرگ شدن کم می‌شود. این‌جا می‌گوییم چرا پیش می‌آید و در خانه چه کار کنید که زودتر تمام شود.",
    coverAlt: "توله‌سگی که کنار در ورودی نشسته و به مهمان نگاه می‌کند",
    relatedCourseSlug: "house-manner",
    body: doc(
      p(
        "در را باز می‌کنید، توله از شوق بالا و پایین می‌پرد و چند ثانیه بعد یک لکه‌ی کوچک روی زمین است. این ",
        { bold: "ادرار هیجانی" },
        " است و در توله‌ها خیلی رایج است. خبر خوب این‌که با چند تغییر ساده در رفتار خودتان، معمولاً زودتر از آن‌چه فکر می‌کنید تمام می‌شود.",
      ),
      h2("چرا پیش می‌آید؟"),
      p(
        "کنترل مثانه در توله هنوز کامل نیست. وقتی هیجان زیاد می‌شود، بدن فرصت نمی‌کند جلویش را بگیرد. این کار لجبازی یا بی‌ادبی نیست و توله نمی‌فهمد چه شده.",
      ),
      list("bullet", [
        ["بیشتر موقع ", { bold: "سلام و احوال‌پرسی" }, " پیش می‌آید: آمدن شما به خانه یا رسیدن مهمان."],
        ["بازی‌های پرهیجان و صدای بلند هم می‌توانند شروعش کنند."],
        ["در توله‌های خجالتی، گاهی با ادرار از سر ترس اشتباه گرفته می‌شود."],
      ]),
      {
        type: "figure",
        mediaId: figureId,
        alt: "توله‌سگ پشمالویی که روی زمین نشسته",
        caption: "آرام ماندن شما، آرام شدن توله را آسان‌تر می‌کند.",
      },
      h2("در خانه چه کار کنیم؟"),
      h3("سلام را آرام کنید"),
      p(
        "وقتی وارد خانه می‌شوید، چند دقیقه به توله توجه نکنید. وقتی آرام شد، خم شوید و با صدای ملایم سلام کنید. از مهمان‌ها هم بخواهید همین کار را بکنند.",
      ),
      h3("بیرون، قبل از هیجان"),
      p("قبل از رسیدن مهمان یا بعد از برگشتن به خانه، توله را برای دستشویی بیرون ببرید تا مثانه‌اش خالی باشد."),
      tip("هیچ‌وقت توله را به خاطر ادرار هیجانی دعوا نکنید. دعوا هیجان و ترس را بیشتر می‌کند و مشکل را طولانی‌تر."),
      list("number", [
        ["لکه را بی‌سروصدا و بدون نگاه کردن به توله تمیز کنید."],
        ["از پاک‌کننده‌ی آنزیمی استفاده کنید تا بو نماند."],
        ["هر بار که آرام سلام کرد، با یک تشویق کوچک جایزه‌اش بدهید."],
      ]),
      h2("کی باید نگران باشیم؟"),
      p(
        "اگر بعد از شش ماهگی هنوز ادامه دارد، یا ادرار بی‌دلیل و در زمان آرامش هم پیش می‌آید، اول با دامپزشک مشورت کنید تا مشکل جسمی کنار گذاشته شود. بعد از آن، ارزیابی رفتاری کمک می‌کند ببینیم ریشه‌اش کجاست.",
      ),
      quote("صبر و آرامش شما، مؤثرترین ابزار این مرحله است."),
    ),
    titleEn: "Why does my puppy pee when guests arrive?",
    excerptEn:
      "Excited urination is common in puppies and usually fades as they grow. Here is why it happens and what you can do at home to help it pass sooner.",
    coverAltEn: "A puppy sitting by the front door, looking up at a guest",
    bodyEn: doc(
      p(
        "You open the door, your puppy bounces with joy, and a few seconds later there is a small puddle on the floor. This is ",
        { bold: "excited urination" },
        ", and it is very common in puppies. The good news: with a few changes in how you greet them, it usually passes sooner than you think.",
      ),
      h2("Why does it happen?"),
      p(
        "A puppy's bladder control isn't finished yet. When excitement peaks, the body can't hold on. It isn't stubbornness, and your puppy doesn't know it happened.",
      ),
      list("bullet", [
        ["It mostly happens during ", { bold: "greetings" }, ": you coming home, or a guest arriving."],
        ["Loud, wild play can set it off too."],
        ["In shy puppies it can be mistaken for urinating out of fear."],
      ]),
      {
        type: "figure",
        mediaId: figureId,
        alt: "A fluffy puppy sitting on the floor",
        caption: "Your calm makes it easier for your puppy to calm down.",
      },
      h2("What to do at home"),
      h3("Keep greetings calm"),
      p(
        "When you come in, ignore your puppy for a few minutes. Once they settle, crouch down and say hello softly. Ask guests to do the same.",
      ),
      h3("Outside, before the excitement"),
      p("Take your puppy out to relieve themselves before guests arrive and right after you get home."),
      tip("Never scold a puppy for excited urination. Scolding adds excitement and fear, and makes it last longer."),
      list("number", [
        ["Clean up quietly, without looking at your puppy."],
        ["Use an enzyme cleaner so no smell is left."],
        ["Reward every calm hello with a small treat."],
      ]),
      h2("When should we worry?"),
      p(
        "If it carries on past six months, or happens when your puppy is calm, see your vet first to rule out a medical cause. After that, a behavior evaluation helps us find where it comes from.",
      ),
      quote("Your patience and calm are the strongest tools at this stage."),
    ),
  };
}

const FIRST_WEEK: Omit<BlogInput, "coverMediaId"> = {
  slug: "first-week-with-a-puppy",
  category: "care",
  title: "هفته‌ی اول توله در خانه: یک برنامه‌ی ساده",
  excerpt:
    "هفته‌ی اول برای توله پر از چیزهای تازه است. با یک برنامه‌ی ساده برای خواب، غذا و دستشویی، هم او زودتر جا می‌افتد و هم شما آرام‌تر می‌مانید.",
  coverAlt: "توله‌سگی که روی پتوی نرم در جای خوابش دراز کشیده",
  relatedCourseSlug: "house-manner",
  body: doc(
    p(
      "توله‌ای که تازه به خانه آمده، همه‌چیز را از نو یاد می‌گیرد: بوها، صداها و آدم‌ها. چیزی که بیشتر از هر وسیله‌ای کمکش می‌کند، یک روز قابل پیش‌بینی است.",
    ),
    h2("یک جای امن برای خواب"),
    p(
      "یک گوشه‌ی آرام، دور از رفت‌وآمد، با یک پتوی نرم کافی است. توله‌ها روزی چندین ساعت می‌خوابند و خواب کافی هیجان و گاز گرفتن را کمتر می‌کند.",
    ),
    h2("ساعت‌های ثابت"),
    list("bullet", [
      [{ bold: "غذا" }, " در ساعت‌های ثابت، به اندازه‌ای که دامپزشک گفته."],
      [{ bold: "دستشویی" }, " بعد از خواب، بعد از غذا و بعد از بازی."],
      [{ bold: "بازی" }, " کوتاه و چندباره، نه یک بار طولانی."],
    ]),
    tip("هر بار که توله در جای درست دستشویی کرد، همان لحظه تشویقش کنید. زمان تشویق مهم‌تر از اندازه‌ی جایزه است."),
    h2("مهمان‌ها و بیرون رفتن"),
    p(
      "در هفته‌ی اول مهمانی شلوغ نگیرید. آشنایی با آدم‌ها و جاهای تازه را آرام و کم‌کم شروع کنید و قبل از بیرون رفتن در محیط‌های عمومی، برنامه‌ی واکسن را با دامپزشک هماهنگ کنید.",
    ),
  ),
};

const COLLAR_AND_LEASH: Omit<BlogInput, "coverMediaId"> = {
  slug: "choosing-a-collar-and-leash",
  category: "training",
  title: "قلاده و لید مناسب را چطور انتخاب کنیم؟",
  excerpt:
    "قلاده‌ی درست، راه رفتن با سگ را راحت‌تر و امن‌تر می‌کند. چند نکته برای انتخاب اندازه، جنس و طول لید، پیش از اولین پیاده‌روی‌ها.",
  coverAlt: "سگ ژرمن شپرد با قلاده که کنار صاحبش ایستاده",
  relatedCourseSlug: "elementary",
  body: doc(
    p("قلاده و لید اولین ابزار آموزش در بیرون از خانه‌اند. انتخاب درست‌شان کار را برای شما و سگ آسان‌تر می‌کند."),
    h2("اندازه"),
    p("بین قلاده و گردن باید جای دو انگشت باشد: نه آن‌قدر تنگ که اذیت کند، نه آن‌قدر گشاد که از سر بیرون بیاید."),
    h2("جنس و طول لید"),
    list("bullet", [
      ["برای شروع، یک لید ساده‌ی حدود دو متری بهتر از لیدهای جمع‌شونده است."],
      ["جنس محکم و دسته‌ی راحت، در کشیدن‌های ناگهانی دست شما را نجات می‌دهد."],
    ]),
    tip("قلاده را اول چند بار کوتاه در خانه ببندید و با بازی و جایزه همراهش کنید، بعد بروید بیرون."),
    h2("اگر سگ لید را می‌کشد"),
    p(
      "کشیدن لید با تمرین درست می‌شود، نه با قلاده‌های آزاردهنده. هر بار که لید شل است، قدم بردارید و هر بار که کشید، بایستید. سگ زود می‌فهمد کدام راه جلو می‌رود.",
    ),
  ),
};

/*===== Seed =====*/
/**
 * Replaces the demo posts: deletes the earlier ones (by their slugs) and their images, uploads the covers and the
 * figure, then creates and publishes the three posts as the Admin. Run again, it leaves nothing of the last run behind.
 *
 * @throws When an upload or a post is refused, so a broken demo is noticed at seed time.
 */
export async function seedBlogPosts({ adminId }: { adminId: string }): Promise<void> {
  /*------ Earlier demo posts and their images ------*/
  const earlier = await db
    .select({ coverMediaId: blogPost.coverMediaId, body: blogPost.body, bodyEn: blogPost.bodyEn })
    .from(blogPost)
    .where(inArray(blogPost.slug, DEMO_SLUGS));
  const oldMediaIds = new Set(
    earlier.flatMap((post) => [
      ...(post.coverMediaId ? [post.coverMediaId] : []),
      ...[post.body, post.bodyEn].flatMap((body) => (body ? bodyFigures(body as BlogBody).map((f) => f.mediaId) : [])),
    ]),
  );
  await db.delete(blogPost).where(inArray(blogPost.slug, DEMO_SLUGS));
  // After the posts, which point at them. The seed uploads its own images, so no other post shares them; a cover that
  // somehow is still used stays (its foreign key refuses the delete).
  for (const mediaId of oldMediaIds) {
    await deleteMedia({ db, mediaId }).catch((error: unknown) =>
      console.warn(`seedBlog: kept media ${mediaId}, still in use`, error instanceof Error ? error.message : error),
    );
  }

  /*------ New posts ------*/

  const [coverOne, coverTwo, coverThree, figure] = await Promise.all([
    upload({ adminId, kind: "post", file: path.join(PUBLIC_PHOTOS, "course-house-manner.webp") }),
    upload({ adminId, kind: "post", file: path.join(PUBLIC_PHOTOS, "course-companion-1.webp") }),
    upload({ adminId, kind: "post", file: path.join(SEED_IMAGES, "dog-leo.jpg") }),
    upload({ adminId, kind: "figure", file: path.join(SEED_IMAGES, "dog-pesteh.jpg") }),
  ]);

  // Oldest first, so the list shows them newest first in this order.
  for (const input of [
    { ...COLLAR_AND_LEASH, coverMediaId: coverThree },
    { ...FIRST_WEEK, coverMediaId: coverTwo },
    { ...excitedUrination(figure), coverMediaId: coverOne },
  ]) {
    const created = await adminCreatePost({ db, userId: adminId, input });
    if (created.kind !== "success") throw new Error(`seedBlog: ${input.slug} was refused: ${JSON.stringify(created)}`);
    const published = await adminSetPostStatus({ db, userId: adminId, id: created.post.id, status: "published" });
    if (published.kind !== "success")
      throw new Error(`seedBlog: ${input.slug} can't be published: ${JSON.stringify(published)}`);
  }
}
