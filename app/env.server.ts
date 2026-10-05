import dotenv from "dotenv";
import { z } from "zod";

/*===== Load .env =====*/
// `quiet` suppresses dotenv's startup log. Existing process env vars win over .env values,
// so deploy-time config (Docker, CI) is never overridden by a stray local file.
dotenv.config({ quiet: true });

/*===== Schema =====*/
// Single source of truth for server env vars. Add new variables here and to `.env.example`.
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/*===== Validation =====*/
const parsed = envSchema.safeParse(process.env);

// Fail fast at startup instead of crashing later on first use of a missing variable.
if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

/**
 * Validated, typed server environment.
 *
 * Server-only: the `.server` suffix makes React Router fail the build if this
 * module is imported into client code, keeping secrets out of the browser bundle.
 */
export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
