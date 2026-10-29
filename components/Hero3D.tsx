"use client";

import { useRef } from "react";

// مشهد ثلاثي الأبعاد بـ CSS: ثلاث بطاقات (ملخص، بطاقة مراجعة، نتيجة اختبار)
// تطفو وتميل مع حركة المؤشر.
export default function Hero3D() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function tilt(e: React.PointerEvent) {
    const el = sceneRef.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${x * 18}deg`);
    el.style.setProperty("--rx", `${-y * 14}deg`);
  }

  function reset() {
    sceneRef.current?.style.setProperty("--ry", "0deg");
    sceneRef.current?.style.setProperty("--rx", "0deg");
  }

  return (
    <div
      onPointerMove={tilt}
      onPointerLeave={reset}
      className="relative mx-auto h-64 w-full max-w-sm select-none perspective-[1100px] sm:h-72"
      aria-hidden
    >
      <div
        ref={sceneRef}
        className="absolute inset-0 transition-transform duration-300 ease-out transform-3d"
        style={{ transform: "rotateX(calc(14deg + var(--rx, 0deg))) rotateY(calc(-16deg + var(--ry, 0deg)))" }}
      >
        {/* ظل أرضي */}
        <div className="absolute inset-x-8 bottom-2 h-10 rounded-[50%] bg-black/25 blur-2xl dark:bg-black/70" />

        {/* البطاقة الخلفية: ملخص */}
        <div className="absolute inset-x-6 top-2 transform-3d" style={{ transform: "translateZ(-60px) translateY(-6px)" }}>
          <div className="surface animate-float space-y-2.5 p-4 [animation-delay:-2s]">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-text" />
              <span className="h-2.5 w-24 rounded-full bg-text/80" />
            </div>
            <span className="block h-2 w-full rounded-full bg-surface-2" />
            <span className="block h-2 w-5/6 rounded-full bg-surface-2" />
            <span className="block h-2 w-2/3 rounded-full bg-surface-2" />
          </div>
        </div>

        {/* البطاقة الوسطى: بطاقة مراجعة سوداء */}
        <div className="absolute inset-x-12 top-16 transform-3d" style={{ transform: "translateZ(10px)" }}>
          <div className="animate-float rounded-[1.25rem] bg-gradient-to-b from-neutral-800 to-neutral-950 p-5 text-white shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.12)] ring-1 ring-white/10 dark:from-neutral-100 dark:to-neutral-300 dark:text-neutral-950 dark:ring-black/10">
            <span className="text-[10px] font-medium tracking-wide opacity-60">بطاقة ٣ من ١٢</span>
            <p className="mt-2 text-base font-semibold leading-relaxed">ما هو الميل الحدي للاستهلاك؟</p>
            <span className="mt-3 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] dark:bg-black/10">
              اضغط لإظهار الجواب
            </span>
          </div>
        </div>

        {/* البطاقة الأمامية: نتيجة الاختبار */}
        <div
          className="absolute bottom-6 start-2 w-36 transform-3d sm:start-0"
          style={{ transform: "translateZ(80px)" }}
        >
          <div className="surface animate-float flex items-center gap-3 p-3 [animation-delay:-4s]">
            <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-2)" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--text)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="94.2"
                strokeDashoffset="14"
              />
            </svg>
            <div>
              <p className="text-sm font-bold">٨٥٪</p>
              <p className="text-[10px] text-muted">نتيجة الاختبار</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
