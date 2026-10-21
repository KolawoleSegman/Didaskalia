import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Game from "./Game";
import { USER, nav, begin } from "./testUtils";
import ErrorBoundary from "./components/ErrorBoundary";
import { QUESTIONS } from "./questions";

const byPrompt = new Map(QUESTIONS.map((q) => [q.prompt, q]));
const rightText = () => { const q = byPrompt.get(screen.getByRole("heading", { level: 2 }).textContent!)!; return q.choices[q.answer]; };
const buttons = () => within(screen.getByRole("list")).getAllByRole("button");
const right = () => buttons().find((b) => b.textContent!.endsWith(rightText()))!;
const wrong = () => buttons().find((b) => !b.textContent!.endsWith(rightText()))!;
const click = (el: HTMLElement) => fireEvent.click(el);

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("crash safety", () => {
  it("shows a way out instead of a blank page", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom = () => { throw new Error("boom"); };
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /reload/i })).toBeTruthy();
  });
  it("a hostile challenge link can't inject huge numbers", () => {
    window.location.hash = "#c=99999999999999999999.99999999999999999999";
    render(<Game user={USER} onSignOut={() => {}} />);
    expect(screen.getByText(/A friend scored 99999\./)).toBeTruthy();
  });
});

describe("Review your mistakes", () => {
  it("remembers misses, replays exactly them, and clears each once answered right", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    begin("Study");
    const missedPrompt = screen.getByRole("heading", { level: 2 }).textContent!;
    click(wrong());
    expect(JSON.parse(localStorage.getItem("didaskalia-missed-v1")!)).toHaveLength(1);
    nav(/^play$/i);
    expect((screen.getByRole("button", { name: /Retry what you missed \(1\)/ })).textContent).toMatch(/Review/);
    begin("Review");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(missedPrompt);
    click(right());
    expect(JSON.parse(localStorage.getItem("didaskalia-missed-v1")!)).toEqual([]);
  });
  it("can't be started when there is nothing to review", () => {
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^play$/i);
    click(screen.getByRole("button", { name: /^Review/ }));
    expect((screen.getByRole("button", { name: /begin/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("backup and restore", () => {
  const file = (obj: unknown) => new File([JSON.stringify(obj)], "b.json", { type: "application/json" });
  const restoreWith = async (obj: unknown) => {
    render(<Game user={USER} onSignOut={() => {}} />);
    nav(/^settings/i);
    const input = screen.getByText("Restore progress").querySelector("input")!;
    fireEvent.change(input, { target: { files: [file(obj)] } });
  };
  it("restores progress from a backup, ignoring junk inside it", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await restoreWith({ app: "the-word", best: 250, stats: { Faith: { seen: 10, right: 9 }, Bad: "x" }, badges: ["first-round", "nope"], theme: "royal", daily: "junk", custom: [{ nope: 1 }] });
    await screen.findByText("Progress restored.");
    nav(/^progress/i);
    expect(screen.getByText(/Overall: 90% · 9\/10/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("didaskalia-badges-v1")!)).toEqual(["first-round"]);
    expect(JSON.parse(localStorage.getItem("didaskalia-best-v1")!)).toBe(250);
  });
  it("rejects files that are not backups, and keeps progress when you cancel", async () => {
    await restoreWith({ hello: "world" });
    await screen.findByText(/isn’t a Didaskalia backup/);
    cleanup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await restoreWith({ app: "the-word", best: 999 });
    await new Promise((r) => setTimeout(r, 50));
    expect(localStorage.getItem("didaskalia-best-v1")).not.toBe("999");
  });
});

describe("site address for shared links", () => {
  it("uses VITE_SITE_URL when set, always with one trailing slash, and a default otherwise", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_SITE_URL", "https://me.github.io/the-word/");
    expect((await import("./config")).SITE_URL).toBe("https://me.github.io/the-word/");
    vi.resetModules();
    vi.stubEnv("VITE_SITE_URL", "");
    expect((await import("./config")).SITE_URL).toBe("https://excellenteaser.com/");
  });
});
