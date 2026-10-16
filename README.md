# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Server demo at k9training.zurvann.ir

Use [deploy.sh](deploy.sh) with the separate [compose.server.yaml](compose.server.yaml) stack: Caddy handles HTTPS, and PostgreSQL and SeaweedFS keep their data in Docker volumes. Only Caddy exposes public ports. See [docs/deploy.md](docs/deploy.md) for server prerequisites, bootstrap instructions, backups, and troubleshooting.

```bash
# First deployment (after these files have been pushed to GitHub):
curl -fsSL https://raw.githubusercontent.com/SinaTZ0/zurvan/main/deploy.sh -o /tmp/k9training-deploy.sh
sudo bash /tmp/k9training-deploy.sh --db-push --seed

# Later updates; preserves .env and data, without pushing the schema or resetting demos:
sudo bash /opt/k9training/deploy.sh

# Also enable HTTP access by the VPS's public IPv4 address (saved for later updates):
sudo bash /opt/k9training/deploy.sh --ip YOUR_SERVER_IP
```

### Run with Docker Compose (local testing)

Only [Docker Desktop](https://www.docker.com/products/docker-desktop/) is needed. Node and Postgres are not. For a step-by-step guide in Persian for non-developers, see [docs/run-with-docker.fa.md](docs/run-with-docker.fa.md).

```bash
docker compose up --build
```

Then open http://localhost:3000. Use `localhost` exactly: auth only trusts that origin.

The stack starts Postgres, syncs the schema with `drizzle-kit push`, seeds the catalogue and the demo accounts, then runs the production server in showcase mode. The secrets in `compose.yaml` are for local testing only.

### Showcase mode and demo accounts

With `SHOWCASE_MODE=true` (set in `compose.yaml` and `.env.example`) no SMS is sent: the sign-in code is always `12345`, and every message lands in the `sms_outbox` table. Without it, the app refuses to start, since nobody could receive a code.

- `npm run db:push` syncs the schema, then `npm run db:seed:demo` seeds the catalogue and one demo account per role (`09120000001` Admin to `09120000005` Customer; the list is in `app/lib/demo-accounts.ts`). The sign-in page lists them.
- `npm run db:seed` seeds only the catalogue, for an environment without demo accounts.

- `docker compose down` stops everything and keeps the data.
- `docker compose down -v` also deletes the database.
- After pulling changes, run `docker compose up --build` again to rebuild and re-sync the schema.

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## How the App Works

[docs/app-spec.md](docs/app-spec.md) describes every feature and page. The database schema is in `app/db/schema.ts`.

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
