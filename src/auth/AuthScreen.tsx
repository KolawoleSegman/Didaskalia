import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, MailCheck, Trophy, Cloud, Users } from "lucide-react";
import { sendReset, signIn, signUp, type Session } from "../lib/backend";
import { APP_GREEK, APP_NAME } from "../brand";
import Logo from "../components/Logo";

type Tab = "in" | "up" | "forgot";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sign in, create an account, or ask for a password reset email. */
export default function AuthScreen({ onSignedIn, notice }: { onSignedIn: (s: Session) => void; notice?: string }) {
  const [tab, setTab] = useState<Tab>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"" | "confirm" | "reset">("");

  function switchTo(next: Tab) {
    setTab(next);
    setError("");
    setDone("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!EMAIL.test(email.trim())) return setError("Enter a valid email address.");
    if (tab === "up" && name.trim().length < 2) return setError("Enter your name (at least 2 letters).");
    if (tab !== "forgot" && password.length < 8) return setError("Your password needs at least 8 characters.");
    setBusy(true);
    try {
      if (tab === "in") onSignedIn(await signIn(email, password));
      else if (tab === "up") {
        const r = await signUp(email, password, name.trim().slice(0, 24));
        if (r.status === "signed-in") onSignedIn(r.session);
        else setDone("confirm");
      } else {
        await sendReset(email);
        setDone("reset");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-bg flex min-h-dvh flex-col items-center px-4 py-10 text-parchment sm:justify-center">
      <div className="grid w-full max-w-4xl items-center gap-10 md:grid-cols-[1.1fr_1fr]">
        <section className="text-center md:text-left">
          <div className="flex justify-center md:justify-start"><Logo size={72} /></div>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-none sm:text-6xl">{APP_NAME}</h1>
          <p className="mt-2 font-display text-xl italic text-gold-bright">{APP_GREEK}</p>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-parchment/80 md:mx-0">Learn the Word of God through quick, beautiful quizzes. Build a daily habit and grow in sound teaching.</p>
          <ul className="mx-auto mt-6 grid max-w-md gap-3 text-left md:mx-0">
            {[[Cloud, "Your progress follows you to any phone"], [Trophy, "Climb the weekly leaderboard"], [Users, "Play with your church or class"]].map(([Icon, text]) => {
              const I = Icon as typeof Cloud;
              return (<li key={text as string} className="flex items-center gap-3 text-parchment/85"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold-bright" aria-hidden><I size={18} /></span>{text as string}</li>);
            })}
          </ul>
        </section>

        <section className="card p-6 sm:p-7" aria-labelledby="auth-title">
          {done ? (
            <div className="text-center" role="status">
              <MailCheck size={44} className="mx-auto text-gold-bright" aria-hidden />
              <h2 id="auth-title" className="mt-3 font-display text-2xl">Check your email</h2>
              <p className="mt-2 text-parchment/80">{done === "confirm" ? `We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.` : `If an account exists for ${email.trim()}, a reset link is on its way.`}</p>
              <button type="button" className="btn btn-gold mt-5 w-full" onClick={() => switchTo("in")}>Back to sign in</button>
            </div>
          ) : (
            <>
              {tab !== "forgot" && (
                <div role="tablist" aria-label="Account" className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-parchment/10 p-1">
                  {([["in", "Sign in"], ["up", "Create account"]] as const).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => switchTo(id)} className={`min-h-11 rounded-full text-sm font-semibold ${tab === id ? "bg-gold-bright text-ink" : "text-parchment/80"}`}>{label}</button>
                  ))}
                </div>
              )}
              <h2 id="auth-title" className="font-display text-2xl">{tab === "in" ? "Welcome back" : tab === "up" ? "Join Didaskalia" : "Reset your password"}</h2>
              {tab === "forgot" && <p className="mt-1 text-sm text-parchment/75">Enter your email and we’ll send you a link to choose a new password.</p>}
              {notice && <p className="mt-3 rounded-xl bg-gold/15 px-3 py-2 text-sm" role="status">{notice}</p>}
              <form onSubmit={submit} className="mt-4 grid gap-3" noValidate>
                {tab === "up" && (
                  <div>
                    <label htmlFor="a-name" className="mb-1 block text-sm text-parchment/75">Your name</label>
                    <input id="a-name" autoComplete="name" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} className="input" />
                  </div>
                )}
                <div>
                  <label htmlFor="a-email" className="mb-1 block text-sm text-parchment/75">Email</label>
                  <input id="a-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
                {tab !== "forgot" && (
                  <div>
                    <label htmlFor="a-pass" className="mb-1 block text-sm text-parchment/75">Password</label>
                    <div className="relative">
                      <input id="a-pass" type={show ? "text" : "password"} autoComplete={tab === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-12" />
                      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-parchment/70">
                        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                      </button>
                    </div>
                    {tab === "up" && <p className="mt-1 text-xs text-parchment/55">At least 8 characters.</p>}
                  </div>
                )}
                {error && <p className="rounded-xl bg-bad/15 px-3 py-2 text-sm text-[#f3b1b6]" role="alert">{error}</p>}
                <button type="submit" disabled={busy} className="btn btn-gold mt-1 w-full">
                  {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
                  {tab === "in" ? "Sign in" : tab === "up" ? "Create my account" : "Send reset link"}
                </button>
              </form>
              <div className="mt-4 text-center text-sm">
                {tab === "in" && <button type="button" className="text-parchment/75 underline underline-offset-2" onClick={() => switchTo("forgot")}>Forgot your password?</button>}
                {tab === "forgot" && <button type="button" className="text-parchment/75 underline underline-offset-2" onClick={() => switchTo("in")}>Back to sign in</button>}
                {tab === "up" && <p className="text-xs leading-relaxed text-parchment/55">By creating an account you agree to our <a className="underline" href="./privacy.html" target="_blank" rel="noreferrer">privacy policy</a>. We store your name, email and points, nothing else.</p>}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
