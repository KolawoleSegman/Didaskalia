import type { ReactNode } from "react";

/** Standard page heading used by every screen. */
export function PageHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="flex items-center gap-3 font-display text-3xl leading-tight sm:text-4xl">
        {icon && <span className="flex size-11 items-center justify-center rounded-2xl bg-gold/20 text-gold-bright" aria-hidden>{icon}</span>}
        {title}
      </h1>
      {subtitle && <p className="mt-2 max-w-prose leading-relaxed text-parchment/75">{subtitle}</p>}
    </header>
  );
}

/** A circular progress ring with content in the middle. */
export function Ring({ pct, size = 76, stroke = 7, children, label }: { pct: number; size?: number; stroke?: number; children?: ReactNode; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-gold-bright)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - clamped / 100)} style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-parchment/60">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs text-parchment/60">{hint}</p>}
    </div>
  );
}

export const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold font-display font-semibold text-ink" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export const PILL_ON = "min-h-11 rounded-full border border-gold-bright bg-gold-bright px-4 text-sm font-semibold text-ink";
export const PILL_OFF = "min-h-11 rounded-full border border-parchment/30 px-4 text-sm hover:bg-parchment/5";
