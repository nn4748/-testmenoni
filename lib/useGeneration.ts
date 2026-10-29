"use client";

import { useEffect, useState } from "react";
import { postJson } from "./api";
import { updateDoc } from "./storage";
import type { StudyDoc } from "./types";

type Field = "summary" | "cards";

// يولّد المحتوى أول مرة يُفتح، ويحفظه في الملف عشان ما يتولّد مرة ثانية.
export function useGeneration<K extends Field, R>(
  doc: StudyDoc,
  field: K,
  endpoint: string,
  pick: (response: R) => NonNullable<StudyDoc[K]>,
) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const data = doc[field];
  const pending = !data || regenerating;

  useEffect(() => {
    if (!pending || error) return;
    const controller = new AbortController();
    postJson<R>(endpoint, { text: doc.text }, controller.signal)
      .then((response) => {
        if (!updateDoc(doc.id, { [field]: pick(response) })) {
          setError("ما قدرنا نحفظ النتيجة لأن مساحة المتصفح ممتلئة. احذف ملفات قديمة من \"ملفاتي\".");
          return;
        }
        setRegenerating(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => controller.abort();
    // pick ثابتة من مكان الاستدعاء، فما نحتاجها في الاعتماديات.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, doc.text, field, endpoint, pending, error, attempt]);

  return {
    data: pending ? undefined : data,
    error,
    retry: () => {
      setError(null);
      setAttempt((a) => a + 1);
    },
    regenerate: () => setRegenerating(true),
  };
}
