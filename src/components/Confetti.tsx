import { useMemo } from "react";

const COLORS = ["#c6a15a", "#f3eee4", "#6fcf9f", "#8db4ea", "#f0a04b", "#b890e8"];

/** A short burst of falling paper for a great round. Decorative only. */
export default function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ left: Math.random() * 100, delay: Math.random() * 0.8, dur: 2.2 + Math.random() * 1.8, color: COLORS[i % COLORS.length] })),
    [],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}
