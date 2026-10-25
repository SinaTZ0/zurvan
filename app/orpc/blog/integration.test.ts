import { randomUUID } from "node:crypto";

import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { auditEvent, blogPost, media, user } from "~/db/schema";
import type { BlogBody } from "~/lib/blog-body";
import { phonePlaceholderEmail } from "~/lib/phone";
import type { BlogInput } from "~/orpc/blog/contract";
import {
  adminCreatePost,
  adminDeletePost,
  adminSetPostStatus,
  adminUpdatePost,
  getPost,
  listPosts,
} from "~/orpc/blog/service";

/*===== Blog =====*/
// Runs against the real database, where the consequences are: a draft or an unpublished post is never public, a post
// without English doesn't exist on `/en`, an old address redirects, the server decides an image's size, and a search
// finds Persian however it was typed. Needs the schema (`deploy/upgrade-2026-10-blog.sql` or `npm run db:push`). The
// test makes its own Admin, images and posts (slugs end with a per-run id), so it doesn't depend on the demo seed.

const runId = randomUUID().slice(0, 8);
const phone = `096${Math.floor(10000 + Math.random() * 89999)}000`;
const slugOf = (name: string) => `t-${name}-${runId}`;

const admin = { id: `test-blog-admin-${runId}` };
const coverId = randomUUID();
const figureId = randomUUID();
// An image of the wrong kind, uploaded by the same Admin.
const dogPhotoId = randomUUID();

function body(text: string, extra: BlogBody["root"]["children"] = []): BlogBody {
  return {
    root: {
      type: "root",
      children: [{ type: "paragraph", children: [{ type: "text", text, format: 0 }] }, ...extra],
    },
  };
}

function postInput(name: string, overrides: Partial<BlogInput> = {}): BlogInput {
  return {
    slug: slugOf(name),
    category: "behavior",
    title: `نوشته‌ی آزمایشی ${name}`,
    excerpt: "این خلاصه‌ی یک نوشته‌ی آزمایشی است که باید دست‌کم چهل حرف داشته باشد.",
    body: body(`ادرار هيجاني در توله‌ها عادی است ${runId}`),
    coverMediaId: coverId,
    coverAlt: "سگی در پارک",
    relatedCourseSlug: null,
    ...overrides,
  };
}

/** Creates a draft through the Admin service and fails the test when it is refused. */
async function makePost(name: string, overrides: Partial<BlogInput> = {}) {
  const result = await adminCreatePost({ db, userId: admin.id, input: postInput(name, overrides) });
  if (result.kind !== "success") throw new Error(`Could not create ${name}: ${JSON.stringify(result)}`);
  return result.post;
}

function searchFor(q: string) {
  return listPosts({ db, locale: "fa", q });
}

async function publish(id: string) {
  const result = await adminSetPostStatus({ db, userId: admin.id, id, status: "published" });
  if (result.kind !== "success") throw new Error(`Could not publish ${id}: ${JSON.stringify(result)}`);
  return result.post;
}

beforeAll(async () => {
  await db.insert(user).values({
    id: admin.id,
    name: "Test admin",
    email: phonePlaceholderEmail(phone),
    phoneNumber: phone,
    role: "admin",
  });
  await db.insert(media).values([
    { id: coverId, kind: "post", uploadedBy: admin.id, width: 2400, height: 1200, placeholder: "data:," },
    { id: figureId, kind: "figure", uploadedBy: admin.id, width: 3000, height: 2000, placeholder: "data:fig" },
    { id: dogPhotoId, kind: "dog", uploadedBy: admin.id, width: 800, height: 600, placeholder: "data:," },
  ]);
});

afterAll(async () => {
  await db.delete(blogPost).where(like(blogPost.slug, `%-${runId}`));
  await db.delete(auditEvent).where(eq(auditEvent.actorId, admin.id));
  await db.delete(media).where(inArray(media.id, [coverId, figureId, dogPhotoId]));
  await db.delete(user).where(eq(user.id, admin.id));
});

