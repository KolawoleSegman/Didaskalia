import { useRef } from "react";
import { Flame, Menu, Volume2, VolumeX } from "lucide-react";
import { useEngine } from "./engine";
import { GameContext, useG } from "./GameContext";
import type { AuthUser } from "./lib/backend";
import { APP_NAME } from "./brand";
import Logo from "./components/Logo";
import Drawer from "./components/Drawer";
import Home from "./screens/Home";
import Modes from "./screens/Modes";
import Play from "./screens/Play";
import Over from "./screens/Over";
import Library from "./screens/Library";
import Progress from "./screens/Progress";
import Achievements from "./screens/Achievements";
import Editor from "./screens/Editor";
import Settings from "./screens/Settings";
import Help from "./screens/Help";
import Leaderboard from "./screens/Leaderboard";
import Admin from "./screens/Admin";
import Memorize from "./components/Memorize";
import Groups from "./components/Groups";

function Shell() {
  const g = useG();
  const menuButton = useRef<HTMLButtonElement>(null);
  const playing = g.screen === "play";

  return (
    <main className="app-bg min-h-dvh text-parchment">
      <header className="sticky top-0 z-30 border-b border-parchment/10 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-2 px-3 sm:px-6">
          <button ref={menuButton} type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={g.drawerOpen} className="flex size-11 items-center justify-center rounded-full border border-parchment/20 hover:bg-parchment/5" onClick={() => g.setDrawerOpen(true)}>
            <Menu size={22} aria-hidden />
          </button>
          <button type="button" aria-label={`${APP_NAME} — home`} className="flex items-center gap-2" onClick={() => g.go("home")}>
            <Logo size={32} />
            <span className="font-display text-xl tracking-tight">{APP_NAME}</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {g.dailyStreak > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold-bright" title="Daily streak">
                <Flame size={16} aria-hidden />
                {g.dailyStreak}
                <span className="sr-only"> day streak</span>
              </span>
            )}
            <button type="button" aria-label={g.sound ? "Sound on" : "Sound off"} aria-pressed={g.sound} className="flex size-11 items-center justify-center rounded-full border border-parchment/20 hover:bg-parchment/5" onClick={() => g.setSound((v) => !v)}>
              {g.sound ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      {g.drawerOpen && <Drawer />}

      <div className={`mx-auto flex min-h-[calc(100dvh-4rem)] w-full flex-col px-4 pb-16 pt-6 sm:px-6 sm:pt-8 ${playing ? "max-w-xl" : "max-w-3xl"}`}>
        {g.screen === "home" && <Home />}
        {g.screen === "modes" && <Modes />}
        {g.screen === "play" && <Play />}
        {g.screen === "over" && <Over />}
        {g.screen === "library" && <Library />}
        {g.screen === "progress" && <Progress />}
        {g.screen === "achievements" && <Achievements />}
        {g.screen === "editor" && <Editor />}
        {g.screen === "memorize" && <Memorize />}
        {g.screen === "groups" && <Groups defaultNick={g.profile.display_name} />}
        {g.screen === "leaderboard" && <Leaderboard />}
        {g.screen === "settings" && <Settings />}
        {g.screen === "help" && <Help />}
        {g.screen === "admin" && <Admin onNotice={g.setHostNotice} />}
      </div>
    </main>
  );
}

/** The signed-in app. `user` comes from the sign-in gate (App.tsx). */
export default function Game({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const engine = useEngine(user, onSignOut);
  return (
    <GameContext.Provider value={engine}>
      <Shell />
    </GameContext.Provider>
  );
}
