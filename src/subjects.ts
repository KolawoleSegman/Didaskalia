import { Anchor, BookMarked, BookOpen, Church, Cross, Crown, Flame, HandHeart, HandHelping, Heart, Key, Landmark, LibraryBig, Music2, ScrollText, Shield, Sprout, Sun, Sunrise, Wind } from "lucide-react";
import type { Subject } from "./questions";

/** An icon and a colour for every subject, so the home page and the Play page feel alive. */
export const SUBJECT_META: Record<Subject, { icon: typeof Shield; hue: string }> = {
  Salvation: { icon: Key, hue: "#d9a441" },
  Righteousness: { icon: Shield, hue: "#6fb3a2" },
  "Eternal Life": { icon: Sunrise, hue: "#f0a04b" },
  Faith: { icon: Anchor, hue: "#7ea6e0" },
  Holiness: { icon: Flame, hue: "#e08b6b" },
  Grace: { icon: HandHeart, hue: "#d98fb0" },
  "The Word": { icon: BookOpen, hue: "#c6a15a" },
  Prayer: { icon: HandHelping, hue: "#9a8fe0" },
  Love: { icon: Heart, hue: "#e0707a" },
  Repentance: { icon: Sprout, hue: "#86c07a" },
  "The Spirit": { icon: Wind, hue: "#6cc6d9" },
  Hope: { icon: Sun, hue: "#e6c14f" },
  Forgiveness: { icon: BookMarked, hue: "#9bc4a0" },
  Obedience: { icon: Crown, hue: "#c68f5a" },
  Peace: { icon: Landmark, hue: "#8fb7d6" },
  "The Cross": { icon: Cross, hue: "#c9b27a" },
  "Bible Basics": { icon: LibraryBig, hue: "#b5a06a" },
  "Old Testament": { icon: ScrollText, hue: "#d0925a" },
  "Life of Jesus": { icon: Church, hue: "#e6b86a" },
  "Early Church": { icon: Church, hue: "#7fbf9f" },
  "Psalms & Wisdom": { icon: Music2, hue: "#a58fd9" },
};
