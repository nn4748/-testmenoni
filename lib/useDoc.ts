"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CHANGE_EVENT, DOCS_KEY, RESULTS_KEY } from "./storage";
import type { QuizResult, StudyDoc } from "./types";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// undefined = لسا ما قرينا (أثناء الرسم على السيرفر).
function useStoredList<T>(key: string): T[] | undefined {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }, [raw]);
}

export function useDocs(): StudyDoc[] | undefined {
  const docs = useStoredList<StudyDoc>(DOCS_KEY);
  return useMemo(() => docs && [...docs].sort((a, b) => b.createdAt - a.createdAt), [docs]);
}

export function useResults(): QuizResult[] | undefined {
  const results = useStoredList<QuizResult>(RESULTS_KEY);
  return useMemo(() => results && [...results].sort((a, b) => b.takenAt - a.takenAt), [results]);
}

// undefined = لسا ما قرينا، null = الملف مو موجود.
export function useDoc(id: string): StudyDoc | null | undefined {
  const docs = useStoredList<StudyDoc>(DOCS_KEY);
  return useMemo(() => (docs === undefined ? undefined : (docs.find((d) => d.id === id) ?? null)), [docs, id]);
}
