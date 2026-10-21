import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS, SUBJECTS, type Question, type Subject } from "./questions";
import {
  BADGES, MODES, allBadgeIds, earnedBadges, freezeReady, dayKey, daySeed, levelFor, currentSeason, liveDailyStreak, nextDaily,
  prepare, reshuffleDeck, sanitizeBadges, sanitizeBest, sanitizeDaily, sanitizeGoal, sanitizeHistory, sanitizeMarks, sanitizeMemory,
  sanitizeProgress, sanitizeQuestion, sanitizeQuestions, sanitizeStats, shuffle, shuffleSeeded, mergeProgress,
  type Daily, type Goal, type Mode, type Progress, type Session, type Stats,
} from "./lib/logic";
import { readJson, storageKey, writeJson, clearAccountData } from "./lib/storage";
import { exitApp, isNative, onBackButton, saveJsonFile, setReminder, shareResult, shareText } from "./lib/native";
import { renderCard } from "./lib/shareCard";
import { SITE_URL } from "./config";
import { verseOfDay } from "./verses";
import { THEMES } from "./themes";
import { ORDER_QUESTIONS } from "./orderQuiz";
import { PACKS } from "./seasonal";
import { getNotice, recordPlay } from "./lib/host";
import { submitScore } from "./lib/groups";
import { backendConfigured, type AuthUser } from "./lib/backend";
import { deleteAccount, ensureProfile, loadProgress, ping, saveProfile, saveProgress, type Profile } from "./lib/account";
import { WHO_AM_I } from "./whoAmI";
import { verseQuestions } from "./lib/verseQuiz";
import { decodeQuiz, encodeQuiz, extractCode, MAX_CLASS_QUESTIONS, type ClassQuiz } from "./lib/classQuiz";
import { cue } from "./lib/feedback";
import { APP_NAME } from "./brand";
import { MODE_COPY } from "./modes";

export const LIVES = 3;
export const SPRINT_SECONDS = 60;
export const ROUND_SIZE = 10;
const HISTORY_MAX = 12;
export const LIBRARY_PAGE = 40;
const MISSED_MAX = 60;
const VERSE_BANK = verseQuestions();
export const TEXT_SIZES = [["Normal", "100%"], ["Large", "112.5%"], ["Largest", "125%"]] as const;
export const SEASON_NAME = { christmas: "Christmas", easter: "Easter" } as const;
export const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

export type Screen = "home" | "modes" | "play" | "over" | "library" | "progress" | "achievements" | "editor" | "memorize" | "groups" | "leaderboard" | "settings" | "help" | "admin";
export type Miss = { ref: string; prompt: string; why: string; subject: string };
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

