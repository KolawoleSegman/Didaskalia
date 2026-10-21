import { useEffect, useRef } from "react";
import { Award, BarChart3, BookOpen, Brain, CalendarDays, CircleHelp, GraduationCap, Home, LibraryBig, LogOut, PenLine, Settings, ShieldCheck, Trophy, Users, X } from "lucide-react";
import type { ComponentType } from "react";
import { useG } from "../GameContext";
import type { Screen } from "../engine";
import { APP_GREEK, APP_NAME, APP_VERSION } from "../brand";
import { Avatar } from "./ui";
import Logo from "./Logo";

type Item = { id: Screen | "daily"; label: string; icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>; show?: boolean };

/** The three-line menu: every feature of the app, in one place. */
export default function Drawer() {
  const g = useG();
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") g.setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Learn",
      items: [
        { id: "home", label: "Home", icon: Home },
        { id: "modes", label: "Play", icon: BookOpen },
        { id: "daily", label: "Daily challenge", icon: CalendarDays },
        { id: "memorize", label: "Memorize", icon: Brain },
        { id: "library", label: "Library", icon: LibraryBig },
      ],
    },
    {
      title: "Compete",
      items: [
        { id: "leaderboard", label: "Leaderboard", icon: Trophy },
        { id: "groups", label: "Groups", icon: Users },
      ],
    },
    {
      title: "You",
      items: [
        { id: "progress", label: "Progress", icon: BarChart3 },
        { id: "achievements", label: "Achievements", icon: Award },
        { id: "editor", label: "My questions", icon: PenLine },
        { id: "settings", label: "Settings", icon: Settings },
      ],
    },
    {
      title: "More",
      items: [
        { id: "help", label: "Help & about", icon: CircleHelp },
        { id: "admin", label: "Admin dashboard", icon: ShieldCheck, show: g.isAdmin },
      ],
    },
  ];

  function choose(id: Item["id"]) {
    if (id === "daily") {
      g.setDrawerOpen(false);
      g.start("daily");
    } else g.go(id);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <button type="button" aria-label="Close menu backdrop" tabIndex={-1} className="drawer-scrim absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => g.setDrawerOpen(false)} />
      <div role="dialog" aria-modal="true" aria-label="Main menu" className="drawer-panel relative flex h-full w-[22rem] max-w-[88vw] flex-col overflow-y-auto border-r border-parchment/10 bg-ink shadow-2xl">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div className="flex items-center gap-2">
            <Logo size={34} />
            <div>
              <p className="font-display text-xl leading-none">{APP_NAME}</p>
              <p className="mt-1 text-xs text-parchment/60">{APP_GREEK}</p>
            </div>
          </div>
          <button ref={close} type="button" aria-label="Close menu" className="flex size-10 items-center justify-center rounded-full border border-parchment/20" onClick={() => g.setDrawerOpen(false)}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <button type="button" onClick={() => g.go("settings")} className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-left" aria-label={`Your account: ${g.profile.display_name}`}>
          <Avatar name={g.profile.display_name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{g.profile.display_name}</span>
            <span className="block text-sm text-parchment/70">Level {g.lvl.level} · {g.lvl.name}</span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-parchment/15">
              <span className="block h-full rounded-full bg-gold-bright" style={{ width: `${g.lvl.pct}%` }} />
            </span>
          </span>
        </button>

        <nav aria-label="Main menu" className="flex-1 px-3 py-4">
          {groups.map((grp) => (
            <div key={grp.title} className="mb-4">
              <p className="eyebrow px-3 pb-1">{grp.title}</p>
              <ul>
                {grp.items.filter((i) => i.show !== false).map((item) => {
                  const Icon = item.icon;
                  const on = g.screen === item.id || (item.id === "modes" && (g.screen === "play" || g.screen === "over"));
                  return (
                    <li key={item.id}>
                      <button type="button" aria-current={on ? "page" : undefined} onClick={() => choose(item.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[1.02rem] ${on ? "bg-gold/20 font-semibold text-gold-bright" : "hover:bg-parchment/5"}`}>
                        <Icon size={20} aria-hidden />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-parchment/10 px-4 py-4">
          <button type="button" onClick={() => void g.logout()} className="btn btn-ghost w-full">
            <LogOut size={18} aria-hidden />
            Sign out
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-parchment/45">
            <GraduationCap size={14} aria-hidden />
            {APP_NAME} {APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
