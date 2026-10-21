import type { Question } from "../questions";
import { sanitizeQuestion } from "./logic";

export const MAX_CLASS_QUESTIONS = 30;
const MAX_CODE_LENGTH = 7000;

export type ClassQuiz = { title: string; questions: Question[] };

const toB64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const w = stream.writable.getWriter();
  // Errors surface when the output is read below; don't also leave these promises unhandled.
  w.write(bytes as unknown as BufferSource).catch(() => {});
  w.close().catch(() => {});
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
}

/** Packs a quiz into a link-safe code. "z" = compressed, "r" = plain (older browsers). Null if it would be too long. */
export async function encodeQuiz(title: string, questions: Question[]): Promise<string | null> {
  const payload = {
    t: title.trim().slice(0, 80),
    q: questions.slice(0, MAX_CLASS_QUESTIONS).map((q) => ({ s: q.subject, p: q.prompt, r: q.ref, c: q.choices, a: q.answer, w: q.why })),
  };
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  let code: string;
  try {
    code = typeof CompressionStream === "undefined" ? "r" + toB64(raw) : "z" + toB64(await pipe(raw, new CompressionStream("deflate-raw")));
  } catch {
    code = "r" + toB64(raw);
  }
  return code.length > MAX_CODE_LENGTH ? null : code;
}

/** Reads a code back, re-validating every question. Null if it isn't a usable quiz. */
export async function decodeQuiz(code: string): Promise<ClassQuiz | null> {
  try {
    const kind = code[0];
    let bytes = fromB64(code.slice(1));
    if (kind === "z") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "r") return null;
    const data = JSON.parse(new TextDecoder().decode(bytes)) as { t?: unknown; q?: unknown };
    if (!Array.isArray(data.q)) return null;
    const questions = data.q
      .slice(0, MAX_CLASS_QUESTIONS)
      .map((o: Record<string, unknown>) => sanitizeQuestion({ subject: o?.s, prompt: o?.p, ref: o?.r, choices: o?.c, answer: o?.a, why: o?.w }))
      .filter((q): q is Question => q !== null);
    if (questions.length === 0) return null;
    return { title: typeof data.t === "string" ? data.t.slice(0, 80) : "", questions };
  } catch {
    return null;
  }
}

/** Accepts a whole link or just the code. */
export function extractCode(input: string): string {
  const m = /q=([A-Za-z0-9_-]+)/.exec(input);
  return m ? m[1] : input.trim();
}
