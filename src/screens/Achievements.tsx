import { Award, Lock } from "lucide-react";
import { useG } from "../GameContext";
import { BADGES, allBadgeIds } from "../lib/logic";
import { PageHeader } from "../components/ui";

export default function Achievements() {
  const { badges } = useG();
  return (
    <section className="rise">
      <PageHeader title="Achievements" subtitle="Earn badges as you learn. Keep going." icon={<Award size={22} />} />
      <h2 className="font-display text-2xl">Badges ({badges.length}/{allBadgeIds().length})</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {allBadgeIds().map((id) => {
          const got = badges.includes(id);
          return (
            <li key={id} className={`rounded-2xl px-4 py-4 text-sm ${got ? "card-gold" : "card opacity-60"}`}>
              <span className={`mb-2 flex size-10 items-center justify-center rounded-full ${got ? "bg-gold-bright text-ink" : "bg-parchment/10"}`} aria-hidden>
                {got ? <Award size={20} /> : <Lock size={18} />}
              </span>
              <p className="font-semibold">{BADGES[id].name}</p>
              <p className="mt-1 text-xs text-parchment/70">{BADGES[id].hint}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
