-- Didaskalia: accounts, installs, activity, leaderboards, groups, cloud progress and the admin dashboard.
--
-- SETUP (once):
--   1. Supabase > SQL Editor > New query > paste this whole file > Run. It is safe to run again later.
--   2. Authentication > Providers > Email: keep it ON. (Turn "Confirm email" OFF if you want people to get in
--      immediately; leave it ON if you want every email address verified first.)
--   3. Authentication > URL Configuration: set "Site URL" to your website address (this is where the
--      password-reset email sends people).
--   4. Register your own account in the app, then make yourself the admin by running (with YOUR email):
--        insert into public.host_admins (user_id)
--          select id from auth.users where email = 'you@example.com'
--        on conflict do nothing;
-- Tables are locked down; the app can only use the functions below. Only a display name, an email (held by
-- Supabase Auth, never exposed to other players) and points are stored.


create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (char_length(name) between 2 and 40),
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  nickname text not null check (char_length(nickname) between 2 and 20),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members(user_id);
create table if not exists public.group_scores (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  day date not null,
  points int not null check (points between 0 and 600),
  primary key (group_id, user_id, day)
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_scores enable row level security;
revoke all on public.groups, public.group_members, public.group_scores from anon, authenticated;

create or replace function public.create_group(p_name text, p_nickname text)
returns table(group_code text, group_name text)
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(p_name); nick text := btrim(p_nickname); c text; g uuid; tries int := 0;
begin
  if u is null then raise exception 'Not signed in'; end if;
  if char_length(n) not between 2 and 40 then raise exception 'Group name must be 2 to 40 characters'; end if;
  if char_length(nick) not between 2 and 20 then raise exception 'Nickname must be 2 to 20 characters'; end if;
  if (select count(*) from group_members m where m.user_id = u) >= 10 then raise exception 'You can be in at most 10 groups'; end if;
  loop
    c := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
    begin
      insert into groups (code, name) values (c, n) returning id into g;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 20 then raise exception 'Please try again'; end if;
    end;
  end loop;
  insert into group_members (group_id, user_id, nickname) values (g, u, nick);
  return query select c, n;
end $$;

create or replace function public.join_group(p_code text, p_nickname text)
returns table(group_code text, group_name text)
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); nick text := btrim(p_nickname); g groups%rowtype; already boolean;
begin
  if u is null then raise exception 'Not signed in'; end if;
  if char_length(nick) not between 2 and 20 then raise exception 'Nickname must be 2 to 20 characters'; end if;
  select * into g from groups where groups.code = upper(btrim(p_code));
  if not found then raise exception 'No group with that code'; end if;
  already := exists (select 1 from group_members m where m.group_id = g.id and m.user_id = u);
  if not already and (select count(*) from group_members m where m.group_id = g.id) >= 200 then raise exception 'That group is full'; end if;
  if not already and (select count(*) from group_members m where m.user_id = u) >= 10 then raise exception 'You can be in at most 10 groups'; end if;
  insert into group_members (group_id, user_id, nickname) values (g.id, u, nick)
    on conflict (group_id, user_id) do update set nickname = excluded.nickname;
  return query select g.code, g.name;
end $$;


