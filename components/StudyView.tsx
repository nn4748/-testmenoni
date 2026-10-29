"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { isArabic } from "@/lib/text";
import { useDoc } from "@/lib/useDoc";
import { CardsIcon, ChevronIcon, FileIcon, QuizIcon, SummaryIcon } from "./Icons";
import FlashcardsPanel from "./FlashcardsPanel";
import Spinner from "./Spinner";
import SummaryPanel from "./SummaryPanel";

const TABS = [
  { id: "summary", label: "الملخص", icon: SummaryIcon, soon: "ملخص منظم بعناوين ونقاط رئيسية من الملزمة." },
  { id: "cards", label: "البطاقات", icon: CardsIcon, soon: "بطاقات سؤال وجواب تقلبها وتراجع فيها." },
  { id: "quiz", label: "الاختبار", icon: QuizIcon, soon: "اختبار اختيار من متعدد مع تصحيح ونقاط ضعفك." },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function StudyView() {
  const { id } = useParams<{ id: string }>();
  const doc = useDoc(id);
  const [tab, setTab] = useState<Tab>("summary");
  // التبويب ما يبدأ التوليد إلا أول ما يُفتح، وبعدها يبقى مركّب.
  const [opened, setOpened] = useState<Set<Tab>>(() => new Set(["summary"]));

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
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-5 pt-2">
      <section className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
          <FileIcon className="size-6" />
        </span>
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-bold leading-snug">
            <bdi>{doc.title}</bdi>
          </h1>
          <div className="flex flex-wrap gap-1.5 text-xs text-muted">
            {doc.pages ? <Badge>{doc.pages.toLocaleString("ar-EG")} صفحة</Badge> : null}
            <Badge>{words.toLocaleString("ar-EG")} كلمة</Badge>
            <Badge>{isArabic(doc.text) ? "عربي" : "English"}</Badge>
          </div>
        </div>
      </section>

      <div role="tablist" className="sticky top-14 z-[5] -mx-4 bg-bg/90 px-4 py-2 backdrop-blur">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              role="tab"
              aria-selected={tab === tabId}
              onClick={() => {
                setTab(tabId);
                setOpened((o) => new Set(o).add(tabId));
              }}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition ${
                tab === tabId ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* نخلي الملخص مركّب حتى لو التبويب مخفي، عشان التوليد ما ينقطع لو تنقّل الطالب. */}
      <div hidden={tab !== "summary"}>
        <SummaryPanel doc={doc} />
      </div>

      {opened.has("cards") && (
        <div hidden={tab !== "cards"}>
          <FlashcardsPanel doc={doc} />
        </div>
      )}

      {tab === "quiz" && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted">
            <current.icon className="size-6" />
          </span>
          <p className="font-semibold">{current.label} قريبًا</p>
          <p className="max-w-xs text-sm leading-6 text-muted">{current.soon}</p>
        </section>
      )}

      <details className="group rounded-2xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-medium">
          النص المستخرج من الملزمة
          <ChevronIcon className="size-4 text-muted transition group-open:rotate-180" />
        </summary>
        <p
          dir="auto"
          className="max-h-96 overflow-y-auto whitespace-pre-line border-t border-border p-4 text-sm leading-7 text-muted"
        >
          {doc.text}
        </p>
      </details>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-surface px-2.5 py-0.5">{children}</span>;
}
