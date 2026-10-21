import { LibraryBig } from "lucide-react";
import { useG } from "../GameContext";
import { LIBRARY_PAGE } from "../engine";
import { PageHeader, PILL_OFF, PILL_ON } from "../components/ui";

export default function Library() {
  const { query, setQuery, setShown, savedOnly, setSavedOnly, marks, bank, filtered, shown, toggleMark, practice } = useG();
  return (
    <section className="rise">
      <PageHeader title="Library" subtitle={`Browse all ${bank.length} questions. Save the ones you want to revisit.`} icon={<LibraryBig size={22} />} />
      <label className="block text-sm text-parchment/70" htmlFor="search">Search subject, verse, or wording</label>
      <input id="search" type="search" value={query} onChange={(e) => { setQuery(e.target.value); setShown(LIBRARY_PAGE); }} className="input mt-1" />
      <div className="mt-3 flex gap-2">
        <button type="button" aria-pressed={!savedOnly} className={!savedOnly ? PILL_ON : PILL_OFF} onClick={() => { setSavedOnly(false); setShown(LIBRARY_PAGE); }}>All</button>
        <button type="button" aria-pressed={savedOnly} className={savedOnly ? PILL_ON : PILL_OFF} onClick={() => { setSavedOnly(true); setShown(LIBRARY_PAGE); }}>
          Saved ({marks.filter((m) => bank.some((q) => q.id === m)).length})
        </button>
      </div>
      <ul className="mt-4 grid gap-3">
        {filtered.length === 0 && <li className="text-parchment/60">{savedOnly ? "Nothing saved yet. Tap Save on any question." : "No questions match."}</li>}
        {filtered.slice(0, shown).map((q) => (
          <li key={q.id} className="card px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-bright">{q.subject} · {q.ref}</p>
              <button type="button" aria-pressed={marks.includes(q.id)} className="text-sm underline-offset-2 hover:underline" onClick={() => toggleMark(q.id)}>{marks.includes(q.id) ? "Saved" : "Save"}</button>
            </div>
            <p className="mt-1 font-semibold">{q.prompt}</p>
            <button type="button" className="mt-2 text-sm text-parchment/70 underline-offset-2 hover:underline" onClick={() => practice(q)}>Practice this</button>
          </li>
        ))}
      </ul>
      {filtered.length > shown && <button type="button" className={`mt-4 ${PILL_OFF}`} onClick={() => setShown((n) => n + LIBRARY_PAGE)}>Show more ({filtered.length - shown} left)</button>}
    </section>
  );
}
