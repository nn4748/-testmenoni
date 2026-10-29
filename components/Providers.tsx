"use client";

import Lenis from "lenis";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { registerLenis } from "@/lib/scroll";

// تمرير ناعم (Lenis) وبقعة ضوء تلحق المؤشر على البطاقات الزجاجية.
export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduced ? null : new Lenis({ lerp: 0.09, autoRaf: true });
    registerLenis(lenis);

    function onMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".surface");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      registerLenis(null);
      lenis?.destroy();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
