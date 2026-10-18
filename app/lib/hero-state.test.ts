import { describe, expect, it } from "vitest";

import {
  decideHeroOnLoad,
  HERO_COOKIE,
  HERO_SESSION_COOKIE,
  nextHeroIndex,
  parseHeroIndex,
  readCookieValue,
} from "~/lib/hero-state";

/*===== Hero State =====*/
// The rules that decide which dog the home hero shows: a new session advances, back/forward/reload and waiting don't.

const COUNT = 3;

describe("nextHeroIndex", () => {
  it("steps forward and wraps to the first dog", () => {
    expect(nextHeroIndex({ current: 0, count: COUNT })).toBe(1);
    expect(nextHeroIndex({ current: 2, count: COUNT })).toBe(0);
  });
});

describe("parseHeroIndex", () => {
  it("accepts an index inside the range and nothing else", () => {
    expect(parseHeroIndex({ raw: "2", count: COUNT })).toBe(2);
    expect(parseHeroIndex({ raw: "3", count: COUNT })).toBeNull();
    expect(parseHeroIndex({ raw: "-1", count: COUNT })).toBeNull();
    expect(parseHeroIndex({ raw: "1.5", count: COUNT })).toBeNull();
    expect(parseHeroIndex({ raw: "abc", count: COUNT })).toBeNull();
    expect(parseHeroIndex({ raw: null, count: COUNT })).toBeNull();
  });
});

describe("readCookieValue", () => {
  it("finds a cookie among others and ignores look-alikes", () => {
    const header = `a=1; ${HERO_COOKIE}=2; b=3`;
    expect(readCookieValue({ header, name: HERO_COOKIE })).toBe("2");
    expect(readCookieValue({ header: `x${HERO_COOKIE}=9`, name: HERO_COOKIE })).toBeNull();
    expect(readCookieValue({ header: null, name: HERO_COOKIE })).toBeNull();
  });
});

describe("decideHeroOnLoad", () => {
  it("shows the first dog on the very first visit and starts the session", () => {
    expect(decideHeroOnLoad({ cookieHeader: null, count: COUNT })).toEqual({ index: 0, startsSession: true });
  });

  it("advances once for a new session that remembers a dog, wrapping at the end", () => {
    expect(decideHeroOnLoad({ cookieHeader: `${HERO_COOKIE}=1`, count: COUNT })).toEqual({
      index: 2,
      startsSession: true,
    });
    expect(decideHeroOnLoad({ cookieHeader: `${HERO_COOKIE}=2`, count: COUNT })).toEqual({
      index: 0,
      startsSession: true,
    });
  });

  it("keeps the same dog inside a session: reload, back, forward and client navigations", () => {
    const header = `${HERO_COOKIE}=1; ${HERO_SESSION_COOKIE}=1`;
    expect(decideHeroOnLoad({ cookieHeader: header, count: COUNT })).toEqual({ index: 1, startsSession: false });
    expect(decideHeroOnLoad({ cookieHeader: header, count: COUNT })).toEqual({ index: 1, startsSession: false });
  });

  it("treats a hand-edited or stale value as the first dog", () => {
    expect(decideHeroOnLoad({ cookieHeader: `${HERO_COOKIE}=99`, count: COUNT })).toEqual({
      index: 0,
      startsSession: true,
    });
    expect(decideHeroOnLoad({ cookieHeader: `${HERO_COOKIE}=nope; ${HERO_SESSION_COOKIE}=1`, count: COUNT })).toEqual({
      index: 0,
      startsSession: false,
    });
  });
});
