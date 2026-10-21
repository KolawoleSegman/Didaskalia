import { readJson, storageKey, writeJson } from "./storage";
import { backendConfigured, rpc } from "./backend";

/** Groups need accounts and the online database. */
export const groupsConfigured = backendConfigured;

export type Group = { code: string; name: string; nickname: string };
export type Row = { nickname: string; points: number; is_me: boolean };

export function loadGroups(): Group[] {
  const v = readJson(storageKey("groups"));
  return Array.isArray(v)
    ? v.filter((g): g is Group => !!g && typeof g.code === "string" && typeof g.name === "string" && typeof g.nickname === "string")
    : [];
}
function remember(g: Group) {
  writeJson(storageKey("groups"), [...loadGroups().filter((x) => x.code !== g.code), g]);
  return g;
}

export async function createGroup(name: string, nickname: string): Promise<Group> {
  const [g] = await rpc("create_group", { p_name: name, p_nickname: nickname });
  return remember({ code: g.group_code, name: g.group_name, nickname: nickname.trim() });
}
export async function joinGroup(code: string, nickname: string): Promise<Group> {
  const [g] = await rpc("join_group", { p_code: code, p_nickname: nickname });
  return remember({ code: g.group_code, name: g.group_name, nickname: nickname.trim() });
}
export async function leaderboard(code: string): Promise<Row[]> {
  const rows = await rpc("group_leaderboard", { p_code: code });
  return (rows as Row[]).map((r) => ({ nickname: r.nickname, points: Number(r.points), is_me: r.is_me }));
}
export async function leaveGroup(code: string): Promise<void> {
  await rpc("leave_group", { p_code: code });
  writeJson(storageKey("groups"), loadGroups().filter((g) => g.code !== code));
}
/** Adds a finished round's points to the public weekly board and to every group the player is in. */
export async function submitScore(points: number): Promise<void> {
  if (!backendConfigured) return;
  await rpc("submit_score", { p_points: Math.round(points) });
}
