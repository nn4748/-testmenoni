"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { isArabic } from "@/lib/text";
import { useDoc } from "@/lib/useDoc";
import { CardsIcon, ChevronIcon, QuizIcon, SummaryIcon } from "./Icons";
import FlashcardsPanel from "./FlashcardsPanel";
import QuizPanel from "./QuizPanel";
import Spinner from "./Spinner";
import SummaryPanel from "./SummaryPanel";

const TABS = [
  { id: "summary", label: "الملخص", icon: SummaryIcon },
  { id: "cards", label: "البطاقات", icon: CardsIcon },
  { id: "quiz", label: "الاختبار", icon: QuizIcon },
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
      <div className="page space-y-4 py-16 text-center">
        <p className="text-lg font-semibold">ما لقينا هذا الملف</p>
        <p className="text-muted">يمكن انحذف من المتصفح. ارفعه مرة ثانية.</p>
        <Link href="/" className="btn-primary px-5 py-3">
          ارفع ملف
        </Link>
      </div>
    );
  }

  const words = doc.text.split(/\s+/).length;

  return (
    <div className="page space-y-6 pt-4">
      <motion.header
        className="space-y-4"
        initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="eyebrow">
          <span dir="ltr">Study set · {doc.source === "pdf" ? "PDF" : "Text"}</span>
        </p>
        <h1 className="text-[1.75rem] font-semibold leading-[1.3] sm:text-[2.25rem]">
          <bdi>{doc.title}</bdi>
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-faint">
          {doc.pages ? <span className="tabular-nums">{doc.pages.toLocaleString("ar-EG")} صفحة</span> : null}
          <span className="tabular-nums">{words.toLocaleString("ar-EG")} كلمة</span>
          <span>{isArabic(doc.text) ? "عربي" : "English"}</span>
        </div>
      </motion.header>

      <div role="tablist" className="sticky top-[4.5rem] z-[5] -mx-4 px-4 py-2">
        <div className="grid grid-cols-3 rounded-2xl border border-border bg-[var(--glass)] p-1 shadow-lux backdrop-blur-2xl backdrop-saturate-150">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              role="tab"
              aria-selected={tab === tabId}
              onClick={() => {
                setTab(tabId);
                setOpened((o) => new Set(o).add(tabId));
              }}
              className={`relative flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors duration-300 ${
                tab === tabId ? "text-bg" : "text-faint hover:text-muted"
              }`}
            >
              {tab === tabId && (
                <motion.span
                  layoutId="study-tab"
                  className="absolute inset-0 rounded-xl bg-text shadow-[0_8px_24px_-12px_var(--text)]"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
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

      {opened.has("quiz") && (
        <div hidden={tab !== "quiz"}>
          <QuizPanel doc={doc} />
        </div>
      )}

      <details className="surface group">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium text-muted">
          النص الأصلي من الملزمة
          <ChevronIcon className="size-4 text-muted transition group-open:rotate-180" />
        </summary>
        <p
          dir="auto"
          data-lenis-prevent
          className="max-h-96 overflow-y-auto whitespace-pre-line border-t border-border p-4 text-sm leading-7 text-muted"
        >
          {doc.text}
        </p>
      </details>
    </div>
  );
}
