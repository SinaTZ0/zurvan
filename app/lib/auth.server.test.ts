import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("~/env.server", () => ({
  env: {
    NODE_ENV: "production",
    SHOWCASE_MODE: true,
    BETTER_AUTH_URL: "https://k9training.example",
    BETTER_AUTH_SECRET: "test-secret-for-http-and-https-session-routing-123456789",
    HTTP_IP: "203.0.113.10",
  },
}));

// Keep the real auth handler, cookies, origin checks, and session adapter. Replace application persistence and SMS.
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");
  const store = { user: [], session: [], account: [], verification: [] };
  return { drizzleAdapter: () => memoryAdapter(store) };
});
vi.mock("~/db/client.server", () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
    update: () => ({ set: () => ({ where: async () => [] }) }),
  },
}));
vi.mock("~/lib/platform-settings.server", () => ({
  readOtpLimits: async () => ({ perIp: 1000, perPhone: 1000 }),
}));
vi.mock("~/lib/sms.server", () => ({
  recentSms: async () => ({ count: 0, latest: null }),
  sendSms: async () => undefined,
}));
vi.mock("~/lib/referral.server", () => ({
  findPartnerForNewCustomer: async () => null,
  readReferralCode: async () => null,
}));

const { auth, authForHeaders } = await import("~/lib/auth.server");

beforeAll(async () => {
  // Better-Auth bypasses origin checks under Vitest; restore the deployed production policy for these handlers.
  const ipAuth = authForHeaders(new Headers({ host: "203.0.113.10" }));
  for (const instance of [auth, ipAuth]) (await instance.$context).skipOriginCheck = false;
});

async function signIn(origin: string, phoneNumber: string) {
  const headers = new Headers({ host: new URL(origin).host, origin, "content-type": "application/json" });
  const selected = authForHeaders(headers);
  const sent = await selected.handler(
    new Request(`${origin}/api/auth/phone-number/send-otp`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phoneNumber }),
    }),
  );
  expect(sent.status).toBe(200);
  const verified = await selected.handler(
    new Request(`${origin}/api/auth/phone-number/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phoneNumber, code: "12345" }),
    }),
  );
  expect(verified.status).toBe(200);
  const cookies = verified.headers.getSetCookie();
  const sessionCookie = cookies.find((cookie) => cookie.includes("session_token="));
  expect(sessionCookie).toBeDefined();
  headers.set("cookie", cookies.map((cookie) => cookie.split(";")[0]).join("; "));
  const session = await authForHeaders(headers).api.getSession({ headers });
  expect(session?.user.phoneNumber).toBe(phoneNumber);
  return { headers, sessionCookie: sessionCookie! };
}

describe("domain and IP authentication", () => {
  it("signs in over HTTP with a usable host-only session cookie", async () => {
    const { sessionCookie } = await signIn("http://203.0.113.10", "09121110001");
    expect(sessionCookie).not.toMatch(/; Secure/i);
    expect(sessionCookie).not.toContain("__Secure-");
    expect(sessionCookie).not.toMatch(/; Domain=/i);
  });

  it("preserves secure HTTPS domain cookies after IP sign-in", async () => {
    const { sessionCookie } = await signIn("https://k9training.example", "09121110002");
    expect(sessionCookie).toMatch(/; Secure/i);
    expect(sessionCookie).toContain("__Secure-");
    expect(sessionCookie).not.toMatch(/; Domain=/i);
  });

  it("rejects a foreign origin on the HTTP sign-in endpoint", async () => {
    const headers = new Headers({
      host: "203.0.113.10",
      origin: "http://attacker.example",
      cookie: "unrelated=value",
      "content-type": "application/json",
    });
    const response = await authForHeaders(headers).handler(
      new Request("http://203.0.113.10/api/auth/phone-number/send-otp", {
        method: "POST",
        headers,
        body: JSON.stringify({ phoneNumber: "09121110003" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("ignores spoofed forwarded headers and unconfigured IPs", () => {
    const headers = new Headers({
      host: "k9training.example",
      "x-forwarded-host": "203.0.113.10",
      "x-forwarded-proto": "http",
    });
    expect(authForHeaders(headers)).toBe(auth);
    expect(authForHeaders(new Headers({ host: "203.0.113.11" }))).toBe(auth);
  });

  it("keeps referral cookies usable on HTTP and secure on the domain", async () => {
    const { referralCookieFromUrl } =
      await vi.importActual<typeof import("~/lib/referral.server")>("~/lib/referral.server");
    const ipCookie = await referralCookieFromUrl(
      "http://203.0.113.10/?ref=PARTNER",
      new Headers({ host: "203.0.113.10" }),
    );
    const domainCookie = await referralCookieFromUrl(
      "https://k9training.example/?ref=PARTNER",
      new Headers({ host: "k9training.example" }),
    );
    expect(ipCookie).toContain("zurvan_ref=");
    expect(ipCookie).not.toMatch(/; Secure/i);
    expect(domainCookie).toMatch(/; Secure/i);
  });
});
