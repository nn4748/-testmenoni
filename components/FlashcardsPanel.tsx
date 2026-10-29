"use client";

import { useEffect, useState } from "react";
import type { Flashcard } from "@/lib/schemas";
import type { StudyDoc } from "@/lib/types";
import { useGeneration } from "@/lib/useGeneration";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";

const STEPS = ["نقرأ الملزمة…", "نختار أهم المعلومات…", "نكتب الأسئلة والأجوبة…", "نرتّب البطاقات…"];

const pickCards = (r: { cards: Flashcard[] }) => r.cards;

export default function FlashcardsPanel({ doc }: { doc: StudyDoc }) {
  const { data: cards, error, retry, regenerate } = useGeneration(doc, "cards", "/api/flashcards", pickCards);

  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!cards) return <GeneratingState steps={STEPS} />;
  if (cards.length === 0) {
    return <ErrorState message="ما طلعت بطاقات من هذي الملزمة. جرّب تولّدها مرة ثانية." onRetry={regenerate} />;
  }
  // المفتاح يصفّر حالة المراجعة إذا تولّدت بطاقات جديدة.
  return <Deck key={cards.map((c) => c.front).join("|")} cards={cards} onRegenerate={regenerate} />;
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Deck({ cards, onRegenerate }: { cards: Flashcard[]; onRegenerate: () => void }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [missed, setMissed] = useState<Set<number>>(new Set());
  const [knownCount, setKnownCount] = useState(0);

  const done = pos >= order.length;
  const card = done ? null : cards[order[pos]];

  function go(next: number) {
    setFlipped(false);
    setPos(Math.max(0, Math.min(next, order.length)));
  }

  function answer(known: boolean) {
    const index = order[pos];
    setMissed((m) => {
      const copy = new Set(m);
      if (known) copy.delete(index);
      else copy.add(index);
      return copy;
    });
    if (known) setKnownCount((k) => k + 1);
    go(pos + 1);
  }

  function restart(indices: number[]) {
    setOrder(indices);
    setMissed(new Set());
    setKnownCount(0);
    go(0);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || (e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowLeft") go(pos + 1); // في الواجهة العربية اليسار = التالي
      else if (e.key === "ArrowRight") go(pos - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (done) {
    const missedList = [...missed];
    return (
      <div className="surface space-y-4 p-6 text-center">
        <p className="text-4xl" aria-hidden>
          {missedList.length === 0 ? "🎉" : "💪"}
        </p>
        <h2 className="text-lg font-bold">خلصت المراجعة</h2>
        <p className="text-muted">
          عرفت {knownCount.toLocaleString("ar-EG")} من {order.length.toLocaleString("ar-EG")} بطاقة
        </p>
        <div className="flex flex-col gap-2 pt-2">
          {missedList.length > 0 && (
            <button
              type="button"
              onClick={() => restart(missedList)}
              className="btn-primary h-12"
            >
              راجع اللي ما عرفتها ({missedList.length.toLocaleString("ar-EG")})
            </button>
          )}
          <button
            type="button"
            onClick={() => restart(cards.map((_, i) => i))}
            className="btn-secondary h-12"
          >
            ابدأ من جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="tabular-nums">
          {(pos + 1).toLocaleString("ar-EG")} / {order.length.toLocaleString("ar-EG")}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(pos / order.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => restart(shuffled(cards.length))}
          className="rounded-lg px-2 py-1 font-medium hover:bg-surface-2 hover:text-text"
        >
          خلط
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "إخفاء الجواب" : "إظهار الجواب"}
        className="block w-full perspective-[1200px]"
      >
        <div
          className={`relative grid min-h-72 transition-transform duration-500 transform-3d ${
            flipped ? "rotate-y-180" : ""
          }`}
        >
          <Face>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs opacity-80 dark:bg-black/10">{card!.topic}</span>
            <p dir="auto" className="text-xl font-semibold leading-relaxed">
              {card!.front}
            </p>
            <span className="text-xs opacity-60">اضغط على البطاقة لإظهار الجواب</span>
          </Face>
          <Face back>
            <span className="chip">الجواب</span>
            <p dir="auto" className="text-lg leading-relaxed">
              {card!.back}
            </p>
            <span className="text-xs text-muted">اضغط للرجوع للسؤال</span>
          </Face>
        </div>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => answer(false)}
            className="h-12 rounded-xl border border-danger/30 bg-danger-soft font-semibold text-danger"
          >
            ما عرفتها
          </button>
          <button type="button" onClick={() => answer(true)} className="btn-primary h-12">
            عرفتها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => go(pos - 1)}
            disabled={pos === 0}
            className="btn-secondary h-12 disabled:opacity-40"
          >
            السابقة
          </button>
          <button type="button" onClick={() => go(pos + 1)} className="btn-secondary h-12">
            التالية
          </button>
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRegenerate}
          className="h-10 rounded-xl px-4 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text"
        >
          ولّد بطاقات جديدة
        </button>
      </div>
    </div>
  );
}

function Face({ back = false, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`col-start-1 row-start-1 flex flex-col items-center justify-center gap-4 rounded-3xl border p-6 text-center backface-hidden ${
        back
          ? "rotate-y-180 border-border bg-surface shadow-lux"
          : "border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-950 text-white shadow-[0_30px_60px_-24px_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.1)] dark:border-black/10 dark:from-neutral-100 dark:to-neutral-300 dark:text-neutral-950"
      }`}
    >
      {children}
    </div>
  );
}
