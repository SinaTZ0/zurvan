# Zurvann the mascot: specification, state rules and asset inventory

A proposal for the owner to approve. Nothing here is live art: **no authentic mascot photographs exist in the repository yet**, so the home hero still shows its three stand-in dogs, and the missing art is an explicit blocker (see section 5).

## 1. Who the mascot is

- **Zurvann** is a Belgian Malinois who grows up on the site, as the owner described it. He is the one recurring character; the other dogs in the photos are stand-ins until he has pictures.
- **Voice.** First person, informal spoken Persian, short, warm, a little funny. He describes how things work, never promises results, and never gives orders (the owner found «من فقط فرمان نمی‌برم؛ می‌فهمم.» too commanding: it is still the live headline but is **not approved as final**, see `03-DECISIONS-NEEDED.md`).
- **Approved lines (the only ones in production):** «سلام! من اینجام که زندگی من و تو با هم بهتر بشه :)»، «توی خیابون هم حواسم فقط به توئه.»، «قلاده‌مو آوردم! بریم تمرین؟».

## 2. Growth stages (proposal)

| Stage      | Looks like                                                                       | Where it can appear                                       |
| ---------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Puppy      | About 10 to 12 weeks: oversized ears, soft mask, clumsy paws, leash in his mouth | First visits, the empty dashboard («سگی اضافه نکرده‌ای»)  |
| Adolescent | About 7 to 8 months: long legs, alert ears, a little cheeky, learning            | The middle visits, course and assessment pages            |
| Adult      | About 2 years: calm, focused, strong; eye contact with the viewer                | Later visits, the logbook and certificate when they exist |

Keep one consistent identity across the three: fawn coat, black mask and ears, dark brown eyes, a thin brown leather collar with a small gold tag. The owner decides the real markings.

## 3. How the hero changes (implemented)

The hero follows the visitor, not a clock. Rules in `app/lib/hero-state.ts`, tested in `hero-state.test.ts`, and checked in a real browser (14 checks, all passing, run on 2026-10-19):

1. A new browser session steps the stored dog by one; the very first visit shows the first dog.
2. Arriving on Home by a link or button steps by one.
3. Back, forward, reload and waiting keep the dog that was showing. There is no autoplay.
4. The visitor can pick a dog with the dots; that choice is remembered too.
5. Two cookies carry it: `zurvan_hero` (the index, one year) and `zurvan_hero_s` (a session marker). The server paints the right photo first, which keeps the largest-contentful-paint image correct.
6. Reduced motion: no crossfade, no push-in.

When Zurvann's stages exist, replace the three entries in `app/routes/home/hero-slides.ts` (name, alt text, line, crop); the rules do not change.

## 4. Where the mascot speaks today

The auth page (a dog asks at each step), the dashboard's empty state, the cart's result banner, the help header and the home sections already carry the dog's bubble. **No new pop-ups were added.** Dialogue for new moments (for example a newcomer's first sign-up) is listed for approval in `03-DECISIONS-NEEDED.md`, not shipped.

## 5. Asset inventory and what is missing

| Asset                              | Exists                                                                                                 | Needed                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Hero photos, 900px and 1536px WebP | Three stand-ins: a German shepherd (`hero`), a Malinois at night (`hero-2`), a golden puppy (`hero-3`) | Three of Zurvann, one per stage, framed like the current ones |
| Cut-out with a transparent ground  | The sunglasses German shepherd on the evaluation panel                                                 | A Zurvann cut-out for the evaluation panel and empty states   |
| Peeking dog for the closing banner | A German shepherd (`peek`)                                                                             | A Zurvann version                                             |
| Alt text                           | Persian scene descriptions for each stand-in                                                           | One per Zurvann photo, describing the scene and the stage     |

**Blocker:** Zurvann's authentic art. Until the owner supplies it (the pipeline in `image-reference/prompts.md`: the owner generates, the developer slices and compresses), nothing pretends the stand-ins are the mascot.

### Prompt proposals for the owner (same shared style line as the existing prompts)

Each ends with: `Shared style: low-key studio-like lighting on a pure black (#000) background, warm amber (#F5B83D) rim light, desaturated warm tones, high contrast, cinematic color grading, photorealistic, no text, no letters, no logos, no watermark, no frame.` Size 1536×1024, the dog's face about a quarter in from the left edge and in the upper half, the right half empty black.

- **Puppy.** A fawn Belgian Malinois puppy of about 11 weeks with a black mask and oversized black ears, a thin brown leather collar with a small gold tag, holding the end of a leash in its mouth, looking straight into the lens.
- **Adolescent.** The same dog at about 7 months: long legs, upright ears, sitting alert and slightly cheeky, head tilted.
- **Adult.** The same dog at about 2 years: calm and strong, sitting with a steady gaze at the lens.
