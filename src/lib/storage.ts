/**
 * Everything is saved on the device under one key per kind of data. Keys are tied to the signed-in account, so two
 * people sharing a phone never see each other's progress. localStorage can throw (private mode, storage disabled,
 * quota); none of that may crash the game.
 */
let space = "";

/** Call with the account id after sign-in, and with null after sign-out. */
export function setNamespace(userId: string | null): void {
  space = userId ? `${userId.replace(/[^a-z0-9]/gi, "").slice(0, 12)}-` : "";
}

/** The storage key for one kind of data, e.g. storageKey("stats"). */
export const storageKey = (name: string): string => `didaskalia-${space}${name}-v1`;

export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable: the game keeps working, it just won't remember */
  }
}

const LEGACY_NAMES = ["best", "stats", "marks", "custom", "history", "daily", "sound", "theme", "missed", "textsize", "badges", "reminder", "memory"];

/**
 * Before this app was renamed, progress was saved under "the-word-*" keys with no account. The first account that
 * signs in on a device inherits it, once.
 */
export function adoptLegacyData(): void {
  try {
    if (localStorage.getItem("didaskalia-legacy-done")) return;
    for (const name of LEGACY_NAMES) {
      const old = localStorage.getItem(`the-word-${name}-v1`);
      if (old !== null && localStorage.getItem(storageKey(name)) === null) localStorage.setItem(storageKey(name), old);
    }
    localStorage.setItem("didaskalia-legacy-done", "1");
  } catch {
    /* nothing to adopt */
  }
}

/** Removes everything this device saved for the current account (used when an account is deleted). */
export function clearAccountData(): void {
  try {
    const prefix = `didaskalia-${space}`;
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}
