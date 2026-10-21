import { Sparkles } from "lucide-react";
import { useG } from "../GameContext";
import { MODES } from "../lib/logic";
import { MODE_COPY, MODE_ICON } from "../modes";
import { SUBJECTS } from "../questions";
import { SEASON_NAME } from "../engine";
import { PageHeader } from "../components/ui";

export default function Modes() {
  const g = useG();
  const { mode } = g;
  const noSubjects = mode === "daily" || mode === "verse" || mode === "who" || mode === "review" || mode === "order" || mode === "season" || mode === "class";
  return (
    <section className="rise">
      <PageHeader title="Play" subtitle="Pick a way to play. Every mode counts toward your level, streak and badges." icon={<Sparkles size={22} />} />
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.filter((m) => m !== "class").map((id) => {
          const Icon = MODE_ICON[id];
          const on = mode === id;
          return (
            <button key={id} type="button" aria-pressed={on} onClick={() => g.setMode(id)} className={`min-h-20 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-gold-bright bg-gold-bright text-ink" : "card hover:bg-parchment/10"}`}>
              <span className="flex items-center gap-2 font-semibold">
                <Icon size={18} aria-hidden />
                {id === "season" ? SEASON_NAME[g.season.id] : MODE_COPY[id].label}
              </span>
              <span className={`mt-1 block text-sm ${on ? "text-ink/80" : "text-parchment/70"}`}>
                {id === "review" ? `Retry what you missed (${g.reviewable})` : id === "season" ? (g.season.active ? "In season now" : `Starts in ${g.season.daysUntil} days`) : MODE_COPY[id].hint}
              </span>
            </button>
          );
        })}
      </div>

      {mode === "daily" ? (
        <p className="mt-4 text-sm text-parchment/70">
          Daily streak: {g.dailyStreak}
          {g.playedToday ? " · today’s round is done, but you can play it again" : ""}
        </p>
      ) : noSubjects ? null : (
        <div className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="eyebrow">Subjects</h2>
            <button type="button" className="text-sm text-parchment/70 underline-offset-2 hover:underline" onClick={() => g.setPicked([])}>All ({g.bank.length})</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subject) => {
              const on = g.picked.includes(subject);
              const row = g.stats[subject];
              return (
                <button key={subject} type="button" aria-pressed={on} onClick={() => g.toggleSubject(subject)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${on ? "border-gold-bright bg-gold-bright text-ink" : "border-parchment/25 bg-parchment/5"}`}>
                  {subject}
                  {row ? ` ${row.right}/${row.seen}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button type="button" disabled={mode === "review" && g.reviewable === 0} onClick={() => g.start(mode)} className="btn btn-light mt-8 w-full sm:w-auto sm:px-10">
        <Sparkles size={18} aria-hidden />
        Begin
      </button>
    </section>
  );
}
