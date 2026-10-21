/**
 * Where the web version lives. Used for friend-challenge and class-quiz links shared from the Android app.
 * Set at build time from VITE_SITE_URL (the GitHub workflows do this automatically); falls back to the default below.
 * Always ends with a slash.
 */
const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim().replace(/\/+$/, "");
export const SITE_URL = `${fromEnv || "https://excellenteaser.com"}/`;
