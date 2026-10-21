import { CircleHelp, Mail, ShieldCheck } from "lucide-react";
import { MODES } from "../lib/logic";
import { MODE_COPY, MODE_HELP, MODE_ICON } from "../modes";
import { APP_GREEK, APP_NAME, APP_TAGLINE, APP_VERSION, SUPPORT_EMAIL } from "../brand";
import { PageHeader } from "../components/ui";
import Logo from "../components/Logo";

export default function Help() {
  return (
    <section className="rise">
      <PageHeader title="Help & about" icon={<CircleHelp size={22} />} />
      <div className="card flex items-center gap-4 px-5 py-5">
        <Logo size={56} />
        <div>
          <p className="font-display text-2xl">{APP_NAME} <span className="text-base text-parchment/60">{APP_GREEK}</span></p>
          <p className="text-sm text-parchment/75">{APP_TAGLINE}</p>
          <p className="mt-1 text-xs text-parchment/50">Version {APP_VERSION}</p>
        </div>
      </div>
      <p className="mt-4 leading-relaxed text-parchment/80">Didaskalia is the Greek word for teaching or doctrine. Each question points you to a verse and explains it, so you learn the Word, not just the answers.</p>

      <h2 className="mt-8 font-display text-2xl">How to play</h2>
      <ul className="mt-3 grid gap-2">
        {MODES.filter((m) => MODE_HELP[m]).map((m) => {
          const Icon = MODE_ICON[m];
          return (
            <li key={m} className="card flex gap-3 px-4 py-3">
              <Icon size={20} className="mt-0.5 shrink-0 text-gold-bright" aria-hidden />
              <p><span className="font-semibold">{MODE_COPY[m].label}.</span> <span className="text-parchment/80">{MODE_HELP[m]}</span></p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 font-display text-2xl">Good to know</h2>
      <ul className="mt-3 grid gap-2 text-parchment/80">
        <li className="card px-4 py-3">Your streak grows each day you finish a Daily round. One missed day is forgiven each week with a streak freeze.</li>
        <li className="card px-4 py-3">Points from finished rounds go to the weekly leaderboard and to any groups you join. You can hide yourself in Settings.</li>
        <li className="card px-4 py-3">Your progress is saved to your account, so you can sign in on another phone and keep going.</li>
      </ul>

      <h2 className="mt-8 font-display text-2xl">Contact & privacy</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <a className="btn btn-ghost min-h-11" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={16} aria-hidden />{SUPPORT_EMAIL}</a>
        <a className="btn btn-ghost min-h-11" href="./privacy.html" target="_blank" rel="noreferrer"><ShieldCheck size={16} aria-hidden />Privacy policy</a>
      </div>
    </section>
  );
}
