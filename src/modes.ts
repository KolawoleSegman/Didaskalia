import { BookOpen, CalendarDays, CircleHelp, Gift, GraduationCap, ListOrdered, Quote, RotateCcw, Shield, Swords, Trophy, Users, Zap } from "lucide-react";
import type { Mode } from "./lib/logic";

export const MODE_COPY: Record<Mode, { label: string; hint: string }> = {
  challenge: { label: "Challenge", hint: "Three lives. Best score saved." },
  study: { label: "Study", hint: "No lives. Stop when you want." },
  sprint: { label: "Sprint", hint: "Sixty seconds. Answer fast." },
  tournament: { label: "Tournament", hint: "Ten questions, then the score." },
  daily: { label: "Daily", hint: "Same ten questions all day." },
  pass: { label: "Pass & play", hint: "Two players, one device." },
  duel: { label: "Duel", hint: "Same ten questions. Challenge a friend." },
  verse: { label: "Finish the verse", hint: "Complete the scripture." },
  class: { label: "Class quiz", hint: "A quiz from your teacher." },
  who: { label: "Who am I?", hint: "Guess the Bible character." },
  review: { label: "Review", hint: "Retry what you missed." },
  order: { label: "Timeline", hint: "What came first? What came last?" },
  season: { label: "Seasonal", hint: "A pack for the season." },
};

export const MODE_ICON: Record<Mode, typeof Shield> = {
  challenge: Shield, study: BookOpen, sprint: Zap, tournament: Trophy, daily: CalendarDays, pass: Users, duel: Swords,
  verse: Quote, class: GraduationCap, who: CircleHelp, review: RotateCcw, order: ListOrdered, season: Gift,
};

/** Longer explanations for the Help page. */
export const MODE_HELP: Partial<Record<Mode, string>> = {
  daily: "Ten questions that are the same for everyone today. Play every day to build your streak.",
  challenge: "Keep answering until you lose three lives. Beat your best score.",
  study: "No pressure and no lives. Choose subjects, read every explanation and stop whenever you like.",
  sprint: "Answer as many as you can in sixty seconds.",
  tournament: "A round of ten questions with a star rating at the end.",
  pass: "Two players share one phone and take turns. The higher score wins.",
  duel: "Play ten questions, then share a link. Your friend gets the same ten and tries to beat you.",
  verse: "Pick the ending that completes the verse.",
  who: "Read the clues and name the Bible character.",
  order: "Put events in order: which came first, which came last?",
  review: "Replays the questions you missed so they stick.",
  season: "A special pack for Christmas and Easter.",
};
