import { SUBJECTS, type Question, type Subject } from "../questions";

export const MODES = ["challenge", "study", "sprint", "tournament", "daily", "pass", "duel", "verse", "class", "who", "review", "order", "season"] as const;
export type Mode = (typeof MODES)[number];

export type Stats = Record<string, { seen: number; right: number }>;
export type Session = { mode: Mode; score: number; correct: number; answered: number; at: string };
export type Daily = { last: string; streak: number; freeze: number; week: string };

/* ---------- randomness ---------- */

export function shuffle<T>(list: readonly T[], rand: () => number = Math.random): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Small deterministic PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleSeeded<T>(list: readonly T[], seed: number): T[] {
  return shuffle(list, seeded(seed));
}

/**
 * Returns a copy of the question with its four choices in random order and the
 * `answer` index remapped. The authored data has the right answer in position B
 * for most questions, so without this a player could win by always tapping B.
 */
export function prepare(q: Question, rand: () => number = Math.random): Question {
  const order = shuffle([0, 1, 2, 3], rand);
  return {
    ...q,
    choices: order.map((i) => q.choices[i]) as Question["choices"],
    answer: order.indexOf(q.answer) as Question["answer"],
  };
}

/** Fresh random order for an endless deck, never opening with the question just played. */
export function reshuffleDeck(deck: readonly Question[], lastId: string, rand: () => number = Math.random): Question[] {
  const next = shuffle(deck, rand).map((q) => prepare(q, rand));
  if (next.length > 1 && next[0].id === lastId) [next[0], next[1]] = [next[1], next[0]];
  return next;
}

/* ---------- dates (the player's local calendar day) ---------- */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function previousDayKey(d: Date = new Date()): string {
  const prev = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  return dayKey(prev);
}

export function daySeed(day: string): number {
  let h = 2166136261;
  for (const c of day) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const parseDay = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export function shiftDay(key: string, delta: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + delta);
  return dayKey(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);
}
/** Monday of the week containing `key`; the streak freeze refills when this changes. */
export function weekKey(key: string): string {
  const d = parseDay(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(d);
}
/** Is a streak freeze available on this day (one per week)? */
export function freezeReady(daily: Daily, today: string): boolean {
  return (daily.week === weekKey(today) ? daily.freeze : 1) > 0;
}

/** Streak to display: it survives yesterday, and one missed day if a freeze is ready. */
export function liveDailyStreak(daily: Daily, now: Date = new Date()): number {
  if (!daily.last) return 0;
  const today = dayKey(now);
  const gap = daysBetween(daily.last, today);
  if (gap <= 1) return daily.streak;
  return gap === 2 && freezeReady(daily, today) ? daily.streak : 0;
}

export function nextDaily(prev: Daily, today: string): Daily {
  if (prev.last === today) return prev;
  const week = weekKey(today);
  const freeze = prev.week === week ? prev.freeze : 1;
  const gap = prev.last ? daysBetween(prev.last, today) : 99;
  if (gap === 1) return { last: today, streak: prev.streak + 1, freeze, week };
  if (gap === 2 && freeze > 0) return { last: today, streak: prev.streak + 1, freeze: freeze - 1, week };
  return { last: today, streak: 1, freeze, week };
}

/* ---------- validation of anything read from storage or imported ---------- */

export function newCustomId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Validates one question. Returns null when it is unusable (missing fields,
 * not exactly four distinct choices, answer outside 0-3). Custom questions
 * always carry a `custom-` id so they can never collide with built-in ones.
 */
export function sanitizeQuestion(raw: unknown, keepId = false): Question | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const prompt = text(o.prompt, 400);
  const ref = text(o.ref, 80);
  const why = text(o.why, 1000);
  const choices = Array.isArray(o.choices) ? o.choices.map((c) => text(c, 200)) : [];
  if (!prompt || !ref || !why || choices.length !== 4 || choices.some((c) => !c)) return null;
  if (new Set(choices.map((c) => c.toLowerCase())).size !== 4) return null;
  const answer = Number(o.answer);
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) return null;
  const subject: Subject = SUBJECTS.includes(o.subject as Subject) ? (o.subject as Subject) : "Faith";
  const id = keepId && typeof o.id === "string" && o.id.startsWith("custom-") ? o.id : newCustomId();
  return { id, subject, prompt, ref, choices: choices as Question["choices"], answer: answer as Question["answer"], why };
}

