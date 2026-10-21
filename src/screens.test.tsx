import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const user = { id: "11111111-2222-3333-4444-555555555555", email: "ada@example.com", name: "Ada Obi" };

const STATS = {
  installs_total: 120, installs_android: 80, installs_pwa: 15, installs_web: 25, installs_today: 4,
  registered: 64, registered_today: 3, registered_7d: 21, online_now: 7, active_today: 18, active_7d: 40, active_30d: 55,
  players: 50, rounds_today: 33, rounds_total: 900,
  modes: [{ mode: "daily", rounds: 300 }],
  days: Array.from({ length: 14 }, (_, i) => ({ day: `2026-10-${String(21 - i).padStart(2, "0")}`, active: i, signups: 1, installs: 2, rounds: 3 })),
};
const MEMBERS = Array.from({ length: 25 }, (_, i) => ({ display_name: `Member ${i}`, platform: "android", created_at: "2026-10-01T10:00:00Z", last_seen_at: "2026-10-20T10:00:00Z" }));

/** Boots the real signed-in app against a fake server. */
async function boot(opts: { admin?: boolean; onCall?: (u: string, body: any) => Response | undefined } = {}) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://x.supabase.co");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
  localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: "a.b.c", refresh_token: "RT", user }));
  const calls: { u: string; body: any }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const u = String(url).replace("https://x.supabase.co", "");
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ u, body });
    const custom = opts.onCall?.(u, body);
    if (custom) return custom;
    if (u.includes("refresh_token")) return json({ access_token: "a.b.c", refresh_token: "RT", user: { id: user.id, email: user.email } });
    if (u.endsWith("ensure_profile")) return json([{ display_name: "Ada Obi", show_on_board: true, is_admin: !!opts.admin }]);
    if (u.endsWith("host_stats")) return json(STATS);
    if (u.endsWith("host_members")) return json(body.p_offset === 0 ? MEMBERS : [{ ...MEMBERS[0], display_name: "Last One" }]);
    if (u.endsWith("set_notice")) return json(body.p_body);
    if (u.endsWith("get_notice")) return json("");
    if (u.endsWith("load_progress")) return json(null);
    if (u.endsWith("global_leaderboard")) return json([{ rank: 1, display_name: "Bayo", points: 500, is_me: false }, { rank: 2, display_name: "Ada Obi", points: 120, is_me: true }]);
    if (u.endsWith("delete_account")) return new Response(null, { status: 204 });
    return u.includes("/rest/v1/rpc/") ? json([]) : json({});
  }));
  const App = (await import("./App")).default;
  const view = render(<App />);
  await screen.findByRole("button", { name: "Open menu" });
  return { calls, ...view };
}
const nav = (label: RegExp | string) => {
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.click(within(screen.getByRole("navigation", { name: "Main menu" })).getByRole("button", { name: label }));
};

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("admin dashboard", () => {
  it("is not in the menu for ordinary people", async () => {
    await boot();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.queryByRole("button", { name: /admin dashboard/i })).toBeNull();
  });

  it("shows installs, registrations and who is using the app, and pages through members", async () => {
    await boot({ admin: true });
    await waitFor(() => expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy());
    await screen.findByText(/Good (morning|afternoon|evening)/);
    await waitFor(() => { fireEvent.click(screen.getByRole("button", { name: "Open menu" })); expect(screen.getByRole("button", { name: /admin dashboard/i })).toBeTruthy(); });
    fireEvent.click(screen.getByRole("button", { name: /admin dashboard/i }));
    await screen.findByText("Total installs");
    const text = document.body.textContent!;
    for (const needle of ["120", "Android app", "Registered", "64", "Online now", "Active today", "Active, 30 days", "55", "Rounds today", "Member 0"]) expect(text).toContain(needle);
    fireEvent.click(screen.getByRole("button", { name: "New sign-ups" }));
    expect(screen.getByRole("button", { name: "New sign-ups" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));
    await screen.findByText("Last One");
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("posts and clears a message to everyone, which then appears on the home page", async () => {
    await boot({ admin: true });
    await waitFor(() => { fireEvent.click(screen.getByRole("button", { name: "Open menu" })); expect(screen.getByRole("button", { name: /admin dashboard/i })).toBeTruthy(); });
    fireEvent.click(screen.getByRole("button", { name: /admin dashboard/i }));
    await screen.findByLabelText("Notice");
    fireEvent.change(screen.getByLabelText("Notice"), { target: { value: "Welcome to Didaskalia!" } });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await screen.findByText("Notice is live.");
    fireEvent.click(screen.getByRole("button", { name: /Didaskalia — home/ }));
    expect(screen.getByText("Welcome to Didaskalia!")).toBeTruthy();
  });

  it("explains how to become admin when the server says no", async () => {
    await boot({ admin: true, onCall: (u) => (u.endsWith("host_stats") ? json({ message: "Not the host" }, 400) : undefined) });
    await waitFor(() => { fireEvent.click(screen.getByRole("button", { name: "Open menu" })); expect(screen.getByRole("button", { name: /admin dashboard/i })).toBeTruthy(); });
    fireEvent.click(screen.getByRole("button", { name: /admin dashboard/i }));
    await screen.findByText(/isn’t an admin/);
  });
});

describe("home, goal and leaderboard", () => {
  it("home is a real dashboard: daily CTA, goal, verse, subjects and the weekly top players", async () => {
    await boot();
    expect(screen.getByRole("button", { name: /Play today’s Daily/ })).toBeTruthy();
    expect(screen.getByText("0/10 today")).toBeTruthy();
    expect(screen.getByText(/Verse of the day/)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Study a subject" })).toBeTruthy();
    expect(screen.getByText("Life of Jesus")).toBeTruthy();
    await screen.findByText("Bayo");
  });

  it("answering questions moves the daily goal, and the target can be changed in Settings", async () => {
    await boot();
    fireEvent.click(screen.getByRole("button", { name: /^Study Faith|^Faith/ }));
    const list = within(screen.getByRole("list"));
    fireEvent.click(list.getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: /next word|see the round/i }));
    nav(/^home$/i);
    expect(screen.getByText("1/10 today")).toBeTruthy();
    nav(/^settings/i);
    fireEvent.click(screen.getByRole("button", { name: "20 questions" }));
    nav(/^home$/i);
    expect(screen.getByText("1/20 today")).toBeTruthy();
  });

  it("the leaderboard page switches between this week and all time", async () => {
    const { calls } = await boot();
    nav(/^leaderboard/i);
    await screen.findByText("Ada Obi (you)");
    fireEvent.click(screen.getByRole("button", { name: "All time" }));
    await waitFor(() => expect(calls.filter((c) => c.u.endsWith("global_leaderboard") && c.body.p_scope === "all")).toHaveLength(1));
  });
});

describe("account settings", () => {
  it("renames the person and can hide them from the public board", async () => {
    const { calls } = await boot({ onCall: (u, b) => (u.endsWith("update_profile") ? json([{ display_name: b.p_name, show_on_board: b.p_show }]) : undefined) });
    nav(/^settings/i);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Pastor Ada" } });
    fireEvent.click(screen.getByLabelText(/Show me on the public leaderboard/));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Saved.");
    expect(calls.find((c) => c.u.endsWith("update_profile"))!.body).toEqual({ p_name: "Pastor Ada", p_show: false });
  });

  it("deleting the account needs a typed confirmation, then wipes the device and signs out", async () => {
    const { calls } = await boot();
    localStorage.setItem(`didaskalia-${user.id.replace(/-/g, "").slice(0, 12)}-best-v1`, "250");
    nav(/^settings/i);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    const go = screen.getByRole("button", { name: "Delete forever" }) as HTMLButtonElement;
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "delete" } });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(go);
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(calls.some((c) => c.u.endsWith("delete_account"))).toBe(true);
    expect(Object.keys(localStorage).filter((k) => k.includes("-best-v1"))).toEqual([]);
  });

  it("keeps the account when the server refuses to delete it", async () => {
    await boot({ onCall: (u) => (u.endsWith("delete_account") ? json({ message: "Something broke" }, 400) : undefined) });
    nav(/^settings/i);
    fireEvent.click(screen.getByRole("button", { name: "Delete my account" }));
    fireEvent.change(screen.getByLabelText(/Type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete forever" }));
    await screen.findByText("Something broke");
    expect(screen.queryByRole("heading", { name: "Welcome back" })).toBeNull();
  });
});

describe("progress follows the account", () => {
  it("restores progress saved in the account onto a new device", async () => {
    await boot({ onCall: (u) => (u.endsWith("load_progress") ? json({ best: 480, stats: { Faith: { seen: 20, right: 19 } }, badges: ["first-round"] }) : undefined) });
    nav(/^progress/i);
    await screen.findByText(/Overall: 95% · 19\/20/);
  });

  it("each account on a shared phone has its own progress", async () => {
    await boot();
    localStorage.setItem("didaskalia-someoneelse-best-v1", "999");
    expect(screen.getByText("Best 0")).toBeTruthy();
  });
});
