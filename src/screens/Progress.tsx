import { BarChart3 } from "lucide-react";
import { useG } from "../GameContext";
import { SUBJECTS } from "../questions";
import { MODE_COPY } from "../modes";
import { SUBJECT_META } from "../subjects";
import { PageHeader, StatTile } from "../components/ui";

export default function Progress() {
  const { totals, stats, history, best, dailyStreak, lvl } = useG();
  return (
    <section className="rise">
      <PageHeader title="Progress" subtitle={`Your accuracy by subject.${totals.seen > 0 ? ` Overall: ${totals.pct}% · ${totals.right}/${totals.seen}.` : ""}`} icon={<BarChart3 size={22} />} />
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Level" value={lvl.level} hint={lvl.name} />
        <StatTile label="Best score" value={best} />
        <StatTile label="Streak" value={dailyStreak} hint="days" />
      </div>
      <ul className="mt-6 grid gap-2">
        {SUBJECTS.map((subject) => {
          const row = stats[subject] ?? { seen: 0, right: 0 };
          const pct = row.seen ? Math.round((row.right / row.seen) * 100) : 0;
          const { hue } = SUBJECT_META[subject];
          return (
            <li key={subject} className="card px-4 py-3">
              <div className="flex items-center justify-between">
                <span>{subject}</span>
                <span className="text-parchment/70">{row.seen ? `${pct}% · ${row.right}/${row.seen}` : "Not played"}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment/10" aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hue }} />
              </div>
            </li>
          );
        })}
      </ul>
      <h2 className="mt-8 font-display text-2xl">Recent sessions</h2>
      {history.length > 1 && (
        <div className="mt-3 flex h-16 items-end gap-1" role="img" aria-label="Accuracy of your recent sessions, oldest to newest">
          {[...history].reverse().map((h, i) => (
            <div key={`${h.at}-${i}`} className="flex-1 rounded-t bg-gold/80" style={{ height: `${Math.max(6, h.answered ? (h.correct / h.answered) * 100 : 0)}%` }} />
          ))}
        </div>
      )}
      <ul className="mt-3 grid gap-2">
        {history.length === 0 && <li className="text-parchment/60">No finished runs yet.</li>}
        {history.map((item, i) => (
          <li key={`${item.at}-${i}`} className="card px-4 py-3">
            <span className="font-semibold">{MODE_COPY[item.mode].label}</span>
            <span className="text-parchment/70"> · {item.correct}/{item.answered} · score {item.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
