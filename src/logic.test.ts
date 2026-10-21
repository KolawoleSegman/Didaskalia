import { describe, expect, it } from "vitest";
import { QUESTIONS, SUBJECTS } from "./questions";
import { splitVerse, verseQuestions } from "./lib/verseQuiz";
import { VERSES } from "./verses";
import { WHO_AM_I } from "./whoAmI";
import { decodeQuiz, encodeQuiz, extractCode, MAX_CLASS_QUESTIONS } from "./lib/classQuiz";
import { vi } from "vitest";
import {
  dayKey, daySeed, levelFor, earnedBadges, weekKey, liveDailyStreak, nextDaily, prepare, previousDayKey, reshuffleDeck,
  sanitizeDaily, sanitizeHistory, sanitizeQuestion, sanitizeQuestions, sanitizeStats, seeded, shuffleSeeded,
} from "./lib/logic";

describe("question bank", () => {
  it("is internally consistent", () => {
    const ids = new Set(QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(SUBJECTS).toContain(q.subject);
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices.map((c) => c.toLowerCase())).size).toBe(4);
      expect([0, 1, 2, 3]).toContain(q.answer);
      expect(q.prompt && q.ref && q.why).toBeTruthy();
    }
  });
});

describe("prepare (choice shuffling)", () => {
  it("always keeps the correct answer pointing at the correct text", () => {
    for (const q of QUESTIONS) {
      for (let n = 0; n < 20; n++) {
        const p = prepare(q);
        expect(p.choices[p.answer]).toBe(q.choices[q.answer]);
        expect([...p.choices].sort()).toEqual([...q.choices].sort());
      }
    }
  });
  it("removes the 'always B' tell", () => {
    const counts = [0, 0, 0, 0];
    for (let n = 0; n < 40; n++) for (const q of QUESTIONS) counts[prepare(q).answer]++;
    const total = counts.reduce((a, b) => a + b, 0);
    for (const c of counts) expect(c / total).toBeGreaterThan(0.2); // fair share is 0.25
  });
});

describe("reshuffleDeck", () => {
  it("keeps every question and never opens with the one just played", () => {
    const deck = QUESTIONS.slice(0, 6);
    for (let n = 0; n < 200; n++) {
      const next = reshuffleDeck(deck, deck[0].id);
      expect(next.map((q) => q.id).sort()).toEqual(deck.map((q) => q.id).sort());
      expect(next[0].id).not.toBe(deck[0].id);
    }
  });
});

describe("daily", () => {
  it("seeded shuffle is deterministic", () => {
    const a = shuffleSeeded(QUESTIONS, daySeed("2026-10-16")).slice(0, 10).map((q) => q.id);
    const b = shuffleSeeded(QUESTIONS, daySeed("2026-10-16")).slice(0, 10).map((q) => q.id);
    const c = shuffleSeeded(QUESTIONS, daySeed("2026-10-17")).slice(0, 10).map((q) => q.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(seeded(1)()).toBe(seeded(1)());
  });
  it("uses the local calendar day, including across month and year ends", () => {
    expect(dayKey(new Date(2026, 9, 16, 0, 30))).toBe("2026-10-16");
    expect(dayKey(new Date(2026, 9, 16, 23, 59))).toBe("2026-10-16");
    expect(previousDayKey(new Date(2026, 2, 1))).toBe("2026-02-28");
    expect(previousDayKey(new Date(2027, 0, 1))).toBe("2026-12-31");
  });
});

describe("sanitizing stored / imported data", () => {
  const good = { subject: "Grace", prompt: "P?", ref: "Rom 1:1", choices: ["a", "b", "c", "d"], answer: 2, why: "Because." };
  it("accepts a good question and gives it a safe custom id", () => {
    const q = sanitizeQuestion({ ...good, id: "sal-1" })!;
    expect(q.id.startsWith("custom-")).toBe(true);
    expect(q.answer).toBe(2);
  });
  it("rejects bad shapes", () => {
    for (const bad of [null, 5, "x", {}, { ...good, choices: ["a", "b", "c"] }, { ...good, choices: ["a", "a", "c", "d"] },
      { ...good, choices: ["a", "b", "", "d"] }, { ...good, answer: 4 }, { ...good, answer: -1 }, { ...good, answer: 1.5 },
      { ...good, prompt: "  " }, { ...good, why: undefined }]) {
      expect(sanitizeQuestion(bad)).toBeNull();
    }
  });
  it("coerces an unknown subject and keeps ids unique", () => {
    expect(sanitizeQuestion({ ...good, subject: "Nope" })!.subject).toBe("Faith");
    const list = sanitizeQuestions([{ ...good, id: "custom-x" }, { ...good, id: "custom-x" }], true);
    expect(new Set(list.map((q) => q.id)).size).toBe(2);
  });
  it("survives junk", () => {
    expect(sanitizeQuestions("nope")).toEqual([]);
    expect(sanitizeStats(null)).toEqual({});
    expect(sanitizeStats({ Faith: { seen: 2, right: 9 }, Bad: 7 })).toEqual({ Faith: { seen: 2, right: 2 } });
    expect(sanitizeHistory([{ mode: "x" }, { mode: "sprint", score: 5, correct: 1, answered: 2, at: "t" }])).toHaveLength(1);
    expect(sanitizeDaily("zzz")).toEqual({ last: "", streak: 0, freeze: 0, week: "" });
  });
});

describe("levels", () => {
  it("climbs with correct answers", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, name: "Seeker", toNext: 25, pct: 0 });
    expect(levelFor(25)).toMatchObject({ level: 2, name: "Learner" });
    expect(levelFor(9999)).toMatchObject({ name: "Elder", next: null, pct: 100 });
  });
});

