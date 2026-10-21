import { useEffect, useMemo, useState } from "react";
import { Brain } from "lucide-react";
import { VERSES } from "../verses";
import { dayKey, memoryCounts, nextMemory, reviewMemory, sanitizeMemory, type MemoryState } from "../lib/logic";
import { readJson, storageKey, writeJson } from "../lib/storage";

const REFS = VERSES.map((v) => v.ref);

export default function Memorize() {
  const today = dayKey();
  const [state, setState] = useState<MemoryState>(() => sanitizeMemory(readJson(storageKey("memory"))));
  const [current, setCurrent] = useState<string | null>(() => nextMemory(REFS, sanitizeMemory(readJson(storageKey("memory"))), today));
  const [shown, setShown] = useState(false);
  useEffect(() => writeJson(storageKey("memory"), state), [state]);

  const counts = useMemo(() => memoryCounts(REFS, state, today), [state, today]);
  const verse = VERSES.find((v) => v.ref === current);

  function answer(knew: boolean) {
    if (!current) return;
    const next = reviewMemory(state, current, knew, today);
    setState(next);
    setCurrent(nextMemory(REFS, next, today, current));
    setShown(false);
  }

  return (
    <section className="rise">
      <h1 className="flex items-center gap-2 font-display text-3xl"><Brain size={26} aria-hidden />Memorize</h1>
      <p className="mt-2 text-parchment/75">Say the verse from memory, then tap to check. Verses you know come back after longer and longer gaps.</p>
      <p className="mt-3 text-sm text-parchment/70">{counts.learned} of {counts.total} learned · {counts.due} due today</p>
      {verse ? (
        <article className="mt-5 rounded-3xl bg-parchment p-6 text-fg shadow-xl shadow-black/40">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">Verse to recall</p>
          <h2 className="mt-2 font-display text-3xl">{verse.ref}</h2>
          {shown ? (
            <>
              <p className="mt-4 font-display text-xl leading-snug">{verse.text}</p>
              <p className="mt-5 text-sm text-muted">Did you say it correctly?</p>
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={() => answer(true)} className="min-h-12 flex-1 rounded-full bg-good font-semibold text-parchment">I knew it</button>
                <button type="button" onClick={() => answer(false)} className="min-h-12 flex-1 rounded-full border border-line font-semibold">Not yet</button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setShown(true)} className="mt-6 min-h-12 w-full rounded-full bg-ink font-semibold text-parchment">Show the verse</button>
          )}
        </article>
      ) : (
        <p className="mt-6 rounded-2xl border border-gold/40 px-4 py-4 font-semibold">All caught up for today. Come back tomorrow to keep these verses fresh.</p>
      )}
      <p className="mt-4 text-xs text-parchment/50">King James Version. Progress is saved on this device.</p>
    </section>
  );
}
