"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import type { QuizResult } from "@/lib/types";
import { scoreMessage, weakTopics } from "@/lib/weakness";

const LETTERS = ["أ", "ب", "ج", "د"];
const EASE = [0.16, 1, 0.3, 1] as const;

export default function QuizResults({ result, actions }: { result: QuizResult; actions?: React.ReactNode }) {
  const total = result.questions.length;
  const percent = Math.round((result.correct / total) * 100);
  const weak = weakTopics(result.questions, result.answers);

  return (
    <div className="space-y-5">
      <motion.section
        className="surface flex flex-col items-center gap-4 px-6 py-10 text-center"
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <p className="eyebrow" dir="ltr">
          Your score
        </p>
        <ScoreDial percent={percent} />
        <p className="text-lg font-semibold tabular-nums">
          {result.correct.toLocaleString("ar-EG")} من {total.toLocaleString("ar-EG")} إجابة صحيحة
        </p>
        <p className="max-w-xs leading-7 text-muted">{scoreMessage(percent)}</p>
        {actions && <div className="flex w-full flex-col gap-2 pt-3">{actions}</div>}
      </motion.section>

      <section className="surface p-5 sm:p-6">
        <p className="eyebrow" dir="ltr">
          Weak points
        </p>
        <h3 className="mt-2 text-lg font-semibold">نقاط ضعفك</h3>
        {weak.length === 0 ? (
          <p className="mt-2 leading-7 text-muted">ما غلطت في أي موضوع. استمر على كذا.</p>
        ) : (
          <>
            <p className="mt-1 text-sm leading-7 text-muted">راجع هذي المواضيع في الملخص والبطاقات قبل الاختبار:</p>
            <ul className="mt-5 space-y-4">
              {weak.map((t, i) => (
                <motion.li
                  key={t.topic}
                  className="space-y-2"
                  initial={{ opacity: 0, x: 16, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, ease: EASE, delay: 0.9 + i * 0.18 }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <bdi className="font-medium">{t.topic}</bdi>
                    <span className="shrink-0 text-sm tabular-nums text-faint">
                      {t.wrong.toLocaleString("ar-EG")} من {t.total.toLocaleString("ar-EG")} خطأ
                    </span>
                  </div>
                  <div className="h-px bg-border">
                    <motion.div
                      className="h-px bg-text shadow-[0_0_12px_var(--text)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.wrong / t.total) * 100}%` }}
                      transition={{ duration: 1.2, ease: EASE, delay: 1.1 + i * 0.18 }}
                    />
                  </div>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="px-1">
          <p className="eyebrow" dir="ltr">
            Review
          </p>
          <h3 className="mt-2 text-lg font-semibold">مراجعة الأسئلة</h3>
        </div>
        {result.questions.map((q, i) => {
          const chosen = result.answers[i];
          const right = chosen === q.correctIndex;
          return (
            <article key={i} className="surface p-5">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    right ? "bg-text text-bg shadow-[0_0_16px_-2px_var(--text)]" : "border border-border-strong text-faint"
                  }`}
                  aria-label={right ? "صحيح" : "خطأ"}
                >
                  {right ? "✓" : "✕"}
                </span>
                <p dir="auto" className="flex-1 font-medium leading-8">
                  {q.question}
                </p>
              </div>
              <ul className="mt-4 space-y-1.5">
                {q.options.map((option, j) => {
                  const isCorrect = j === q.correctIndex;
                  const isChosen = j === chosen;
                  return (
                    <li
                      key={j}
                      className={`flex gap-3 rounded-xl px-3 py-2.5 text-sm leading-7 ${
                        isCorrect
                          ? "bg-text font-semibold text-bg shadow-[0_0_28px_-10px_var(--text)]"
                          : isChosen
                            ? "border border-border text-faint line-through decoration-faint"
                            : "text-faint"
                      }`}
                    >
                      <span className="shrink-0 opacity-70">{LETTERS[j]}</span>
                      <bdi>{option}</bdi>
                    </li>
                  );
                })}
              </ul>
              {chosen === -1 && <p className="mt-2 text-xs text-faint">ما جاوبت على هذا السؤال.</p>}
              <p dir="auto" className="mt-4 border-t border-border pt-4 text-sm leading-7 text-muted">
                {q.explanation}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

// الدرجة تعدّ من صفر، والدائرة الرفيعة تمتلي معها.
function ScoreDial({ percent }: { percent: number }) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toString());
  const r = 64;
  const c = 2 * Math.PI * r;
  const offset = useTransform(value, (v) => c * (1 - v / 100));

  useEffect(() => {
    const controls = animate(value, percent, { duration: 1.8, ease: EASE, delay: 0.3 });
    return () => controls.stop();
  }, [value, percent]);

  return (
    <div className="relative size-44" dir="ltr">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--border-strong)" strokeWidth="1" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="var(--text)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset, filter: "drop-shadow(0 0 6px var(--text))" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display tabular-nums">
        <motion.span className="text-7xl leading-none">{text}</motion.span>
        <span className="mt-6 text-2xl text-faint">%</span>
      </span>
      <span className="sr-only">{percent}٪</span>
    </div>
  );
}