export function sanitizeQuestions(raw: unknown, keepIds = false, max = 500): Question[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const item of raw) {
    const q = sanitizeQuestion(item, keepIds);
    if (!q) continue;
    if (seen.has(q.id)) q.id = newCustomId();
    seen.add(q.id);
    out.push(q);
    if (out.length >= max) break;
  }
  return out;
}

const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

export function sanitizeBest(raw: unknown): number {
  return count(raw);
}

export function sanitizeStats(raw: unknown): Stats {
  const out: Stats = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [subject, row] of Object.entries(raw as Record<string, unknown>)) {
    if (!row || typeof row !== "object") continue;
    const seen = count((row as { seen?: unknown }).seen);
    const right = Math.min(count((row as { right?: unknown }).right), seen);
    out[subject] = { seen, right };
  }
  return out;
}

export function sanitizeMarks(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

export function sanitizeHistory(raw: unknown, max = 12): Session[] {
  if (!Array.isArray(raw)) return [];
  const out: Session[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    if (!MODES.includes(s.mode as Mode) || typeof s.at !== "string") continue;
    out.push({ mode: s.mode as Mode, score: count(s.score), correct: count(s.correct), answered: count(s.answered), at: s.at });
    if (out.length >= max) break;
  }
  return out;
}

export function sanitizeDaily(raw: unknown): Daily {
  if (!raw || typeof raw !== "object") return { last: "", streak: 0, freeze: 0, week: "" };
  const d = raw as Record<string, unknown>;
  return { last: typeof d.last === "string" ? d.last : "", streak: count(d.streak), freeze: Math.min(1, count(d.freeze)), week: typeof d.week === "string" ? d.week : "" };
}

/* ---------- levels ---------- */

const LEVELS = [[0, "Seeker"], [25, "Learner"], [75, "Disciple"], [150, "Scholar"], [300, "Teacher"], [500, "Elder"]] as const;

export function levelFor(correct: number) {
  let i = 0;
  LEVELS.forEach(([n], k) => {
    if (correct >= n) i = k;
  });
  const cur = LEVELS[i];
  const nxt = LEVELS[i + 1];
  return {
    level: i + 1,
    name: cur[1] as string,
    next: nxt ? (nxt[1] as string) : null,
    toNext: nxt ? nxt[0] - correct : 0,
    pct: nxt ? Math.round(((correct - cur[0]) / (nxt[0] - cur[0])) * 100) : 100,
  };
}

/* ---------- badges ---------- */

const BASE_BADGES: [string, string, string][] = [
  ["first-round", "First Steps", "Finish your first round"],
  ["streak-3", "On Fire", "Play the Daily 3 days in a row"],
  ["streak-7", "Faithful Week", "Keep a 7-day streak"],
  ["streak-30", "Steadfast", "Keep a 30-day streak"],
  ["perfect", "Perfect Round", "Answer every question right in a round of 5 or more"],
  ["hundred", "Hundred Strong", "Get 100 answers right in total"],
  ["duelist", "Duelist", "Finish a friend challenge"],
  ["five-hundred", "Five Hundred", "Get 500 answers right in total"],
  ["explorer", "Explorer", "Finish 5 different game modes"],
];
export const BADGES: Record<string, { name: string; hint: string }> = {
  ...Object.fromEntries(BASE_BADGES.map(([id, name, hint]) => [id, { name, hint }])),
  ...Object.fromEntries(SUBJECTS.map((s) => [`master-${s}`, { name: `Master of ${s}`, hint: `Get 10 right in ${s} with 80% accuracy` }])),
};
export const allBadgeIds = () => Object.keys(BADGES);

export function earnedBadges(s: { totalCorrect: number; sessions: number; dailyStreak: number; perfect: boolean; duel: boolean; stats: Stats; modesTried?: number }): string[] {
  const out: string[] = [];
  if (s.sessions >= 1) out.push("first-round");
  if (s.dailyStreak >= 3) out.push("streak-3");
  if (s.dailyStreak >= 7) out.push("streak-7");
  if (s.dailyStreak >= 30) out.push("streak-30");
  if (s.perfect) out.push("perfect");
  if (s.totalCorrect >= 100) out.push("hundred");
  if (s.duel) out.push("duelist");
  if (s.totalCorrect >= 500) out.push("five-hundred");
  if ((s.modesTried ?? 0) >= 5) out.push("explorer");
  for (const subject of SUBJECTS) {
    const row = s.stats[subject];
    if (row && row.right >= 10 && row.right / row.seen >= 0.8) out.push(`master-${subject}`);
  }
  return out;
}

export function sanitizeBadges(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string" && x in BADGES) : [];
}

/* ---------- verse memorization (Leitner boxes) ---------- */

export type MemoryState = Record<string, { box: number; due: string }>;
export const MEMORY_INTERVALS = [0, 1, 3, 7, 14, 30]; // days until a verse comes back, by box
export const MEMORY_LEARNED_BOX = 3;

export function sanitizeMemory(raw: unknown): MemoryState {
  const out: MemoryState = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [ref, v] of Object.entries(raw as Record<string, unknown>)) {
    const row = v as { box?: unknown; due?: unknown } | null;
    if (!row || typeof row.due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.due)) continue;
    out[ref] = { box: Math.min(MEMORY_INTERVALS.length - 1, count(row.box)), due: row.due };
  }
  return out;
}

