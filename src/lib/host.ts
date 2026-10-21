import { backendConfigured, rpc } from "./backend";

export type DayRow = { day: string; active: number; signups: number; installs: number; rounds: number };
export type HostStats = {
  installs_total: number; installs_android: number; installs_pwa: number; installs_web: number; installs_today: number;
  registered: number; registered_today: number; registered_7d: number;
  online_now: number; active_today: number; active_7d: number; active_30d: number;
  players: number; rounds_today: number; rounds_total: number;
  modes: { mode: string; rounds: number }[];
  days: DayRow[];
};
export type Member = { display_name: string; platform: string; created_at: string; last_seen_at: string };

/** Counts one round started. Anonymous apart from the account id; no answers are sent. */
export async function recordPlay(mode: string): Promise<void> {
  if (backendConfigured) await rpc("record_play", { p_mode: mode });
}
export const hostStats = (): Promise<HostStats> => rpc("host_stats", {});
export const hostMembers = (limit: number, offset: number): Promise<Member[]> => rpc("host_members", { p_limit: limit, p_offset: offset });

export async function getNotice(): Promise<string> {
  if (!backendConfigured) return "";
  const v = await rpc("get_notice", {});
  return typeof v === "string" ? v : "";
}
export async function setNotice(body: string): Promise<string> {
  const v = await rpc("set_notice", { p_body: body });
  return typeof v === "string" ? v : "";
}
