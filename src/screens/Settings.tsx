import { useState } from "react";
import { Bell, Download, Lock, Palette, Settings as Cog, Share2, Target, Trash2, Type, UserRound, Volume2 } from "lucide-react";
import { useG } from "../GameContext";
import { HOURS, TEXT_SIZES } from "../engine";
import { GOAL_TARGETS } from "../lib/logic";
import { THEMES } from "../themes";
import { isNative } from "../lib/native";
import { backendConfigured } from "../lib/backend";
import { PageHeader, PILL_OFF, PILL_ON } from "../components/ui";

function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card mb-4 px-5 py-5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl"><span className="text-gold-bright" aria-hidden>{icon}</span>{title}</h2>
      {children}
    </section>
  );
}

export default function Settings() {
  const g = useG();
  const [name, setName] = useState(g.profile.display_name);
  const [show, setShow] = useState(g.profile.show_on_board);
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setNote(await g.renameMe(name, show));
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    const err = await g.removeAccount();
    if (err) {
      setNote(err);
      setBusy(false);
    }
  }

  return (
    <section className="rise">
      <PageHeader title="Settings" subtitle="Your account, goals and how the app looks." icon={<Cog size={22} />} />

      <Block title="Account" icon={<UserRound size={20} />}>
        <p className="text-sm text-parchment/70">Signed in as <span className="font-semibold text-parchment">{g.user.email}</span></p>
        <label htmlFor="dname" className="mt-4 block text-sm text-parchment/70">Display name</label>
        <input id="dname" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} className="input mt-1" />
        {backendConfigured && (
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="mt-1 size-5 accent-[var(--color-gold-bright)]" />
            <span>Show me on the public leaderboard<span className="block text-parchment/60">Only your display name and points are shown. Never your email.</span></span>
          </label>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy || (name === g.profile.display_name && show === g.profile.show_on_board)} onClick={() => void save()} className="btn btn-gold min-h-11">Save changes</button>
          <button type="button" onClick={() => void g.logout()} className="btn btn-ghost min-h-11">Sign out</button>
        </div>
        {note && <p className="mt-3 text-sm text-parchment/80" role="status">{note}</p>}
      </Block>

      <Block title="Daily goal" icon={<Target size={20} />}>
        <p className="mb-3 text-sm text-parchment/70">How many questions do you want to answer each day?</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_TARGETS.map((t) => (
            <button key={t} type="button" aria-pressed={g.goal.target === t} className={g.goal.target === t ? PILL_ON : PILL_OFF} onClick={() => g.setGoalTarget(t)}>{t} questions</button>
          ))}
        </div>
      </Block>

      <Block title="Appearance" icon={<Type size={20} />}>
        <p className="mb-2 text-sm font-semibold">Text size</p>
        <div className="flex flex-wrap gap-2">
          {TEXT_SIZES.map(([label], i) => (
            <button key={label} type="button" aria-pressed={g.textSize === i} className={g.textSize === i ? PILL_ON : PILL_OFF} onClick={() => g.setTextSize(i)}>{label}</button>
          ))}
        </div>
        <p className="mb-1 mt-5 flex items-center gap-2 text-sm font-semibold"><Palette size={16} aria-hidden />Themes</p>
        <p className="mb-3 text-sm text-parchment/70">Level up to unlock more looks.</p>
        <ul className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const open = g.lvl.level >= t.level;
            const on = g.activeTheme === t.id;
            return (
              <li key={t.id}>
                <button type="button" disabled={!open} aria-pressed={on} onClick={() => g.setTheme(t.id)} className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left ${on ? "border-gold bg-gold/10" : "border-parchment/20 bg-parchment/5"} ${open ? "" : "opacity-50"}`}>
                  <span className="size-6 shrink-0 rounded-full" style={{ background: t.swatch }} aria-hidden />
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-xs text-parchment/70">{open ? (on ? "In use" : "Unlocked") : `Unlocks at level ${t.level}`}</span>
                  </span>
                  {!open && <Lock size={14} className="ml-auto" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </Block>

      <Block title="Sound & reminders" icon={<Volume2 size={20} />}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Sound effects</span>
          <button type="button" aria-pressed={g.sound} className={g.sound ? PILL_ON : PILL_OFF} onClick={() => g.setSound((v) => !v)}>{g.sound ? "On" : "Off"}</button>
        </div>
        {isNative && (
          <div className="mt-4 border-t border-parchment/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold"><Bell size={16} aria-hidden />Daily reminder</span>
              <div className="flex items-center gap-2">
                <select aria-label="Reminder time" value={g.reminder.hour} onChange={(e) => void g.changeReminder(g.reminder.on, Number(e.target.value))} className="input min-h-10 w-auto px-2 text-sm">
                  {HOURS.map((h) => (<option key={h} value={h}>{h}:00</option>))}
                </select>
                <button type="button" aria-pressed={g.reminder.on} className={g.reminder.on ? PILL_ON : PILL_OFF} onClick={() => void g.changeReminder(!g.reminder.on, g.reminder.hour)}>{g.reminder.on ? "On" : "Off"}</button>
              </div>
            </div>
            {g.reminderNote && <p className="mt-2 text-xs text-parchment/70" role="status">{g.reminderNote}</p>}
          </div>
        )}
      </Block>

      <Block title="Share & install" icon={<Share2 size={20} />}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-11" onClick={() => void g.shareApp()}><Share2 size={16} aria-hidden />Invite a friend</button>
          {g.installEvent && (
            <button type="button" className="btn btn-ghost min-h-11" onClick={async () => { try { await g.installEvent!.prompt(); } finally { g.setInstallEvent(null); } }}>
              <Download size={16} aria-hidden />Install
            </button>
          )}
        </div>
      </Block>

      <Block title="Back up" icon={<Download size={20} />}>
        <p className="mb-3 text-sm text-parchment/70">{backendConfigured ? "Your progress is saved to your account automatically. You can also keep a copy as a file." : "Progress lives on this device. Save a backup before changing phones or clearing data."}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={PILL_OFF} onClick={() => void g.backup()}>Back up progress</button>
          <label className={`inline-flex cursor-pointer items-center ${PILL_OFF}`}>
            Restore progress
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) g.restore(f); e.target.value = ""; }} />
          </label>
        </div>
        {g.backupNote && <p className="mt-2 text-sm text-parchment/80" role="status">{g.backupNote}</p>}
        <button type="button" className="btn btn-danger mt-5 min-h-11" onClick={g.resetProgress}>Reset progress</button>
      </Block>

      {backendConfigured && (
        <Block title="Delete account" icon={<Trash2 size={20} />}>
          <p className="text-sm text-parchment/75">This permanently removes your account, your leaderboard points and your saved progress. It cannot be undone.</p>
          {!confirmDelete ? (
            <button type="button" className="btn btn-danger mt-3 min-h-11" onClick={() => setConfirmDelete(true)}>Delete my account</button>
          ) : (
            <div className="mt-3">
              <label htmlFor="del" className="block text-sm">Type DELETE to confirm</label>
              <input id="del" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="input mt-1" />
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={typed !== "DELETE" || busy} className="btn btn-danger min-h-11" onClick={() => void remove()}>Delete forever</button>
                <button type="button" className="btn btn-ghost min-h-11" onClick={() => { setConfirmDelete(false); setTyped(""); }}>Cancel</button>
              </div>
            </div>
          )}
        </Block>
      )}
    </section>
  );
}