/** Knew it: move up a box and wait longer. Didn't: back to box 0, due again today. */
export function reviewMemory(state: MemoryState, ref: string, knew: boolean, today: string): MemoryState {
  const box = knew ? Math.min((state[ref]?.box ?? 0) + 1, MEMORY_INTERVALS.length - 1) : 0;
  return { ...state, [ref]: { box, due: shiftDay(today, MEMORY_INTERVALS[box]) } };
}

/** Next verse to practise: due ones first (weakest box first), brand-new ones count as due. Avoids repeating `skip` when possible. */
export function nextMemory(refs: string[], state: MemoryState, today: string, skip?: string): string | null {
  const due = refs
    .map((ref, i) => ({ ref, i, box: state[ref]?.box ?? 0, isDue: !state[ref] || state[ref].due <= today }))
    .filter((v) => v.isDue)
    .sort((a, b) => a.box - b.box || a.i - b.i);
  const pick = due.find((v) => v.ref !== skip) ?? due[0];
  return pick ? pick.ref : null;
}

export function memoryCounts(refs: string[], state: MemoryState, today: string) {
  return {
    total: refs.length,
    due: refs.filter((r) => !state[r] || state[r].due <= today).length,
    learned: refs.filter((r) => (state[r]?.box ?? 0) >= MEMORY_LEARNED_BOX).length,
  };
}

/* ---------- seasons ---------- */

