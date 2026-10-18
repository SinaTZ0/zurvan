# Implementation log

Newest entries are added at the bottom of each phase. Commits are on `feat/zurvann-overnight-feedback`. Nothing here is deployed.

## Phase A: header, navigation, pages

### Brief (written before the code, as `docs/design-flow.md` asks for a Redesign-verdict shell)

- **Purpose.** A visitor finds the courses, the trainer, a way to talk to her or him, and the partner information in one tap; a customer reaches the free assessment or sign-in without hunting.
- **Role.** The public shell (`layout_public`) wraps every storefront page. It is not a page of its own.
- **Structure.**
  - Desktop (from `lg`, 1024px): logo at the start; four text links (دوره‌ها، درباره‌ی طلا راستی، همکاران، تماس با ما); at the end the gold pill «ارزیابی رایگان» and either «ورود یا ثبت‌نام» (outline) or the signed-in controls (cart and person menu, unchanged).
  - Below `lg`: logo, sign-in or signed-in controls, and the menu button. The sheet holds the pill first, the same four links, then the account block.
  - Footer: the three columns stay; «درباره‌ی طلا راستی» and «تماس با ما» join the contact column; the assessment link leaves the footer (the pill is the one prominent place).
- **Hidden on purpose.** «مربی» (there is one trainer), the header search (search lives on the pages with something to search), «قوانین» (no approved legal text exists) and «پرونده‌ها» (the logbook is Phase G). A link appears only when its page is usable.
- **Style.** Existing tokens only: `bg-jet` bar, `text-sm font-bold text-muted-foreground` links with the current page in `text-foreground`, flat gold pill (`buttonVariants` default, `size="sm"`). No new colour, no new font.
- **Motion.** Colour changes on hover and focus only.
- **Accessibility.** `nav` landmark labelled «منوی اصلی»; `aria-current="page"` on the current link; every control reachable by keyboard with the visible focus ring; the menu sheet is the existing `Sheet`.
- **New pages.** `/about` and `/contact` are static, built only from details the owner supplied on the business card (name, role, 13 years, international credential, service area, phone, Telegram, Instagram, YouTube). No biography, no claims beyond the card.

### Result

- **Header.** `site-header.tsx` shows the four links from `lg` (`NavLink`, the current page in full-strength text), the gold «ارزیابی رایگان» pill and sign-in or the signed-in controls. The header search and the «مربی» link are gone; `site-search.tsx` is deleted.
- **Phone menu.** `mobile-menu.tsx`: the pill first, then the four links, then sign-in or account as outline buttons (one gold button in the sheet).
- **Footer.** The assessment link left; «درباره‌ی طلا راستی» and «تماس با ما» joined the contact column.
- **New pages.** `/about` (`app/routes/about/`) and `/contact` (`app/routes/contact/`), built only from the business card. `contact.ts` now exports each profile separately (`CENTER_TELEGRAM`, `CENTER_INSTAGRAM`, `CENTER_YOUTUBE`).
- **Hidden on purpose, with the reason.** «قوانین»: no approved legal text exists, and the rules say never to ship unreviewed legal text (`03-DECISIONS-NEEDED.md`). «پرونده‌ها / لاگ‌بوک»: Phase G.
- **Checks.** `npm run typecheck` and `oxlint` clean. Headless Chrome screenshots of `/about` and `/contact` at 1440px and the phone menu at 390px were read and look right (`docs/overnight/screenshots/a-*.png`). `/courses` needs the database and was not rendered locally in this step.
- **Docs.** `legacy-pages.md`, `storefront-design.md` and `app-spec.md` updated in the same change (page counts, the nav, the new pages).
