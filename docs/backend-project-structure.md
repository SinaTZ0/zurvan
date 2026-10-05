# Feature-Based oRPC Project Structure

Organize code by feature so everything needed to understand or change a capability stays together. Give each layer one
clear job, pass dependencies explicitly, and return explicit outcomes from the service. Keep shared infrastructure
outside feature folders.

```text
app/
  orpc/
    contract.ts                    # combines feature contracts
    router.ts                      # combines feature procedures
    middleware/
      database/
        database.middleware.ts     # injects the database and translates database failures
        database.errors.ts         # browser-safe public error definitions
      altcha/
        altcha.middleware.ts       # verifies any procedure input with an altcha field
        altcha.errors.ts
    feature-name/
      contract.ts
      procedure.ts
      service.ts
      repository.ts
      validation.ts   # service-owned domain validation and normalization
      mapper.ts       # only when a conversion is needed
      integration.test.ts         # optional, for consequential public behavior
  db/
    schema.ts
    errors.server.ts               # availability classification at query boundaries
  lib/
    altcha.server.ts               # shared challenge generation and verification
  routes/
    rpc.ts                         # mounts the shared oRPC handler
```

Not every feature needs every file. Add a repository only when the feature owns persistence, and add a mapper only
when its internal data differs from its public API representation.

## Feature Files

- **Contract** defines the public input and output shapes, metadata, and declared API errors. Use Zod here to reject
  malformed requests and keep the client type-safe. Keep database and business logic out of this file.
- **Procedure** adapts oRPC to the service: pass input and dependencies, translate service outcomes into declared API
  errors, and return the public output. Keep the handler thin.
- **Service** owns product rules, normalization, and orchestration. Use a local Zod schema to trim and transform values,
  validate domain constraints, and produce typed values ready for persistence. Return a discriminated success or failure
  outcome; do not throw oRPC or HTTP errors here.
- **Repository** contains focused database reads and writes. It should not know about oRPC, HTTP, or API errors.
- **Mapper** converts database or domain values into stable public DTOs.
- **Integration test**, when warranted, exercises consequential behavior through the public API. Keep representative
  success and failure cases; shared middleware behavior is covered through feature tests rather than a suite per layer.

## Request Flow

```text
resource route -> oRPC handler -> contract validation -> procedure -> service -> repository -> database
                                     public shape          API mapping   product rules  persistence
```

The service calls `safeParse` on its local Zod schema, uses the parsed output for database writes, and turns the first
relevant issue into a field-specific failure. The procedure maps that failure to a declared oRPC error. Database errors
that represent product outcomes, such as reusing an accepted challenge, are handled by the service; unexpected errors
still propagate. This keeps transport details at the edge and makes the business path readable from top to bottom.

Keep shared side effects, such as CAPTCHA verification, in infrastructure helpers called by general middleware. A
resource route may call the same helper when serving a non-oRPC protocol, such as a widget's plain JSON challenge.

## Implementing a Feature

Implement features in this order:

```text
contract -> repository and service -> optional mapper -> procedure -> relevant validation
```

Dependencies point inward: procedures depend on services, services coordinate repositories, and repositories depend only
on persistence infrastructure. Add a repository only for persistence and a mapper only when the internal and public
representations differ.

## Validation and Business Rules

The contract schema checks the request's structural shape: required fields, types, unknown fields, and output type. The
service schema checks what those values mean for this feature. Use Zod's `trim`, `transform`, `min`, `max`, `regex`,
`email`, `enum`, and `pipe` where they make normalization and validation clearer than manual branches. For example,
optional blank text can become `null`, Persian and Arabic digits can become ASCII digits, and a select value can be
checked against the feature's allowed options in one schema. Avoid duplicating those rules in the contract.

Browser forms own separate schemas in their route slices. Do not derive a form schema from service validation,
even when their current rules match. Intentional duplication lets form behavior and domain validation evolve
independently; update both explicitly when a requirement applies to both. Browser-safe option constants may
remain shared.

Some rules require a database read or a side effect rather than a schema. Check them in the service after parsing and
return an explicit outcome. Keep the repository focused on the query or write. This separation lets another caller use
the same service without importing oRPC, while the procedure remains responsible for the public error response.

## Middleware and Database Failures

The shared contract implementer applies logging first, then error normalization, before validation and feature
middleware. Assemble the router with its undecorated `api` builder; using `os.router` would apply shared middleware
again. The logging middleware writes one Pino JSON completion log for each RPC call: successes at `info`, client
rejections at `warn`, and server failures at `error`. The request ID also becomes the public server-error ID.

Completion logs contain total RPC execution time in `durationMs` and named `timings` entries for procedure, service,
and repository operations. These are inclusive elapsed milliseconds, so parent durations include child operations.
The procedure handler, `submitComplaint`, and `insertComplaint` pass the request's `measure` dependency explicitly;
the timer records failures and each retry in `finally`. Layers that do not execute have no entries. Total RPC timing
includes validation, guards, and error normalization, but excludes HTTP decoding and response serialization.
Request and response payloads are not explicitly added to completion logs. The private error serializer keeps original
messages, SQL, query parameters, PostgreSQL detail, and structured driver diagnostics from a bounded,
cycle-safe cause chain. Database exceptions can therefore include submitted values in server logs; these details
are intentionally retained for debugging. A single top-level `stack` uses the deepest cause that retains
application frames, falling back to the first available stack. Frames from `node_modules` and Node internals are
omitted; complete error headers are retained. Nested causes keep messages and structured diagnostics without
repeated stacks. Arbitrary error properties are omitted, and server exception details remain excluded from
public error responses.

Middleware in `app/orpc/middleware/` uses `os` from `@orpc/server` and imports no feature contract, service, or root
implementer. Each middleware has its own named folder containing its implementation and errors. Add a separate test only
when a consequential behavior cannot be adequately covered through an existing feature test; see [Testing](./testing.md).
Public error definitions live in separate browser-safe files that both middleware and feature contracts
import directly. Each procedure chooses which middleware to apply.

`verifyAltchaMiddleware` accepts any input containing `altcha: string` and injects `context.altchaNonce`. Shared
challenge generation and verification live in `app/lib/altcha.server.ts`. A feature consumes the verified nonce
atomically with its write to enforce its single-use policy.

Feature input validation and business rules belong in the service. Procedures pass input and dependencies to the
service and translate its outcomes into API errors. General middleware handles shared dependencies and guards.

The database middleware injects
the database and maps `DatabaseUnavailableError` to the declared API error. Repositories use
`withDatabaseAvailability` around individual queries, so a network failure from another dependency is not mistakenly
classified as a database outage. Constraint failures remain available to the service for domain decisions.

The database factory bounds pool acquisition to 5 seconds and statements to 10 seconds. The driver query deadline is
15 seconds, allowing PostgreSQL to cancel first. A pool error listener handles idle connection failures and logs only
their diagnostic code. These limits apply to each operation rather than the entire request.
