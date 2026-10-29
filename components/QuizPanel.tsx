"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { postJson } from "@/lib/api";
import { scrollToTop } from "@/lib/scroll";
import { DEFAULT_QUIZ_COUNT, QUIZ_COUNTS, type QuizQuestion } from "@/lib/schemas";
import { newId, saveResult, updateDoc } from "@/lib/storage";
import type { QuizResult, StudyDoc } from "@/lib/types";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";
import { Reveal } from "./motion/Reveal";
import QuizResults from "./QuizResults";

const STEPS = ["نقرأ الملزمة…", "نختار المفاهيم المهمة…", "نكتب الأسئلة والخيارات…", "نجهّز الشرح لكل سؤال…"];
const LETTERS = ["أ", "ب", "ج", "د"];

type Stage =
  | { name: "setup" }
  | { name: "generating"; count: number }
  | { name: "taking" }
  | { name: "results"; result: QuizResult };

export default function QuizPanel({ doc }: { doc: StudyDoc }) {
  const [stage, setStage] = useState<Stage>({ name: "setup" });
  const [count, setCount] = useState<number>(DEFAULT_QUIZ_COUNT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage.name !== "generating" || error) return;
    const controller = new AbortController();
    postJson<{ questions: QuizQuestion[] }>(
      "/api/quiz",
      { text: doc.text, count: stage.count },
      controller.signal,
    )
      .then(({ questions }) => {
        if (!updateDoc(doc.id, { quiz: questions })) {
          setError("ما قدرنا نحفظ الاختبار لأن مساحة المتصفح ممتلئة.");
          return;
        }
        setStage({ name: "taking" });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, [stage, error, doc.id, doc.text]);

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setStage({ name: "generating", count });
        }}
      />
    );
  }

  if (stage.name === "generating") return <GeneratingState steps={STEPS} />;

  if (stage.name === "taking" && doc.quiz) {
    return (
      <QuizRunner
        questions={doc.quiz}
        onSubmit={(answers) => {
          const questions = doc.quiz!;
          const result: QuizResult = {
            id: newId(),
            docId: doc.id,
            docTitle: doc.title,
            takenAt: Date.now(),
            questions,
            answers,
            correct: answers.filter((a, i) => a === questions[i].correctIndex).length,
          };
          saveResult(result);
          setStage({ name: "results", result });
          scrollToTop();
        }}
      />
    );
  }

  if (stage.name === "results") {
    return (
      <QuizResults
        result={stage.result}
        actions={
          <>
            <button type="button" onClick={() => setStage({ name: "taking" })} className="btn-primary h-12">
              أعد نفس الاختبار
            </button>
            <button type="button" onClick={() => setStage({ name: "setup" })} className="btn-secondary h-12">
              اختبار جديد
            </button>
          </>
        }
      />
    );
  }

  return (
    <Reveal onMount>
      <div className="surface space-y-6 p-6">
        <div>
          <p className="eyebrow">
            <span dir="ltr">Quiz</span>
          </p>
          <h2 className="mt-2 text-xl font-semibold">اختبر نفسك</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            أسئلة اختيار من متعدد من الملزمة. بعد التسليم تشوف درجتك وشرح كل سؤال ونقاط ضعفك.
          </p>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm text-faint">عدد الأسئلة</legend>
          <div className="grid grid-cols-4 rounded-2xl bg-surface-2 p-1">
            {QUIZ_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={`relative h-12 rounded-xl font-display text-xl tabular-nums transition-colors duration-300 ${
                  count === n ? "text-bg" : "text-faint hover:text-muted"
                }`}
              >
                {count === n && (
                  <motion.span
                    layoutId="quiz-count"
                    className="absolute inset-0 rounded-xl bg-text shadow-[0_8px_24px_-12px_var(--text)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{n}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setStage({ name: "generating", count })} className="btn-primary h-13 text-base">
            {doc.quiz ? "ولّد اختبار جديد" : "ولّد الاختبار"}
          </button>
          {doc.quiz && (
            <button type="button" onClick={() => setStage({ name: "taking" })} className="btn-secondary h-12">
              كمّل آخر اختبار ({doc.quiz.length.toLocaleString("ar-EG")} سؤال)
            </button>
          )}
        </div>
      </div>
    </Reveal>
  );
}

function QuizRunner({ questions, onSubmit }: { questions: QuizQuestion[]; onSubmit: (answers: number[]) => void }) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [index, setIndex] = useState(0);
  const q = questions[index];
  const answered = answers.filter((a) => a !== -1).length;
  const last = index === questions.length - 1;

  function choose(option: number) {
    setAnswers((a) => a.map((v, i) => (i === index ? option : v)));
  }

  function submit() {
    const missing = questions.length - answered;
    if (missing > 0 && !window.confirm(`باقي ${missing} سؤال بدون إجابة. تبي تسلّم الحين؟`)) return;
    onSubmit(answers);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-sm text-faint">
        <span className="font-display text-xl tabular-nums text-text" dir="ltr">
          {String(index + 1).padStart(2, "0")}
          <span className="text-faint"> / {String(questions.length).padStart(2, "0")}</span>
        </span>
        <div className="h-px flex-1 bg-border">
          <motion.div
            className="h-px bg-text"
            animate={{ width: `${(answered / questions.length) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <span className="tabular-nums">{answered.toLocaleString("ar-EG")} مُجاب</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={index}
          className="surface p-5 sm:p-6"
          initial={{ opacity: 0, x: -24, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 24, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="eyebrow">{q.topic}</span>
          <p dir="auto" className="mt-3 text-lg font-semibold leading-8 sm:text-xl">
            {q.question}
          </p>
          <div role="radiogroup" className="mt-5 space-y-2">
            {q.options.map((option, j) => {
              const selected = answers[index] === j;
              const dimmed = answers[index] !== -1 && !selected;
              return (
                <motion.button
                  key={j}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(j)}
                  whileTap={{ scale: 0.98, y: 1 }}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-start leading-7 transition-[background,color,border-color,box-shadow,opacity] duration-500 ${
                    selected
                      ? "border-text bg-text text-bg shadow-[0_0_40px_-12px_var(--text),inset_0_1px_0_rgb(255_255_255/0.3)]"
                      : `border-border hover:border-border-strong hover:bg-surface-2 ${dimmed ? "opacity-55" : ""}`
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold transition-colors duration-500 ${
                      selected ? "bg-bg text-text" : "bg-surface-2 text-faint"
                    }`}
                  >
                    {LETTERS[j]}
                  </span>
                  <bdi className="pt-0.5">{option}</bdi>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0} className="btn-secondary h-12">
          السابق
        </button>
        {last ? (
          <button type="button" onClick={submit} className="btn-primary h-12">
            سلّم الاختبار
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((i) => i + 1)} className="btn-primary h-12">
            التالي
          </button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5" aria-label="انتقل لسؤال">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`سؤال ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            className={`size-8 rounded-lg text-xs font-semibold tabular-nums transition ${
              i === index
                ? "bg-text text-bg"
                : answers[i] !== -1
                  ? "border border-border-strong text-text"
                  : "border border-border text-faint"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
