# App Identity: Mood, Tone & Theme

Source: `claude-design-assets/Zurvan UI reproduction/`. Zurvann is a premium pet-services app (vet, pet taxi, trainer, pet walker, boarding) for Persian-speaking pet owners. It's RTL and mobile-first.

## Mood

**Premium, calm and trustworthy, with a warm side.** It should feel like a well-run private clinic, not a playful pet store.

- **Premium**: deep forest green and gold on warm cream, with lots of whitespace. Nothing is loud or neon.
- **Trustworthy**: verification is visible everywhere. Look for green check badges, "تأییدشده" labels, shield notes and trust levels.
- **Warm**: real photos of pets and people, the pet's name on every screen, and soft rounded shapes.
- **Calm**: one primary action per screen, few colours, and gentle shadows.

## Tone (copy)

- **Personal**: use the user's first name ("سلام سارا جان 👋"). Talk about the pet by name, not "your pet" ("پرونده لئو", "امروز برای لئو چه کاری انجام بدیم؟").
- **Friendly, then polite**: prompts and greetings are casual ("حیوانت را اضافه کن"، "کمک می‌خوام"). Safety, privacy and legal text stays polite and formal ("لطفاً…"، "اطلاعات شما امن و محرمانه است").
- **Reassuring**: before a commitment, say what's protected or verified ("فقط متخصصان تأییدشده زروان…").
- **Concrete**: give numbers, not adjectives ("۱۲ دقیقه"، "۲.۱ هزار خدمت"، "از ۷۵۰ هزار تومان").
- **Locale**: use Persian digits and Jalali dates. Show prices in toman, shortened as "هزار" or "میلیون".
- **Emoji**: rare, and only in friendly moments (👋 🌿). Never put one in a button or an error.

## Theme

All tokens live in `app/app.css`. Use the Tailwind classes (`bg-primary`, `text-gold-text`, `border-cream-border`…), never raw hex.

### Colour

| Token | Light | Use |
| --- | --- | --- |
| `primary` | `#0C3B2E` | Primary buttons, active nav, hero cards, check badges, focus `ring` |
| `primary-foreground` | `#F7F4EC` | Text on green |
| `foreground` | `#22352B` | Headings and body text |
| `muted-foreground` | `#6E6A5E` | Secondary text |
| `background` | `#FBFAF6` | App background |
| `card` / `popover` | `#FFFFFF` | Cards, inputs, popovers |
| `muted` / `secondary` | `#F1EDE2` | Subtle fills, segmented controls, secondary buttons |
| `accent` | `#FBF6E9` | Hover and selected rows |
| `border` | `#EBE5D6` | Card borders and dividers |
| `input` | `#8D897B` | Edges of inputs, selects, checkboxes and radios |
| `gold` | `#C8A85A` | Accents on green only: stars, highlights, logo |
| `gold-deep` | `#B98F3E` | Icons and decoration on light backgrounds, never text |
| `gold-text` | `#8A6B2E` | Gold as readable text or links |
| `faint` | `#8D897B` | Disabled items and decoration, never text. Placeholders use `muted-foreground` |
| `cream` / `cream-border` | `#FBF6E9` / `#F0E4C6` | Icon boxes, reminders, info notes |
| `mint` / `mint-border` | `#EEF4F0` / `#D5E3DA` | Positive or safety notes |
| `success` / `destructive` | `#267F4C` / `#C53B3B` | Status only, used sparingly |
| `hero` / `hero-foreground` | `#0C3B2E` / `#F7F4EC` | Dark green hero cards. Same in both themes, because dark mode's `primary` is gold |

Use green for structure and action and gold for value and accent. Keep gold off large surfaces.

**Dark mode** (`.dark`) isn't in the design assets. It's a night version of the same palette: deep green surfaces, cream text, and gold as `primary`.

### Type

- **Font**: Vazirmatn Variable (`@fontsource-variable/vazirmatn`), with Tahoma as fallback.
- **Weights**: 800 for titles and section headings (`h1`–`h4` get this by default), 700 for buttons and labels, 400–500 for body text.
- **Sizes**: at least `text-sm` (14px) for body text and `text-xs` (12px) for captions.
- **Line height**: Persian needs room. `text-xs`, `text-sm` and `text-base` are set to 1.7–1.8.

### Shape & depth

- **Radius**:
  - `rounded-sm` 8px: small controls
  - `rounded-md` 12px: icon boxes
  - `rounded-lg` 14px: buttons and inputs
  - `rounded-xl` 16px: cards
  - `rounded-2xl` 20px or more: maps and hero blocks
  - avatars are `rounded-full`
- **Borders over shadows**: cards use a 1px `border`. `shadow-soft` is the only elevation, and it should be used rarely.
- **Controls**: inputs and primary buttons are 54–56px tall, full width at the bottom of a flow. This isn't in `components/ui` yet.

### Iconography & imagery

- Line icons with a 1.7 stroke and round caps and joins. They're usually `gold-deep` inside a `cream` rounded box.
- Real photos only. People get a round avatar with a green check badge when verified.
- The paw is the brand motif. Use it as an accent, not as wallpaper.

### Signature patterns

- A **dark green hero card** with gold highlights, used for a live order or a specialist header.
- **Cream and mint note boxes** with an icon, for trust, privacy and tips.
- A **pet chip**: avatar, name with check, then breed and age, shown at the top of flows.
- A **stepper** ("مرحله ۲ از ۴") for multi-step requests.
- **Locked tiles** (greyed, with a lock icon) for services that are "به‌زودی".

## Reference screens

These are examples of the identity, not specs to copy. Match their feel, not their pixels.

- [home.png](./references/home.png): hero card, pet chip, reminders, specialist cards and bottom nav.
- [services.png](./references/services.png): service grid, stepper, request form, specialist profile and timeline.
- [auth.png](./references/auth.png): sign-in, verification code, forms, trust notes and segmented choices.

## Accessibility notes

The mockups miss WCAG AA in a few places. The tokens above already fix these:

| Mockup | Problem | Token now |
| --- | --- | --- |
| Grey text `#8D897B` | 3.35:1 on background | `muted-foreground` `#6E6A5E` (5.4:1) |
| Gold text `#B98F3E` | 2.97:1 on white | `gold-text` `#8A6B2E` (4.76:1) |
| Danger `#D64545` | 4.19:1 on background | `destructive` `#C53B3B` (4.95:1) |
| Success `#2E9E5B` | 3.41:1 on white | `success` `#267F4C` (4.97:1) |
| Input border `#EBE5D6` | 1.26:1, needs 3:1 for control edges | `input` `#8D897B` (3.5:1) |
| 9.5–12.5px text | too small | 14px for body, 12px for captions |

Gold on green already passes: `gold` is 5.48:1.
