"use client";

import { useSyncExternalStore } from "react";

// حالة المجسم ثلاثي الأبعاد: ساكن، أو "يعالج" وقت قراءة الملزمة وتوليد المواد.
export type SceneMode = "idle" | "processing";

let mode: SceneMode = "idle";
const listeners = new Set<() => void>();

export function setSceneMode(next: SceneMode) {
  if (next === mode) return;
  mode = next;
  listeners.forEach((l) => l());
}

export function getSceneMode(): SceneMode {
  return mode;
}

export function useSceneMode(): SceneMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => mode,
    () => "idle",
  );
}
