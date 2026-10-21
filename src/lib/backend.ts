import { readJson, writeJson } from "./storage";

const API = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
/** True once the two Supabase values are filled in (see README). Accounts need it. */
export const backendConfigured = Boolean(API && KEY);

const SESSION_KEY = "didaskalia-session-v1";
const OFFLINE = "Couldn’t connect. Check your internet and try again.";

export type AuthUser = { id: string; email: string; name: string };
export type Session = { access_token: string; refresh_token: string; user: AuthUser };

/* ---------- session (kept on the device so people stay signed in, even offline) ---------- */

function userFrom(raw: any): AuthUser | null {
  if (!raw || typeof raw.id !== "string") return null;
  const email = typeof raw.email === "string" ? raw.email : "";
  const meta = raw.user_metadata?.display_name ?? raw.name; // "name" is how we store it on the device
  const name = typeof meta === "string" && meta.trim() ? meta.trim() : email.split("@")[0] || "Friend";
  return { id: raw.id, email, name };
}

export function getSession(): Session | null {
  const v = readJson(SESSION_KEY) as Partial<Session> | undefined;
  const user = userFrom(v?.user);
  return v && user && typeof v.access_token === "string" && typeof v.refresh_token === "string"
    ? { access_token: v.access_token, refresh_token: v.refresh_token, user }
    : null;
}
const saveSession = (s: Session | null) => writeJson(SESSION_KEY, s);

/* ---------- plain requests ---------- */

async function send(method: string, path: string, body: unknown, token?: string): Promise<Response> {
  try {
    return await fetch(`${API}${path}`, {
      method,
      headers: { apikey: KEY, "Content-Type": "application/json", Authorization: `Bearer ${token ?? KEY}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(OFFLINE);
  }
}

/** Turns the server's English error into something kinder. */
export function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email or password isn’t right.";
  if (m.includes("not confirmed")) return "Please confirm your email first. Check your inbox for our message.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with that email already exists. Try signing in.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return "Too many tries. Please wait a few minutes and try again.";
  if (m.includes("password") && m.includes("least")) return "Choose a longer password (at least 8 characters).";
  if (m.includes("valid email") || m.includes("invalid format")) return "That doesn’t look like a valid email address.";
  if (m.includes("signups not allowed")) return "New accounts are switched off right now.";
  return message || "Something went wrong. Try again.";
}

async function authError(res: Response): Promise<Error> {
  const body = await res.json().catch(() => null);
  return new Error(friendly(String(body?.msg ?? body?.error_description ?? body?.message ?? "")));
}

/* ---------- accounts ---------- */

function toSession(data: any): Session | null {
  const user = userFrom(data?.user);
  if (!user || typeof data?.access_token !== "string" || typeof data?.refresh_token !== "string") return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token, user };
}

export type SignUpResult = { status: "signed-in"; session: Session } | { status: "confirm" };

export async function signUp(email: string, password: string, name: string): Promise<SignUpResult> {
  const res = await send("POST", "/auth/v1/signup", { email: email.trim(), password, data: { display_name: name.trim() } });
  if (!res.ok) throw await authError(res);
  const data = await res.json().catch(() => null);
  const session = toSession(data);
  if (session) {
    saveSession(session);
    return { status: "signed-in", session };
  }
  return { status: "confirm" };
}

export async function signIn(email: string, password: string): Promise<Session> {
  const res = await send("POST", "/auth/v1/token?grant_type=password", { email: email.trim(), password });
  if (!res.ok) throw await authError(res);
  const session = toSession(await res.json().catch(() => null));
  if (!session) throw new Error("Couldn’t sign you in. Try again.");
  saveSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  const s = getSession();
  saveSession(null);
  if (s) await send("POST", "/auth/v1/logout", {}, s.access_token).catch(() => {});
}

export async function sendReset(email: string): Promise<void> {
  const res = await send("POST", "/auth/v1/recover", { email: email.trim() });
  if (!res.ok) throw await authError(res);
}

/** Used on the "choose a new password" page that the reset email opens. */
export async function setNewPassword(accessToken: string, password: string): Promise<void> {
  const res = await send("PUT", "/auth/v1/user", { password }, accessToken);
  if (!res.ok) throw await authError(res);
}

export async function updateAuthName(name: string): Promise<void> {
  const s = getSession();
  if (!s) return;
  const res = await send("PUT", "/auth/v1/user", { data: { display_name: name.trim() } }, s.access_token);
  if (res.ok) saveSession({ ...s, user: { ...s.user, name: name.trim() } });
}

let refreshing: Promise<Session | null> | null = null;
/** Returns the fresh session, or null if the refresh token is no longer valid. Throws only when offline. */
export function refresh(old: Session): Promise<Session | null> {
  refreshing ??= send("POST", "/auth/v1/token?grant_type=refresh_token", { refresh_token: old.refresh_token })
    .then(async (res) => {
      if (!res.ok) {
        // 400/401/403 mean the sign-in is truly gone; anything else (500, 429) is worth retrying later.
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          saveSession(null);
          return null;
        }
        throw new Error(OFFLINE);
      }
      const s = toSession(await res.json().catch(() => null));
      if (!s) throw new Error(OFFLINE);
      saveSession(s);
      return s;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/* ---------- calls to the database functions ---------- */

export async function rpc(name: string, args: Record<string, unknown> = {}, retried = false): Promise<any> {
  if (!backendConfigured) throw new Error("The online features aren’t set up yet.");
  const session = getSession();
  if (!session) throw new Error("Please sign in first.");
  const res = await send("POST", `/rest/v1/rpc/${name}`, args, session.access_token);
  if (res.status === 401 && !retried) {
    const fresh = await refresh(session);
    if (!fresh) throw new Error("Your session expired. Please sign in again.");
    return rpc(name, args, true);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(typeof body?.message === "string" ? body.message : "Something went wrong. Try again.");
  return body;
}

/** For the few calls that work before sign-in (counting installs). Uses only the public key. */
export async function publicRpc(name: string, args: Record<string, unknown>): Promise<void> {
  if (!backendConfigured) return;
  const res = await send("POST", `/rest/v1/rpc/${name}`, args);
  if (!res.ok) throw new Error("Request failed.");
}
