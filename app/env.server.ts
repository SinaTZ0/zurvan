import dotenv from "dotenv";
import { z } from "zod";

/*===== Load .env =====*/
// `quiet` suppresses dotenv's startup log. Existing process env vars win over .env values,
// so deploy-time config (Docker, CI) is never overridden by a stray local file.
dotenv.config({ quiet: true });

/*===== Schema =====*/
// Single source of truth for server env vars. Add new variables here and to `.env.example`.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Accept both URI schemes node-postgres understands; reject anything else early.
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Signs session cookies and tokens. Rotating it signs every user out.
  BETTER_AUTH_SECRET: z.string().min(32),
  // Public origin of the app. Better-Auth uses it for callbacks and trusted-origin checks.
  BETTER_AUTH_URL: z.url(),
  // The owner's showcase: no SMS provider (the sign-in code is always 12345 and messages go to the `sms_outbox`
  // table). With it off, auth refuses to start until a real SMS provider is wired (`app/lib/sms.server.ts`).
  SHOWCASE_MODE: z.stringbool().default(false),
  // S3-compatible storage for uploaded images (SeaweedFS; docs/media.md). The app writes through this endpoint.
  S3_ENDPOINT: z.url(),
  S3_BUCKET_NAME: z.string().min(1),
  // Any value works while S3 auth is off (local SeaweedFS); production uses the app's identity.
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_REGION: z.string().min(1).default("us-east-1"),
  // Where browsers read images: a full URL (dev, straight from SeaweedFS) or a path behind nginx (`/media`). No
  // trailing slash.
  MEDIA_PUBLIC_URL: z.union([z.url(), z.string().regex(/^\/\S*$/, "Must be a URL or a path starting with /")]),
});

/*===== Validation =====*/
// TODO: Remove this bypass and always validate once the Cloudflare deployment has real env vars
// (a Wrangler config with `vars`/secrets, or the dashboard settings). It exists only because the
// demo deploy has none configured and does not touch the database or auth yet.
// Cloudflare Workers is detected by its user agent because `process.env` is empty there at load time.
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" || globalThis.navigator?.userAgent === "Cloudflare-Workers";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && skipValidation) {
  console.warn("Skipping environment validation (demo deploy); server features that need env vars will fail.");
}

// Fail fast at startup instead of crashing later on first use of a missing variable.
if (!parsed.success && !skipValidation) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

/**
 * Validated, typed server environment.
 *
 * Server-only: the `.server` suffix makes React Router fail the build if this
 * module is imported into client code, keeping secrets out of the browser bundle.
 */
export const env = (parsed.success ? parsed.data : process.env) as Env;

export type Env = z.infer<typeof envSchema>;
