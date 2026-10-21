import type { Question } from "../questions";
import { VERSES } from "../verses";

/** Splits a verse near its middle, preferring a natural pause (comma, semicolon, colon). */
export function splitVerse(text: string): [string, string] {
  const words = text.split(" ");
  const mid = Math.round(words.length / 2);
  let at = mid;
  for (let d = 0; d <= 3; d++) {
    for (const k of [mid - d, mid + d]) {
      if (k >= 3 && k <= words.length - 3 && /[,;:]$/.test(words[k - 1])) {
        at = k;
        d = 4;
        break;
      }
    }
  }
  at = Math.min(Math.max(at, 3), words.length - 3);
  return [words.slice(0, at).join(" "), words.slice(at).join(" ")];
}

/** "Finish the verse" questions built from the verse list. Distractors are endings of other verses of similar length. */
export function verseQuestions(): Question[] {
  const parts = VERSES.map((v) => ({ ref: v.ref, ...(() => { const [a, b] = splitVerse(v.text); return { head: a, tail: b }; })() }));
  return parts.map((p, i) => {
    const wrong = parts
      .filter((_, j) => j !== i)
      .sort((a, b) => Math.abs(a.tail.length - p.tail.length) - Math.abs(b.tail.length - p.tail.length))
      .slice(0, 8)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((o) => o.tail);
    return {
      id: `verse-${i}`,
      subject: "The Word",
      prompt: `“${p.head}…” Which ending completes this verse?`,
      ref: p.ref,
      choices: [p.tail, ...wrong] as Question["choices"],
      answer: 0,
      why: `${p.head} ${p.tail}`,
    };
  });
}
