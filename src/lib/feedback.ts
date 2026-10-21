let ctx: AudioContext | undefined;

/** Short tone + vibration for right / wrong / finished. Silent if sound is off or unsupported. */
export function cue(kind: "right" | "wrong" | "done", on: boolean): void {
  if (!on) return;
  try {
    navigator.vibrate?.(kind === "wrong" ? [60, 40, 60] : 25);
  } catch {
    /* no vibration */
  }
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const c = (ctx ??= new AC());
    const notes = kind === "right" ? [660, 880] : kind === "wrong" ? [220, 165] : [523, 659, 784];
    notes.forEach((freq, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime + i * 0.11;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {
    /* audio blocked */
  }
}
