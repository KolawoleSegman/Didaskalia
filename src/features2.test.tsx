import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Game from "./Game";
import { USER, nav, begin } from "./testUtils";
import Memorize from "./components/Memorize";
import { ORDER_QUESTIONS } from "./orderQuiz";
import { memoryCounts, nextMemory, reviewMemory, sanitizeMemory, shiftDay } from "./lib/logic";
import { VERSES } from "./verses";

const click = (el: HTMLElement) => fireEvent.click(el);
beforeEach(() => { localStorage.clear(); document.documentElement.style.fontSize = ""; });
afterEach(cleanup);

describe("memorization (spaced repetition)", () => {
  const refs = ["A", "B", "C"];
  it("brings weak and new verses first, spaces out known ones, repeats misses today", () => {
    expect(nextMemory(refs, {}, "2026-10-19")).toBe("A");
    let s = reviewMemory({}, "A", true, "2026-10-19"); // box 1: back in 1 day
    expect(s.A).toEqual({ box: 1, due: "2026-10-20" });
    expect(nextMemory(refs, s, "2026-10-19")).toBe("B");
    expect(nextMemory(refs, s, "2026-10-20")).toBe("B"); // new verse (box 0) before the due box-1 one
    s = reviewMemory(s, "A", true, "2026-10-20"); // box 2: 3 days
    expect(s.A.due).toBe(shiftDay("2026-10-20", 3));
    s = reviewMemory(s, "A", false, "2026-10-21"); // forgot: back to box 0, due today
    expect(s.A).toEqual({ box: 0, due: "2026-10-21" });
  });
  it("does not show the same verse twice in a row while others are due, and finishes cleanly", () => {
    expect(nextMemory(refs, {}, "2026-10-19", "A")).toBe("B");
    expect(nextMemory(["A"], {}, "2026-10-19", "A")).toBe("A");
    const done = Object.fromEntries(refs.map((r) => [r, { box: 3, due: "2026-11-30" }]));
    expect(nextMemory(refs, done, "2026-10-19")).toBeNull();
    expect(memoryCounts(refs, done, "2026-10-19")).toEqual({ total: 3, due: 0, learned: 3 });
  });
  it("ignores corrupt saved data", () => {
    expect(sanitizeMemory({ A: { box: 99, due: "2026-10-19" }, B: { box: 1, due: "tomorrow" }, C: 5, D: null })).toEqual({ A: { box: 5, due: "2026-10-19" } });
    expect(sanitizeMemory("junk")).toEqual({});
  });
  it("the screen walks through a verse and saves progress", () => {
    render(<Memorize />);
    expect(screen.getByText(new RegExp(`0 of ${VERSES.length} learned`))).toBeTruthy();
    click(screen.getByRole("button", { name: /show the verse/i }));
    click(screen.getByRole("button", { name: /i knew it/i }));
    const saved = JSON.parse(localStorage.getItem("didaskalia-memory-v1")!);
    expect(Object.keys(saved)).toHaveLength(1);
    expect(screen.getByText(new RegExp(`0 of ${VERSES.length} learned · ${VERSES.length - 1} due today`))).toBeTruthy();
  });
});

describe("timeline quiz", () => {
  it("has valid questions with unique ids and references", () => {
    expect(new Set(ORDER_QUESTIONS.map((q) => q.ref)).size).toBe(ORDER_QUESTIONS.length);
    for (const q of ORDER_QUESTIONS) {
      expect(new Set(q.choices).size).toBe(4);
      expect(q.prompt).toMatch(/FIRST|LAST/);
    }
  });
  it("plays all ten questions", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Timeline");
    for (let i = 0; i < 10; i++) {
      expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/happened (FIRST|LAST)/);
      click(within(screen.getByRole("list")).getAllByRole("button")[0]);
      click(screen.getByRole("button", { name: /next word|see the round/i }));
    }
    expect(screen.getByText(/timeline complete/i)).toBeTruthy();
  });
});

describe("text size", () => {
  it("scales the whole app and is remembered", () => {
    const first = render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^settings/i);
    click(screen.getByRole("button", { name: "Large" }));
    expect(document.documentElement.style.fontSize).toBe("112.5%");
    first.unmount();
    document.documentElement.style.fontSize = "";
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(document.documentElement.style.fontSize).toBe("112.5%");
    expect(VERSES.length).toBeGreaterThan(0);
  });
});
