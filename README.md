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

### Run with Docker Compose (local testing)

Only [Docker Desktop](https://www.docker.com/products/docker-desktop/) is needed. Node and Postgres are not. For a step-by-step guide in Persian for non-developers, see [docs/run-with-docker.fa.md](docs/run-with-docker.fa.md).

```bash
docker compose up --build
```

Then open http://localhost:3000. Use `localhost` exactly: auth only trusts that origin, and the sign-up captcha needs a secure context.

The stack starts Postgres, syncs the schema with `drizzle-kit push`, then runs the production server. The secrets in `compose.yaml` are for local testing only.

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

## Entity Diagrams

[docs/entities.d2](docs/entities.d2) maps every Phase One entity with [D2](https://d2lang.com/): an index board, plus one board per entity with its fields, relationships, status lifecycle and business rules.

Install the D2 CLI (needs Go, or see the [other install options](https://d2lang.com/tour/install)):

```bash
go install oss.terrastruct.com/d2@latest
```

Live preview in the browser, with clickable links between boards:

```bash
d2 --watch docs/entities.d2
```

Render one linked SVG per board into `docs/entities/` (open `docs/entities/index.svg`):

```bash
d2 docs/entities.d2 docs/entities.svg
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