describe("streak with weekly freeze", () => {
  const d = (last: string, streak: number, freeze = 0, week = "") => ({ last, streak, freeze, week });
  it("counts once per day and grows on consecutive days", () => {
    expect(nextDaily(d("", 0), "2026-10-14")).toMatchObject({ last: "2026-10-14", streak: 1 });
    expect(nextDaily(d("2026-10-14", 4, 1, weekKey("2026-10-14")), "2026-10-15").streak).toBe(5);
    const same = d("2026-10-15", 5, 1, "w");
    expect(nextDaily(same, "2026-10-15")).toBe(same);
  });
  it("one freeze forgives exactly one missed day, then is spent for the week", () => {
    const wk = weekKey("2026-10-15"); // Mon 2026-10-12
    const after = nextDaily(d("2026-10-13", 4, 1, wk), "2026-10-15"); // missed the 14th
    expect(after).toMatchObject({ streak: 5, freeze: 0 });
    expect(nextDaily(d("2026-10-13", 4, 0, wk), "2026-10-15").streak).toBe(1); // no freeze left
    expect(nextDaily(d("2026-10-10", 9, 1, weekKey("2026-10-10")), "2026-10-14").streak).toBe(1); // missed 3 days
  });
  it("freeze refills on a new week and the displayed streak respects it", () => {
    expect(weekKey("2026-10-18")).toBe("2026-10-12"); // Sunday belongs to the week starting Monday
    expect(weekKey("2026-10-19")).toBe("2026-10-19");
    expect(nextDaily(d("2026-10-18", 3, 0, "2026-10-12"), "2026-10-19").freeze).toBe(1);
    const now = new Date(2026, 9, 15);
    expect(liveDailyStreak(d("2026-10-13", 4, 1, weekKey("2026-10-13")), now)).toBe(4);
    expect(liveDailyStreak(d("2026-10-13", 4, 0, weekKey("2026-10-13")), now)).toBe(0);
    expect(liveDailyStreak(d("2026-10-10", 4, 1, "x"), now)).toBe(0);
  });
});

describe("badges", () => {
  const base = { totalCorrect: 0, sessions: 0, dailyStreak: 0, perfect: false, duel: false, stats: {} };
  it("awards by milestone", () => {
    expect(earnedBadges(base)).toEqual([]);
    expect(earnedBadges({ ...base, sessions: 1, dailyStreak: 7, perfect: true, duel: true, totalCorrect: 100 }).sort())
      .toEqual(["duelist", "first-round", "hundred", "perfect", "streak-3", "streak-7"].sort());
  });
  it("masters a subject with 10+ right at 80%", () => {
    expect(earnedBadges({ ...base, stats: { Grace: { seen: 12, right: 10 } } })).toContain("master-Grace");
    expect(earnedBadges({ ...base, stats: { Grace: { seen: 20, right: 10 } } })).not.toContain("master-Grace");
  });
});

describe("finish the verse", () => {
  it("splits every verse so head + tail rebuilds it exactly", () => {
    for (const v of VERSES) {
      const [a, b] = splitVerse(v.text);
      expect(`${a} ${b}`).toBe(v.text);
      expect(a.split(" ").length).toBeGreaterThanOrEqual(3);
      expect(b.split(" ").length).toBeGreaterThanOrEqual(3);
    }
  });
  it("builds valid questions whose right answer completes the verse", () => {
    for (let n = 0; n < 20; n++) {
      for (const q of verseQuestions()) {
        const verse = VERSES.find((v) => v.ref === q.ref)!;
        expect(verse.text.endsWith(q.choices[q.answer])).toBe(true);
        expect(new Set(q.choices).size).toBe(4);
      }
    }
  });
});

describe("class quiz codes", () => {
  const mk = (n: number) => QUESTIONS.slice(0, n).map((q, i) => ({ ...q, id: `custom-${i}` }));
  it("round-trips a quiz exactly, compressed or not", async () => {
    for (const noCompression of [false, true]) {
      if (noCompression) vi.stubGlobal("CompressionStream", undefined);
      const code = (await encodeQuiz("Sunday School", mk(5)))!;
      expect(code[0]).toBe(noCompression ? "r" : "z");
      const quiz = (await decodeQuiz(code))!;
      expect(quiz.title).toBe("Sunday School");
      expect(quiz.questions.map((q) => [q.prompt, q.choices[q.answer]])).toEqual(mk(5).map((q) => [q.prompt, q.choices[q.answer]]));
      vi.unstubAllGlobals();
    }
  });
  it("accepts a whole link, and rejects junk and tampered codes", async () => {
    const code = (await encodeQuiz("T", mk(2)))!;
    expect(extractCode(`https://excellenteaser.com/#q=${code}`)).toBe(code);
    for (const bad of ["", "zzzz", "r", "x123", "rnotbase64!!", "r" + btoa("{}"), "r" + btoa('{"q":[{"p":"x"}]}')]) expect(await decodeQuiz(bad)).toBeNull();
  });
  it("caps the size of a quiz", async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ ...QUESTIONS[i % QUESTIONS.length], id: `custom-${i}` }));
    const quiz = (await decodeQuiz((await encodeQuiz("Big", many))!))!;
    expect(quiz.questions.length).toBeLessThanOrEqual(MAX_CLASS_QUESTIONS);
  });
});

describe("Who am I?", () => {
  it("has valid, distinct, uniquely-identified questions", () => {
    expect(new Set(WHO_AM_I.map((q) => q.id)).size).toBe(WHO_AM_I.length);
    for (const q of WHO_AM_I) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      expect(q.prompt.startsWith("Who am I?")).toBe(true);
      expect(q.choices[q.answer]).toBeTruthy();
    }
  });
});
