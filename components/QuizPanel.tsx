"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/api";
import { DEFAULT_QUIZ_COUNT, QUIZ_COUNTS, type QuizQuestion } from "@/lib/schemas";
import { newId, saveResult, updateDoc } from "@/lib/storage";
import type { QuizResult, StudyDoc } from "@/lib/types";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";
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
          window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="surface space-y-5 p-5">
      <div>
        <h2 className="text-lg font-bold">اختبر نفسك</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          أسئلة اختيار من متعدد من الملزمة، وبعد التسليم تشوف درجتك وشرح كل سؤال ونقاط ضعفك.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">عدد الأسئلة</legend>
        <div className="grid grid-cols-4 gap-2">
          {QUIZ_COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={count === n}
              onClick={() => setCount(n)}
              className={`h-11 rounded-xl border text-sm font-semibold transition ${
                count === n ? "border-text bg-text text-bg" : "border-border hover:bg-surface-2"
              }`}
            >
              {n.toLocaleString("ar-EG")}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setStage({ name: "generating", count })} className="btn-primary h-12">
          {doc.quiz ? "ولّد اختبار جديد" : "ولّد الاختبار"}
        </button>
        {doc.quiz && (
          <button type="button" onClick={() => setStage({ name: "taking" })} className="btn-secondary h-12">
            كمّل آخر اختبار ({doc.quiz.length.toLocaleString("ar-EG")} سؤال)
          </button>
        )}
      </div>
    </div>
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
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="tabular-nums">
          سؤال {(index + 1).toLocaleString("ar-EG")} من {questions.length.toLocaleString("ar-EG")}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-text transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </div>

      <section className="surface p-5">
        <span className="chip">{q.topic}</span>
        <p dir="auto" className="mt-3 text-lg font-semibold leading-8">
          {q.question}
        </p>
        <div role="radiogroup" className="mt-4 space-y-2">
          {q.options.map((option, j) => {
            const selected = answers[index] === j;
            return (
              <button
                key={j}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(j)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-start leading-7 transition ${
                  selected ? "border-text bg-text text-bg shadow-md" : "border-border hover:border-muted hover:bg-surface-2"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                    selected ? "bg-bg text-text" : "bg-surface-2 text-muted"
                  }`}
                >
                  {LETTERS[j]}
                </span>
                <bdi className="pt-0.5">{option}</bdi>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          className="btn-secondary h-12 disabled:opacity-40"
        >
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
            className={`size-8 rounded-lg text-xs font-semibold transition ${
              i === index
                ? "bg-text text-bg"
                : answers[i] !== -1
                  ? "bg-surface-2 text-text"
                  : "border border-border text-muted"
            }`}
          >
            {(i + 1).toLocaleString("ar-EG")}
          </button>
        ))}
      </div>
    </div>
  );
}
