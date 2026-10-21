// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const U = (n: number) => `00000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`;
const [OWNER, A, B, C, D] = [U(1), U(10), U(11), U(12), U(13)];
let db: PGlite;

async function as(user: string) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user]);
}
const call = async (user: string, sql: string, params: unknown[] = []) => {
  await as(user);
  return (await db.query(sql, params)).rows as any[];
};
const fails = async (user: string, sql: string, params: unknown[], msg: RegExp) => {
  await expect(call(user, sql, params)).rejects.toThrow(msg);
};
const val = async (user: string, fn: string, ...args: unknown[]) =>
  (await call(user, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as v`, args))[0].v;

beforeAll(async () => {
  db = new PGlite();
  // Minimal stand-ins for what Supabase provides.
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public to anon, authenticated; grant usage on schema auth to anon, authenticated;
  `);
  await db.exec(readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8"));
  // The file must be safe to run twice.
  await db.exec(readFileSync(new URL("../supabase/setup.sql", import.meta.url), "utf8"));
  await db.exec(`insert into auth.users values ('${OWNER}', 'owner@example.com'), ('${A}', 'a@example.com'), ('${B}', 'b@example.com'), ('${C}', 'c@example.com'), ('${D}', 'd@example.com')`);
});

describe("groups", () => {
  let code = "";
  it("creates a group with a 6-character code and makes the creator a member", async () => {
    const [g] = await call(A, "select * from public.create_group($1,$2)", ["Grace Chapel", "Ada"]);
    code = g.group_code;
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(g.group_name).toBe("Grace Chapel");
  });
  it("lets others join by code (any case, extra spaces) and rejects bad input", async () => {
    const [j] = await call(B, "select * from public.join_group($1,$2)", [`  ${code.toLowerCase()} `, "Bayo"]);
    expect(j.group_code).toBe(code);
    await fails(C, "select * from public.join_group($1,$2)", ["ZZZZZZ", "Chi"], /No group with that code/);
    await fails(C, "select * from public.join_group($1,$2)", [code, "x"], /Nickname must be/);
    await fails(C, "select * from public.create_group($1,$2)", ["x", "Chi"], /Group name must be/);
  });
  it("ranks this week's points, caps a round at 300 and a day at 600", async () => {
    await call(A, "select public.submit_score($1)", [120]);
    await call(B, "select public.submit_score($1)", [9999]); // clamped to 300
    await call(B, "select public.submit_score($1)", [300]);
    await call(B, "select public.submit_score($1)", [300]); // day total capped at 600
    const rows = await call(A, "select * from public.group_leaderboard($1)", [code]);
    expect(rows.map((r) => [r.nickname, Number(r.points), r.is_me])).toEqual([["Bayo", 600, false], ["Ada", 120, true]]);
    await call(A, "select public.submit_score($1)", [-50]); // negatives count as 0
    expect(Number((await call(A, "select * from public.group_leaderboard($1)", [code]))[1].points)).toBe(120);
  });
  it("hides a group's board from non-members and from direct table access", async () => {
    await fails(C, "select * from public.group_leaderboard($1)", [code], /not in that group/);
    await as(A);
    await db.exec("set role authenticated");
    await expect(db.query("select * from public.group_scores")).rejects.toThrow(/permission denied/);
    await expect(db.query("select * from public.groups")).rejects.toThrow(/permission denied/);
    await db.exec("reset role");
  });
  it("limits a person to 10 groups, and leaving removes them", async () => {
    for (let i = 0; i < 9; i++) await call(C, "select * from public.create_group($1,$2)", [`Group ${i}`, "Chi"]);
    await call(C, "select * from public.join_group($1,$2)", [code, "Chi"]); // 10th
    await fails(C, "select * from public.create_group($1,$2)", ["Eleventh", "Chi"], /at most 10/);
    await call(C, "select public.leave_group($1)", [code]);
    await fails(C, "select * from public.group_leaderboard($1)", [code], /not in that group/);
    expect(await call(A, "select * from public.group_leaderboard($1)", [code])).toHaveLength(2);
  });
});

