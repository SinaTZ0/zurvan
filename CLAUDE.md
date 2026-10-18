# Repository Instructions

These instructions apply to the entire repository unless overridden by a more specific `AGENTS.md` in a subdirectory.

This is a React Router v8 application using Framework Mode. The application's user-facing content is in Persian.

## Naming

- The brand is **K9 Training** in Latin script and **آموزش K9** in Persian text. Use these in user-facing text and docs. The old logo set "K9" in the stencil face (`font-stencil`); the wordmark is now «زروان» (see the next bullet).
- On 2026-10-18 the owner asked for the header and footer to show **زروان** with the descriptor «مجموعه تربیتی و رفتارشناسی سگ زروان»; the gold emblem and its size stay. `BrandLogo` and the footer do that. Page titles, SMS texts, the auth page and other copy still say آموزش K9 until the owner decides whether to rename them everywhere.
- The brand was previously Zurvann / زروان. Internal identifiers still use `zurvan` (the npm package, the Docker Compose project and database name, the theme storage key, the GitHub repo) and `zurvann` (the media bucket). Leave them as they are; renaming the database, Compose project or bucket would lose existing data.

## Product Scope

- [docs/app-spec.md](docs/app-spec.md) is the source of truth for how the app works, organized by feature (F1–F12). Code comments that cite the deleted phase-one docs (`app-phase-one.md`, `business-logic.md`, `foundations-plan.md`, the design briefs) are out of date; follow app-spec. [docs/zurvan-courses.md](docs/zurvan-courses.md) is still the source for the courses' content.
- This is a dog-training center, not a multi-service pet marketplace. The head trainer is the owner, the one Admin and the center's only trainer (the owner confirmed it on 2026-10-18; the two placeholder colleagues' cards, `TeamSection`, are kept in the repo but switched off on the home page). There are no trainer accounts or trainer pages in the app. The site sells a real, named person: copy and design should build trust in the head trainer, never in an anonymous pool of "verified trainers".
- Training is mostly private, like hiring a tutor, and since 2026-10-18 the owner lists four formats: private at the client's place, private at the center, group at the center, and boarding with training (boarding needs prior coordination: for now it is arranged with a partner pension). Group classes aren't running yet, so don't build seats, class minimums or a sign-up for them and never word them as open; the help page says only that the group format starts when a class is held.
- It is a small shop whose items are locked: a new dog starts with a free evaluation (the customer requests it; the Admin marks it evaluated or rejects it). An evaluated dog can buy courses whose prerequisites it has passed, at the course's fixed price, paid upfront from a cart kept in the account (mirrored in the browser). The Admin then calls the customer, and marks the enrollment done when the training is over, which unlocks the next courses.
- The app records and shows; it doesn't run the business. Lesson times and sessions are handled by the Admin in real life: no calendar, lesson tracking, course requests to accept, trainer earnings, payouts or refunds. Admin screens are plain lists with one-click buttons and an overview dashboard. Behavior requests, course tests, assessment slots and trainer-submitted courses are dropped.
- Dog profiles and course settings are still being worked out with the owner: keep what exists and don't build on guesses (app-spec F2, F8).
- The owner's "every dog takes CGC / almost every dog takes BMC" is never said on the site.
- The head trainer's details live in `app/lib/head-trainer.ts`; the name, years and photo there are placeholders until the owner sends the real ones.

## Design and Legacy Pages

- [docs/storefront-design.md](docs/storefront-design.md) is the look and voice of the whole site: pure black and flat gold, dark dog photos everywhere, and the dog talking to the visitor in chalk speech bubbles. The mockups in `image-reference/` are its visual reference. Only the home page is built in this look so far.
- **Before changing any page or shared component, check [docs/legacy-pages.md](docs/legacy-pages.md).** If it's listed, follow its verdict: **Redesign** (a small fix goes in as is; a layout change means redesigning the whole page first), **Rebuild** (build the app-spec page new, don't patch the old one), or **Retire** (the feature is dropped: don't build on it, tell the user). Update the doc in the same commit when a row is done.

## Working Directory

- Run project commands from the repository root.
- After making code changes, run `npm run lint` and fix all errors.
- Put temporary scripts, diagnostics, experiments, and logs in `./.tmp-claude/`.
- Create `./.tmp-claude/` as needed. It is gitignored and must never contain deliverable source files.

## Git

- Commit directly on `main`. Do not create, switch to, or merge other branches unless the user explicitly asks for a branch.

## Testing and Validation

- Keep automated tests small and focused on consequential business behavior, security boundaries, and meaningful regressions. Do not add exhaustive input matrices, implementation-detail assertions, library behavior tests, logging/timing checks, or tests for routine styling changes.
- After code changes, run `npm run lint`. Run only existing tests directly relevant to the change; do not run the entire suite for every task. Browser smoke tests are optional and appropriate when changing their covered form flows or when explicitly requested.
- Run `npm run typecheck` for TypeScript contract changes and `npm run build` for bundling or runtime concerns. Avoid repeating checks already performed, including the production build run by Playwright.
- If test prerequisites are unavailable, report the limitation. Do not automatically provision databases, push schemas, or install browsers just to run tests.
- Story files are maintained UI documentation. Preserve them during test cleanup, including their existing `play` functions, controls, and callback actions. Keep Storybook for manual previews and accessibility review; do not reintroduce its automatic test runner.

## Route Module Slices (Framework Mode)

- **Keep Route Slices Flat:** In this repository, route module directories under `app/routes/` (or the configured `appDirectory`) must be flat. URL hierarchy does not imply folder nesting (e.g. use `dashboard_user/`, never `dashboard/user/`).
- **Colocate Route Internals:** A route module file, its route exports (`loader`, `action`, `clientLoader`, `clientAction`, `ErrorBoundary`, `meta`, `headers`), `./+types/...` imports, and route-only internals (components, hooks, queries, schemas) must live inside that route's slice.
- **Promote Only When Shared:** Keep code with its immediate route consumer. Only move it to a shared or broader domain location when multiple routes consume it or it clearly belongs to a broader domain abstraction.

```text
app/routes/
  dashboard/
  dashboard_user/
  dashboard_user_setting/
    dashboard-user-setting.tsx  # route module
    components/
    hooks/
    queries.ts
    schema.ts
```

## Code Conventions

Preserve established local conventions unless a rule below explicitly says otherwise.

### Imports

Import values and types directly from their owning modules. Do not create directory barrel files such as `index.ts`.

### Function Parameters

Prefer a single object parameter when a function has multiple meaningful inputs. Use positional parameters when there is only one input or the ordering is conventional and obvious.

### Section Dividers

Use major dividers between top-level sections to improve code navigation and readability:

```ts
/*===== Section Name =====*/
```

Inside JSX:

```tsx
{
  /*===== Section Name =====*/
}
```

Use minor dividers for distinct phases inside longer functions or JSX:

```ts
/*------ Step Name ------*/
```

```tsx
{
  /*------ SubSection Name ------*/
}
```

Use dividers generously.

### Comments

Comment non-obvious decisions, constraints, edge cases, invariants, and domain-specific reasoning. Prefer explaining **why** over restating what the code already says.

Avoid comments for self-explanatory code.

### Documentation

Add JSDoc to functions, methods, and classes when their purpose, contract, side effects, constraints, or error behavior are not obvious from the code.

Document relevant parameters, return behavior, thrown errors, side effects, and important invariants. Avoid redundant documentation.

### Agent Skills

don't use any Agent Skills until i specifically tell you.

Exception: use the `frontend-design` skill (`.agents/skills/frontend-design/`) whenever you design a page or reshape an existing page's UI.
