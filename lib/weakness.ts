import type { QuizQuestion } from "./schemas";
import type { WeakTopic } from "./types";

// يجمع الأسئلة الغلط حسب الموضوع، ويرتّب المواضيع من الأضعف للأقوى.
export function weakTopics(questions: QuizQuestion[], answers: number[]): WeakTopic[] {
  const byTopic = new Map<string, WeakTopic>();
  questions.forEach((q, i) => {
    const topic = q.topic.trim() || "عام";
    const entry = byTopic.get(topic) ?? { topic, wrong: 0, total: 0 };
    entry.total++;
    if (answers[i] !== q.correctIndex) entry.wrong++;
    byTopic.set(topic, entry);
  });
  return [...byTopic.values()]
    .filter((t) => t.wrong > 0)
    .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong);
}

export function scoreMessage(percent: number): string {
  if (percent >= 90) return "ممتاز! أنت جاهز للاختبار.";
  if (percent >= 75) return "أداء قوي، راجع النقاط اللي غلطت فيها وتصير جاهز.";
  if (percent >= 50) return "بداية حلوة، تحتاج مراجعة لبعض المواضيع.";
  return "لا تشيل هم، راجع الملخص والبطاقات وجرّب مرة ثانية.";
}
