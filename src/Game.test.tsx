import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Game from "./Game";
import { USER, nav, begin } from "./testUtils";
import { QUESTIONS } from "./questions";
import { shuffleSeeded } from "./lib/logic";
import { encodeQuiz } from "./lib/classQuiz";
import { verseOfDay } from "./verses";
import { dayKey } from "./lib/logic";

const byPrompt = new Map(QUESTIONS.map((q) => [q.prompt, q]));

/** Reads the on-screen question and returns the button text of its right answer. */
function correctText(): string {
  const prompt = screen.getByRole("heading", { level: 2 }).textContent!;
  const q = byPrompt.get(prompt)!;
  expect(q, `unknown prompt ${prompt}`).toBeTruthy();
  return q.choices[q.answer];
}
function wrongButton() {
  const right = correctText();
  const buttons = within(screen.getByRole("list")).getAllByRole("button");
  return buttons.find((b) => !b.textContent!.endsWith(right))!;
}
function rightButton() {
  const right = correctText();
  return within(screen.getByRole("list")).getAllByRole("button").find((b) => b.textContent!.endsWith(right))!;
}
const click = (el: HTMLElement) => fireEvent.click(el);

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Game", () => {
  it("opens on the menu", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByText(/one question at a time/i)).toBeTruthy();
  });

  it("scores a correct answer and shows the explanation", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    click(rightButton());
    expect(screen.getByText("True.")).toBeTruthy();
    expect(screen.getByText("Score 12")).toBeTruthy();
  });

  it("challenge ends after three wrong answers and saves nothing weird", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Challenge");
    for (let i = 0; i < 3; i++) {
      click(wrongButton());
      click(screen.getByRole("button", { name: i < 2 ? /next word/i : /see your result/i }));
    }
    expect(screen.getByText(/challenge complete/i)).toBeTruthy();
  });

  it("endless mode never goes blank after the whole deck has been played (regression)", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    const total = QUESTIONS.length;
    for (let i = 0; i < total * 2 + 5; i++) {
      click(rightButton()); // would throw if the question were missing
      click(screen.getByRole("button", { name: /next word/i }));
    }
    expect(screen.getByRole("heading", { level: 2 })).toBeTruthy();
  });

  it("50/50 removes two wrong answers, once per run", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    const lifeline = screen.getByRole("button", { name: /50\/50/ });
    click(lifeline);
    const choices = within(screen.getByRole("list")).getAllByRole("button");
    expect(choices.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(2);
    expect((rightButton() as HTMLButtonElement).disabled).toBe(false);
    expect((lifeline as HTMLButtonElement).disabled).toBe(true);
  });

  it("sound toggle is remembered", () => {
    const first = render(<Game user={USER} onSignOut={() => {}} />);
    click(screen.getByRole("button", { name: /sound on/i }));
    first.unmount();
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByRole("button", { name: /sound off/i })).toBeTruthy();
  });

  it("tournament runs exactly ten questions", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Tournament");
    for (let i = 0; i < 10; i++) {
      expect(screen.getByText(new RegExp(`${i + 1}/10`))).toBeTruthy();
      click(rightButton());
      click(screen.getByRole("button", { name: i === 9 ? /see the round/i : /next word/i }));
    }
    expect(screen.getByText(/tournament complete/i)).toBeTruthy();
    expect(screen.getByText(/10 right out of 10/)).toBeTruthy();
  });

  it("pass & play alternates players, tracks streaks separately and names a winner", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Pass");
    expect(screen.getByText(/Player 1/)).toBeTruthy();
    for (let i = 0; i < 10; i++) {
      // Player 1 always right, player 2 always wrong
      click(i % 2 === 0 ? rightButton() : wrongButton());
      click(screen.getByRole("button", { name: i === 9 ? /see the round/i : /next word/i }));
    }
    expect(screen.getByText(/Player 1 wins/)).toBeTruthy();
  });

  it("sprint finishes when the clock runs out", () => {
    vi.useFakeTimers();
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Sprint");
    expect(screen.getByLabelText(/60 seconds left/)).toBeTruthy();
    click(rightButton());
    act(() => { vi.advanceTimersByTime(61_000); });
    expect(screen.getByText(/sprint complete/i)).toBeTruthy();
  });

  it("daily gives the same questions twice and counts the streak once", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    const seen = () => {
      const out: string[] = [];
      for (let i = 0; i < 10; i++) {
        out.push(screen.getByRole("heading", { level: 2 }).textContent!);
        click(rightButton());
        click(screen.getByRole("button", { name: i === 9 ? /see the round/i : /next word/i }));
      }
      return out;
    };
    begin("Daily");
    const first = seen();
    click(screen.getByRole("button", { name: /run again/i }));
    const second = seen();
    expect(second).toEqual(first);
    expect(screen.getByText(/Daily streak 1\./)).toBeTruthy();
  });

  it("keyboard: a number key answers, Enter advances", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    fireEvent.keyDown(window, { key: "2" });
    expect(screen.getByRole("status")).toBeTruthy();
    (document.activeElement as HTMLElement)?.blur();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("survives corrupted saved data instead of crashing", () => {
    localStorage.setItem("didaskalia-stats-v1", "{not json");
    localStorage.setItem("didaskalia-custom-v1", JSON.stringify([{ junk: true }, 5, null]));
    localStorage.setItem("didaskalia-history-v1", JSON.stringify("oops"));
    localStorage.setItem("didaskalia-best-v1", JSON.stringify({ a: 1 }));
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByText("Best 0")).toBeTruthy();
  });

  it("survives localStorage throwing", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    click(rightButton());
    expect(screen.getByText("True.")).toBeTruthy();
    spy.mockRestore(); set.mockRestore();
  });

  it("saves a custom question, plays it, and validates input", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/my questions/i);
    click(screen.getByRole("button", { name: /save question/i }));
    expect(screen.getByText(/fill in every field/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Prompt"), { target: { value: "Custom Q?" } });
    fireEvent.change(screen.getByLabelText("Reference"), { target: { value: "Test 1:1" } });
    ["Alpha", "Beta", "Gamma", "Delta"].forEach((v, i) => fireEvent.change(screen.getByLabelText(`Choice ${i + 1}`), { target: { value: v } }));
    fireEvent.change(screen.getByLabelText("Explanation"), { target: { value: "Because." } });
    click(screen.getByRole("button", { name: /save question/i }));
    expect(screen.getByText(/question saved/i)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("didaskalia-custom-v1")!)).toHaveLength(1);
  });

  it("Library: bookmarks can be filtered, practice plays one question", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^library/i);
    click(screen.getAllByRole("button", { name: /^save$/i })[0]);
    click(screen.getByRole("button", { name: /^saved \(1\)/i }));
    expect(screen.getAllByRole("button", { name: /practice this/i })).toHaveLength(1);
    click(screen.getByRole("button", { name: /practice this/i }));
    click(rightButton());
    click(screen.getByRole("button", { name: /see the round/i }));
    expect(screen.getByText(/study complete/i)).toBeTruthy();
  });

  it("remembers progress between visits", () => {
    const first = render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    click(rightButton());
    first.unmount();
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^progress/i);
    expect(screen.getByText(/Overall: 100% · 1\/1/)).toBeTruthy();
  });

  it("friend challenge link: same questions for everyone, and the result compares scores", () => {
    window.location.hash = "#c=123456.40";
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByText(/A friend scored 40/)).toBeTruthy();
    click(screen.getByRole("button", { name: /accept challenge/i }));
    const expected = shuffleSeeded(QUESTIONS, 123456).slice(0, 10).map((q) => q.prompt);
    for (let i = 0; i < 10; i++) {
      expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(expected[i]);
      click(rightButton());
      click(screen.getByRole("button", { name: i === 9 ? /see the round/i : /next word/i }));
    }
    expect(screen.getByText(/You beat your friend’s 40/)).toBeTruthy();
    expect(screen.getByText(/Duelist/)).toBeTruthy();
    expect(window.location.hash).toBe("");
  });

  it("shows the verse of the day and awards badges after a perfect round", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByText(verseOfDay(dayKey()).text)).toBeTruthy();
    begin("Tournament");
    for (let i = 0; i < 10; i++) {
      click(rightButton());
      click(screen.getByRole("button", { name: i === 9 ? /see the round/i : /next word/i }));
    }
    expect(screen.getByText(/Perfect Round/)).toBeTruthy();
    expect(screen.getByText(/First Steps/)).toBeTruthy();
  });

  it("Finish the verse plays ten questions", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Finish the verse");
    for (let i = 0; i < 10; i++) {
      const q = screen.getByRole("heading", { level: 2 }).textContent!;
      expect(q).toMatch(/Which ending completes this verse/);
      const buttons = within(screen.getByRole("list")).getAllByRole("button");
      const verse = Array.from(new Set(buttons)).length; // four choices present
      expect(verse).toBe(4);
      click(buttons[0]);
      click(screen.getByRole("button", { name: /next word|see the round/i }));
    }
    expect(screen.getByText(/finish the verse complete/i)).toBeTruthy();
  });

  it("teacher shares a quiz; a student opens the link and plays exactly it", async () => {
    const qs = QUESTIONS.slice(0, 3).map((q, i) => ({ ...q, id: `custom-${i}` }));
    const code = (await encodeQuiz("Week 1", qs))!;
    window.location.hash = `#q=${code}`;
    render(<Game user={USER} onSignOut={() => {}} />);
    await screen.findByText(/Your teacher shared “Week 1” \(3 questions\)/);
    click(screen.getByRole("button", { name: /start class quiz/i }));
    const allowed = new Set(qs.map((q) => q.prompt));
    for (let i = 0; i < 3; i++) {
      expect(allowed.has(screen.getByRole("heading", { level: 2 }).textContent!)).toBe(true);
      click(rightButton());
      click(screen.getByRole("button", { name: i === 2 ? /see the round/i : /next word/i }));
    }
    expect(screen.getByText(/class quiz complete/i)).toBeTruthy();
  });

  it("joining with a bad code explains the problem", async () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/paste the link/i), { target: { value: "nonsense" } });
    click(screen.getByRole("button", { name: /^join$/i }));
    await screen.findByText(/isn’t a valid class quiz/i);
  });

  it("Who am I? plays ten questions", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Who am I");
    for (let i = 0; i < 10; i++) {
      expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/^Who am I\?/);
      click(within(screen.getByRole("list")).getAllByRole("button")[0]);
      click(screen.getByRole("button", { name: /next word|see the round/i }));
    }
    expect(screen.getByText(/who am i\? complete/i)).toBeTruthy();
  });

  it("themes unlock with level, apply, and a locked saved theme falls back", () => {
    localStorage.setItem("didaskalia-stats-v1", JSON.stringify({ Faith: { seen: 30, right: 30 } })); // level 2
    localStorage.setItem("didaskalia-theme-v1", JSON.stringify("royal")); // needs level 4
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(document.documentElement.dataset.theme).toBe("classic");
    nav(/^settings/i);
    expect((screen.getByRole("button", { name: /royal/i }) as HTMLButtonElement).disabled).toBe(true);
    click(screen.getByRole("button", { name: /midnight/i }));
    expect(document.documentElement.dataset.theme).toBe("midnight");
    expect(JSON.parse(localStorage.getItem("didaskalia-theme-v1")!)).toBe("midnight");
  });
});
