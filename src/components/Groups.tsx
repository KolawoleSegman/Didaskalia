import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { createGroup, joinGroup, leaderboard, leaveGroup, loadGroups, type Group, type Row } from "../lib/groups";
import { shareText } from "../lib/native";

const FIELD = "input";
const BTN = "btn btn-gold";

export default function Groups({ defaultNick = "" }: { defaultNick?: string }) {
  const [groups, setGroups] = useState<Group[]>(loadGroups);
  const [open, setOpen] = useState<string | null>(() => loadGroups()[0]?.code ?? null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [nick, setNick] = useState(() => loadGroups()[0]?.nickname ?? defaultNick);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (c: string) => {
    setRows(null);
    try {
      setRows(await leaderboard(c));
    } catch (e) {
      setNote((e as Error).message);
      setRows([]);
    }
  }, []);
  useEffect(() => {
    if (open) void load(open);
  }, [open, load]);

  async function run(fn: () => Promise<Group>) {
    setBusy(true);
    setNote("");
    try {
      const g = await fn();
      setGroups(loadGroups());
      setOpen(g.code);
      setName("");
      setCode("");
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function leave(g: Group) {
    if (!window.confirm(`Leave “${g.name}”? Your points in it are removed.`)) return;
    try {
      await leaveGroup(g.code);
      const rest = loadGroups();
      setGroups(rest);
      setOpen(rest[0]?.code ?? null);
      setRows(null);
    } catch (e) {
      setNote((e as Error).message);
    }
  }

  const current = groups.find((g) => g.code === open);
  const nickOk = nick.trim().length >= 2;

  return (
    <section className="rise">
      <h1 className="flex items-center gap-2 font-display text-3xl"><Users size={26} aria-hidden />Groups</h1>
      <p className="mt-2 text-parchment/75">Play with your church, family or friends. Rounds you finish count toward a weekly leaderboard that resets every Monday. Only your nickname and points are shared.</p>

      {groups.length > 0 && (
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button key={g.code} type="button" aria-pressed={g.code === open} onClick={() => setOpen(g.code)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${g.code === open ? "border-gold bg-gold text-ink" : "border-parchment/25 card"}`}>
                {g.name}
              </button>
            ))}
          </div>
          {current && (
            <div className="mt-4 rounded-2xl card px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-parchment/60">Join code</p>
                  <p className="font-display text-3xl tracking-widest">{current.code}</p>
                </div>
                <button type="button" className="min-h-11 rounded-full border border-parchment/30 px-4" onClick={() => void shareText("The Word", `Join “${current.name}” on The Word. Open the app, tap Groups, and enter the code ${current.code}.`)}>
                  Invite
                </button>
              </div>
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-wider text-gold-bright">This week</h2>
              <ol className="mt-2 grid gap-2">
                {rows === null && <li className="text-parchment/60">Loading…</li>}
                {rows?.length === 0 && <li className="text-parchment/60">No scores yet.</li>}
                {rows?.map((r, i) => (
                  <li key={`${r.nickname}-${i}`} className={`flex items-center justify-between rounded-xl px-3 py-2 ${r.is_me ? "border border-gold/60 bg-gold/10" : "bg-ink"}`}>
                    <span><span className="mr-2 text-parchment/60">{i + 1}</span>{r.nickname}{r.is_me ? " (you)" : ""}</span>
                    <span className="font-semibold">{r.points}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-3 text-sm">
                <button type="button" className="underline-offset-2 hover:underline" onClick={() => void load(current.code)}>Refresh</button>
                <button type="button" className="text-bad underline-offset-2 hover:underline" onClick={() => void leave(current)}>Leave group</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-2">
        <label className="text-sm text-parchment/70" htmlFor="nick">Your nickname</label>
        <input id="nick" className={FIELD} maxLength={20} value={nick} onChange={(e) => setNick(e.target.value)} placeholder="2 to 20 characters" />
        <div className="mt-2 flex gap-2">
          <input aria-label="New group name" className={FIELD} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="New group name" />
          <button type="button" className={BTN} disabled={busy || !nickOk || name.trim().length < 2} onClick={() => void run(() => createGroup(name, nick))}>Create</button>
        </div>
        <div className="flex gap-2">
          <input aria-label="Group code" className={`${FIELD} uppercase`} maxLength={12} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Group code" />
          <button type="button" className={BTN} disabled={busy || !nickOk || code.trim().length < 4} onClick={() => void run(() => joinGroup(code, nick))}>Join</button>
        </div>
      </div>
      {note && <p className="mt-3 text-sm text-parchment/80" role="status">{note}</p>}
      <p className="mt-4 text-xs text-parchment/50">Friendly competition: scores are reported by each player’s device, so they aren’t tamper-proof.</p>
    </section>
  );
}
