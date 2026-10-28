// Captures the blog (F16): the list with its sections and search (a search typed with Arabic letters, and one that finds
// nothing), the end of an article, then the Admin writing a post, saving it as a draft, publishing it from the list, and
// the post on the public blog. Usage: node scripts/feature-boards/14-blog.capture.mjs [base-url]
import { ADMIN_PHONE, PHONE, createCapture } from "./capture-lib.mjs";

const { OUT, shots, go, box, shoot, newPage, signIn, finish } = await createCapture({ board: "14-blog" });

/*===== Test Data =====*/
// The search is typed the way an Arabic keyboard types it (ي and no ZWNJ); the post says «ادرار هیجانی».
const ARABIC_QUERY = "ادرار هيجاني";
const NOTHING_QUERY = "اسکیت‌برد";
const SEEDED_POST = "/blog/excited-urination-in-puppies";
const POST = {
  title: "سگ کوچک هم آموزش لازم دارد",
  excerpt:
    "خیلی‌ها فکر می‌کنند سگ کوچک چون در بغل جا می‌شود آموزش نمی‌خواهد. اما پارس بی‌وقفه، گاز گرفتن و نیامدن وقتی صدایش می‌کنیم در سگ کوچک هم همان‌قدر دردسر است.",
  intro:
    "هر هفته صاحب یک پامرانین یا شیتزو به من می‌گوید سگم کوچک است، آموزش برای سگ‌های بزرگ است. ولی سگ کوچک هم سگ است و همان چیزها را لازم دارد.",
  heading: "از کجا شروع کنیم؟",
  body: "از سه فرمان ساده شروع کنید: بنشین، بمان و بیا. روزی دو بار، هر بار پنج دقیقه، با جایزه‌ی کوچک.",
  tip: "من هم دلم می‌خواد بدونم چی ازم می‌خوای. کوتاه و شاد تمرین کن!",
  coverAlt: "پامرانین سفیدی که با قلاده کنار یک نیمکت چوبی نشسته",
  slug: "small-dogs-need-training-too",
};

/*===== Helpers =====*/
/** Scrolls down the whole page and back, so lazy images load before a tall shot. */
async function loadLazyImages(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
  }
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
}

/**
 * A shot of what the phone screen shows at its current scroll (a taller screen for the step), with the floating save
 * bar where it floats; its boxes are relative to the screen.
 */
async function shootScreen(page, name, targets) {
  await page.waitForTimeout(600);
  const scrollY = await page.evaluate(() => window.scrollY);
  const viewport = page.viewportSize();
  const boxes = {};
  for (const [key, locator] of Object.entries(targets)) {
    const b = await box(page, locator);
    boxes[key] = b && { ...b, y: b.y - scrollY };
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, animations: "disabled" });
  shots[name] = { width: PHONE.width, height: viewport.height, fullHeight: viewport.height, url: page.url(), boxes };
  const lost = Object.entries(boxes)
    .filter(([, b]) => !b)
    .map(([k]) => k);
  if (lost.length) console.warn(`${name}: not found: ${lost.join(", ")}`);
}

/*===== An earlier run's post goes first =====*/
// So the blog reads as before the post is written, and its address is free again.
const { context: admin, page } = await signIn({ phone: ADMIN_PHONE });
await go(page, "/admin/blog");
const earlier = page.getByRole("button", { name: `حذف ${POST.title}` });
while ((await earlier.count()) > 0) {
  await earlier.first().click();
  await page.getByRole("button", { name: "برای همیشه پاکش کن" }).click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle");
}

/*===== Reading =====*/
{
  const { context, page: reader } = await newPage();

  /*------ 1. The blog ------*/
  await go(reader, "/blog");
  await loadLazyImages(reader);
  await shoot(
    reader,
    "01-blog",
    {
      author: reader.locator("#blog-title").locator("xpath=following-sibling::*[2]"),
      sections: reader.getByRole("link", { name: "همه", exact: true }).locator(".."),
      search: reader.locator("#blog-search"),
      lead: reader.getByRole("heading", { level: 2 }).first(),
      more: reader.getByRole("heading", { level: 2 }).nth(1),
    },
    { maxHeight: 1450 },
  );

  /*------ 2. A search typed with Arabic letters ------*/
  await reader.locator("#blog-search").fill(ARABIC_QUERY);
  await reader.waitForURL((url) => url.searchParams.has("q"));
  await reader.waitForLoadState("networkidle");
  await reader.getByText(/نوشته برای/).waitFor();
  await loadLazyImages(reader);
  await shoot(
    reader,
    "02-search",
    {
      search: reader.locator("#blog-search"),
      count: reader.getByText(/نوشته برای/).first(),
      found: reader.getByRole("heading", { level: 2, name: /خیس/ }),
    },
    { maxHeight: 1250 },
  );

  /*------ 3. Nothing found ------*/
  await reader.locator("#blog-search").fill(NOTHING_QUERY);
  await reader.locator("#blog-empty-title").waitFor();
  await reader.waitForTimeout(800);
  await shoot(
    reader,
    "03-nothing",
    {
      search: reader.locator("#blog-search"),
      empty: reader.locator("#blog-empty-title"),
      clear: reader.getByRole("button", { name: "پاک کردن جست‌وجو" }),
    },
    { maxHeight: 1350 },
  );

  /*------ 4. The end of an article ------*/
  await go(reader, SEEDED_POST);
  await loadLazyImages(reader);
  // From the mascot's tip (the article's last part) down to the course its end suggests.
  const tipBox = await box(reader, reader.getByRole("complementary", { name: "زروان می‌گه" }).first());
  const top = Math.round((tipBox?.y ?? 2400) - 60);
  const courseEnd = await box(reader, reader.getByRole("link", { name: "دیدن دوره" }));
  await shoot(
    reader,
    "04-article-end",
    {
      tip: reader.getByRole("complementary", { name: "زروان می‌گه" }).first(),
      author: reader.getByRole("link", { name: "بیشتر درباره‌ی طلا" }),
      closing: reader.locator("#post-closing-title"),
      course: reader.getByRole("link", { name: "دیدن دوره" }),
    },
    { top, maxHeight: Math.round(courseEnd.y + courseEnd.h + 50 - top) },
  );
  await context.close();
}

