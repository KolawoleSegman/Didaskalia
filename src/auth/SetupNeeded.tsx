import { APP_NAME } from "../brand";
import Logo from "../components/Logo";

/** Shown when the two Supabase values are missing, so the owner knows exactly what to do. */
export default function SetupNeeded() {
  return (
    <main className="app-bg flex min-h-dvh items-center justify-center px-4 py-10 text-parchment">
      <section className="card w-full max-w-lg p-7">
        <Logo size={48} />
        <h1 className="mt-4 font-display text-3xl">{APP_NAME} isn’t connected yet</h1>
        <p className="mt-3 leading-relaxed text-parchment/80">Accounts need a Supabase project. Add <code className="rounded bg-parchment/10 px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-parchment/10 px-1">VITE_SUPABASE_ANON_KEY</code> (see <code className="rounded bg-parchment/10 px-1">.env.example</code> and the README), then rebuild.</p>
      </section>
    </main>
  );
}
