"use client";

import { useState } from "react";

// معاينات مصغّرة لكل مخرج في الصفحة الرئيسية. المحتوى مثال توضيحي.

export function SummaryPreview() {
  return (
    <div className="surface overflow-hidden p-0" aria-label="مثال على ملخص">
      <div className="border-b border-border bg-surface-2/60 px-5 py-4">
        <p className="eyebrow">
          <span dir="ltr">Summary · 4 sections</span>
        </p>
        <p className="mt-2 text-lg font-semibold">نموذج الدخل والإنفاق في الاقتصاد المغلق</p>
        <p className="mt-1 text-sm leading-7 text-muted">كيف يتحدد الدخل التوازني، وكيف تكبّر المضاعفات أثر الإنفاق الحكومي.</p>
      </div>
      <div className="space-y-5 p-5">
        {[
          ["دالة الاستهلاك", ["الاستهلاك يعتمد على الدخل المتاح.", "الميل الحدي للاستهلاك = 0.6"]],
          ["مضاعف الإنفاق الحكومي", ["المضاعف = 1 ÷ (1 − MPC) = 2.5"]],
        ].map(([heading, points], i) => (
          <div key={i}>
            <p className="flex items-center gap-2.5 font-semibold">
              <span className="font-display text-lg text-faint">{String(i + 1).padStart(2, "0")}</span>
              {heading as string}
            </p>
            <ul className="mt-2 space-y-1.5 ps-8">
              {(points as string[]).map((p) => (
                <li key={p} className="flex gap-2 text-sm leading-7 text-muted">
                  <span className="mt-3 h-px w-3 shrink-0 bg-faint" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsPreview() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative mx-auto h-64 max-w-sm perspective-[1200px]">
      {/* بطاقات خلفية */}
      {[2, 1].map((n) => (
        <div
          key={n}
          aria-hidden
          className="surface absolute inset-x-6 top-0 h-56"
          style={{ transform: `translateY(${n * 14}px) scale(${1 - n * 0.05})`, opacity: 1 - n * 0.3 }}
        />
      ))}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "إظهار السؤال" : "إظهار الجواب"}
        className="absolute inset-x-6 top-0 h-56 transform-3d transition-transform duration-[900ms] ease-out-expo"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-gradient-to-b from-neutral-800 to-black p-6 text-white shadow-lux ring-1 ring-white/10 backface-hidden">
          <span className="eyebrow text-neutral-400"><span dir="ltr">Card 03 / 12</span></span>
          <span className="text-lg font-semibold leading-8">ما هو الميل الحدي للاستهلاك؟</span>
          <span className="text-xs text-neutral-400">اضغط للقلب</span>
        </span>
        <span className="surface absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 rotate-y-180 backface-hidden">
          <span className="eyebrow">Answer</span>
          <span className="leading-8">نسبة التغير في الاستهلاك إلى التغير في الدخل المتاح.</span>
        </span>
      </button>
    </div>
  );
}

export function QuizPreview() {
  const options = ["1.5", "2.5", "0.4", "6"];
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="surface p-5">
        <span className="chip">المضاعفات</span>
        <p className="mt-3 font-semibold leading-8">كم يساوي مضاعف الإنفاق الحكومي إذا MPC = 0.6؟</p>
        <div className="mt-4 space-y-2">
          {options.map((o, i) => (
            <div
              key={o}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                i === 1
                  ? "border-text bg-text text-bg shadow-[0_0_32px_-6px_var(--text)]"
                  : "border-border text-muted"
              }`}
            >
              <span className={`grid size-6 place-items-center rounded-md text-xs font-bold ${i === 1 ? "bg-bg text-text" : "bg-surface-2"}`}>
                {"أبجد"[i]}
              </span>
              <span dir="ltr" className="tabular-nums">{o}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="surface flex items-center gap-5 p-5 sm:w-52 sm:flex-col sm:justify-center sm:text-center">
        <p className="font-display text-6xl tabular-nums leading-none">
          85<span className="text-2xl text-faint">%</span>
        </p>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">نقاط ضعفك</p>
          <p className="text-muted">الضرائب · المضاعفات</p>
        </div>
      </div>
    </div>
  );
}