describe("accounts and installs", () => {
  it("counts a device once, from the public key, before anyone signs in", async () => {
    const dev = "11111111-1111-1111-1111-111111111111";
    await db.exec("set role anon");
    await db.query("select public.record_install($1, 'android')", [dev]);
    await db.query("select public.record_install($1, 'android')", [dev]);
    await db.query("select public.record_install($1, 'something-odd')", ["22222222-2222-2222-2222-222222222222"]); // falls back to web
    await db.exec("reset role");
    expect((await db.query("select platform, count(*)::int as n from public.installs group by 1 order by 1")).rows).toEqual([{ platform: "android", n: 1 }, { platform: "web", n: 1 }]);
  });

  it("creates a profile on first sign-in, keeps the name afterwards and falls back to a friendly one", async () => {
    const [p] = await call(OWNER, "select * from public.ensure_profile($1, $2)", ["  Pastor Tim  ", "android"]);
    expect(p).toEqual({ display_name: "Pastor Tim", show_on_board: true, is_admin: false });
    const [again] = await call(OWNER, "select * from public.ensure_profile($1, $2)", ["Someone Else", "web"]);
    expect(again.display_name).toBe("Pastor Tim");
    const [anon] = await call(A, "select * from public.ensure_profile($1, $2)", ["", "web"]);
    expect(anon.display_name).toMatch(/^Friend /);
    await call(A, "select * from public.update_profile($1, $2)", ["Ada", true]);
    await call(B, "select * from public.ensure_profile($1, $2)", ["Bayo", "pwa"]);
    await call(C, "select * from public.ensure_profile($1, $2)", ["Chi", "web"]);
    await fails(A, "select * from public.update_profile($1, $2)", ["x", true], /Display name must be/);
  });

  it("requires a signed-in user", async () => {
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await expect(db.query("select * from public.ensure_profile('Zed', 'web')")).rejects.toThrow(/Not signed in/);
    await expect(db.query("select public.record_play('x')")).rejects.toThrow(/Not signed in/);
    await expect(db.query("select * from public.global_leaderboard('week')")).rejects.toThrow(/Not signed in/);
  });

  it("blocks direct table access", async () => {
    await as(OWNER);
    await db.exec("set role authenticated");
    for (const t of ["profiles", "installs", "plays", "host_settings", "host_admins", "activity", "progress_sync", "global_scores"]) {
      await expect(db.query(`select * from public.${t}`)).rejects.toThrow(/permission denied/);
    }
    await db.exec("reset role");
  });
});

describe("leaderboard", () => {
  it("ranks everyone's points, handles ties, and hides people who opted out", async () => {
    // Earlier tests already gave Ada 120 and Bayo 600 (capped) this week.
    await call(C, "select public.submit_score($1)", [120]);
    let rows = await call(A, "select * from public.global_leaderboard('week')");
    expect(rows.map((r) => [Number(r.rank), r.display_name, Number(r.points), r.is_me])).toEqual([[1, "Bayo", 600, false], [2, "Ada", 120, true], [2, "Chi", 120, false]]);
    await call(B, "select * from public.update_profile($1, $2)", ["Bayo", false]);
    rows = await call(A, "select * from public.global_leaderboard('all')");
    expect(rows.map((r) => r.display_name)).toEqual(["Ada", "Chi"]);
  });
  it("shows the caller their own rank when they are outside the top 25", async () => {
    for (let i = 0; i < 26; i++) {
      const id = `00000000-0000-0000-0000-0000000001${String(i).padStart(2, "0")}`;
      await db.exec(`insert into auth.users values ('${id}', 'p${i}@example.com')`);
      await call(id, "select * from public.ensure_profile($1, 'web')", [`Player ${i}`]);
      await call(id, "select public.submit_score($1)", [200 + i]);
    }
    const rows = await call(A, "select * from public.global_leaderboard('week')");
    expect(rows).toHaveLength(26); // top 25 plus Ada
    expect(rows[25]).toMatchObject({ display_name: "Ada", is_me: true });
    expect(Number(rows[25].rank)).toBe(27);
  });
});

describe("cloud progress", () => {
  it("saves and loads a person's own progress only", async () => {
    expect(await val(D, "load_progress")).toBeNull();
    await call(D, "select public.save_progress($1::jsonb)", [JSON.stringify({ best: 120 })]);
    await call(D, "select public.save_progress($1::jsonb)", [JSON.stringify({ best: 240 })]);
    expect(await val(D, "load_progress")).toEqual({ best: 240 });
    expect(await val(A, "load_progress")).toBeNull();
    await fails(D, "select public.save_progress($1::jsonb)", ["[1]"], /Bad progress data/);
    await fails(D, "select public.save_progress($1::jsonb)", [JSON.stringify({ x: "y".repeat(300_001) })], /too large/);
  });
});

