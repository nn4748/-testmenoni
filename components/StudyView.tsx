"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { isArabic } from "@/lib/text";
import { useDoc } from "@/lib/useDoc";
import Spinner from "./Spinner";

const TABS = [
  { id: "summary", label: "الملخص" },
  { id: "cards", label: "البطاقات" },
  { id: "quiz", label: "الاختبار" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function StudyView() {
  const { id } = useParams<{ id: string }>();
  const doc = useDoc(id);
  const [tab, setTab] = useState<Tab>("summary");

  if (doc === undefined) {
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg font-semibold">ما لقينا هذا الملف</p>
        <p className="text-muted">يمكن انحذف من المتصفح. ارفعه مرة ثانية.</p>
        <Link href="/" className="inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-brand-ink">
          ارفع ملف
        </Link>
      </div>
    );
  }

  const words = doc.text.split(/\s+/).length;

  return (
    <div className="space-y-5">
      <section className="space-y-1">
        <h1 className="text-xl font-bold leading-snug" dir="auto">
          {doc.title}
        </h1>
        <p className="text-sm text-muted">
          {doc.pages ? `${doc.pages} صفحة · ` : ""}
          {words.toLocaleString("ar")} كلمة · {isArabic(doc.text) ? "عربي" : "إنجليزي"}
        </p>
      </section>

      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-10 rounded-lg text-sm font-medium transition ${
              tab === t.id ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-3 text-sm text-muted">النص المستخرج من الملزمة:</p>
        <p dir="auto" className="max-h-96 overflow-y-auto whitespace-pre-line text-sm leading-7">
          {doc.text}
        </p>
      </section>
    </div>
  );
}
