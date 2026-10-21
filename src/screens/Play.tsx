import { Heart, Scissors } from "lucide-react";
import { useG } from "../GameContext";
import { LIVES, SPRINT_SECONDS } from "../engine";

export default function Play() {
  const { mode, turn, question, limit, index, lives, seconds, score, p2, streak, correctCount, answered, choice, hidden, lifeUsed, serial, ending, nextButton, finish, fiftyFifty, pick, next } = useG();
  if (!question) return null;
  const progress = mode === "sprint" ? (seconds / SPRINT_SECONDS) * 100 : limit !== null ? ((index + (choice !== null ? 1 : 0)) / limit) * 100 : (lives / LIVES) * 100;

  return (
    <section className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-gold-bright">
          {mode === "pass" ? (turn === 0 ? "Player 1" : "Player 2") : question.subject}
          {limit !== null ? ` · ${index + 1}/${limit}` : ""}
        </span>
        {mode === "challenge" && (
          <span className="flex items-center gap-1" role="img" aria-label={`${lives} ${lives === 1 ? "life" : "lives"} left`}>
            {Array.from({ length: LIVES }).map((_, i) => (
              <Heart key={i} size={18} className={i < lives ? "fill-bad text-bad" : "text-parchment/30"} aria-hidden />
            ))}
          </span>
        )}
        {mode === "sprint" && <span className="font-display text-2xl" aria-label={`${seconds} seconds left`}>{seconds}s</span>}
        {mode === "study" && limit === null && (
          <button type="button" className="text-parchment/70 underline-offset-2 hover:underline" onClick={finish}>
            End study
          </button>
        )}
      </div>
      <div className="mb-4 flex gap-4 text-sm text-parchment/70">
        {mode === "pass" ? (
          <>
            <span>P1 {score}</span>
            <span>P2 {p2}</span>
          </>
        ) : (
          <span>Score {score}</span>
        )}
        <span>Streak {streak}</span>
        <span>
          {correctCount}/{answered}
        </span>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-parchment/15" aria-hidden>
          <div className="h-full rounded-full bg-gold-bright transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        {mode !== "sprint" && (
          <button type="button" disabled={lifeUsed || choice !== null} onClick={fiftyFifty} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-gold/50 px-3 text-sm text-gold-bright disabled:opacity-40">
            <Scissors size={14} aria-hidden />
            50/50
          </button>
        )}
      </div>
      <article key={serial} className={`rise rounded-3xl bg-parchment p-5 text-fg shadow-xl shadow-black/40 sm:p-7 ${choice === null ? "" : choice === question.answer ? "pop" : "shake"}`}>
        <p className="text-sm font-semibold uppercase tracking-wider text-gold">{question.ref}</p>
        <h2 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{question.prompt}</h2>
        <ul className="mt-6 grid gap-3">
          {question.choices.map((choiceText, i) => {
            const revealed = choice !== null;
            const correct = i === question.answer;
            const selected = i === choice;
            const gone = hidden.includes(i);
            let tone = "border-line bg-parchment hover:border-gold";
            if (revealed && correct) tone = "border-good bg-good-soft";
            else if (revealed && selected) tone = "border-bad bg-bad-soft";
            else if (revealed) tone = "border-line opacity-60";
            else if (gone) tone = "border-line opacity-25 line-through";
            return (
              <li key={i}>
                <button type="button" disabled={revealed || gone} onClick={() => pick(i)} className={`flex min-h-12 w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left font-semibold leading-snug ${tone}`}>
                  <span className="mt-0.5 text-muted">{String.fromCharCode(65 + i)}</span>
                  <span>{choiceText}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {choice !== null && (
          <div className="mt-5 border-t border-line pt-4" role="status">
            <p className={`font-semibold ${choice === question.answer ? "text-good" : "text-bad"}`}>{choice === question.answer ? "True." : "Not that."}</p>
            <p className="mt-1 leading-relaxed">{question.why}</p>
            <button ref={nextButton} type="button" onClick={next} className="mt-4 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 py-3 font-semibold text-parchment">
              {ending ? (mode === "challenge" ? "See your result" : "See the round") : "Next word"}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}
