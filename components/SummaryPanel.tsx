"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/api";
import type { Summary } from "@/lib/schemas";
import { updateDoc } from "@/lib/storage";
import type { StudyDoc } from "@/lib/types";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";

const STEPS = ["نقرأ الملزمة…", "نحدد الأفكار الرئيسية…", "نرتّب الأقسام…", "نكتب الملخص…"];

export default function SummaryPanel({ doc }: { doc: StudyDoc }) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const needsSummary = !doc.summary || regenerating;

  useEffect(() => {
    if (!needsSummary || error) return;
    const controller = new AbortController();
    postJson<Summary>("/api/summary", { text: doc.text }, controller.signal)
      .then((summary) => {
        if (!updateDoc(doc.id, { summary })) {
          setError("ما قدرنا نحفظ الملخص لأن مساحة المتصفح ممتلئة.");
          return;
        }
        setRegenerating(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
  }, [doc.id, doc.text, needsSummary, error, attempt]);

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  if (needsSummary || !doc.summary) return <GeneratingState steps={STEPS} />;

  const s = doc.summary;
  const dir = s.language === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-4" dir={dir}>
      <section className="rounded-2xl border border-brand/25 bg-brand-soft p-5">
        <h2 className="text-lg font-bold leading-snug">{s.title}</h2>
        <p className="mt-2 leading-7">{s.overview}</p>
      </section>

      {s.sections.map((section, i) => (
        <section key={i} className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="flex items-start gap-2.5 font-bold leading-snug">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 text-xs text-muted">
              {i + 1}
            </span>
            {section.heading}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {section.points.map((point, j) => (
              <li key={j} className="flex gap-2.5 leading-7">
                <span className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {s.keyTerms.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-bold">{s.language === "ar" ? "مصطلحات مهمة" : "Key terms"}</h3>
          <dl className="mt-3 divide-y divide-border">
            {s.keyTerms.map((t, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <dt className="font-semibold text-brand">{t.term}</dt>
                <dd className="mt-0.5 text-sm leading-6 text-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div dir="rtl" className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setRegenerating(true)}
          className="h-10 rounded-xl px-4 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          ولّد ملخص جديد
        </button>
      </div>
    </div>
  );
}