/** Western (Gregorian) Easter Sunday as YYYY-MM-DD. */
export function easterDate(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Christmas runs Dec 1 to Jan 6; Easter from three weeks before to a week after. Otherwise: whichever starts next. */
export function currentSeason(today: string): { id: "christmas" | "easter"; active: boolean; daysUntil: number } {
  const y = Number(today.slice(0, 4));
  const events: { id: "christmas" | "easter"; start: string; end: string }[] = [];
  for (const yr of [y - 1, y, y + 1]) {
    events.push({ id: "christmas", start: `${yr}-12-01`, end: `${yr + 1}-01-06` });
    const e = easterDate(yr);
    events.push({ id: "easter", start: shiftDay(e, -21), end: shiftDay(e, 7) });
  }
  const on = events.find((e) => e.start <= today && today <= e.end);
  if (on) return { id: on.id, active: true, daysUntil: 0 };
  const next = events.filter((e) => e.start > today).sort((a, b) => (a.start < b.start ? -1 : 1))[0];
  return { id: next.id, active: false, daysUntil: daysBetween(today, next.start) };
}


/* ---------- daily goal ---------- */

export const GOAL_TARGETS = [5, 10, 20, 30] as const;
export type Goal = { day: string; count: number; target: number };

export function sanitizeGoal(raw: unknown, today: string): Goal {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const target = GOAL_TARGETS.includes(o.target as 5) ? (o.target as number) : 10;
  // The count belongs to one day; a new day starts at zero but keeps the chosen target.
  return { day: today, count: o.day === today ? Math.min(count(o.count), 9999) : 0, target };
}

/* ---------- progress that follows the account (cloud sync) and also forms the backup file ---------- */

export type Progress = {
  best: number; stats: Stats; marks: string[]; custom: Question[]; history: Session[]; daily: Daily;
  badges: string[]; theme: string; missed: string[]; memory: MemoryState;
};

export function sanitizeProgress(raw: unknown): Progress {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    best: sanitizeBest(d.best),
    stats: sanitizeStats(d.stats),
    marks: sanitizeMarks(d.marks),
    custom: sanitizeQuestions(d.custom, true),
    history: sanitizeHistory(d.history, 12),
    daily: sanitizeDaily(d.daily),
    badges: sanitizeBadges(d.badges),
    theme: typeof d.theme === "string" ? d.theme : "classic",
    missed: sanitizeMarks(d.missed).slice(-60),
    memory: sanitizeMemory(d.memory),
  };
}

const union = <T,>(a: readonly T[], b: readonly T[]) => [...new Set([...a, ...b])];

/**
 * Combines progress from this device with progress saved in the account, so nothing is lost when someone plays on
 * two phones. Scores and streaks keep the better value; lists are joined; the device's own theme wins.
 */
export function mergeProgress(local: Progress, cloud: Progress): Progress {
  const stats: Stats = { ...cloud.stats };
  for (const [subject, row] of Object.entries(local.stats)) {
    if (!stats[subject] || row.seen >= stats[subject].seen) stats[subject] = row;
  }
  const customIds = new Set<string>();
  const custom = [...local.custom, ...cloud.custom].filter((q) => (customIds.has(q.id) ? false : (customIds.add(q.id), true))).slice(0, 500);
  const seenRuns = new Set<string>();
  const history = [...local.history, ...cloud.history]
    .filter((h) => { const k = `${h.at}|${h.mode}|${h.score}`; return seenRuns.has(k) ? false : (seenRuns.add(k), true); })
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 12);
  const daily = local.daily.last > cloud.daily.last || (local.daily.last === cloud.daily.last && local.daily.streak >= cloud.daily.streak) ? local.daily : cloud.daily;
  const memory: MemoryState = { ...cloud.memory };
  for (const [ref, row] of Object.entries(local.memory)) {
    const other = memory[ref];
    if (!other || row.box > other.box || (row.box === other.box && row.due > other.due)) memory[ref] = row;
  }
  return {
    best: Math.max(local.best, cloud.best),
    stats,
    marks: union(local.marks, cloud.marks),
    custom,
    history,
    daily,
    badges: union(local.badges, cloud.badges),
    theme: local.theme,
    missed: union(local.missed, cloud.missed).slice(-60),
    memory,
  };
}

/** True when there is nothing worth keeping on this device (a brand-new install). */
export const isBlankProgress = (p: Progress): boolean =>
  p.best === 0 && Object.keys(p.stats).length === 0 && p.history.length === 0 && p.custom.length === 0 && p.marks.length === 0 && Object.keys(p.memory).length === 0;
