import { useEffect, useState } from "react";
import { Activity, Download, Megaphone, ShieldCheck, Smartphone, UserPlus, Users } from "lucide-react";
import { hostMembers, hostStats, setNotice, type HostStats, type Member } from "../lib/host";
import { useG } from "../GameContext";
import { PageHeader } from "../components/ui";

const nf = new Intl.NumberFormat();
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function Big({ label, value, hint, icon }: { label: string; value: number; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="card px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-parchment/60"><span className="text-gold-bright" aria-hidden>{icon}</span>{label}</p>
      <p className="mt-2 font-display text-4xl leading-none">{nf.format(value)}</p>
      {hint && <p className="mt-2 text-xs text-parchment/60">{hint}</p>}
    </div>
  );
}

const SERIES = [["active", "Active people"], ["signups", "New sign-ups"], ["installs", "New installs"], ["rounds", "Rounds played"]] as const;

/** Only people made admin in the database can open this; everyone else is turned away by the server. */
export default function Admin({ onNotice }: { onNotice: (s: string) => void }) {
  const g = useG();
  const [stats, setStats] = useState<HostStats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [series, setSeries] = useState<(typeof SERIES)[number][0]>("active");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");

  async function load() {
    setError("");
    try {
      const [s, m] = await Promise.all([hostStats(), hostMembers(25, 0)]);
      setStats(s);
      setMembers(m);
      setMore(m.length === 25);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function loadMore() {
    try {
      const m = await hostMembers(25, members.length);
      setMembers((cur) => [...cur, ...m]);
      setMore(m.length === 25);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function post(body: string) {
    try {
      const v = await setNotice(body);
      onNotice(v);
      setSaved(v ? "Notice is live." : "Notice cleared.");
      setText("");
    } catch (e) {
      setSaved((e as Error).message);
    }
  }

  if (!g.isAdmin && !stats && !error) return <p className="text-parchment/70">Checking access…</p>;
  const days = stats ? [...stats.days].reverse() : [];
  const max = Math.max(1, ...days.map((d) => d[series]));

  return (
    <section className="rise">
      <PageHeader title="Admin dashboard" subtitle="Who is using Didaskalia. Counts only, no private answers." icon={<ShieldCheck size={22} />} />
      {error && (
        <div className="card-gold mb-4 px-4 py-3" role="alert">
          <p>{error === "Not the host" ? "This account isn’t an admin. See the README, step “Make yourself the admin”." : error}</p>
          <button type="button" className="btn btn-ghost mt-2 min-h-10" onClick={() => void load()}>Try again</button>
        </div>
      )}
      {stats && (
        <>
          <h2 className="eyebrow mb-2">Downloads & installs</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Big label="Total installs" value={stats.installs_total} icon={<Download size={14} />} hint={`${stats.installs_today} today`} />
            <Big label="Android app" value={stats.installs_android} icon={<Smartphone size={14} />} />
            <Big label="Web app (installed)" value={stats.installs_pwa} />
            <Big label="Website visitors" value={stats.installs_web} />
          </div>
          <p className="mt-2 text-xs text-parchment/55">An install is counted the first time a device opens the app. Google Play Console shows the store’s own download numbers.</p>

          <h2 className="eyebrow mb-2 mt-6">Registered people</h2>
          <div className="grid grid-cols-3 gap-3">
            <Big label="Registered" value={stats.registered} icon={<Users size={14} />} />
            <Big label="Joined today" value={stats.registered_today} icon={<UserPlus size={14} />} />
            <Big label="Joined, 7 days" value={stats.registered_7d} />
          </div>

          <h2 className="eyebrow mb-2 mt-6">Using the app</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Big label="Online now" value={stats.online_now} icon={<Activity size={14} />} hint="last 5 minutes" />
            <Big label="Active today" value={stats.active_today} />
            <Big label="Active, 7 days" value={stats.active_7d} />
            <Big label="Active, 30 days" value={stats.active_30d} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Big label="Rounds today" value={stats.rounds_today} />
            <Big label="Rounds, all time" value={stats.rounds_total} />
            <Big label="People who played" value={stats.players} />
          </div>

          <div className="card mt-6 px-4 py-4">
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Chart">
              {SERIES.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={series === id} onClick={() => setSeries(id)} className={`min-h-9 rounded-full border px-3 text-sm ${series === id ? "border-gold-bright bg-gold-bright text-ink" : "border-parchment/25"}`}>{label}</button>
              ))}
            </div>
            <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`${SERIES.find((s) => s[0] === series)![1]} for the last 14 days`}>
              {days.map((d) => (
                <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${d.day}: ${d[series]}`}>
                  <span className="mb-1 text-center text-[10px] text-parchment/60">{d[series]}</span>
                  <div className="rounded-t bg-gold/80" style={{ height: `${Math.max(3, (d[series] / max) * 100)}%` }} />
                </div>
              ))}
            </div>
            <p className="mt-1 flex justify-between text-[10px] text-parchment/50"><span>{days[0]?.day.slice(5)}</span><span>{days[days.length - 1]?.day.slice(5)}</span></p>
          </div>

          {stats.modes.length > 0 && (
            <div className="card mt-4 px-4 py-4">
              <h2 className="mb-2 font-display text-xl">Favourite modes (30 days)</h2>
              <ul className="grid gap-1.5 text-sm">
                {stats.modes.map((m) => (<li key={m.mode} className="flex justify-between"><span className="capitalize">{m.mode}</span><span>{nf.format(m.rounds)}</span></li>))}
              </ul>
            </div>
          )}

          <div className="card mt-4 px-4 py-4">
            <h2 className="mb-2 font-display text-xl">Newest members</h2>
            {members.length === 0 ? <p className="text-parchment/60">No members yet.</p> : (
              <ul className="divide-y divide-parchment/10 text-sm">
                {members.map((m, i) => (
                  <li key={`${m.display_name}-${i}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0"><span className="block truncate font-semibold">{m.display_name}</span><span className="text-xs text-parchment/55">Joined {when(m.created_at)} · {m.platform}</span></span>
                    <span className="shrink-0 text-xs text-parchment/60">Seen {when(m.last_seen_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            {more && <button type="button" className="btn btn-ghost mt-3 min-h-10" onClick={() => void loadMore()}>Show more</button>}
          </div>

          <div className="card-gold mt-4 px-4 py-4">
            <h2 className="flex items-center gap-2 font-display text-xl"><Megaphone size={18} aria-hidden />Message to everyone</h2>
            <p className="mt-1 text-sm text-parchment/75">Shows on every player’s home page. Up to 280 characters.</p>
            <textarea aria-label="Notice" maxLength={280} value={text} onChange={(e) => setText(e.target.value)} className="input mt-3 min-h-24 py-3" />
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={!text.trim()} className="btn btn-gold min-h-11" onClick={() => void post(text)}>Publish</button>
              <button type="button" className="btn btn-ghost min-h-11" onClick={() => void post("")}>Clear message</button>
            </div>
            {saved && <p className="mt-2 text-sm" role="status">{saved}</p>}
          </div>
          <button type="button" className="btn btn-ghost mt-4 min-h-10" onClick={() => void load()}>Refresh numbers</button>
        </>
      )}
    </section>
  );
}
