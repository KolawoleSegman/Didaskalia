import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Game from "./Game";
import { USER, nav, begin } from "./testUtils";
import { PACKS } from "./seasonal";
import { QUESTIONS, SUBJECTS } from "./questions";
import { currentSeason, easterDate } from "./lib/logic";

const click = (el: HTMLElement) => fireEvent.click(el);
beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("seasons", () => {
  it("computes Easter correctly", () => {
    expect(easterDate(2025)).toBe("2025-04-20");
    expect(easterDate(2026)).toBe("2026-04-05");
    expect(easterDate(2027)).toBe("2027-03-28");
    expect(easterDate(2038)).toBe("2038-04-25");
  });
  it("knows when each season is on, and what comes next", () => {
    expect(currentSeason("2026-12-25")).toEqual({ id: "christmas", active: true, daysUntil: 0 });
    expect(currentSeason("2027-01-06").active).toBe(true);
    expect(currentSeason("2026-04-01")).toMatchObject({ id: "easter", active: true }); // Easter is 5 April
    expect(currentSeason("2026-10-19")).toEqual({ id: "christmas", active: false, daysUntil: 43 });
    expect(currentSeason("2027-01-07")).toMatchObject({ id: "easter", active: false, daysUntil: 59 });
    expect(currentSeason("2026-04-13")).toMatchObject({ id: "christmas", active: false });
  });
  it("both packs are valid, with unique references", () => {
    for (const pack of Object.values(PACKS)) {
      expect(new Set(pack.map((q) => q.ref + q.prompt)).size).toBe(pack.length);
      for (const q of pack) {
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices[q.answer]).toBeTruthy();
      }
    }
  });
  it("the home screen offers the current season and plays its pack", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^play$/i);
    click(screen.getByRole("button", { name: /Christmas|Easter/ }));
    click(screen.getByRole("button", { name: /begin/i }));
    const prompts = new Set([...PACKS.christmas, ...PACKS.easter].map((q) => q.prompt));
    expect(prompts.has(screen.getByRole("heading", { level: 2 }).textContent!)).toBe(true);
  });
});

describe("celebration and trend", () => {
  const play = () => {
    begin("Tournament");
  };
  it("celebrates a perfect round with confetti, but not a round with nothing to celebrate", () => {
    const byPrompt = new Map(QUESTIONS.map((q) => [q.prompt, q]));
    const answer = (right: boolean) => {
      const q = byPrompt.get(screen.getByRole("heading", { level: 2 }).textContent!)!;
      const btns = within(screen.getByRole("list")).getAllByRole("button");
      click(btns.find((b) => b.textContent!.endsWith(q.choices[q.answer])) === undefined || right ? btns.find((b) => b.textContent!.endsWith(q.choices[q.answer]))! : btns.find((b) => !b.textContent!.endsWith(q.choices[q.answer]))!);
    };
    const round = (right: boolean) => {
      play();
      for (let i = 0; i < 10; i++) {
        answer(right);
        click(screen.getByRole("button", { name: /next word|see the round/i }));
      }
    };
    const { container } = render(<Game user={USER} onSignOut={() => {}} />);
    round(true);
    expect(container.querySelector(".confetti")).not.toBeNull();
    click(screen.getByRole("button", { name: /^home$/i }));
    round(false);
    expect(screen.getByRole("img", { name: "1 of 3 stars" })).toBeTruthy();
    expect(container.querySelector(".confetti")).toBeNull();
  });
  it("draws accuracy bars once there are two finished sessions", () => {
    const h = (c: number) => ({ mode: "sprint", score: c * 10, correct: c, answered: 10, at: `2026-10-0${c}T10:00:00.000Z` });
    localStorage.setItem("didaskalia-history-v1", JSON.stringify([h(3), h(8)]));
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^progress/i);
    expect(screen.getByRole("img", { name: /accuracy of your recent sessions/i }).children).toHaveLength(2);
  });
});

describe("question bank", () => {
  it("is large, well spread, and has no repeated references or prompts", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(125);
    for (const s of SUBJECTS) expect(QUESTIONS.filter((q) => q.subject === s).length).toBeGreaterThanOrEqual(6);
    expect(new Set(QUESTIONS.map((q) => q.ref)).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => q.prompt)).size).toBe(QUESTIONS.length);
  });
});
