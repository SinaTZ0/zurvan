// Checks the message files (`messages/<slice>/{fa,en}.json`) for what Paraglide compiles without complaint but the
// site can't afford: an English message missing (Paraglide quietly shows the Persian), a key in the wrong file (two
// slices defining the same key, where one silently wins), a slice folder the inlang project doesn't load, and an
// English placeholder the Persian doesn't have (the caller passes what the Persian needs; English may leave a value out
// where its grammar does without it). Run by `npm run lint`. See docs/i18n/english-version-plan.md, "Phase 1 notes".
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["fa", "en"];
const root = new URL("..", import.meta.url).pathname;
const settings = JSON.parse(readFileSync(join(root, "project.inlang/settings.json"), "utf8"));
const patterns = settings["plugin.inlang.messageFormat"].pathPattern;
const problems = [];

/*===== Registered Slices =====*/
const registered = new Set(
  patterns.map((pattern) => {
    const match = /^\.\/messages\/([a-z_]+)\/\{locale\}\.json$/.exec(pattern);
    if (!match) problems.push(`project.inlang/settings.json: unexpected pathPattern "${pattern}"`);
    return match?.[1];
  }),
);
const folders = readdirSync(join(root, "messages"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const folder of folders) {
  if (!registered.has(folder)) problems.push(`messages/${folder}/ is not listed in project.inlang/settings.json`);
}

/*===== Each Slice =====*/
/** The `{name}` placeholders a message uses, whether it is a plain string or a variant list. */
function placeholders(value) {
  const text = JSON.stringify(value);
  return [...text.matchAll(/(?<!\\)\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).toSorted();
}

for (const slice of registered) {
  if (!slice) continue;
  const files = {};
  for (const locale of LOCALES) {
    const path = `messages/${slice}/${locale}.json`;
    try {
      files[locale] = JSON.parse(readFileSync(join(root, path), "utf8"));
    } catch (error) {
      problems.push(`${path}: ${error.message}`);
    }
  }
  if (!files.fa || !files.en) continue;

  const keys = (locale) => Object.keys(files[locale]).filter((key) => key !== "$schema");
  for (const locale of LOCALES) {
    for (const key of keys(locale)) {
      const where = `messages/${slice}/${locale}.json: ${key}`;
      if (!key.startsWith(`${slice}_`)) problems.push(`${where}: keys in this file start with "${slice}_"`);
      const value = files[locale][key];
      if (typeof value === "string" && value.trim() === "") problems.push(`${where}: empty`);
      const other = LOCALES.find((candidate) => candidate !== locale);
      if (!(key in files[other])) problems.push(`${where}: missing in ${other}.json`);
      else if (locale === "en") {
        const persian = new Set(placeholders(files.fa[key]));
        const extra = placeholders(value).filter((name) => !persian.has(name));
        if (extra.length > 0) problems.push(`${where}: {${extra.join("}, {")}} is not in the Persian message`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`i18n-check: ${problems.length} problem(s)\n${problems.map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}
console.log("i18n-check: messages OK");
