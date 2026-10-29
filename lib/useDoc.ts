"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CHANGE_EVENT, DOCS_KEY } from "./storage";
import type { StudyDoc } from "./types";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(DOCS_KEY);
  } catch {
    return null;
  }
}

// undefined = لسا ما قرينا (أثناء الرسم على السيرفر)، null = الملف مو موجود.
export function useDoc(id: string): StudyDoc | null | undefined {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      const docs: StudyDoc[] = raw ? JSON.parse(raw) : [];
      return docs.find((d) => d.id === id) ?? null;
    } catch {
      return null;
    }
  }, [raw, id]);
}
