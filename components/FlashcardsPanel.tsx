"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Flashcard } from "@/lib/schemas";
import type { StudyDoc } from "@/lib/types";
import { useGeneration } from "@/lib/useGeneration";
import ErrorState from "./ErrorState";
import GeneratingState from "./GeneratingState";
import { Reveal } from "./motion/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

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
      <Reveal onMount>
        <div className="surface space-y-5 px-6 py-10 text-center">
          <p className="eyebrow">
            <span dir="ltr">Session complete</span>
          </p>
          <p className="font-display text-7xl leading-none tabular-nums" dir="ltr">
            {knownCount}
            <span className="text-3xl text-faint">/{order.length}</span>
          </p>
          <p className="text-muted">
            {missedList.length === 0 ? "عرفت كل البطاقات. ممتاز." : `باقي ${missedList.length.toLocaleString("ar-EG")} بطاقة تحتاج مراجعة.`}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            {missedList.length > 0 && (
              <button type="button" onClick={() => restart(missedList)} className="btn-primary h-12">
                راجع اللي ما عرفتها
              </button>
            )}
            <button type="button" onClick={() => restart(cards.map((_, i) => i))} className="btn-secondary h-12">
              ابدأ من جديد
            </button>
          </div>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 text-sm text-faint">
        <span className="font-display text-xl tabular-nums text-text" dir="ltr">
          {String(pos + 1).padStart(2, "0")}
          <span className="text-faint"> / {String(order.length).padStart(2, "0")}</span>
        </span>
        <div className="h-px flex-1 bg-border">
          <motion.div
            className="h-px bg-text"
            animate={{ width: `${(pos / order.length) * 100}%` }}
            transition={{ duration: 0.8, ease: EASE }}
          />
        </div>
        <button type="button" onClick={() => restart(shuffled(cards.length))} className="btn-ghost h-8 px-2.5">
          خلط
        </button>
      </div>

      <FlipCard
        key={`${pos}-${order[pos]}`}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
        front={
          <>
            <span className="eyebrow text-neutral-400 dark:text-neutral-500">{card!.topic}</span>
            <p dir="auto" className="text-xl font-semibold leading-[1.7] sm:text-2xl">
              {card!.front}
            </p>
            <span className="text-xs text-neutral-500">اضغط للقلب</span>
          </>
        }
        back={
          <>
            <span className="eyebrow"><span dir="ltr">Answer</span></span>
            <p dir="auto" className="text-lg leading-[1.8]">
              {card!.back}
            </p>
          </>
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {flipped ? (
          <motion.div
            key="judge"
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <button type="button" onClick={() => answer(false)} className="btn-secondary h-12">
              ما عرفتها
            </button>
            <button type="button" onClick={() => answer(true)} className="btn-primary h-12">
              عرفتها
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="nav"
            className="grid grid-cols-2 gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <button type="button" onClick={() => go(pos - 1)} disabled={pos === 0} className="btn-secondary h-12">
              السابقة
            </button>
            <button type="button" onClick={() => go(pos + 1)} className="btn-secondary h-12">
              التالية
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center">
        <button type="button" onClick={onRegenerate} className="btn-ghost h-10">
          ولّد بطاقات جديدة
        </button>
      </div>
    </div>
  );
}

// قلب ثلاثي الأبعاد بثقل (spring)، ولمعة تمر على البطاقة كل ما انقلبت.
function FlipCard({
  flipped,
  onFlip,
  front,
  back,
}: {
  flipped: boolean;
  onFlip: () => void;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  const [flips, setFlips] = useState(0);
  return (
    <motion.button
      type="button"
      onClick={() => {
        setFlips((n) => n + 1);
        onFlip();
      }}
      aria-label={flipped ? "إظهار السؤال" : "إظهار الجواب"}
      className="block w-full perspective-[1400px]"
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, ease: EASE }}
      whileTap={{ scale: 0.985 }}
    >
      <motion.div
        className="relative grid min-h-80 transform-3d"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 14, mass: 1.1 }}
      >
        <Face sheenKey={flips}>{front}</Face>
        <Face back sheenKey={flips}>
          {back}
        </Face>
      </motion.div>
    </motion.button>
  );
}

function Face({ back = false, sheenKey, children }: { back?: boolean; sheenKey: number; children: React.ReactNode }) {
  return (
    <div
      className={`relative col-start-1 row-start-1 flex flex-col items-center justify-center gap-5 overflow-hidden rounded-[1.75rem] p-8 text-center backface-hidden ${
        back
          ? "surface rotate-y-180"
          : "bg-gradient-to-b from-neutral-800 via-neutral-950 to-black text-white shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.14)] ring-1 ring-white/10 dark:from-neutral-900 dark:via-neutral-950"
      }`}
    >
      {sheenKey > 0 && (
        <motion.span
          key={sheenKey}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          style={{ skewX: -16 }}
          initial={{ x: "-150%" }}
          animate={{ x: "250%" }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
        />
      )}
      {children}
    </div>
  );
}