-- This week's totals (weeks start Monday, UTC), highest first.
create or replace function public.group_leaderboard(p_code text)
returns table(nickname text, points bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare u uuid := auth.uid(); g uuid; wk date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if u is null then raise exception 'Not signed in'; end if;
  select groups.id into g from groups where groups.code = upper(btrim(p_code));
  if g is null or not exists (select 1 from group_members m where m.group_id = g and m.user_id = u) then
    raise exception 'You are not in that group';
  end if;
  return query
    select m.nickname, coalesce(sum(s.points), 0)::bigint as pts, (m.user_id = u) as me
    from group_members m
    left join group_scores s on s.group_id = m.group_id and s.user_id = m.user_id and s.day >= wk
    where m.group_id = g
    group by m.user_id, m.nickname
    order by pts desc, m.nickname
    limit 50;
end $$;

create or replace function public.leave_group(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); g uuid;
begin
  if u is null then raise exception 'Not signed in'; end if;
  select groups.id into g from groups where groups.code = upper(btrim(p_code));
  delete from group_scores s where s.group_id = g and s.user_id = u;
  delete from group_members m where m.group_id = g and m.user_id = u;
end $$;

-- ===================================================================================================
-- Admin settings, accounts and activity
-- ===================================================================================================

create table if not exists public.host_settings (
  id int primary key check (id = 1),
  notice text not null default '',
  timezone text not null default 'Africa/Lagos'
);
-- Older installs of this game had a host_key_hash column. It is no longer used; admins are chosen by account.
alter table public.host_settings drop column if exists host_key_hash;
insert into public.host_settings (id) values (1) on conflict do nothing;

create table if not exists public.host_admins (user_id uuid primary key, created_at timestamptz not null default now());

create table if not exists public.profiles (
  user_id uuid primary key,
  display_name text not null check (char_length(display_name) between 2 and 24),
  show_on_board boolean not null default true,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists profiles_created_idx on public.profiles (created_at);
create index if not exists profiles_seen_idx on public.profiles (last_seen_at);

-- One row per device that has opened the app, before anyone signs in. Counts installs.
create table if not exists public.installs (
  device_id uuid primary key,
  platform text not null check (platform in ('android', 'pwa', 'web')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create index if not exists installs_first_idx on public.installs (first_seen);

-- One row per person per day they opened the app.
create table if not exists public.activity (
  user_id uuid not null,
  day date not null,
  primary key (user_id, day)
);
create index if not exists activity_day_idx on public.activity (day);

create table if not exists public.plays (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  mode text not null,
  played_at timestamptz not null default now()
);
create index if not exists plays_at_idx on public.plays (played_at);
create index if not exists plays_user_idx on public.plays (user_id, played_at);

create table if not exists public.global_scores (
  user_id uuid not null,
  day date not null,
  points int not null check (points between 0 and 600),
  primary key (user_id, day)
);
create index if not exists global_scores_day_idx on public.global_scores (day);

create table if not exists public.progress_sync (
  user_id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.host_settings enable row level security;
alter table public.host_admins enable row level security;
alter table public.profiles enable row level security;
alter table public.installs enable row level security;
alter table public.activity enable row level security;
alter table public.plays enable row level security;
alter table public.global_scores enable row level security;
alter table public.progress_sync enable row level security;
revoke all on public.host_settings, public.host_admins, public.profiles, public.installs, public.activity,
  public.plays, public.global_scores, public.progress_sync from anon, authenticated;

create or replace function public.is_host()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from host_admins a where a.user_id = auth.uid())
$$;

-- Works before sign-in. Counts a device once; repeat opens only refresh last_seen.
create or replace function public.record_install(p_device uuid, p_platform text)
returns void language plpgsql security definer set search_path = public as $$
declare plat text := case when p_platform in ('android', 'pwa') then p_platform else 'web' end;
begin
  if p_device is null then return; end if;
  insert into installs (device_id, platform) values (p_device, plat)
  on conflict (device_id) do update set last_seen = now(), platform = excluded.platform;
end $$;

-- Called after every sign-in. Creates the profile the first time, then returns it.
create or replace function public.ensure_profile(p_name text, p_platform text)
returns table(display_name text, show_on_board boolean, is_admin boolean)
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(coalesce(p_name, '')); plat text := case when p_platform in ('android', 'pwa') then p_platform else 'web' end;
begin
  if u is null then raise exception 'Not signed in'; end if;
  if char_length(n) not between 2 and 24 then n := 'Friend ' || substr(replace(u::text, '-', ''), 1, 4); end if;
  insert into profiles (user_id, display_name, platform) values (u, n, plat)
  on conflict (user_id) do update set last_seen_at = now(), platform = excluded.platform;
  insert into activity (user_id, day)
  values (u, (now() at time zone (select s.timezone from host_settings s where s.id = 1))::date) on conflict do nothing;
  return query select p.display_name, p.show_on_board, public.is_host() from profiles p where p.user_id = u;
end $$;

-- Heartbeat while the app is open: powers "online now" and "active today".
create or replace function public.ping(p_platform text)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); plat text := case when p_platform in ('android', 'pwa') then p_platform else 'web' end;
begin
  if u is null then raise exception 'Not signed in'; end if;
  update profiles set last_seen_at = now(), platform = plat where user_id = u;
  insert into activity (user_id, day)
  select u, (now() at time zone (select s.timezone from host_settings s where s.id = 1))::date
  where exists (select 1 from profiles p where p.user_id = u) on conflict do nothing;
end $$;

create or replace function public.update_profile(p_name text, p_show boolean)
returns table(display_name text, show_on_board boolean)
language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n text := btrim(coalesce(p_name, ''));
begin
  if u is null then raise exception 'Not signed in'; end if;
  if char_length(n) not between 2 and 24 then raise exception 'Display name must be 2 to 24 characters'; end if;
  update profiles set display_name = n, show_on_board = coalesce(p_show, true) where user_id = u;
  if not found then raise exception 'No profile yet'; end if;
  return query select p.display_name, p.show_on_board from profiles p where p.user_id = u;
end $$;

-- Permanently removes the caller's data and sign-in. Required by Google Play for apps with accounts.
create or replace function public.delete_account()
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Not signed in'; end if;
  delete from group_scores where user_id = u;
  delete from group_members where user_id = u;
  delete from global_scores where user_id = u;
  delete from progress_sync where user_id = u;
  delete from activity where user_id = u;
  delete from plays where user_id = u;
  delete from host_admins where user_id = u;
  delete from profiles where user_id = u;
  delete from auth.users where id = u;
end $$;

-- One row per round started. Repeats from the same person within 10 seconds are ignored.
create or replace function public.record_play(p_mode text)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from plays p where p.user_id = u and p.played_at > now() - interval '10 seconds') then return; end if;
  insert into plays (user_id, mode) values (u, left(coalesce(btrim(p_mode), ''), 20));
end $$;

-- Adds today's points in every group the caller belongs to, and to the public weekly board.
-- A round is worth at most 300; at most 600 count per day.
create or replace function public.submit_score(p_points int)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); pts int := greatest(0, least(coalesce(p_points, 0), 300)); d date := (now() at time zone 'utc')::date;
begin
  if u is null then raise exception 'Not signed in'; end if;
  insert into group_scores (group_id, user_id, day, points)
  select m.group_id, u, d, pts from group_members m where m.user_id = u
  on conflict (group_id, user_id, day) do update set points = least(600, group_scores.points + excluded.points);
  insert into global_scores (user_id, day, points) values (u, d, pts)
  on conflict (user_id, day) do update set points = least(600, global_scores.points + excluded.points);
end $$;

-- Public board: top 25 for 'week' (Monday to Sunday, UTC) or 'all'. The caller is appended with their true rank
-- if they are further down. People who switched off "show me on the leaderboard" are not listed.
create or replace function public.global_leaderboard(p_scope text)
returns table(rank bigint, display_name text, points bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare u uuid := auth.uid(); wk date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if u is null then raise exception 'Not signed in'; end if;
  return query
  with totals as (
    select s.user_id as uid, sum(s.points)::bigint as pts from global_scores s
    where p_scope = 'all' or s.day >= wk group by s.user_id
  ), ranked as (
    select rank() over (order by t.pts desc)::bigint as rk, p.display_name as nm, t.pts as pts, (t.uid = u) as me
    from totals t join profiles p on p.user_id = t.uid where p.show_on_board and t.pts > 0
  )
  select r.rk, r.nm, r.pts, r.me from ranked r where r.rk <= 25 or r.me order by r.rk, r.nm;
end $$;

create or replace function public.save_progress(p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Not signed in'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Bad progress data'; end if;
  if octet_length(p_data::text) > 300000 then raise exception 'Progress is too large to sync'; end if;
  insert into progress_sync (user_id, data) values (u, p_data)
  on conflict (user_id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.load_progress()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  return (select p.data from progress_sync p where p.user_id = auth.uid());
end $$;

-- ===================================================================================================
-- Admin dashboard
-- ===================================================================================================

create or replace function public.host_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare tz text; today date;
begin
  if not public.is_host() then raise exception 'Not the host'; end if;
  select s.timezone into tz from host_settings s where s.id = 1;
  today := (now() at time zone tz)::date;
  return jsonb_build_object(
    'installs_total', (select count(*) from installs),
    'installs_android', (select count(*) from installs where platform = 'android'),
    'installs_pwa', (select count(*) from installs where platform = 'pwa'),
    'installs_web', (select count(*) from installs where platform = 'web'),
    'installs_today', (select count(*) from installs where (first_seen at time zone tz)::date = today),
    'registered', (select count(*) from profiles),
    'registered_today', (select count(*) from profiles where (created_at at time zone tz)::date = today),
    'registered_7d', (select count(*) from profiles where (created_at at time zone tz)::date > today - 7),
    'online_now', (select count(*) from profiles where last_seen_at > now() - interval '5 minutes'),
    'active_today', (select count(*) from activity where day = today),
    'active_7d', (select count(distinct user_id) from activity where day > today - 7),
    'active_30d', (select count(distinct user_id) from activity where day > today - 30),
    'players', (select count(distinct user_id) from plays),
    'rounds_today', (select count(*) from plays p where (p.played_at at time zone tz)::date = today),
    'rounds_total', (select count(*) from plays),
    'modes', coalesce((
      select jsonb_agg(jsonb_build_object('mode', m.mode, 'rounds', m.n) order by m.n desc)
      from (select mode, count(*) as n from plays where (played_at at time zone tz)::date > today - 30 group by mode order by n desc limit 8) m
    ), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'active', d.active, 'signups', d.signups, 'installs', d.installs, 'rounds', d.rounds) order by d.day desc)
      from (
        select g::date as day,
          (select count(*) from activity a where a.day = g::date) as active,
          (select count(*) from profiles p where (p.created_at at time zone tz)::date = g::date) as signups,
          (select count(*) from installs i where (i.first_seen at time zone tz)::date = g::date) as installs,
          (select count(*) from plays y where (y.played_at at time zone tz)::date = g::date) as rounds
        from generate_series(today - 13, today, interval '1 day') g
      ) d
    ), '[]'::jsonb)
  );
end $$;

-- Newest members first. Names and dates only; emails stay inside Supabase Auth.
create or replace function public.host_members(p_limit int, p_offset int)
returns table(display_name text, platform text, created_at timestamptz, last_seen_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_host() then raise exception 'Not the host'; end if;
  return query select p.display_name, p.platform, p.created_at, p.last_seen_at from profiles p
    order by p.created_at desc limit greatest(1, least(coalesce(p_limit, 25), 100)) offset greatest(0, coalesce(p_offset, 0));
end $$;

create or replace function public.get_notice()
returns text language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  return (select s.notice from host_settings s where s.id = 1);
end $$;

create or replace function public.set_notice(p_body text)
returns text language plpgsql security definer set search_path = public as $$
declare b text := left(btrim(coalesce(p_body, '')), 280);
begin
  if not public.is_host() then raise exception 'Not the host'; end if;
  update host_settings set notice = b where id = 1;
  return b;
end $$;

-- ===================================================================================================
-- Permissions
-- ===================================================================================================

revoke all on function
  public.create_group(text, text), public.join_group(text, text), public.submit_score(int), public.group_leaderboard(text),
  public.leave_group(text), public.is_host(), public.record_install(uuid, text), public.ensure_profile(text, text),
  public.ping(text), public.update_profile(text, boolean), public.delete_account(), public.record_play(text),
  public.global_leaderboard(text), public.save_progress(jsonb), public.load_progress(), public.host_stats(),
  public.host_members(int, int), public.get_notice(), public.set_notice(text)
from public, anon;

grant execute on function
  public.create_group(text, text), public.join_group(text, text), public.submit_score(int), public.group_leaderboard(text),
  public.leave_group(text), public.is_host(), public.ensure_profile(text, text), public.ping(text),
  public.update_profile(text, boolean), public.delete_account(), public.record_play(text), public.global_leaderboard(text),
  public.save_progress(jsonb), public.load_progress(), public.host_stats(), public.host_members(int, int),
  public.get_notice(), public.set_notice(text)
to authenticated;

-- Installs are counted before anyone signs in, so this one is open to the app's public key.
grant execute on function public.record_install(uuid, text) to anon, authenticated;
