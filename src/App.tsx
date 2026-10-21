import { useEffect, useState } from "react";
import Game from "./Game";
import AuthScreen from "./auth/AuthScreen";
import ResetPassword from "./auth/ResetPassword";
import SetupNeeded from "./auth/SetupNeeded";
import { backendConfigured, getSession, refresh, signOut, type Session } from "./lib/backend";
import { recordInstall } from "./lib/account";
import { adoptLegacyData, setNamespace } from "./lib/storage";

type Recovery = { token: string | null; problem?: string } | null;

/** The reset email opens the site with the new login in the address bar, e.g. #access_token=…&type=recovery. */
function readRecovery(): Recovery {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw.includes("type=recovery") && !raw.includes("error_description")) return null;
  const p = new URLSearchParams(raw);
  const token = p.get("type") === "recovery" ? p.get("access_token") : null;
  const problem = p.get("error_description")?.replace(/\+/g, " ") ?? undefined;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return { token, problem: problem ? "That link has expired. Ask for a new one from the sign-in page." : undefined };
}

function enter(s: Session | null): Session | null {
  setNamespace(s?.user.id ?? null);
  if (s) adoptLegacyData();
  return s;
}

/** Nobody gets past this screen without an account. */
export default function App() {
  const [session, setSession] = useState<Session | null>(() => enter(getSession()));
  const [recovery, setRecovery] = useState<Recovery>(readRecovery);
  const [notice, setNotice] = useState("");

  // Count this device as an install (works before sign-in).
  useEffect(() => {
    void recordInstall().catch(() => {});
  }, []);

  // If the saved sign-in has been revoked (or the account deleted), send the person back to sign in.
  useEffect(() => {
    if (!session) return;
    let live = true;
    const [, payload] = session.access_token.split(".");
    let expired = false;
    try {
      expired = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000 < Date.now() + 30_000;
    } catch {
      expired = true;
    }
    if (expired) {
      refresh(session)
        .then((fresh) => {
          if (!live) return;
          if (fresh === null) setSession(enter(null));
        })
        .catch(() => {
          /* offline: keep playing with what is on the device */
        });
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!backendConfigured) return <SetupNeeded />;
  if (recovery) {
    return <ResetPassword token={recovery.token} problem={recovery.problem} onDone={(m) => { setNotice(m); setRecovery(null); }} />;
  }
  if (!session) return <AuthScreen notice={notice} onSignedIn={(s) => { setNotice(""); setSession(enter(s)); }} />;
  return (
    <Game
      key={session.user.id}
      user={session.user}
      onSignOut={() => {
        void signOut();
        setSession(enter(null));
      }}
    />
  );
}
