import "server-only";
import { generate, languageInstruction } from "./ai";
import { chunkText, mapLimit } from "./chunk";
import { AppError } from "./errors";
import { QuizSchema, type QuizQuestion } from "./schemas";
import { isArabic } from "./text";

const SYSTEM = `أنت أستاذ جامعي تكتب اختبارات اختيار من متعدد من محاضرات الطلاب.

قواعد الأسئلة:
- كل سؤال له أربعة خيارات بالضبط، وواحد منها فقط صحيح بشكل واضح حسب المحاضرة.
- الخيارات الخاطئة لازم تكون مقنعة: أخطاء شائعة أو مفاهيم قريبة من المحاضرة، مو خيارات سخيفة.
- لا تستخدم "كل ما سبق" أو "لا شيء مما سبق".
- نوّع الأسئلة: فهم، تطبيق، مقارنة، حساب إذا فيه قوانين، وليس حفظ فقط.
- غطِّ أقسام المحاضرة بالتساوي، ولا تكرر نفس الفكرة.
- الشرح جملة أو جملتين توضّح ليش الجواب صحيح، ويفضل تذكر ليش أقرب خيار خاطئ غلط.
- topic اسم القسم أو المفهوم اللي يختبره السؤال، وخلّه ثابت للأسئلة اللي من نفس القسم عشان نقدر نجمعها.
- التزم بمحتوى المحاضرة فقط.
- النص مستخرج آليًا من PDF، فممكن تلقى حروف مكررة أو أسطر مقطوعة. افهم المقصود وصحّح الكتابة.`;

function prompt(text: string, arabic: boolean, count: number, part?: { index: number; total: number }) {
  const partNote = part ? `هذا الجزء ${part.index + 1} من ${part.total} من المحاضرة. اكتب أسئلة عن هذا الجزء فقط.\n\n` : "";
  return `${partNote}${languageInstruction(arabic)}

<lecture>
${text}
</lecture>

اكتب ${count} سؤال اختيار من متعدد حسب القواعد.`;
}

function isValid(q: QuizQuestion): boolean {
  return (
    q.question.trim().length > 0 &&
    q.options.length === 4 &&
    q.options.every((o) => o.trim().length > 0) &&
    new Set(q.options.map((o) => o.trim())).size === 4 &&
    Number.isInteger(q.correctIndex) &&
    q.correctIndex >= 0 &&
    q.correctIndex < 4
  );
}

// الموديلات تميل تحط الجواب الصحيح في نفس المكان، فنخلط الخيارات بأنفسنا.
function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) };
}

// نوزّع عدد الأسئلة على الأجزاء حسب طول كل جزء.
function splitCount(chunks: string[], count: number): number[] {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const counts = chunks.map((c) => Math.max(1, Math.round((c.length / total) * count)));
  let diff = count - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0; i = (i + 1) % counts.length) {
    if (diff > 0) {
      counts[i]++;
      diff--;
    } else if (counts[i] > 1) {
      counts[i]--;
      diff++;
    }
  }
  return counts;
}

export async function makeQuiz(text: string, count: number): Promise<QuizQuestion[]> {
  const arabic = isArabic(text);
  const chunks = chunkText(text);
  const counts = splitCount(chunks, count);

  const parts = await mapLimit(chunks, 3, (chunk, index) =>
    generate({
      schema: QuizSchema,
      system: SYSTEM,
      prompt: prompt(chunk, arabic, counts[index], chunks.length > 1 ? { index, total: chunks.length } : undefined),
    }),
  );

  const seen = new Set<string>();
  const questions = parts
    .flatMap((p) => p.questions)
    .filter(isValid)
    .filter((q) => {
      const key = q.question.replace(/\s+/g, " ").trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, count)
    .map(shuffleOptions);

  if (questions.length === 0) throw new AppError("bad_output");
  return questions;
}
