import { describe, expect, it } from "vitest";

import { resolvePublicOrigin } from "~/lib/public-origin";

const primary = "https://k9training.example";
const ip = "203.0.113.10";

describe("public origin selection", () => {
  it.each([ip, `${ip}:80`])("uses HTTP for the configured IP host %s", (host) => {
    expect(resolvePublicOrigin(new Headers({ host }), primary, ip)).toBe(`http://${ip}`);
  });

  it.each(["203.0.113.11", `${ip}:8080`, `${ip}.attacker.example`, `attacker@${ip}`, "attacker.example"])(
    "keeps the primary origin for an unconfigured host %s",
    (host) => {
      expect(resolvePublicOrigin(new Headers({ host }), primary, ip)).toBe(primary);
    },
  );

  it("keeps the primary origin when IP access is disabled or host is missing", () => {
    expect(resolvePublicOrigin(new Headers({ host: ip }), primary)).toBe(primary);
    expect(resolvePublicOrigin(new Headers(), primary, ip)).toBe(primary);
  });
});
