"use client";

import type { Summary } from "@/lib/schemas";
import type { StudyDoc } from "@/lib/types";
import { useGeneration } from "@/lib/useGeneration";
import ErrorState from "./ErrorState";
import { Reveal } from "./motion/Reveal";
import GeneratingState from "./GeneratingState";

const STEPS = ["نقرأ الملزمة…", "نحدد الأفكار الرئيسية…", "نرتّب الأقسام…", "نكتب الملخص…"];

const pickSummary = (summary: Summary) => summary;

export default function SummaryPanel({ doc }: { doc: StudyDoc }) {
  const { data: s, error, retry, regenerate } = useGeneration(doc, "summary", "/api/summary", pickSummary);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!s) return <GeneratingState steps={STEPS} />;

  const dir = s.language === "ar" ? "rtl" : "ltr";

  return (
    <div className="space-y-5" dir={dir}>
      <Reveal onMount>
        <section className="surface overflow-hidden p-6">
          <p className="eyebrow">
            <span dir="ltr">Overview</span>
          </p>
          <h2 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{s.title}</h2>
          <p className="mt-3 text-[1.0625rem] leading-8 text-muted">{s.overview}</p>
        </section>
      </Reveal>

      <ol className="space-y-3">
        {s.sections.map((section, i) => (
          <Reveal key={i} as="li" onMount delay={0.1 + Math.min(i, 6) * 0.07}>
            <section className="surface p-5 sm:p-6">
              <h3 className="flex items-baseline gap-4 text-lg font-semibold leading-snug">
                <span className="font-display text-3xl tabular-nums text-faint" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {section.heading}
              </h3>
              <ul className="mt-4 space-y-3 ps-12">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-3 leading-8">
                    <span className="mt-4 h-px w-3 shrink-0 bg-faint" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))}
      </ol>

      {s.keyTerms.length > 0 && (
        <Reveal onMount>
          <section className="surface p-5 sm:p-6">
            <p className="eyebrow">
              <span dir="ltr">Key terms</span>
            </p>
            <h3 className="mt-2 text-lg font-semibold">{s.language === "ar" ? "مصطلحات مهمة" : "Terms to know"}</h3>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.keyTerms.map((t, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface-2/60 p-4">
                  <dt className="font-semibold">{t.term}</dt>
                  <dd className="mt-1 text-sm leading-7 text-muted">{t.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>
      )}

      <div dir="rtl" className="flex justify-center pt-2">
        <button type="button" onClick={regenerate} className="btn-ghost h-10">
          ولّد ملخص جديد
        </button>
      </div>
    </div>
  );
}
