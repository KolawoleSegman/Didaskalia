import { useEffect, useState } from "react";
import { globalBoard, type BoardRow } from "../lib/account";
import { backendConfigured } from "../lib/backend";

/** The public weekly ranking. `limit` trims it for the home page preview. */
export default function BoardList({ scope, limit }: { scope: "week" | "all"; limit?: number }) {
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!backendConfigured) {
      setRows([]);
      return;
    }
    let live = true;
    setRows(null);
    globalBoard(scope).then((r) => live && setRows(r)).catch((e) => { if (live) { setError((e as Error).message); setRows([]); } });
    return () => { live = false; };
  }, [scope]);

  if (rows === null) return <p className="text-parchment/60">Loading…</p>;
  const shown = limit ? rows.slice(0, limit) : rows;
  if (shown.length === 0) return <p className="text-parchment/60">{error || "No scores yet. Finish a round to take the first place."}</p>;
  return (
    <ol className="grid gap-2">
      {shown.map((r, i) => (
        <li key={`${r.rank}-${r.display_name}-${i}`} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${r.is_me ? "border border-gold/60 bg-gold/10" : "bg-parchment/5"}`}>
          <span className="flex items-center gap-3">
            <span className={`flex size-7 items-center justify-center rounded-full text-sm font-bold ${r.rank === 1 ? "bg-gold-bright text-ink" : r.rank <= 3 ? "bg-gold/30 text-gold-bright" : "text-parchment/60"}`}>{r.rank}</span>
            <span>{r.display_name}{r.is_me ? " (you)" : ""}</span>
          </span>
          <span className="font-semibold">{r.points}</span>
        </li>
      ))}
    </ol>
  );
}
