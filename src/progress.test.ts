import { describe, expect, it } from "vitest";
import { GOAL_TARGETS, isBlankProgress, mergeProgress, sanitizeGoal, sanitizeProgress, earnedBadges } from "./lib/logic";

const blank = () => sanitizeProgress({});

describe("progress that follows the account", () => {
  it("a brand-new device is blank, and sanitizing junk gives a safe blank", () => {
    expect(isBlankProgress(blank())).toBe(true);
    expect(sanitizeProgress("junk")).toEqual(blank());
    expect(isBlankProgress(sanitizeProgress({ best: 10 }))).toBe(false);
  });

  it("merging keeps the better of both devices and loses nothing", () => {
    const phone = sanitizeProgress({
      best: 120, theme: "royal", marks: ["a"], missed: ["m1"], badges: ["first-round"],
      stats: { Faith: { seen: 10, right: 8 }, Grace: { seen: 2, right: 1 } },
      daily: { streak: 3, last: "2026-10-20", freezeWeek: "" },
      history: [{ mode: "sprint", score: 50, correct: 5, answered: 10, at: "2026-10-20T10:00:00.000Z" }],
      memory: { "John 3:16": { box: 2, due: "2026-10-25" } },
    });
    const cloud = sanitizeProgress({
      best: 200, theme: "midnight", marks: ["b", "a"], missed: ["m2"], badges: ["perfect"],
      stats: { Faith: { seen: 4, right: 4 }, Hope: { seen: 5, right: 5 } },
      daily: { streak: 9, last: "2026-10-21", freezeWeek: "" },
      history: [{ mode: "daily", score: 90, correct: 9, answered: 10, at: "2026-10-21T08:00:00.000Z" }],
      memory: { "John 3:16": { box: 4, due: "2026-11-01" }, "Psalm 23:1": { box: 1, due: "2026-10-22" } },
    });
    const m = mergeProgress(phone, cloud);
    expect(m.best).toBe(200);
    expect(m.theme).toBe("royal"); // this device's own look wins
    expect([...m.marks].sort()).toEqual(["a", "b"]);
    expect([...m.missed].sort()).toEqual(["m1", "m2"]);
    expect([...m.badges].sort()).toEqual(["first-round", "perfect"]);
    expect(m.stats.Faith).toEqual({ seen: 10, right: 8 }); // the longer record, not a double count
    expect(Object.keys(m.stats).sort()).toEqual(["Faith", "Grace", "Hope"]);
    expect(m.daily.streak).toBe(9);
    expect(m.history.map((h) => h.mode)).toEqual(["daily", "sprint"]); // newest first
    expect(m.memory["John 3:16"].box).toBe(4);
    expect(Object.keys(m.memory)).toHaveLength(2);
  });

  it("merging the same progress twice changes nothing", () => {
    const p = sanitizeProgress({ best: 50, marks: ["x"], stats: { Faith: { seen: 3, right: 2 } }, history: [{ mode: "sprint", score: 1, correct: 1, answered: 2, at: "2026-10-01T00:00:00.000Z" }] });
    expect(mergeProgress(p, p)).toEqual(p);
  });
});

describe("daily goal", () => {
  it("keeps today's count, starts a new day at zero, and falls back to 10 for a bad target", () => {
    expect(sanitizeGoal({ day: "2026-10-21", count: 7, target: 20 }, "2026-10-21")).toEqual({ day: "2026-10-21", count: 7, target: 20 });
    expect(sanitizeGoal({ day: "2026-10-20", count: 7, target: 20 }, "2026-10-21")).toEqual({ day: "2026-10-21", count: 0, target: 20 });
    expect(sanitizeGoal({ target: 3, count: -4 }, "2026-10-21").target).toBe(10);
    expect(sanitizeGoal("junk", "2026-10-21")).toEqual({ day: "2026-10-21", count: 0, target: 10 });
    expect(GOAL_TARGETS).toContain(10);
  });
});

describe("new badges", () => {
  const base = { totalCorrect: 0, sessions: 0, dailyStreak: 0, perfect: false, duel: false, stats: {} };
  it("awards Five Hundred and Explorer", () => {
    expect(earnedBadges({ ...base, totalCorrect: 499 })).not.toContain("five-hundred");
    expect(earnedBadges({ ...base, totalCorrect: 500 })).toContain("five-hundred");
    expect(earnedBadges({ ...base, modesTried: 4 })).not.toContain("explorer");
    expect(earnedBadges({ ...base, modesTried: 5 })).toContain("explorer");
  });
});