describe("admin dashboard", () => {
  it("is closed to everyone until they are made an admin", async () => {
    await fails(A, "select public.host_stats()", [], /Not the host/);
    await fails(A, "select * from public.host_members(10, 0)", [], /Not the host/);
    await fails(A, "select public.set_notice('hi')", [], /Not the host/);
    expect(await val(OWNER, "is_host")).toBe(false);
    await db.exec(`insert into public.host_admins (user_id) select id from auth.users where email = 'owner@example.com'`);
    expect(await val(OWNER, "is_host")).toBe(true);
    expect((await call(OWNER, "select * from public.ensure_profile('x', 'web')"))[0].is_admin).toBe(true);
  });

  it("reports installs, registrations, activity and rounds", async () => {
    await call(OWNER, "select public.record_play($1)", ["challenge"]);
    await call(A, "select public.record_play($1)", ["sprint"]);
    await call(A, "select public.record_play($1)", ["sprint"]); // within 10s: ignored
    await call(B, "select public.record_play($1)", ["x".repeat(100)]); // clipped to 20
    await call(A, "select public.ping('android')");
    const s = await val(OWNER, "host_stats");
    expect(s).toMatchObject({ installs_total: 2, installs_android: 1, installs_web: 1, installs_pwa: 0, rounds_today: 3, rounds_total: 3, players: 3 });
    expect(s.registered).toBe(4 + 26); // owner, A, B, C and the 26 leaderboard players
    expect(s.registered_today).toBe(s.registered);
    expect(s.online_now).toBe(s.registered);
    expect(s.active_today).toBe(s.registered);
    expect(s.active_7d).toBe(s.registered);
    expect(s.active_30d).toBe(s.registered);
    expect(s.days).toHaveLength(14);
    expect(s.days[0]).toMatchObject({ signups: s.registered, installs: 2, rounds: 3 });
    expect(s.modes).toHaveLength(3);
    expect(s.modes).toContainEqual({ mode: "sprint", rounds: 1 });
    expect((await db.query("select max(length(mode)) as n from public.plays")).rows[0]).toEqual({ n: 20 });
    await db.exec(`update public.profiles set last_seen_at = now() - interval '2 hours' where display_name = 'Chi'`);
    expect((await val(OWNER, "host_stats")).online_now).toBe(s.registered - 1);
  });

  it("lists the newest members with names and dates only", async () => {
    const rows = await call(OWNER, "select * from public.host_members(5, 0)");
    expect(rows).toHaveLength(5);
    expect(Object.keys(rows[0]).sort()).toEqual(["created_at", "display_name", "last_seen_at", "platform"]);
    expect(await call(OWNER, "select * from public.host_members(100, 29)")).toHaveLength(1);
  });

  it("only the admin can post a note; everyone signed in can read it; it is clipped to 280", async () => {
    expect(await val(OWNER, "set_notice", "  Welcome!  ")).toBe("Welcome!");
    expect(await val(A, "get_notice")).toBe("Welcome!");
    expect((await val(OWNER, "set_notice", "y".repeat(500))).length).toBe(280);
    expect(await val(OWNER, "set_notice", "")).toBe("");
  });
});

describe("deleting an account", () => {
  it("removes the person's data and sign-in, and nobody else's", async () => {
    await call(B, "select public.save_progress($1::jsonb)", [JSON.stringify({ best: 1 })]);
    await call(B, "select public.delete_account()");
    for (const t of ["profiles", "activity", "plays", "global_scores", "progress_sync", "group_members"]) {
      expect((await db.query<{ n: number }>(`select count(*)::int as n from public.${t} where user_id = $1`, [B])).rows[0].n).toBe(0);
    }
    expect((await db.query<{ n: number }>("select count(*)::int as n from auth.users where id = $1", [B])).rows[0].n).toBe(0);
    expect((await db.query<{ n: number }>("select count(*)::int as n from public.profiles where user_id = $1", [A])).rows[0].n).toBe(1);
  });
});
