# Feature Boards

One Excalidraw board per feature, for the owner: she walks through it on the live site and ticks it as verified. A board is
both the checklist item and the guide for testing it. The finished boards live in `excalidraw/` (`NN-name.excalidraw` plus
a `NN-name.jpg` preview); `excalidraw/01-sign-in.*` is the reference.

## Pipeline

Each board has two scripts here, built on two shared libraries, then the shared export:

- `capture-lib.mjs`: `createCapture({ board })` opens a phone-sized Chromium (390×844, DPR 2, `fa-IR`, reduced
  motion) and gives `newPage`, `go`, `shoot` (a full-page shot cut at `maxHeight`, plus the page-space boxes of the
  named controls; a tall shot hides the fixed tab bar), `signIn` (the demo code; a new number also gets a name) and
  `finish` (writes `shots.json`). A number signed in once keeps its cookies in
  `.tmp-claude/feature-boards/.sessions/`, so re-running a capture doesn't spend sign-in codes against the hourly limits.
- `board-lib.mjs`: `createBoard({ name })` gives the board's drawing functions: `header` (title, summary, colour key and
  the owner's «تأیید شد» tick box and «یادداشت:» card), `step`, `nextArrow`, `turnArrow`, `text`, `rect`, `arrow`,
  `card` and `write`.

1. `NN-name.capture.mjs [base-url]`: drives the site and saves its shots and boxes to
   `.tmp-claude/feature-boards/NN-name/shots/` (`shots.json` + PNGs). The base URL defaults to
   `https://k9training.zurvann.ir`, which runs in demo mode: every SMS code is `12345`, and the sign-in page lists the
   demo accounts (`09120000001` is the Admin).
2. `NN-name.board.mjs [out.excalidraw]`: lays the shots out as an Excalidraw scene (shots embedded as JPEG) and writes
   `excalidraw/NN-name.excalidraw`.
3. `export-png.mjs <board> <out.png> 1`, then `to-jpg.mjs <out.png> excalidraw/NN-name.jpg <crop.jpg> x y w h`: the
   preview, rendered by excalidraw.com's own exporter (so Persian text and fonts come out as she'll see them).

`00-index.board.mjs` has no capture: it lists every board with its title and what to try, each with a box to tick.

## Against a Local Copy

When the live site can't be reached, run the same code and demo seed locally and pass `http://localhost:3000` to the
capture scripts. What the boards were made with:

1. `npm ci`, then `npx playwright install --with-deps chromium`.
2. Postgres (the image's own, e.g. `pg_ctlcluster 16 main start`), user `postgres`/`postgres`, a database `zurvan`.
3. An S3-compatible store on port 8333 with a bucket `zurvann` that anyone may read (browsers load images straight from
   it): SeaweedFS (`weed server -s3`), or, where its release can't be downloaded, moto
   (`pip install 'moto[server]'`, `moto_server -p 8333`, then create the bucket and give it a public-read bucket policy
   for `s3:GetObject` with the AWS SDK).
4. `.env` from `.env.example` with `SHOWCASE_MODE=true`, `BETTER_AUTH_URL=http://localhost:3000` and a random
   `BETTER_AUTH_SECRET` (never committed).
5. `npx drizzle-kit push --force && npm run db:seed:demo`, `npm run build`, then `PORT=3000 npm start`.
6. Many boards sign in many numbers from one address: the per-address code limit (20 an hour) is the Admin's setting,
   and the counters live in the server's memory, so either raise it on the settings page for the session or restart
   the server. Put it back before capturing the settings board.

The demo gateway needs nothing: in showcase mode «پرداخت» returns straight to the cart with the result.

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
