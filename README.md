# K9 Training (آموزش K9)

The website of a dog-training center, in Persian and right to left. A customer brings a dog in for a free
evaluation, then buys the courses it's ready for, and the head trainer (the center's owner and only Admin) runs the
rest from the Admin area. The header shows the wordmark «زروان»; the rest of the copy says آموزش K9 (see `CLAUDE.md`,
Naming). Internal names still say `zurvan` (the npm package, the database, the Compose project); leave them as they
are.

## Stack

- [TanStack Start](https://tanstack.com/start/latest) (React 19, TanStack Router, server-side rendering), built with
  Vite and served by Nitro.
- [oRPC](https://orpc.dev) for the API, with TanStack Query on the client.
- PostgreSQL with Drizzle ORM; Better Auth for sign-in by phone number (an SMS code, or a password once set).
- Tailwind CSS 4, Base UI / shadcn components, Jotai for shared client state.
- SeaweedFS (S3-compatible) for uploaded images and videos ([docs/media.md](docs/media.md)).
- Vitest, Playwright, Storybook; oxlint and Prettier.

## Run It Locally

You need Node 24 and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, BETTER_AUTH_SECRET, and the rest
npm run db:push             # create the tables
npm run db:seed:demo        # the course catalogue and one demo account per role
npm run dev                 # http://localhost:5173
```

With `SHOWCASE_MODE=true` (the default in `.env.example`) no SMS is sent: the sign-in code is always `12345`, and
every message lands in the `sms_outbox` table, which the Admin can read. Without it the app refuses to start, since
nobody could receive a code. The demo accounts run from `09120000001` (Admin) to `09120000005` (Customer); the list is
in `app/lib/demo-accounts.ts`, and the sign-in page shows them. `npm run db:seed` seeds only the catalogue.

## Scripts

| Script                               | What it does                                                         |
| ------------------------------------ | -------------------------------------------------------------------- |
| `npm run dev`                        | The dev server with HMR (`vite dev`)                                 |
| `npm run build`                      | A production build into `.output/`                                   |
| `npm start`                          | Serves the build (`node .output/server/index.mjs`)                   |
| `npm run start:local`                | Serves the build with `NODE_ENV=development`, to try it on localhost |
| `npm run typecheck`                  | `tsc`                                                                |
| `npm run lint` / `lint:fix`          | oxlint                                                               |
| `npm run format` / `format:check`    | Prettier                                                             |
| `npm test` / `test:watch`            | Vitest                                                               |
| `npm run test:e2e`                   | Playwright smoke tests                                               |
| `npm run storybook`                  | Storybook on port 6006 (`storybook:build` builds it)                 |
| `npm run db:push`                    | Syncs the Drizzle schema to the database                             |
| `npm run db:generate` / `db:migrate` | Writes and applies SQL migrations                                    |
| `npm run db:studio`                  | Drizzle Studio                                                       |
| `npm run db:seed` / `db:seed:demo`   | Seeds the catalogue / the catalogue and the demo accounts            |

## Build and Start

```bash
npm run build
npm start
```

The build is self-contained: `.output/` holds the server bundle (with its one native dependency, sharp) and the
client assets, pre-compressed. Deploy that folder and run `node .output/server/index.mjs`; no `node_modules` needed.
The server doesn't compress HTML itself, so put a reverse proxy that does (Caddy, in production) in front of it.

## Docker

Only Docker is needed; Node and Postgres are not.

```bash
docker compose up --build
```

Then open http://localhost:3000. Use `localhost` exactly: auth only trusts that origin. `compose.yaml` starts
Postgres, syncs the schema, seeds the catalogue and the demo accounts, then runs the production server in showcase
mode. Its secrets are for local testing only. `docker compose down` stops everything and keeps the data;
`docker compose down -v` also deletes the database. A step-by-step guide in Persian for non-developers is in
[docs/run-with-docker.fa.md](docs/run-with-docker.fa.md).

The server demo (https://k9training.zurvann.ir) runs `compose.server.yaml` behind Caddy and is installed and updated
with [deploy.sh](deploy.sh); see [docs/deploy.md](docs/deploy.md).

## Docs

- [docs/app-spec.md](docs/app-spec.md): how the app works, feature by feature (F1–F12). The source of truth.
- [docs/storefront-design.md](docs/storefront-design.md): the look and voice of the whole site.
- [docs/frontend-guideline.md](docs/frontend-guideline.md): routes, data loading, links, and UI conventions.
- [docs/backend-guideline.md](docs/backend-guideline.md) and [docs/orpc.md](docs/orpc.md): the API.
- `CLAUDE.md`: the repository's working rules.
