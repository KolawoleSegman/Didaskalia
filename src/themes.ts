/** Unlocked by reaching a level (see levelFor in lib/logic.ts). Colors live in styles.css under [data-theme]. */
export const THEMES = [
  { id: "classic", name: "Classic", level: 1, swatch: "#c6a15a" },
  { id: "midnight", name: "Midnight", level: 2, swatch: "#8db4ea" },
  { id: "emerald", name: "Emerald", level: 3, swatch: "#6fcf9f" },
  { id: "royal", name: "Royal", level: 4, swatch: "#b890e8" },
  { id: "sunrise", name: "Sunrise", level: 5, swatch: "#f0a04b" },
] as const;
