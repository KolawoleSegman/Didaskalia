import { useState, type FormEvent } from "react";
import { setNewPassword } from "../lib/backend";
import Logo from "../components/Logo";

/** Opened from the link in the password-reset email. */
export default function ResetPassword({ token, problem, onDone }: { token: string | null; problem?: string; onDone: (message: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(problem ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      await setNewPassword(token, password);
      onDone("Password changed. Sign in with your new password.");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="app-bg flex min-h-dvh items-center justify-center px-4 py-10 text-parchment">
      <section className="card w-full max-w-md p-7">
        <Logo size={48} />
        <h1 className="mt-4 font-display text-3xl">Choose a new password</h1>
        {token ? (
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <label htmlFor="np" className="text-sm text-parchment/75">New password</label>
            <input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            {error && <p className="rounded-xl bg-bad/15 px-3 py-2 text-sm text-[#f3b1b6]" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-gold">Save password</button>
          </form>
        ) : (
          <>
            <p className="mt-3 text-parchment/80" role="alert">{error || "That reset link isn’t valid."}</p>
            <button type="button" className="btn btn-gold mt-5 w-full" onClick={() => onDone("")}>Back to sign in</button>
          </>
        )}
      </section>
    </main>
  );
}
