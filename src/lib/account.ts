import { publicRpc, rpc, backendConfigured, updateAuthName } from "./backend";
import { readJson, writeJson } from "./storage";
import { isNative } from "./native";

export type Profile = { display_name: string; show_on_board: boolean; is_admin: boolean };
export type BoardRow = { rank: number; display_name: string; points: number; is_me: boolean };

/** "android" inside the app, "pwa" when the website was installed to the home screen, otherwise "web". */
export function platform(): "android" | "pwa" | "web" {
  if (isNative) return "android";
  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true) return "pwa";
  } catch {
    /* ignore */
  }
  return "web";
}

const DEVICE_KEY = "didaskalia-device-v1";
function deviceId(): string {
  const v = readJson(DEVICE_KEY);
  if (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) return v;
  const id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); });
  writeJson(DEVICE_KEY, id);
  return id;
}

/** Counts this device as an install the first time it opens the app (and refreshes "last seen" later). Works before sign-in. */
export async function recordInstall(): Promise<void> {
  if (!backendConfigured) return;
  await publicRpc("record_install", { p_device: deviceId(), p_platform: platform() });
}

export async function ensureProfile(name: string): Promise<Profile> {
  const [p] = await rpc("ensure_profile", { p_name: name, p_platform: platform() });
  return p as Profile;
}
export const ping = (): Promise<void> => rpc("ping", { p_platform: platform() });

export async function saveProfile(name: string, show: boolean): Promise<{ display_name: string; show_on_board: boolean }> {
  const [p] = await rpc("update_profile", { p_name: name, p_show: show });
  void updateAuthName(p.display_name);
  return p;
}
export const deleteAccount = (): Promise<void> => rpc("delete_account", {});

export async function globalBoard(scope: "week" | "all"): Promise<BoardRow[]> {
  const rows = (await rpc("global_leaderboard", { p_scope: scope })) as BoardRow[];
  return rows.map((r) => ({ rank: Number(r.rank), display_name: r.display_name, points: Number(r.points), is_me: r.is_me }));
}

export const saveProgress = (data: unknown): Promise<void> => rpc("save_progress", { p_data: data });
export async function loadProgress(): Promise<Record<string, unknown> | null> {
  const v = await rpc("load_progress", {});
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
