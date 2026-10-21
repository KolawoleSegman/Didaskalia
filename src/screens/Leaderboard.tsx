import { useState } from "react";
import { Trophy } from "lucide-react";
import { useG } from "../GameContext";
import { backendConfigured } from "../lib/backend";
import { PageHeader, PILL_OFF, PILL_ON } from "../components/ui";
import BoardList from "../components/BoardList";

export default function Leaderboard() {
  const g = useG();
  const [scope, setScope] = useState<"week" | "all">("week");
  return (
    <section className="rise">
      <PageHeader title="Leaderboard" subtitle="Points from every round you finish. The weekly board resets on Monday." icon={<Trophy size={22} />} />
      {!backendConfigured ? (
        <p className="card px-4 py-3 text-parchment/75">The leaderboard needs the online connection, which isn’t set up in this copy.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <button type="button" aria-pressed={scope === "week"} className={scope === "week" ? PILL_ON : PILL_OFF} onClick={() => setScope("week")}>This week</button>
            <button type="button" aria-pressed={scope === "all"} className={scope === "all" ? PILL_ON : PILL_OFF} onClick={() => setScope("all")}>All time</button>
          </div>
          <BoardList scope={scope} />
          {!g.profile.show_on_board && <p className="mt-4 text-sm text-parchment/65">You are hidden from the public board. You can change that in Settings.</p>}
        </>
      )}
    </section>
  );
}
