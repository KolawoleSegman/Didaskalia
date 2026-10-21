import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const user = { id: "11111111-2222-3333-4444-555555555555", email: "ada@example.com", user_metadata: { display_name: "Ada Obi" } };

async function loadApp(configured = true) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", configured ? "https://x.supabase.co" : "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", configured ? "anon" : "");
  return (await import("./App")).default;
}
/** A tiny fake server: sign-in, install counting, profile and anything else answers with an empty OK. */
function server(extra: (url: string, init: RequestInit) => Response | undefined = () => undefined) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const u = String(url).replace("https://x.supabase.co", "");
    calls.push(u);
    const custom = extra(u, init);
    if (custom) return custom;
    if (u.includes("grant_type=password")) return json({ access_token: "AT", refresh_token: "RT", user });
    if (u.endsWith("ensure_profile")) return json([{ display_name: "Ada Obi", show_on_board: true, is_admin: false }]);
    if (u.endsWith("load_progress")) return json(null);
    if (u.endsWith("get_notice")) return json("");
    if (u.endsWith("record_install")) return new Response(null, { status: 204 });
    return json([]);
  }));
  return calls;
}
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => { localStorage.clear(); window.location.hash = ""; });
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("the sign-in gate", () => {
  it("shows the sign-in page first, and counts the install before anyone signs in", async () => {
    const calls = server();
    const App = await loadApp();
    render(<App />);
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
    await waitFor(() => expect(calls).toContain("/rest/v1/rpc/record_install"));
  });

  it("explains setup when Supabase isn't connected, instead of letting anyone in", async () => {
    const App = await loadApp(false);
    render(<App />);
    expect(screen.getByText(/isn’t connected yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open menu" })).toBeNull();
  });

  it("checks the form before asking the server", async () => {
    const calls = server();
    const App = await loadApp();
    render(<App />);
    const submit = screen.getAllByRole("button", { name: "Sign in" }).find((b) => (b as HTMLButtonElement).type === "submit")!;
    fireEvent.click(submit);
    expect(screen.getByRole("alert").textContent).toMatch(/valid email/);
    type("Email", "ada@example.com");
    type("Password", "short");
    fireEvent.click(submit);
    expect(screen.getByRole("alert").textContent).toMatch(/at least 8/);
    expect(calls.some((c) => c.includes("grant_type=password"))).toBe(false);
  });

  it("signs in and opens the app with the person's name; the menu holds every feature", async () => {
    server();
    const App = await loadApp();
    render(<App />);
    type("Email", "ada@example.com");
    type("Password", "password123");
    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" }).find((b) => (b as HTMLButtonElement).type === "submit")!);
    await screen.findByText(/Good (morning|afternoon|evening), Ada/);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = screen.getByRole("navigation", { name: "Main menu" });
    for (const name of ["Home", "Play", "Daily challenge", "Memorize", "Library", "Leaderboard", "Groups", "Progress", "Achievements", "My questions", "Settings", "Help & about"]) {
      expect(menu.querySelector(`button`) && Array.from(menu.querySelectorAll("button")).some((b) => b.textContent === name), name).toBe(true);
    }
    expect(Array.from(menu.querySelectorAll("button")).some((b) => /admin/i.test(b.textContent ?? ""))).toBe(false); // not an admin
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays signed in after a reload, even offline, and signing out returns to the sign-in page", async () => {
    localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: "a.b.c", refresh_token: "RT", user: { id: user.id, email: user.email, name: "Ada Obi" } }));
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    const App = await loadApp();
    render(<App />);
    await screen.findByText(/Good (morning|afternoon|evening), Ada/);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(localStorage.getItem("didaskalia-session-v1")).toBe("null");
  });

  it("sends people with a revoked saved session back to sign in", async () => {
    localStorage.setItem("didaskalia-session-v1", JSON.stringify({ access_token: "a.b.c", refresh_token: "RT", user: { id: user.id, email: user.email, name: "Ada" } }));
    server((u) => (u.includes("refresh_token") ? json({ msg: "Invalid Refresh Token" }, 400) : undefined));
    const App = await loadApp();
    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
  });

  it("create account: asks for a name, and says to check email when confirmation is on", async () => {
    server((u) => (u.endsWith("/auth/v1/signup") ? json({ id: "u1", email: "ada@example.com" }) : undefined));
    const App = await loadApp();
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Create account" }));
    type("Email", "ada@example.com");
    type("Password", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));
    expect(screen.getByRole("alert").textContent).toMatch(/your name/i);
    type("Your name", "Ada");
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));
    await screen.findByText(/Check your email/);
  });

  it("forgot password sends a reset link without revealing whether the email exists", async () => {
    const calls = server();
    const App = await loadApp();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /forgot your password/i }));
    type("Email", "nobody@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await screen.findByText(/If an account exists/);
    expect(calls).toContain("/auth/v1/recover");
  });

  it("the reset email link opens a 'choose a new password' page", async () => {
    window.location.hash = "#access_token=RESETTOKEN&refresh_token=x&type=recovery";
    const calls = server((u, init) => {
      if (u === "/auth/v1/user") {
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer RESETTOKEN");
        return json({ id: user.id });
      }
    });
    const App = await loadApp();
    render(<App />);
    type("New password", "brandnewpass");
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));
    await screen.findByText(/Password changed/);
    expect(calls).toContain("/auth/v1/user");
    expect(window.location.hash).toBe("");
  });

  it("an expired reset link says so", async () => {
    window.location.hash = "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";
    server();
    const App = await loadApp();
    render(<App />);
    expect(screen.getByRole("alert").textContent).toMatch(/expired/);
  });
});
