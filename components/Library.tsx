"use client";

import Link from "next/link";
import { deleteDoc } from "@/lib/storage";
import type { QuizResult, StudyDoc } from "@/lib/types";
import { useDocs, useResults } from "@/lib/useDoc";
import { Reveal } from "./motion/Reveal";
import Spinner from "./Spinner";

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-arab-ca-gregory", { day: "numeric", month: "short", year: "numeric" }).format(ts);
}

export default function Library() {
  const docs = useDocs();
  const results = useResults();

  if (!docs || !results) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page space-y-6 pt-4">
      <Reveal onMount>
        <header className="space-y-5">
          <p className="eyebrow">
            <span dir="ltr">Library</span>
          </p>
          <div className="flex items-end justify-between gap-3">
            <h1 className="text-[2rem] font-semibold leading-tight">ملفاتي</h1>
            <Link href="/#start" className="btn-primary h-10 px-4 text-sm">
              ملف جديد
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat value={docs.length} label="ملف" />
            <Stat value={results.length} label="اختبار" />
          </div>
        </header>
      </Reveal>

      {docs.length === 0 ? (
        <Reveal onMount delay={0.1}>
          <div className="surface flex flex-col items-center gap-4 px-6 py-16 text-center">
            <p className="font-display text-5xl text-faint" dir="ltr">
              Empty, <em>for now.</em>
            </p>
            <p className="max-w-xs leading-7 text-muted">ارفع أول ملزمة، وكل ملخصاتك وبطاقاتك واختباراتك بتنحفظ هنا.</p>
            <Link href="/#start" className="btn-primary mt-2 h-12 px-6">
              ارفع ملزمة
            </Link>
          </div>
        </Reveal>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc, i) => (
            <Reveal key={doc.id} as="li" onMount delay={0.1 + Math.min(i, 8) * 0.06}>
              <DocItem doc={doc} results={results.filter((r) => r.docId === doc.id)} />
            </Reveal>
          ))}
        </ul>
      )}

      <p className="text-center text-xs leading-6 text-faint">
        الملفات محفوظة في هذا المتصفح فقط. إذا مسحت بيانات المتصفح بتنحذف.
      </p>
    </div>
  );
}

function DocItem({ doc, results }: { doc: StudyDoc; results: QuizResult[] }) {
  const last = results[0];
  const best = results.reduce((m, r) => Math.max(m, r.correct / r.questions.length), 0);

  function remove() {
    if (window.confirm(`تبي تحذف "${doc.title}" وكل نتائج اختباراته؟`)) deleteDoc(doc.id);
  }

  return (
    <div className="surface p-5">
      <div className="flex items-start gap-4">
        <span className="font-display text-4xl leading-none tabular-nums text-faint" dir="ltr">
          {best ? Math.round(best * 100) : "—"}
          {best ? <span className="text-lg">%</span> : null}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/study/${doc.id}`} className="block text-lg font-semibold leading-snug transition hover:text-muted">
            <bdi>{doc.title}</bdi>
          </Link>
          <p className="mt-1 text-xs text-faint">{formatDate(doc.createdAt)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Status done={!!doc.summary} label="ملخص" />
            <Status done={!!doc.cards} label={doc.cards ? `${doc.cards.length.toLocaleString("ar-EG")} بطاقة` : "بطاقات"} />
            <Status done={results.length > 0} label={results.length ? `أفضل نتيجة ${Math.round(best * 100).toLocaleString("ar-EG")}٪` : "اختبار"} />
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          aria-label={`حذف ${doc.title}`}
          className="btn-ghost size-9 shrink-0 p-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden>
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </svg>
        </button>
      </div>

      {results.length > 0 && (
        <details className="group mt-4 border-t border-border pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm">
            <span>
              آخر اختبار: <span className="font-semibold tabular-nums">{last.correct.toLocaleString("ar-EG")}/{last.questions.length.toLocaleString("ar-EG")}</span>
            </span>
            <span className="text-muted group-open:hidden">كل النتائج ({results.length.toLocaleString("ar-EG")})</span>
            <span className="hidden text-muted group-open:inline">إخفاء</span>
          </summary>
          <ul className="mt-2 divide-y divide-border">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={`/results/${r.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-text">
                  <span className="text-muted">{formatDate(r.takenAt)}</span>
                  <span className="font-semibold tabular-nums">
                    {Math.round((r.correct / r.questions.length) * 100).toLocaleString("ar-EG")}٪
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="surface px-5 py-4">
      <p className="text-4xl leading-none">
        <span className="font-display tabular-nums">{value}</span>
      </p>
      <p className="mt-1 text-sm text-faint">{label}</p>
    </div>
  );
}

function Status({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`chip ${done ? "border-border-strong text-text" : "opacity-50"}`}>
      <span className={`size-1.5 rounded-full ${done ? "bg-text" : "bg-muted/50"}`} aria-hidden />
      {label}
    </span>
  );
}
