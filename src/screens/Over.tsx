import { Award, RotateCcw, Star } from "lucide-react";
import { useG } from "../GameContext";
import { BADGES } from "../lib/logic";
import { MODE_COPY } from "../modes";
import Confetti from "../components/Confetti";

export default function Over() {
  const { mode, stars, newBest, newBadges, correctCount, answered, p1Wins, p2Wins, dailyStreak, score, p2, bestStreak, misses, rival, shareNote, start, share, go, goal } = useG();
  const stats: [string, number][] = mode === "pass" ? [["Player 1", score], ["Player 2", p2], ["Missed", misses.length]] : [["Score", score], ["Best streak", bestStreak], ["Missed", misses.length]];

  return (
    <section className="rise flex flex-1 flex-col">
      {(stars === 3 || newBest || newBadges.length > 0) && <Confetti />}
      <h1 className="font-display text-4xl leading-tight">{MODE_COPY[mode].label} complete</h1>
      <div className="mt-3 flex gap-1" role="img" aria-label={`${stars} of 3 stars`}>
        {[1, 2, 3].map((n) => (
          <Star key={n} size={28} className={n <= stars ? "fill-gold-bright text-gold-bright" : "text-parchment/25"} aria-hidden />
        ))}
      </div>
      <p className="mt-3 text-lg text-parchment/80">
        {mode === "pass" ? (p1Wins ? "Player 1 wins. " : p2Wins ? "Player 2 wins. " : "It’s a tie. ") : ""}
        {correctCount} right out of {answered}.
        {mode === "daily" ? ` Daily streak ${dailyStreak}.` : ""}
        {newBest ? " New best score!" : ""}
      </p>
      <dl className="mt-8 grid grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="card px-3 py-4">
            <dt className="text-xs uppercase tracking-wider text-parchment/60">{label}</dt>
            <dd className="mt-1 font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-parchment/65">Today’s goal: {Math.min(goal.count, goal.target)} of {goal.target} questions{goal.count >= goal.target ? " ✓" : ""}</p>
      {newBadges.length > 0 && (
        <div className="card-gold mt-4 px-4 py-3">
          <p className="flex items-center gap-2 font-semibold"><Award size={18} aria-hidden />New badge{newBadges.length > 1 ? "s" : ""}</p>
          <ul className="mt-1 text-sm">{newBadges.map((id) => (<li key={id}>{BADGES[id].name} · {BADGES[id].hint}</li>))}</ul>
        </div>
      )}
      {mode === "duel" && (
        <p className="card-gold mt-4 px-4 py-3 font-semibold">
          {rival ? (score > rival.score ? `You beat your friend’s ${rival.score}!` : score === rival.score ? `A tie with your friend (${rival.score}).` : `Your friend’s ${rival.score} wins this time.`) : `Tap Share result to challenge a friend to beat ${score}.`}
        </p>
      )}
      {misses.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {misses.map((miss) => (
            <li key={miss.ref + miss.prompt} className="card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-bright">{miss.subject} · {miss.ref}</p>
              <p className="mt-1 font-semibold">{miss.prompt}</p>
              <p className="mt-1 text-sm leading-relaxed text-parchment/80">{miss.why}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={() => start(mode)} className="btn btn-light">
          <RotateCcw size={18} aria-hidden />
          Run again
        </button>
        <button type="button" onClick={share} className="btn btn-ghost">Share result</button>
        <button type="button" onClick={() => go("home")} className="btn btn-ghost">Home</button>
      </div>
      {shareNote && <p className="mt-3 text-sm text-parchment/70" role="status">{shareNote}</p>}
    </section>
  );
}
