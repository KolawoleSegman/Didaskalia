import { ArrowRight, Flame, Gift, GraduationCap, Play as PlayIcon, Sparkles, Target, Trophy } from "lucide-react";
import { useG } from "../GameContext";
import { MODE_COPY, MODE_ICON } from "../modes";
import { SUBJECT_META } from "../subjects";
import { SUBJECTS } from "../questions";
import { SEASON_NAME } from "../engine";
import { APP_GREEK, APP_TAGLINE } from "../brand";
import { backendConfigured } from "../lib/backend";
import { shareText } from "../lib/native";
import { Ring } from "../components/ui";
import BoardList from "../components/BoardList";
import type { Mode } from "../lib/logic";

const QUICK: Mode[] = ["challenge", "sprint", "who", "verse", "order", "tournament"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const g = useG();
  const first = g.profile.display_name.split(" ")[0];

  return (
    <div className="rise grid gap-6">
      <section className="hero relative overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <svg className="pointer-events-none absolute -right-10 -top-10 opacity-25" width="260" height="260" viewBox="0 0 260 260" aria-hidden>
          {[120, 90, 60, 30].map((r) => (<circle key={r} cx="130" cy="130" r={r} fill="none" stroke="#14110d" strokeWidth="1.5" />))}
          <path d="M130 20v220M20 130h220" stroke="#14110d" strokeWidth="1" />
        </svg>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-ink/70">{greeting()}, {first}</p>
        <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">Sound teaching, one question at a time.</h1>
        <p className="mt-3 max-w-md text-ink/75"><span className="font-display italic">{APP_GREEK}</span> · {APP_TAGLINE.replace("Sound teaching, one question at a time.", "the teaching of God’s Word, made a daily habit.")}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" onClick={() => g.start("daily")} className="btn bg-ink text-parchment shadow-lg shadow-black/30">
            <PlayIcon size={18} aria-hidden />
            {g.playedToday ? "Replay today’s Daily" : "Play today’s Daily"}
          </button>
          <button type="button" onClick={() => g.go("modes")} className="btn border border-ink/40 text-ink hover:bg-ink/10">
            All game modes <ArrowRight size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink/80">
          <Flame size={18} aria-hidden />
          {g.dailyStreak > 0 ? `${g.dailyStreak}-day streak${g.freezeOk ? " · 1 freeze ready" : ""}` : "Play today’s Daily to start a streak."}
        </p>
      </section>

      {g.hostNotice && <p className="card-gold px-4 py-3" role="note">{g.hostNotice}</p>}
      {g.classQuiz && (
        <div className="card-gold px-4 py-3">
          <p className="font-semibold">Your teacher shared {g.classQuiz.title ? `“${g.classQuiz.title}”` : "a quiz"} ({g.classQuiz.questions.length} question{g.classQuiz.questions.length === 1 ? "" : "s"}).</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn btn-gold min-h-11" onClick={() => g.start("class")}>Start class quiz</button>
            <button type="button" className="btn btn-ghost min-h-11" onClick={() => g.setClassQuiz(null)}>Not now</button>
          </div>
        </div>
      )}
      {g.rival && (
        <div className="card-gold px-4 py-3">
          <p className="font-semibold">A friend scored {g.rival.score}. Can you beat them?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn btn-gold min-h-11" onClick={() => g.start("duel", g.rival!.seed)}>Accept challenge</button>
            <button type="button" className="btn btn-ghost min-h-11" onClick={() => g.setRival(null)}>Not now</button>
          </div>
        </div>
      )}

      <section aria-label="Your day" className="grid grid-cols-3 gap-3">
        <div className="card flex flex-col items-center gap-2 px-2 py-4 text-center">
          <Ring pct={g.lvl.pct} label="Progress to next level"><span className="font-display text-2xl">{g.lvl.level}</span></Ring>
          <p className="text-sm font-semibold">{g.lvl.name}</p>
          <p className="text-xs text-parchment/60">{g.lvl.next ? `${g.lvl.toNext} to ${g.lvl.next}` : "Top level"}</p>
        </div>
        <div className="card flex flex-col items-center gap-2 px-2 py-4 text-center">
          <Ring pct={g.goalPct} label="Today’s goal"><Target size={22} className="text-gold-bright" aria-hidden /></Ring>
          <p className="text-sm font-semibold">{Math.min(g.goal.count, g.goal.target)}/{g.goal.target} today</p>
          <p className="text-xs text-parchment/60">{g.goal.count >= g.goal.target ? "Goal reached!" : "Daily goal"}</p>
        </div>
        <div className="card flex flex-col items-center justify-center gap-1 px-2 py-4 text-center">
          <Trophy size={30} className="text-gold-bright" aria-hidden />
          <p className="font-display text-2xl">Best {g.best}</p>
          <p className="text-xs text-parchment/60">{g.totals.right} answers right</p>
        </div>
      </section>

      <blockquote className="card px-5 py-4">
        <p className="eyebrow">Verse of the day · {g.verse.ref}</p>
        <p className="mt-2 font-display text-xl leading-snug">{g.verse.text}</p>
        <button type="button" className="mt-3 text-sm text-parchment/70 underline underline-offset-2" onClick={() => void shareText("Didaskalia", `“${g.verse.text}” — ${g.verse.ref} (KJV)`)}>Share this verse</button>
      </blockquote>

      <section aria-labelledby="quick">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="quick" className="font-display text-2xl">Jump in</h2>
          <button type="button" onClick={() => g.go("modes")} className="text-sm text-gold-bright underline-offset-2 hover:underline">See all</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK.map((id) => {
            const Icon = MODE_ICON[id];
            return (
              <button key={id} type="button" onClick={() => g.start(id)} className="card flex min-h-28 flex-col items-start justify-between p-4 text-left transition hover:border-gold/60 hover:bg-parchment/10">
                <Icon size={24} className="text-gold-bright" aria-hidden />
                <span>
                  <span className="block font-semibold">{MODE_COPY[id].label}</span>
                  <span className="block text-sm text-parchment/65">{MODE_COPY[id].hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {g.weakest && (
          <button type="button" onClick={() => g.studySubject(g.weakest!.subject)} className="card-gold mt-3 flex w-full items-center gap-3 px-4 py-3 text-left">
            <Sparkles size={22} className="shrink-0 text-gold-bright" aria-hidden />
            <span className="flex-1"><span className="block font-semibold">Strengthen {g.weakest.subject}</span><span className="block text-sm text-parchment/70">You’re at {g.weakest.pct}% here. Ten questions to improve it.</span></span>
            <ArrowRight size={18} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => g.start("season")} className="card mt-3 flex w-full items-center gap-3 px-4 py-3 text-left">
          <Gift size={22} className="shrink-0 text-gold-bright" aria-hidden />
          <span className="flex-1"><span className="block font-semibold">{SEASON_NAME[g.season.id]} pack</span><span className="block text-sm text-parchment/70">{g.season.active ? "In season now" : `Starts in ${g.season.daysUntil} days, but you can play it any time`}</span></span>
          <ArrowRight size={18} aria-hidden />
        </button>
      </section>

      <section aria-labelledby="subjects">
        <h2 id="subjects" className="mb-3 font-display text-2xl">Study a subject</h2>
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {SUBJECTS.map((s) => {
            const { icon: Icon, hue } = SUBJECT_META[s];
            const row = g.stats[s];
            return (
              <button key={s} type="button" onClick={() => g.studySubject(s)} className="card flex w-36 shrink-0 flex-col items-start gap-3 p-3.5 text-left hover:bg-parchment/10 sm:w-[10.5rem]">
                <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${hue}26`, color: hue }}><Icon size={20} aria-hidden /></span>
                <span><span className="block font-semibold leading-tight">{s}</span><span className="block text-xs text-parchment/60">{row ? `${row.right}/${row.seen} right` : "Not played yet"}</span></span>
              </button>
            );
          })}
        </div>
      </section>

      {backendConfigured && (
        <section aria-labelledby="board" className="card px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="board" className="flex items-center gap-2 font-display text-2xl"><Trophy size={20} className="text-gold-bright" aria-hidden />This week’s top players</h2>
            <button type="button" onClick={() => g.go("leaderboard")} className="text-sm text-gold-bright underline-offset-2 hover:underline">Full board</button>
          </div>
          <BoardList scope="week" limit={3} />
        </section>
      )}

      <section className="card px-4 py-4">
        <label htmlFor="join" className="flex items-center gap-2 text-sm font-semibold"><GraduationCap size={16} aria-hidden />Join a class quiz</label>
        <div className="mt-2 flex gap-2">
          <input id="join" value={g.joinText} onChange={(e) => g.setJoinText(e.target.value)} placeholder="Paste the link or code" className="input min-h-11 min-w-0 flex-1 text-sm" />
          <button type="button" disabled={!g.joinText.trim()} className="btn btn-ghost min-h-11" onClick={() => void g.openClass(g.joinText)}>Join</button>
        </div>
        {g.joinNote && <p className="mt-2 text-xs text-parchment/70" role="status">{g.joinNote}</p>}
      </section>
    </div>
  );
}