/** All of the game's state and actions. Screens read it through the context in Game.tsx. */
export function useEngine(user: AuthUser, onSignOut: () => void) {
  const [custom, setCustom] = useState<Question[]>(() => sanitizeQuestions(readJson(storageKey("custom")), true));
  const [marks, setMarks] = useState<string[]>(() => sanitizeMarks(readJson(storageKey("marks"))));
  const [stats, setStats] = useState<Stats>(() => sanitizeStats(readJson(storageKey("stats"))));
  const [history, setHistory] = useState<Session[]>(() => sanitizeHistory(readJson(storageKey("history")), HISTORY_MAX));
  const [daily, setDaily] = useState<Daily>(() => sanitizeDaily(readJson(storageKey("daily"))));
  const [best, setBest] = useState<number>(() => sanitizeBest(readJson(storageKey("best"))));

  const [sound, setSound] = useState<boolean>(() => readJson(storageKey("sound")) !== false);
  const [badges, setBadges] = useState<string[]>(() => sanitizeBadges(readJson(storageKey("badges"))));
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [reminder, setReminderState] = useState<{ on: boolean; hour: number }>(() => {
    const v = readJson(storageKey("reminder")) as { on?: unknown; hour?: unknown } | undefined;
    const hour = typeof v?.hour === "number" && HOURS.includes(v.hour) ? v.hour : 19;
    return { on: v?.on === true, hour };
  });
  const [reminderNote, setReminderNote] = useState("");
  const [theme, setTheme] = useState<string>(() => {
    const v = readJson(storageKey("theme"));
    return typeof v === "string" ? v : "classic";
  });
  const [missed, setMissed] = useState<string[]>(() => sanitizeMarks(readJson(storageKey("missed"))).slice(-MISSED_MAX));
  const [backupNote, setBackupNote] = useState("");
  const [textSize, setTextSize] = useState<number>(() => {
    const v = readJson(storageKey("textsize"));
    return v === 1 || v === 2 ? v : 0;
  });
  const [hostNotice, setHostNotice] = useState("");
  const [classQuiz, setClassQuiz] = useState<ClassQuiz | null>(null);
  const [teacherTitle, setTeacherTitle] = useState("");
  const [joinText, setJoinText] = useState("");
  const [joinNote, setJoinNote] = useState("");
  const [rival, setRival] = useState<{ seed: number; score: number } | null>(null);
  const [duelSeed, setDuelSeed] = useState<number | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [lifeUsed, setLifeUsed] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("challenge");
  const [picked, setPicked] = useState<Subject[]>([]);
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [shown, setShown] = useState(LIBRARY_PAGE);

  const [deck, setDeck] = useState<Question[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [serial, setSerial] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [p2, setP2] = useState(0);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [streaks, setStreaks] = useState<[number, number]>([0, 0]);
  const [bestStreak, setBestStreak] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [seconds, setSeconds] = useState(SPRINT_SECONDS);
  const [newBest, setNewBest] = useState(false);
  const [shareNote, setShareNote] = useState("");
  const [editorNote, setEditorNote] = useState("");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [draft, setDraft] = useState({ subject: "Faith" as Subject, prompt: "", ref: "", a: "", b: "", c: "", d: "", answer: "0", why: "" });

  const deadline = useRef(0);
  const nextButton = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<() => void>(() => {});
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  const backRef = useRef<() => void>(() => {});

  const bank = useMemo(() => [...QUESTIONS, ...custom], [custom]);
  const lookup = useMemo(() => {
    const all = new Map<string, Question>();
    for (const q of [...bank, ...WHO_AM_I, ...VERSE_BANK, ...ORDER_QUESTIONS, ...PACKS.christmas, ...PACKS.easter]) all.set(q.id, q);
    return all;
  }, [bank]);
  const reviewable = missed.filter((id) => lookup.has(id)).length;
  const question: Question | undefined = deck[index];
  const who: 0 | 1 = mode === "pass" ? turn : 0;
  const streak = streaks[who];
  const ending =
    choice !== null && ((mode === "challenge" && lives <= 0) || (limit !== null && index + 1 >= limit));
  const today = dayKey();
  const season = currentSeason(today);
  const dailyStreak = liveDailyStreak(daily);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>({ display_name: user.name, show_on_board: true, is_admin: false });
  const [goal, setGoal] = useState<Goal>(() => sanitizeGoal(readJson(storageKey("goal")), dayKey()));
  const [cloudReady, setCloudReady] = useState(!backendConfigured);
  const syncedRef = useRef("");

  function snapshot(): Progress {
    return { best, stats, marks, custom, history, daily, badges, theme, missed, memory: sanitizeMemory(readJson(storageKey("memory"))) };
  }
  /** Puts progress into the game. `withTheme` is only for restoring a backup. */
  function applyProgress(p: Progress, withTheme = false) {
    setBest(p.best);
    setStats(p.stats);
    setMarks(p.marks);
    setCustom(p.custom);
    setHistory(p.history);
    setDaily(p.daily);
    setBadges(p.badges);
    setMissed(p.missed);
    writeJson(storageKey("memory"), p.memory);
    if (withTheme) setTheme(p.theme);
  }

  /** Go to a screen, closing the menu and returning to the top of the page. */
  function go(next: Screen) {
    setDrawerOpen(false);
    setScreen(next);
    try {
      window.scrollTo(0, 0);
    } catch {
      /* not in a browser */
    }
  }

  /* ---------- account: profile, heartbeat, and progress that follows the account ---------- */
  useEffect(() => {
    if (backendConfigured) ensureProfile(user.name).then(setProfile).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (!backendConfigured) return;
    const beat = () => {
      if (document.visibilityState !== "hidden") void ping().catch(() => {});
    };
    const id = window.setInterval(beat, 120_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);

  useEffect(() => {
    if (!backendConfigured) return;
    let live = true;
    loadProgress()
      .then((cloud) => {
        if (live && cloud) applyProgress(mergeProgress(sanitizeProgress(snapshot()), sanitizeProgress(cloud)));
      })
      .catch(() => {})
      .finally(() => {
        if (live) setCloudReady(true);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!backendConfigured || !cloudReady) return;
    const body = JSON.stringify({ best, stats, marks, custom, history, daily, badges, missed });
    if (body === syncedRef.current) return;
    const id = window.setTimeout(() => {
      syncedRef.current = body;
      void saveProgress(snapshot()).catch(() => {
        syncedRef.current = "";
      });
    }, 6000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudReady, best, stats, marks, custom, history, daily, badges, missed]);

  useEffect(() => writeJson(storageKey("goal"), goal), [goal]);
  const goalNow = sanitizeGoal(goal, dayKey());
  const goalPct = Math.min(100, Math.round((goalNow.count / goalNow.target) * 100));

  async function logout() {
    try {
      if (backendConfigured && cloudReady) await saveProgress(snapshot());
    } catch {
      /* the next sign-in will merge whatever the account already has */
    }
    onSignOut();
  }

  async function renameMe(name: string, show: boolean): Promise<string> {
    try {
      const p = await saveProfile(name, show);
      setProfile((cur) => ({ ...cur, ...p }));
      return "Saved.";
    } catch (e) {
      return (e as Error).message;
    }
  }

  /** Permanently deletes the account and everything saved for it. Returns an error message, or "" on success. */
  async function removeAccount(): Promise<string> {
    try {
      await deleteAccount();
    } catch (e) {
      return (e as Error).message;
    }
    clearAccountData();
    onSignOut();
    return "";
  }

  function setGoalTarget(target: number) {
    setGoal({ ...goalNow, target });
  }

  async function shareApp() {
    const base = isNative ? SITE_URL : window.location.origin + window.location.pathname;
    return shareText(APP_NAME, `Come and learn the Bible with me on ${APP_NAME}: ${base}`);
  }

  /** The subject where this player is weakest (at least three answers, under 100%). */
  const weakest = useMemo(() => {
    let low: { subject: Subject; pct: number } | null = null;
    for (const s of SUBJECTS) {
      const r = stats[s];
      if (!r || r.seen < 3) continue;
      const pct = Math.round((r.right / r.seen) * 100);
      if (pct < 100 && (!low || pct < low.pct)) low = { subject: s, pct };
    }
    return low;
  }, [stats]);

  function studySubject(subject: Subject) {
    const pool = shuffle(bank.filter((q) => q.subject === subject)).slice(0, ROUND_SIZE);
    begin("study", pool.map((q) => prepare(q)), pool.length);
  }

  /* ---------- persistence: every change is saved; failures are ignored ---------- */
  useEffect(() => writeJson(storageKey("custom"), custom), [custom]);
  useEffect(() => writeJson(storageKey("marks"), marks), [marks]);
  useEffect(() => writeJson(storageKey("stats"), stats), [stats]);
  useEffect(() => writeJson(storageKey("history"), history), [history]);
  useEffect(() => writeJson(storageKey("daily"), daily), [daily]);
  useEffect(() => writeJson(storageKey("best"), best), [best]);
  useEffect(() => writeJson(storageKey("sound"), sound), [sound]);
  useEffect(() => writeJson(storageKey("badges"), badges), [badges]);
  useEffect(() => writeJson(storageKey("theme"), theme), [theme]);
  useEffect(() => writeJson(storageKey("missed"), missed), [missed]);
  useEffect(() => {
    writeJson(storageKey("textsize"), textSize);
    document.documentElement.style.fontSize = TEXT_SIZES[textSize][1];
  }, [textSize]);
  useEffect(() => writeJson(storageKey("reminder"), reminder), [reminder]);

  useEffect(() => {
    if (backendConfigured) getNotice().then(setHostNotice).catch(() => {});
  }, []);

  /* ---------- friend challenge links (#c=seed.score) and reminder re-arming ---------- */
  useEffect(() => {
    const m = /c=(\d+)\.(\d+)/.exec(window.location.hash);
    const q = /q=([A-Za-z0-9_-]+)/.exec(window.location.hash);
    if (m) setRival({ seed: Number(m[1]) % 4294967296, score: Math.min(Number(m[2]), 99999) });
    if (q) void openClass(q[1]);
    if (m || q) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (isNative && reminder.on) void setReminder(reminder.hour);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- web install prompt (never fires inside the Android app) ---------- */
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  /* ---------- sprint clock: based on a deadline so it stays honest if the tab is throttled ---------- */
  useEffect(() => {
    if (screen !== "play" || mode !== "sprint") return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [screen, mode]);

  useEffect(() => {
    if (screen === "play" && mode === "sprint" && seconds === 0) finishRef.current();
  }, [seconds, screen, mode]);

  useEffect(() => setEditorNote(""), [screen]);

  /* ---------- after answering, move focus to the explanation's Next button ---------- */
  useEffect(() => {
    if (choice !== null) nextButton.current?.focus();
  }, [choice]);

  /* ---------- keyboard: 1-4 or A-D to answer, Enter for next ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ---------- Android Back: step back to the menu, exit only from the menu ---------- */
  useEffect(() => onBackButton(() => backRef.current()), []);

  /* ---------- game flow ---------- */

  function begin(nextMode: Mode, nextDeck: Question[], nextLimit: number | null) {
    if (nextDeck.length === 0) return;
    deadline.current = Date.now() + SPRINT_SECONDS * 1000;
    if (backendConfigured) void recordPlay(nextMode).catch(() => {});
    setMode(nextMode);
    setDeck(nextDeck);
    setLimit(nextLimit);
    setIndex(0);
    setSerial((n) => n + 1);
    setLives(LIVES);
    setScore(0);
    setP2(0);
    setTurn(0);
    setStreaks([0, 0]);
    setBestStreak(0);
    setChoice(null);
    setAnswered(0);
    setCorrectCount(0);
    setMisses([]);
    setSeconds(SPRINT_SECONDS);
    setNewBest(false);
    setNewBadges([]);
    setHidden([]);
    setLifeUsed(false);
    setShareNote("");
    setScreen("play");
  }

  function start(nextMode: Mode = mode, seedOverride?: number) {
    let pool: Question[];
    if (nextMode === "duel") {
      // Everyone who opens the same link gets the same ten questions.
      const seed = seedOverride ?? Math.floor(Math.random() * 1e9);
      setDuelSeed(seed);
      if (seedOverride === undefined) setRival(null);
      pool = shuffleSeeded(QUESTIONS, seed).slice(0, ROUND_SIZE);
    } else if (nextMode === "class" && classQuiz) {
      pool = shuffle(classQuiz.questions);
    } else if (nextMode === "season") {
      pool = shuffle(PACKS[season.id]);
    } else if (nextMode === "order") {
      pool = shuffle(ORDER_QUESTIONS).slice(0, ROUND_SIZE);
    } else if (nextMode === "review") {
      pool = shuffle(missed.map((id) => lookup.get(id)).filter((q): q is Question => !!q)).slice(0, 20);
    } else if (nextMode === "who") {
      pool = shuffle(WHO_AM_I).slice(0, ROUND_SIZE);
    } else if (nextMode === "verse") {
      pool = shuffle(verseQuestions()).slice(0, ROUND_SIZE);
    } else if (nextMode === "daily") {
      // Built-in questions only, so every player gets the same ten on a given day.
      pool = shuffleSeeded(QUESTIONS, daySeed(dayKey())).slice(0, ROUND_SIZE);
    } else {
      const base = picked.length === 0 ? bank : bank.filter((q) => picked.includes(q.subject));
      pool = nextMode === "tournament" || nextMode === "pass" ? shuffle(base).slice(0, ROUND_SIZE) : shuffle(base);
    }
    const fixed = nextMode === "duel" || nextMode === "season" || nextMode === "order" || nextMode === "review" || nextMode === "who" || nextMode === "class" || nextMode === "verse" || nextMode === "daily" || nextMode === "tournament" || nextMode === "pass";
    begin(nextMode, pool.map((q) => prepare(q)), fixed ? pool.length : null);
  }

  function practice(q: Question) {
    begin("study", [prepare(q)], 1);
  }

  function finish() {
    if (mode === "challenge" && score > best) {
      setBest(score);
      setNewBest(true);
    }
    const nextD = mode === "daily" ? nextDaily(daily, dayKey()) : daily;
    if (mode === "daily") setDaily(nextD);
    const session: Session = {
      mode,
      score: mode === "pass" ? score + p2 : score,
      correct: correctCount,
      answered,
      at: new Date().toISOString(),
    };
    setHistory((prev) => [session, ...prev].slice(0, HISTORY_MAX));
    const earned = earnedBadges({
      totalCorrect: totals.right,
      sessions: history.length + 1,
      dailyStreak: liveDailyStreak(nextD),
      perfect: answered >= 5 && correctCount === answered,
      duel: mode === "duel",
      stats,
      modesTried: new Set([...history.map((h) => h.mode), mode]).size,
    });
    const fresh = earned.filter((id) => !badges.includes(id));
    setNewBadges(fresh);
    if (fresh.length) setBadges((prev) => [...prev, ...fresh]);
    cue("done", sound);
    if (backendConfigured && mode !== "study" && mode !== "pass" && score > 0) void submitScore(score).catch(() => {});
    setScreen("over");
  }
  finishRef.current = finish;

  function pick(i: number) {
    if (choice !== null || !question) return;
    if (mode === "sprint" && (seconds === 0 || Date.now() >= deadline.current)) return;
    if (hidden.includes(i)) return;
    const right = i === question.answer;
    cue(right ? "right" : "wrong", sound);
    setChoice(i);
    setMissed((prev) => (right ? prev.filter((id) => id !== question.id) : prev.includes(question.id) ? prev : [...prev, question.id].slice(-MISSED_MAX)));
    setAnswered((n) => n + 1);
    setGoal((g) => {
      const cur = sanitizeGoal(g, dayKey());
      return { ...cur, count: cur.count + 1 };
    });
    setStats((prev) => {
      const row = prev[question.subject] ?? { seen: 0, right: 0 };
      return { ...prev, [question.subject]: { seen: row.seen + 1, right: row.right + (right ? 1 : 0) } };
    });
    if (right) {
      const nextStreak = streaks[who] + 1;
      const gain = 10 + Math.min(nextStreak, 10) * 2;
      setStreaks((s) => (who === 0 ? [nextStreak, s[1]] : [s[0], nextStreak]));
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrectCount((n) => n + 1);
      if (who === 0) setScore((s) => s + gain);
      else setP2((s) => s + gain);
    } else {
      setStreaks((s) => (who === 0 ? [0, s[1]] : [s[0], 0]));
      setMisses((list) =>
        list.some((m) => m.ref === question.ref && m.prompt === question.prompt)
          ? list
          : [...list, { ref: question.ref, prompt: question.prompt, why: question.why, subject: question.subject }],
      );
      if (mode === "challenge") setLives((h) => h - 1);
    }
  }

  function next() {
    if (choice === null || !question) return;
    if (ending) {
      finish();
      return;
    }
    setChoice(null);
    setHidden([]);
    setSerial((n) => n + 1);
    if (mode === "pass") setTurn((t) => (t === 0 ? 1 : 0));
    const upcoming = index + 1;
    if (limit === null && upcoming >= deck.length) {
      // Endless modes: start a fresh shuffled lap instead of running off the end of the deck.
      setDeck((d) => reshuffleDeck(d, question.id));
      setIndex(0);
    } else {
      setIndex(upcoming);
    }
  }

  function fiftyFifty() {
    if (choice !== null || lifeUsed || !question) return;
    const wrong = [0, 1, 2, 3].filter((i) => i !== question.answer);
    setHidden(shuffle(wrong).slice(0, 2));
    setLifeUsed(true);
  }

  keyRef.current = (e) => {
    if (screen !== "play" || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = document.activeElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return;
    if (choice === null && question) {
      const k = e.key.toLowerCase();
      const i = "1234".includes(k) && k.length === 1 ? Number(k) - 1 : "abcd".includes(k) && k.length === 1 ? k.charCodeAt(0) - 97 : -1;
      if (i >= 0) {
        e.preventDefault();
        pick(i);
      }
    } else if (choice !== null && e.key === "Enter" && !(el instanceof HTMLButtonElement)) {
      e.preventDefault();
      next();
    }
  };

  backRef.current = () => {
    if (drawerOpen) setDrawerOpen(false);
    else if (screen === "home") exitApp();
    else go("home");
  };

  async function share() {
    const total = mode === "pass" ? `${score} / ${p2}` : String(score);
    const base = isNative ? SITE_URL : window.location.origin + window.location.pathname;
    const link = mode === "duel" && duelSeed !== null ? `${base}#c=${duelSeed}.${score}` : "";
    const line = `${APP_NAME} — ${MODE_COPY[mode].label}: ${correctCount}/${answered} right, score ${total}.${link ? ` Beat my score: ${link}` : ""}`;
    const image = await renderCard({
      title: `${MODE_COPY[mode].label} complete`,
      big: total,
      lines: [`${correctCount} of ${answered} right`, dailyStreak > 0 ? `${dailyStreak}-day streak` : ""],
      footer: link ? "Can you beat my score?" : `${APP_NAME} · Bible quiz`,
    });
    const result = await shareResult(APP_NAME, line, image);
    setShareNote(result === "copied" ? "Copied to clipboard." : result === "failed" ? "Sharing isn’t available here." : "");
  }

  async function openClass(raw: string) {
    const quiz = await decodeQuiz(extractCode(raw));
    if (!quiz) {
      setJoinNote("That isn’t a valid class quiz link or code.");
      return;
    }
    setClassQuiz(quiz);
    setJoinNote("");
    setJoinText("");
  }

  async function shareClass() {
    if (custom.length === 0) {
      setEditorNote("Write at least one question first.");
      return;
    }
    const code = await encodeQuiz(teacherTitle, custom);
    if (!code) {
      setEditorNote("That is too long to share as a link. Try 20 questions or fewer.");
      return;
    }
    const base = isNative ? SITE_URL : window.location.origin + window.location.pathname;
    const name = teacherTitle.trim() || "Class quiz";
    const count = Math.min(custom.length, MAX_CLASS_QUESTIONS);
    const result = await shareText(APP_NAME, `${name} — ${count} question${count === 1 ? "" : "s"}. Open this link to play: ${base}#q=${code}`);
    setEditorNote(result === "copied" ? "Link copied. Send it to your class." : result === "failed" ? "Couldn’t share on this device." : "");
  }

  async function changeReminder(on: boolean, hour: number) {
    if (!on) {
      if (reminder.on) await setReminder(null);
      setReminderState({ on: false, hour });
      setReminderNote(reminder.on ? "Reminder off." : "");
      return;
    }
    const result = await setReminder(hour);
    if (result === "denied") {
      setReminderState({ on: false, hour });
      setReminderNote("Notifications are blocked for this app. Allow them in Android settings.");
    } else if (result === "failed") {
      setReminderNote("Couldn’t set the reminder on this device.");
    } else {
      setReminderState({ on: true, hour });
      setReminderNote(`Reminder set for ${hour}:00 every day.`);
    }
  }

  async function backup() {
    const data = { app: "didaskalia", version: 2, ...snapshot() };
    const result = await saveJsonFile("didaskalia-backup.json", JSON.stringify(data, null, 2));
    setBackupNote(result === "failed" ? "Couldn’t save the backup on this device." : "Backup created. Keep the file somewhere safe.");
  }

  function restore(file: File) {
    if (file.size > 2_000_000) {
      setBackupNote("That file is too large to be a backup.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setBackupNote("Couldn’t read that file.");
    reader.onload = () => {
      let d: Record<string, unknown>;
      try {
        d = JSON.parse(String(reader.result));
      } catch {
        setBackupNote("That file couldn’t be read.");
        return;
      }
      if (!d || (d.app !== "didaskalia" && d.app !== "the-word")) {
        setBackupNote("That isn’t a Didaskalia backup.");
        return;
      }
      if (!window.confirm("Replace the progress on this device with this backup?")) return;
      applyProgress(sanitizeProgress(d), true);
      setBackupNote("Progress restored.");
    };
    reader.readAsText(file);
  }

  function toggleMark(id: string) {
    setMarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSubject(subject: Subject) {
    setPicked((cur) => (cur.includes(subject) ? cur.filter((s) => s !== subject) : [...cur, subject]));
  }

  function resetProgress() {
    if (!window.confirm("Erase your scores, streaks and history on this device? Your saved and custom questions are kept.")) return;
    setBest(0);
    setStats({});
    setHistory([]);
    setDaily({ last: "", streak: 0, freeze: 0, week: "" });
    setBadges([]);
    setMissed([]);
  }

  /* ---------- custom questions ---------- */

  function addCustom() {
    const item = sanitizeQuestion({
      subject: draft.subject,
      prompt: draft.prompt,
      ref: draft.ref,
      choices: [draft.a, draft.b, draft.c, draft.d],
      answer: Number(draft.answer),
      why: draft.why,
    });
    if (!item) {
      setEditorNote("Fill in every field, and make each of the four choices different.");
      return;
    }
    setCustom((prev) => [...prev, item]);
    setDraft((cur) => ({ ...cur, prompt: "", ref: "", a: "", b: "", c: "", d: "", why: "" }));
    setEditorNote("Question saved.");
  }

  function removeCustom(id: string) {
    setCustom((prev) => prev.filter((q) => q.id !== id));
    setMarks((prev) => prev.filter((m) => m !== id));
  }

  async function exportCustom() {
    if (custom.length === 0) {
      setEditorNote("You haven’t written any questions yet.");
      return;
    }
    const result = await saveJsonFile("didaskalia-questions.json", JSON.stringify(custom, null, 2));
    setEditorNote(result === "failed" ? "Couldn’t export the file on this device." : "");
  }

  function importCustom(file: File) {
    if (file.size > 1_000_000) {
      setEditorNote("That file is too large to be a question list.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setEditorNote("Couldn’t read that file.");
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setEditorNote("That isn’t a valid question file.");
        return;
      }
      const incoming = sanitizeQuestions(parsed);
      const keyOf = (q: Question) => `${q.prompt}|${q.ref}`.toLowerCase();
      const have = new Set(bank.map(keyOf));
      const fresh = incoming.filter((q) => {
        const k = keyOf(q);
        if (have.has(k)) return false;
        have.add(k);
        return true;
      });
      if (fresh.length === 0) {
        setEditorNote(incoming.length === 0 ? "No usable questions found in that file." : "Those questions are already in your list.");
        return;
      }
      setCustom((prev) => [...prev, ...fresh]);
      setEditorNote(`Imported ${fresh.length} question${fresh.length === 1 ? "" : "s"}.`);
    };
    reader.readAsText(file);
  }

  /* ---------- library ---------- */

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bank.filter((q) => {
      if (savedOnly && !marks.includes(q.id)) return false;
      return (q.subject + " " + q.prompt + " " + q.ref).toLowerCase().includes(needle);
    });
  }, [bank, query, savedOnly, marks]);

  const totals = useMemo(() => {
    let seen = 0;
    let right = 0;
    for (const row of Object.values(stats)) {
      seen += row.seen;
      right += row.right;
    }
    return { seen, right, pct: seen ? Math.round((right / seen) * 100) : 0 };
  }, [stats]);

  const lvl = levelFor(totals.right);
  // A saved theme only applies while it is still unlocked.
  const activeTheme = THEMES.some((t) => t.id === theme && lvl.level >= t.level) ? theme : "classic";
  useEffect(() => {
    document.documentElement.dataset.theme = activeTheme;
  }, [activeTheme]);
  const playedToday = daily.last === today;
  const freezeOk = freezeReady(daily, today);
  const verse = verseOfDay(today);
  const stars = answered === 0 ? 0 : correctCount / answered >= 0.9 ? 3 : correctCount / answered >= 0.6 ? 2 : 1;
  const p1Wins = score > p2;
  const p2Wins = p2 > score;

  return {
    custom,
    setCustom,
    marks,
    setMarks,
    stats,
    setStats,
    history,
    setHistory,
    daily,
    setDaily,
    best,
    setBest,
    sound,
    setSound,
    badges,
    setBadges,
    newBadges,
    setNewBadges,
    reminder,
    setReminderState,
    reminderNote,
    setReminderNote,
    theme,
    setTheme,
    missed,
    setMissed,
    backupNote,
    setBackupNote,
    textSize,
    setTextSize,
    hostNotice,
    setHostNotice,
    classQuiz,
    setClassQuiz,
    teacherTitle,
    setTeacherTitle,
    joinText,
    setJoinText,
    joinNote,
    setJoinNote,
    rival,
    setRival,
    duelSeed,
    setDuelSeed,
    hidden,
    setHidden,
    lifeUsed,
    setLifeUsed,
    screen,
    setScreen,
    mode,
    setMode,
    picked,
    setPicked,
    query,
    setQuery,
    savedOnly,
    setSavedOnly,
    shown,
    setShown,
    deck,
    setDeck,
    limit,
    setLimit,
    index,
    setIndex,
    serial,
    setSerial,
    lives,
    setLives,
    score,
    setScore,
    p2,
    setP2,
    turn,
    setTurn,
    streaks,
    setStreaks,
    bestStreak,
    setBestStreak,
    choice,
    setChoice,
    answered,
    setAnswered,
    correctCount,
    setCorrectCount,
    misses,
    setMisses,
    seconds,
    setSeconds,
    newBest,
    setNewBest,
    shareNote,
    setShareNote,
    editorNote,
    setEditorNote,
    installEvent,
    setInstallEvent,
    draft,
    setDraft,
    bank,
    lookup,
    filtered,
    totals,
    begin,
    start,
    practice,
    finish,
    pick,
    next,
    fiftyFifty,
    share,
    openClass,
    shareClass,
    changeReminder,
    backup,
    restore,
    toggleMark,
    toggleSubject,
    resetProgress,
    addCustom,
    removeCustom,
    exportCustom,
    importCustom,
    reviewable,
    question,
    who,
    streak,
    ending,
    today,
    season,
    dailyStreak,
    lvl,
    activeTheme,
    playedToday,
    freezeOk,
    verse,
    stars,
    p1Wins,
    p2Wins,
    nextButton,
    user,
    onSignOut,
    drawerOpen,
    setDrawerOpen,
    profile,
    setProfile,
    goal: goalNow,
    goalPct,
    setGoalTarget,
    cloudReady,
    go,
    logout,
    renameMe,
    removeAccount,
    shareApp,
    weakest,
    studySubject,
    snapshot,
    applyProgress,
    isAdmin: profile.is_admin,
  };
}

export type Engine = ReturnType<typeof useEngine>;