/*===== Writing (the Admin) =====*/
/*------ 5. The text ------*/
await go(page, "/admin/blog/new");
await page.locator("#post-title").fill(POST.title);
await page.locator("#post-excerpt").fill(POST.excerpt);
const editor = page.getByRole("textbox", { name: "متن نوشته" });
await editor.click();
await page.keyboard.type(POST.intro);
await page.keyboard.press("Enter");
await page.getByRole("button", { name: "تیتر بخش (H2)" }).first().click();
await page.keyboard.type(POST.heading);
await page.keyboard.press("Enter");
await page.keyboard.type(POST.body);
await page.keyboard.press("Enter");
await page
  .getByRole("button", { name: /سگ می‌گه/ })
  .first()
  .click();
await page.keyboard.type(POST.tip);
await page.locator("#post-title").click(); // leaves the editor, so its caret and toolbar state settle
const saveBar = page.locator("[data-post-save-bar]");
await saveBar.evaluate((el) => (el.style.visibility = "hidden"));
await shoot(
  page,
  "05-text",
  {
    title: page.locator("#post-title"),
    excerpt: page.locator("#post-excerpt"),
    toolbar: page.getByRole("button", { name: "تیتر بخش (H2)" }).first().locator(".."),
    heading: editor.locator("h2").first(),
    tip: page.getByRole("button", { name: /سگ می‌گه/ }).first(),
    tipBlock: editor.locator(":scope > *").last(),
  },
  { maxHeight: (await box(page, page.locator("#post-plate-cover-title"))).y - 40 },
);
await saveBar.evaluate((el) => (el.style.visibility = ""));

/*------ 6. The cover and the details, then the draft ------*/
await page.locator("#post-coverMediaId").setInputFiles("app/db/seed-images/dog-pesteh.jpg");
await page.locator("#post-coverAlt").fill(POST.coverAlt);
await page.locator("#post-slug").fill(POST.slug);
await page
  .locator("label")
  .filter({ has: page.locator("input[name=category][value=training]") })
  .click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(2500); // the cover's upload
await page.setViewportSize({ width: PHONE.width, height: 1500 });
await page.locator("#post-plate-cover-title").evaluate((el) => {
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70);
});
await shootScreen(page, "06-cover", {
  cover: page.locator("#post-plate-cover-title").locator("xpath=ancestor::section[1]").locator("img").first(),
  alt: page.locator("#post-coverAlt"),
  slug: page.locator("#post-slug"),
  category: page.locator("input[name=category]").first().locator("xpath=ancestor::fieldset[1]"),
  course: page.locator("#post-relatedCourseSlug"),
  draft: page.getByRole("button", { name: "ذخیره‌ی پیش‌نویس" }),
});
await page.setViewportSize(PHONE);
await page.getByRole("button", { name: "ذخیره‌ی پیش‌نویس" }).click();
await page.waitForURL(/\/admin\/blog\/[^/]+\/edit/);
await page.waitForLoadState("networkidle");

/*------ 7. The list, with the draft ------*/
await go(page, "/admin/blog");
const row = page.locator("li").filter({ hasText: POST.title });
await shoot(
  page,
  "07-list",
  {
    tabs: page.getByRole("button", { name: /^پیش‌نویس/ }).locator(".."),
    newPost: page.getByRole("link", { name: "نوشته‌ی تازه" }),
    row: row.getByRole("link", { name: POST.title }),
    chip: row.getByText("پیش‌نویس", { exact: true }),
    publish: row.getByRole("button", { name: "انتشار", exact: true }),
  },
  { maxHeight: 900 },
);
await row.getByRole("button", { name: "انتشار", exact: true }).click();
await row.getByRole("button", { name: "لغو انتشار" }).waitFor();
await admin.close();

/*===== 8. On the public blog =====*/
{
  const { context, page: reader } = await newPage();
  await go(reader, "/blog");
  await loadLazyImages(reader);
  await shoot(
    reader,
    "08-published",
    {
      lead: reader.getByRole("heading", { level: 2, name: POST.title }),
      section: reader.getByText("آموزش", { exact: true }).nth(1),
      cover: reader.locator(`img[alt="${POST.coverAlt}"]`),
    },
    { maxHeight: 1150 },
  );
  await context.close();
}

await finish({ post: POST.slug });
