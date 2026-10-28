# Feature Boards

One Excalidraw board per feature, for the owner: she walks through it on the live site and ticks it as verified. A board is
both the checklist item and the guide for testing it. The finished boards live in `excalidraw/` (`NN-name.excalidraw` plus
a `NN-name.jpg` preview); `excalidraw/01-sign-in.*` is the reference.

## Pipeline

Each board has two scripts here, then the shared export:

1. `NN-name.capture.mjs [base-url]`: drives the site with Playwright at phone size (390×844, DPR 2, `fa-IR`, reduced
   motion), saves full-page shots and the page-space boxes of the controls the board points at to
   `.tmp-claude/feature-boards/NN-name/shots/` (`shots.json` + PNGs). The base URL defaults to
   `https://k9training.zurvann.ir`, which runs in demo mode: every SMS code is `12345`, and the sign-in page lists the
   demo accounts (`09120000001` is the Admin).
2. `NN-name.board.mjs [out.excalidraw]`: lays the shots out as an Excalidraw scene (shots embedded as JPEG) and writes
   `excalidraw/NN-name.excalidraw`.
3. `export-png.mjs <board> <out.png> 1`, then `to-jpg.mjs <out.png> excalidraw/NN-name.jpg <crop.jpg> x y w h`: the
   preview, rendered by excalidraw.com's own exporter (so Persian text and fonts come out as she'll see them).

## How a Board Reads

- Right to left, like the site: the title, a one-line summary and a colour key at the top right; step 1 is the
  rightmost shot.
- Each step: a numbered title over the shot, and a notes column on the shot's right. Each note is a dotted card with an
  arrow to a red highlight on the screen.
- Big black arrows between steps, labelled with what the person taps («ادامه»). Green is a second customer path,
  blue is the Admin's side, red is the highlights.
- Notes are short, plain, spoken Persian for the owner: what she should see and what to try. No URLs, code or
  technical terms.
- A board's test data is its own: a fresh random phone number for a new customer, and names that say what they are for.
