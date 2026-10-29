"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";

// حالة تحميل بخطوات تتغير، عشان الطالب يعرف إن الشغل ماشي.
export default function GeneratingState({ steps }: { steps: string[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 4500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
        <span className="text-brand">
          <Spinner />
        </span>
        <div>
          <p className="font-medium">{steps[step]}</p>
          <p className="text-xs text-muted">ياخذ عادة بين 20 و60 ثانية</p>
        </div>
      </div>
      <div className="space-y-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-border bg-surface p-5">
            <div className="h-4 w-1/3 rounded bg-surface-2" />
            <div className="h-3 w-full rounded bg-surface-2" />
            <div className="h-3 w-5/6 rounded bg-surface-2" />
            <div className="h-3 w-2/3 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
