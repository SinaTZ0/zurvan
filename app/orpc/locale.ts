import { baseLocale, getServerAsyncLocalStorage, isLocale, type Locale } from "~/paraglide/runtime";

/*===== Request Locale =====*/
// The language a procedure words its sentences in (docs/i18n/english-version-plan.md, "Server sentences"). `/rpc` has
// no language in its address, so the browser's client names the page's language in a header (`~/orpc/client`); the
// in-process client of a server render passes the request's language directly. Persian when it is missing or unknown:
// an old tab, a test or a script gets the base language, never an error.

/** The custom Paraglide strategy that reads that header for `/rpc` (`app/server.ts`, the route strategies). */
export const LOCALE_STRATEGY = "custom-header";

/** The header the browser's oRPC link sends the page's language in. */
export const LOCALE_HEADER = "x-locale";

/** The language a request to `/rpc` asked for. */
export function localeFromHeaders(headers: Headers): Locale {
  const value = headers.get(LOCALE_HEADER);
  return value && isLocale(value) ? value : baseLocale;
}

/*===== Running in a Language =====*/
/**
 * Runs `run` with Paraglide's request language set to `locale`, so `m.…()` and the formatters inside it (however deep)
 * answer in it. For a server route Paraglide excludes from its own detection (`/api/...`, the route strategies), where
 * every message would otherwise be Persian: the evaluation video upload (`app/routes/api_evaluation_videos/`).
 *
 * Outside a request's store (a script, a test) it simply runs `run`, in the base language.
 */
export function runInLocale<Result>({ locale, run }: { locale: Locale; run: () => Result }): Result {
  const storage = getServerAsyncLocalStorage();
  const store = storage?.getStore();
  if (!storage || !store) return run();
  return storage.run({ ...store, locale }, run) as Result;
}
