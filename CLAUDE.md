# Repository Instructions

These instructions apply to the entire repository unless overridden by a more specific `AGENTS.md` in a subdirectory.

This is a React Router v8 application using Framework Mode. The application's user-facing content is in Persian.

## Working Directory

- Run project commands from the repository root.
- After making code changes, run `npm run lint` and fix all errors.
- Put temporary scripts, diagnostics, experiments, and logs in `./.tmp-codex/`.
- Create `./.tmp-claude/` as needed. It is gitignored and must never contain deliverable source files.

## Testing and Validation

- Keep automated tests small and focused on consequential business behavior, security boundaries, and meaningful regressions. Do not add exhaustive input matrices, implementation-detail assertions, library behavior tests, logging/timing checks, or tests for routine styling changes.
- After code changes, run `npm run lint`. Run only existing tests directly relevant to the change; do not run the entire suite for every task. Browser smoke tests are optional and appropriate when changing their covered form flows or when explicitly requested.
- Run `npm run typecheck` for TypeScript contract changes and `npm run build` for bundling or runtime concerns. Avoid repeating checks already performed, including the production build run by Playwright.
- If test prerequisites are unavailable, report the limitation. Do not automatically provision databases, push schemas, or install browsers just to run tests.
- Story files are maintained UI documentation. Preserve them during test cleanup, including their existing `play` functions, controls, and callback actions. Keep Storybook for manual previews and accessibility review; do not reintroduce its automatic test runner.
- See `docs/testing.md` for the retained test inventory, prerequisites, and focused commands.

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
