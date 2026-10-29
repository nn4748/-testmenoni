"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { setSceneMode } from "@/lib/sceneState";
import HeroStage from "./hero/HeroStage";

const EASE = [0.16, 1, 0.3, 1] as const;

// حالة المعالجة: المجسم ينفصل ويتحرك، والخطوات تتبدل تحته.
// overlay = تغطي الشاشة كاملة (وقت قراءة الملف)، inline = داخل الصفحة (وقت التوليد).
export default function GeneratingState({
  steps,
  variant = "inline",
  hint = "ياخذ عادة بين ٢٠ و٦٠ ثانية",
}: {
  steps: string[];
  variant?: "inline" | "overlay";
  hint?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setSceneMode("processing");
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 4200);
    return () => {
      clearInterval(timer);
      setSceneMode("idle");
    };
  }, [steps.length]);

  const body = (
    <div className="flex flex-col items-center text-center" aria-live="polite">
      <HeroStage className={variant === "overlay" ? "h-[46svh] w-full max-w-lg" : "h-64 w-full max-w-sm"} />
      <p className="eyebrow mt-2" dir="ltr">
        Distilling
      </p>
      <div className="relative mt-3 h-8 w-full overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={step}
            className="absolute inset-x-0 text-lg font-medium"
            initial={{ y: 24, opacity: 0, filter: "blur(6px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -24, opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-5 h-px w-48 overflow-hidden bg-border">
        <motion.div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-text to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
      <p className="mt-4 text-xs text-faint">{hint}</p>
    </div>
  );

  if (variant === "inline") return <div className="py-6">{body}</div>;

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/80 px-4 backdrop-blur-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {body}
    </motion.div>
  );
}
