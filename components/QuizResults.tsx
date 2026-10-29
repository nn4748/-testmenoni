import type { QuizResult } from "@/lib/types";
import { scoreMessage, weakTopics } from "@/lib/weakness";

const LETTERS = ["أ", "ب", "ج", "د"];

export default function QuizResults({ result, actions }: { result: QuizResult; actions?: React.ReactNode }) {
  const total = result.questions.length;
  const percent = Math.round((result.correct / total) * 100);
  const weak = weakTopics(result.questions, result.answers);

  return (
    <div className="space-y-4">
      <section className="surface flex flex-col items-center gap-3 p-6 text-center">
        <ScoreRing percent={percent} />
        <p className="text-lg font-bold">
          {result.correct.toLocaleString("ar-EG")} من {total.toLocaleString("ar-EG")} إجابة صحيحة
        </p>
        <p className="text-muted">{scoreMessage(percent)}</p>
        {actions && <div className="flex w-full flex-col gap-2 pt-2">{actions}</div>}
      </section>

      <section className="surface p-5">
        <h3 className="font-bold">نقاط ضعفك</h3>
        {weak.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-muted">ما غلطت في أي موضوع. استمر على كذا!</p>
        ) : (
          <>
            <p className="mt-1 text-sm leading-6 text-muted">
              هذي المواضيع غلطت فيها، ننصحك تراجعها في الملخص والبطاقات قبل الاختبار:
            </p>
            <ul className="mt-3 space-y-3">
              {weak.map((t) => (
                <li key={t.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <bdi className="font-medium">{t.topic}</bdi>
                    <span className="shrink-0 text-muted">
                      غلطت في {t.wrong.toLocaleString("ar-EG")} من {t.total.toLocaleString("ar-EG")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-danger" style={{ width: `${(t.wrong / t.total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">مراجعة الأسئلة</h3>
        {result.questions.map((q, i) => {
          const chosen = result.answers[i];
          const right = chosen === q.correctIndex;
          return (
            <article key={i} className="surface p-4">
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    right ? "bg-text text-bg" : "bg-danger text-white dark:text-neutral-950"
                  }`}
                  aria-label={right ? "صحيح" : "خطأ"}
                >
                  {right ? "✓" : "✗"}
                </span>
                <p dir="auto" className="flex-1 font-medium leading-7">
                  {q.question}
                </p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {q.options.map((option, j) => {
                  const isCorrect = j === q.correctIndex;
                  const isChosen = j === chosen;
                  return (
                    <li
                      key={j}
                      className={`flex gap-2 rounded-lg px-3 py-2 text-sm leading-6 ${
                        isCorrect
                          ? "bg-brand-soft font-medium"
                          : isChosen
                            ? "bg-danger-soft text-danger line-through decoration-danger/50"
                            : "text-muted"
                      }`}
                    >
                      <span className="shrink-0">{LETTERS[j]}.</span>
                      <bdi>{option}</bdi>
                    </li>
                  );
                })}
              </ul>
              {chosen === -1 && <p className="mt-2 text-xs text-danger">ما جاوبت على هذا السؤال.</p>}
              <p dir="auto" className="mt-3 border-t border-border pt-3 text-sm leading-6 text-muted">
                {q.explanation}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function ScoreRing({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = percent >= 50 ? "var(--text)" : "var(--danger)";
  return (
    <div className="relative size-32">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-3xl font-bold">
        {percent.toLocaleString("ar-EG")}٪
      </span>
    </div>
  );
}
