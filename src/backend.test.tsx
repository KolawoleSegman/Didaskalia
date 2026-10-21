import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const authUser = { id: "11111111-2222-3333-4444-555555555555", email: "ada@example.com", user_metadata: { display_name: "Ada Obi" } };
async function load() {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://x.supabase.co/");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
  return { b: await import("./lib/backend"), g: await import("./lib/groups"), a: await import("./lib/account") };
}
const headers = (init: RequestInit) => init.headers as Record<string, string>;
beforeEach(() => localStorage.clear());
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("accounts", () => {
  it("signs in, keeps the session on the device, and reads the display name", async () => {
    const { b } = await load();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      expect(String(url)).toBe("https://x.supabase.co/auth/v1/token?grant_type=password");
      expect(JSON.parse(String(init.body))).toEqual({ email: "ada@example.com", password: "hunter2hunter2" });
      return json({ access_token: "AT", refresh_token: "RT", user: authUser });
    }));
    const s = await b.signIn(" ada@example.com ", "hunter2hunter2");
    expect(s.user).toEqual({ id: authUser.id, email: "ada@example.com", name: "Ada Obi" });
    expect(b.getSession()?.access_token).toBe("AT");
  });

  it("falls back to the start of the email when there is no display name", async () => {
    const { b } = await load();
    vi.stubGlobal("fetch", vi.fn(async () => json({ access_token: "AT", refresh_token: "RT", user: { id: "u1", email: "bayo@example.com" } })));
    expect((await b.signIn("bayo@example.com", "password1")).user.name).toBe("bayo");
  });

  it("explains wrong passwords and unconfirmed emails kindly", async () => {
    const { b } = await load();
    vi.stubGlobal("fetch", vi.fn(async () => json({ msg: "Invalid login credentials" }, 400)));
    await expect(b.signIn("a@b.co", "password1")).rejects.toThrow("That email or password isn’t right.");
    vi.stubGlobal("fetch", vi.fn(async () => json({ msg: "Email not confirmed" }, 400)));
    await expect(b.signIn("a@b.co", "password1")).rejects.toThrow(/confirm your email/);
    expect(b.getSession()).toBeNull();
  });

  it("sign-up either signs in at once or asks the person to confirm their email", async () => {
    const { b } = await load();
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => {
      expect(JSON.parse(String(init.body)).data).toEqual({ display_name: "Ada Obi" });
      return json({ access_token: "AT", refresh_token: "RT", user: authUser });
    }));
    expect((await b.signUp("ada@example.com", "password1", " Ada Obi ")).status).toBe("signed-in");
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => json({ id: "u1", email: "ada@example.com", confirmation_sent_at: "now" })));
    expect(await b.signUp("ada@example.com", "password1", "Ada")).toEqual({ status: "confirm" });
    expect(b.getSession()).toBeNull();
    vi.stubGlobal("fetch", vi.fn(async () => json({ msg: "User already registered" }, 422)));
    await expect(b.signUp("ada@example.com", "password1", "Ada")).rejects.toThrow(/already exists/);
  });

  it("signs out locally even when the server can't be reached", async () => {
    const { b } = await load();
    localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: "AT", refresh_token: "RT", user: authUser }));
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    await b.signOut();
    expect(b.getSession()).toBeNull();
  });

  it("ignores a damaged saved session", async () => {
    const { b } = await load();
    localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: 5 }));
    expect(b.getSession()).toBeNull();
    localStorage.setItem("didaskalia-session-v1", "{oops");
    expect(b.getSession()).toBeNull();
  });
});

describe("calls to the database", () => {
  const signedIn = () => localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: "AT", refresh_token: "RT", user: authUser }));

  it("sends the person's token, and creates and remembers a group", async () => {
    const { g } = await load();
    signedIn();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      expect(headers(init).Authorization).toBe("Bearer AT");
      expect(headers(init).apikey).toBe("anon");
      return String(url).endsWith("create_group") ? json([{ group_code: "ABC234", group_name: "Grace" }]) : json([{ nickname: "Ada", points: "120", is_me: true }]);
    }));
    expect(await g.createGroup("Grace", " Ada ")).toEqual({ code: "ABC234", name: "Grace", nickname: "Ada" });
    expect(g.loadGroups()).toHaveLength(1);
    expect(await g.leaderboard("ABC234")).toEqual([{ nickname: "Ada", points: 120, is_me: true }]);
  });

  it("refreshes an expired token once and retries", async () => {
    const { g } = await load();
    signedIn();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      if (String(url).includes("grant_type=refresh_token")) return json({ access_token: "NEW", refresh_token: "RT2", user: authUser });
      return headers(init).Authorization === "Bearer NEW" ? json([]) : json({ message: "JWT expired" }, 401);
    }));
    expect(await g.leaderboard("ABC234")).toEqual([]);
    expect(JSON.parse(localStorage.getItem("didaskalia-session-v1")!).access_token).toBe("NEW");
  });

  it("asks the person to sign in again when the refresh token is dead", async () => {
    const { g, b } = await load();
    signedIn();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("refresh_token") ? json({ msg: "Invalid Refresh Token" }, 400) : json({ message: "JWT expired" }, 401))));
    await expect(g.leaderboard("ABC234")).rejects.toThrow(/sign in again/);
    expect(b.getSession()).toBeNull();
  });

  it("needs a signed-in person, shows the server's message and a friendly offline message", async () => {
    const { g } = await load();
    await expect(g.joinGroup("ABC234", "Ada")).rejects.toThrow(/sign in/i);
    signedIn();
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "No group with that code" }, 400)));
    await expect(g.joinGroup("NOPE", "Ada")).rejects.toThrow("No group with that code");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network"); }));
    await expect(g.joinGroup("ABC234", "Ada")).rejects.toThrow(/Couldn’t connect/);
  });

  it("is switched off when Supabase isn't configured", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");
    const g = await import("./lib/groups");
    const a = await import("./lib/account");
    expect(g.groupsConfigured).toBe(false);
    await expect(g.createGroup("Grace", "Ada")).rejects.toThrow(/aren’t set up/);
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await a.recordInstall();
    await g.submitScore(100);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("counting installs", () => {
  it("uses only the public key, and the same device id every time", async () => {
    const { a } = await load();
    const seen: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
      expect(String(url)).toBe("https://x.supabase.co/rest/v1/rpc/record_install");
      expect(headers(init).Authorization).toBe("Bearer anon");
      seen.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 204 });
    }));
    await a.recordInstall();
    await a.recordInstall();
    expect(seen[0].p_device).toMatch(/^[0-9a-f-]{36}$/i);
    expect(seen[1].p_device).toBe(seen[0].p_device);
    expect(seen[0].p_platform).toBe("web");
  });

  it("reports an installed web app and the Android app by their own names", async () => {
    const { a } = await load();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(a.platform()).toBe("pwa");
  });
});
