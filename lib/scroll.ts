"use client";

import type Lenis from "lenis";

// Lenis يتحكم بالتمرير، فنمرر من خلاله إذا كان شغّال.
let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.1 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
