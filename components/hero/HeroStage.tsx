"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const MonolithScene = dynamic(() => import("./MonolithScene"), { ssr: false });

type Support = "pending" | "webgl" | "static";

function detectSupport(): { support: Support; quality: "high" | "low" } {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return { support: "static", quality: "low" };
  try {
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2") && !canvas.getContext("webgl")) return { support: "static", quality: "low" };
  } catch {
    return { support: "static", quality: "low" };
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  if (cores <= 2 || memory <= 2) return { support: "static", quality: "low" };
  const coarse = matchMedia("(pointer: coarse)").matches;
  return { support: "webgl", quality: coarse || cores <= 4 ? "low" : "high" };
}

// يحمّل المشهد بعد ما تجهز الصفحة، ويوقف الرسم إذا طلع من الشاشة.
// قبل التحميل، وفي الأجهزة الضعيفة، تطلع صورة ثابتة للمجسم.
export default function HeroStage({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ support, quality }, setEnv] = useState<{ support: Support; quality: "high" | "low" }>({
    support: "pending",
    quality: "low",
  });
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => setEnv(detectSupport()));
    return () => cancel(handle);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`} aria-hidden>
      <StaticRender className={`transition-opacity duration-1000 ${ready ? "opacity-0" : "opacity-100"}`} />
      {support === "webgl" && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}>
          <MonolithScene active={visible} quality={quality} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}

// صورة ثابتة للمجسم (مرسومة من نفس المشهد) للأجهزة اللي ما تدعم WebGL أو وقت التحميل.
function StaticRender({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-still.webp"
        alt=""
        width={1200}
        height={900}
        className="h-full w-full object-contain"
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}