describe("what is public", () => {
  it("shows a post only while it is published", async () => {
    const draft = await makePost("draft");

    expect(await getPost({ db, slug: draft.slug, locale: "fa" })).toEqual({ kind: "not-found" });
    expect(await searchFor(runId)).toHaveLength(0);

    await publish(draft.id);
    expect((await getPost({ db, slug: draft.slug, locale: "fa" })).kind).toBe("post");
    expect((await searchFor(runId)).map((card) => card.slug)).toEqual([draft.slug]);

    await adminSetPostStatus({ db, userId: admin.id, id: draft.id, status: "draft" });
    expect(await getPost({ db, slug: draft.slug, locale: "fa" })).toEqual({ kind: "not-found" });
  });

  it("refuses to publish an unfinished post and says what to finish", async () => {
    const unfinished = await makePost("unfinished", { excerpt: "", coverMediaId: undefined, body: body("") });
    const result = await adminSetPostStatus({ db, userId: admin.id, id: unfinished.id, status: "published" });

    expect(result).toEqual({
      kind: "invalid",
      errors: [],
      fields: { body: expect.any(String), cover: expect.any(String), excerpt: expect.any(String) },
    });
  });

  it("finds Persian however it was typed", async () => {
    const post = await makePost("search");
    await publish(post.id);

    for (const q of ["ادرار هیجانی", "ادرارهیجانی", "توله ها"]) {
      const found = (await listPosts({ db, locale: "fa", q })).map((card) => card.slug);
      expect(found).toContain(post.slug);
    }
    // `%` is a visitor's character, not a wildcard.
    expect(await listPosts({ db, locale: "fa", q: `%${runId}%` })).toHaveLength(0);
  });

  it("keeps a post without its full English off the English pages", async () => {
    const persianOnly = await makePost("fa-only");
    await publish(persianOnly.id);
    const bilingual = await makePost("bilingual", {
      titleEn: "A test post",
      excerptEn: "The summary of a test post, long enough to be published.",
      coverAltEn: "A dog in a park",
      bodyEn: body(`Excited urination in puppies ${runId}`),
    });
    await publish(bilingual.id);

    expect(await getPost({ db, slug: persianOnly.slug, locale: "en" })).toEqual({ kind: "not-found" });
    const english = await getPost({ db, slug: bilingual.slug, locale: "en" });
    expect(english.kind === "post" && english.post.title).toBe("A test post");
    expect((await listPosts({ db, locale: "en", q: runId })).map((card) => card.slug)).toEqual([bilingual.slug]);
  });

  it("won't publish half an English post", async () => {
    const half = await makePost("half-english", { titleEn: "Only a title" });
    const result = await adminSetPostStatus({ db, userId: admin.id, id: half.id, status: "published" });

    expect(result).toMatchObject({ kind: "invalid", fields: { bodyEn: expect.any(String) } });
  });
});

describe("addresses", () => {
  it("redirects a published post's old address, and frees nothing for another post", async () => {
    const post = await publish((await makePost("old-name")).id);
    const renamed = await adminUpdatePost({ db, userId: admin.id, input: { ...postInput("new-name"), id: post.id } });
    expect(renamed.kind).toBe("success");

    expect(await getPost({ db, slug: slugOf("old-name"), locale: "fa" })).toEqual({
      kind: "moved",
      slug: slugOf("new-name"),
    });
    const thief = await adminCreatePost({ db, userId: admin.id, input: postInput("old-name") });
    expect(thief.kind === "invalid" && thief.fields).toHaveProperty("slug");
  });

  it("answers 404 for every address of a deleted post", async () => {
    const post = await publish((await makePost("doomed")).id);
    await adminUpdatePost({ db, userId: admin.id, input: { ...postInput("doomed-2"), id: post.id } });

    expect(await adminDeletePost({ db, userId: admin.id, id: post.id })).toEqual({ kind: "success" });
    expect(await getPost({ db, slug: slugOf("doomed"), locale: "fa" })).toEqual({ kind: "not-found" });
    expect(await getPost({ db, slug: slugOf("doomed-2"), locale: "fa" })).toEqual({ kind: "not-found" });
  });
});

describe("what the server stores", () => {
  it("takes an image's size from the upload, not from the client", async () => {
    const figure = { type: "figure" as const, mediaId: figureId, alt: "توله", caption: "", width: 1, height: 1, src: "https://evil.example/x.png" };
    const post = await makePost("figure", { body: body("متن", [figure]) });

    const stored = post.body.root.children.find((block) => block.type === "figure");
    // The `inline` variant fits 3000×2000 inside 1440×1440.
    expect(stored).toMatchObject({ mediaId: figureId, width: 1440, height: 960, placeholder: "data:fig" });
    expect(stored && "src" in stored && stored.src).not.toContain("evil.example");
  });

  it("refuses an image of another kind and a node the article can't draw, and keeps no unsafe link", async () => {
    const wrongKind = await adminCreatePost({
      db,
      userId: admin.id,
      input: postInput("wrong-kind", { body: body("متن", [{ type: "figure", mediaId: dogPhotoId, alt: "سگ", caption: "" }]) }),
    });
    expect(wrongKind.kind === "invalid" && wrongKind.fields).toHaveProperty("body");

    const table = await adminCreatePost({
      db,
      userId: admin.id,
      input: postInput("table", { body: { root: { type: "root", children: [{ type: "table", children: [] }] } } }),
    });
    expect(table.kind === "invalid" && table.fields).toHaveProperty("body");

    const linked = await makePost("unsafe-link", {
      body: {
        root: {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [{ type: "link", url: "javascript:alert(1)", children: [{ type: "text", text: "بزن", format: 0 }] }],
            },
          ],
        },
      },
    });
    expect(JSON.stringify(linked.body)).not.toContain("javascript:");
    expect(JSON.stringify(linked.body)).toContain("بزن");
  });
});
