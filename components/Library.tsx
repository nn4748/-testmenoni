"use client";

import Link from "next/link";
import { deleteDoc } from "@/lib/storage";
import type { QuizResult, StudyDoc } from "@/lib/types";
import { useDocs, useResults } from "@/lib/useDoc";
import { FileIcon } from "./Icons";
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
    <div className="space-y-6 pt-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ملفاتي</h1>
          <p className="mt-1 text-sm text-muted">
            {docs.length.toLocaleString("ar-EG")} ملف · {results.length.toLocaleString("ar-EG")} اختبار
          </p>
        </div>
        <Link href="/" className="btn-primary h-10 px-4 text-sm">
          ملف جديد
        </Link>
      </header>

      {docs.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-text text-bg shadow-lg">
            <FileIcon className="size-7" />
          </span>
          <p className="font-semibold">ما عندك ملفات للحين</p>
          <p className="max-w-xs text-sm leading-6 text-muted">ارفع أول ملزمة، وكل ملخصاتك وبطاقاتك واختباراتك بتنحفظ هنا.</p>
          <Link href="/" className="btn-primary mt-2 h-11 px-5">
            ارفع ملزمة
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <DocItem key={doc.id} doc={doc} results={results.filter((r) => r.docId === doc.id)} />
          ))}
        </ul>
      )}

      <p className="text-center text-xs leading-5 text-muted">
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
    <li className="surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
          <FileIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/study/${doc.id}`} className="block font-semibold leading-snug hover:underline">
            <bdi>{doc.title}</bdi>
          </Link>
          <p className="mt-0.5 text-xs text-muted">{formatDate(doc.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Status done={!!doc.summary} label="ملخص" />
            <Status done={!!doc.cards} label={doc.cards ? `${doc.cards.length.toLocaleString("ar-EG")} بطاقة` : "بطاقات"} />
            <Status done={results.length > 0} label={results.length ? `أفضل نتيجة ${Math.round(best * 100).toLocaleString("ar-EG")}٪` : "اختبار"} />
          </div>
        </div>
        <button
          type="button"
          onClick={remove}
          aria-label={`حذف ${doc.title}`}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-danger-soft hover:text-danger"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4" aria-hidden>
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </svg>
        </button>
      </div>

      {results.length > 0 && (
        <details className="group mt-3 border-t border-border pt-3">
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
    </li>
  );
}

function Status({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`chip ${done ? "border-text/20 text-text" : "opacity-60"}`}>
      <span className={`size-1.5 rounded-full ${done ? "bg-text" : "bg-muted/50"}`} aria-hidden />
      {label}
    </span>
  );
}
