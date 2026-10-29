"use client";

import type { Summary } from "@/lib/schemas";
import type { StudyDoc } from "@/lib/types";
import { useGeneration } from "@/lib/useGeneration";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";

const STEPS = ["نقرأ الملزمة…", "نحدد الأفكار الرئيسية…", "نرتّب الأقسام…", "نكتب الملخص…"];

const pickSummary = (summary: Summary) => summary;

export default function SummaryPanel({ doc }: { doc: StudyDoc }) {
  const { data: s, error, retry, regenerate } = useGeneration(doc, "summary", "/api/summary", pickSummary);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!s) return <GeneratingState steps={STEPS} />;

  const dir = s.language === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-4" dir={dir}>
      <section className="rounded-[1.25rem] bg-gradient-to-b from-neutral-800 to-neutral-950 p-5 text-white shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.1)] dark:from-neutral-100 dark:to-neutral-300 dark:text-neutral-950">
        <h2 className="text-lg font-bold leading-snug">{s.title}</h2>
        <p className="mt-2 leading-7 opacity-80">{s.overview}</p>
      </section>

      {s.sections.map((section, i) => (
        <section key={i} className="surface p-5">
          <h3 className="flex items-start gap-2.5 font-bold leading-snug">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-text text-xs text-bg">
              {i + 1}
            </span>
            {section.heading}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {section.points.map((point, j) => (
              <li key={j} className="flex gap-2.5 leading-7">
                <span className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-muted" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {s.keyTerms.length > 0 && (
        <section className="surface p-5">
          <h3 className="font-bold">{s.language === "ar" ? "مصطلحات مهمة" : "Key terms"}</h3>
          <dl className="mt-3 divide-y divide-border">
            {s.keyTerms.map((t, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0">
                <dt className="font-semibold">{t.term}</dt>
                <dd className="mt-0.5 text-sm leading-6 text-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div dir="rtl" className="flex justify-center pt-1">
        <button
          type="button"
          onClick={regenerate}
          className="h-10 rounded-xl px-4 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          ولّد ملخص جديد
        </button>
      </div>
    </div>
  );
}
