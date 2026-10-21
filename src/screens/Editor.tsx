import { GraduationCap, PenLine } from "lucide-react";
import { useG } from "../GameContext";
import { SUBJECTS, type Subject } from "../questions";
import { MAX_CLASS_QUESTIONS } from "../lib/classQuiz";
import { PageHeader, PILL_OFF } from "../components/ui";

export default function Editor() {
  const { draft, setDraft, addCustom, editorNote, exportCustom, importCustom, teacherTitle, setTeacherTitle, shareClass, custom, removeCustom } = useG();
  return (
    <section className="rise">
      <PageHeader title="My questions" subtitle="Write your own questions for your class or small group. They are saved with your account on this device." icon={<PenLine size={22} />} />
      <div className="grid gap-2">
        <select aria-label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value as Subject })} className="input">
          {SUBJECTS.map((s) => (<option key={s}>{s}</option>))}
        </select>
        <input aria-label="Prompt" placeholder="Question" maxLength={400} value={draft.prompt} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} className="input" />
        <input aria-label="Reference" placeholder="Verse reference" maxLength={80} value={draft.ref} onChange={(e) => setDraft({ ...draft, ref: e.target.value })} className="input" />
        {(["a", "b", "c", "d"] as const).map((key, i) => (
          <input key={key} aria-label={`Choice ${i + 1}`} placeholder={`Choice ${String.fromCharCode(65 + i)}`} maxLength={200} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="input" />
        ))}
        <label className="text-sm text-parchment/70">
          Correct choice
          <select aria-label="Correct choice" value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} className="input mt-1">
            <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
          </select>
        </label>
        <textarea aria-label="Explanation" placeholder="What the verse means" maxLength={1000} value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} className="input min-h-24 py-3" />
        <button type="button" onClick={addCustom} className="btn btn-light">Save question</button>
      </div>
      {editorNote && <p className="mt-3 text-sm text-parchment/80" role="status">{editorNote}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={exportCustom} className={PILL_OFF}>Export JSON</button>
        <label className={`inline-flex cursor-pointer items-center ${PILL_OFF}`}>
          Import JSON
          <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) importCustom(file); e.target.value = ""; }} />
        </label>
      </div>
      <div className="card-gold mt-6 px-4 py-4">
        <h2 className="flex items-center gap-2 font-display text-xl"><GraduationCap size={18} aria-hidden />Teacher mode</h2>
        <p className="mt-1 text-sm text-parchment/75">Share the questions below as a quiz for your class. Students open the link, or paste it into the app. The answers travel inside the link, so use it for friendly classroom quizzes, not exams.</p>
        <input aria-label="Quiz title" placeholder="Quiz title (optional)" maxLength={80} value={teacherTitle} onChange={(e) => setTeacherTitle(e.target.value)} className="input mt-3" />
        <button type="button" onClick={() => void shareClass()} className="btn btn-gold mt-2 w-full">Share as class quiz ({Math.min(custom.length, MAX_CLASS_QUESTIONS)})</button>
      </div>
      <ul className="mt-4 grid gap-2">
        {custom.map((q) => (
          <li key={q.id} className="card flex items-start justify-between gap-3 px-4 py-3">
            <span>{q.ref}: {q.prompt}</span>
            <button type="button" className="text-sm text-bad" onClick={() => removeCustom(q.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
