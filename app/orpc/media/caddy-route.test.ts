import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { MEDIA_KINDS } from "~/orpc/media/constants";

/*===== Production Media Route =====*/
// In production Caddy serves `/media/{kind}/…` only for the kinds its route names (`deploy/Caddyfile`). A kind added
// in code but not there uploads fine and shows only its placeholder on the live site: it happened to `record`, `post`
// and `figure`. This keeps the two lists in step.

const caddyfile = readFileSync(path.resolve(import.meta.dirname, "../../../deploy/Caddyfile"), "utf8");
const routeKinds = /path_regexp image \^\/media\/\(\(([a-z|]+)\)\//.exec(caddyfile)?.[1]?.split("|") ?? [];

describe("the production media route", () => {
  it("serves every image kind the app uploads, and nothing else", () => {
    expect(routeKinds.toSorted()).toEqual([...MEDIA_KINDS].toSorted());
  });
});
