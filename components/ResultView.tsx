"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useResults } from "@/lib/useDoc";
import { formatDate } from "./Library";
import QuizResults from "./QuizResults";
import Spinner from "./Spinner";

export default function ResultView() {
  const { id } = useParams<{ id: string }>();
  const results = useResults();

  if (!results) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );
  }

  const result = results.find((r) => r.id === id);
  if (!result) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg font-semibold">ما لقينا هذي النتيجة</p>
        <Link href="/library" className="btn-primary h-11 px-5">
          ارجع لملفاتي
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-4">
      <header>
        <Link href="/library" className="text-sm text-muted hover:text-text">
          → ملفاتي
        </Link>
        <h1 className="mt-2 text-xl font-bold leading-snug">
          <bdi>{result.docTitle}</bdi>
        </h1>
        <p className="mt-1 text-sm text-muted">اختبار بتاريخ {formatDate(result.takenAt)}</p>
      </header>
      <QuizResults
        result={result}
        actions={
          <Link href={`/study/${result.docId}`} className="btn-secondary h-12">
            ارجع للملف
          </Link>
        }
      />
    </div>
  );
}
