import { Component, type ReactNode } from "react";

/** If anything in the game ever crashes, show a way out instead of a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  reset() {
    if (!window.confirm("Erase everything saved by Didaskalia on this device (scores, streaks, badges, your questions) and reload?")) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("didaskalia-") || k.startsWith("the-word-")).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage unavailable */
    }
    window.location.reload();
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-parchment">
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="max-w-sm text-parchment/80">Your progress is safe. Reload to keep playing. If this keeps happening, you can reset the saved data.</p>
        <button type="button" className="min-h-12 rounded-full bg-parchment px-6 font-semibold text-fg" onClick={() => window.location.reload()}>Reload</button>
        <button type="button" className="text-sm text-parchment/60 underline underline-offset-2" onClick={() => this.reset()}>Reset saved data</button>
      </main>
    );
  }
}
