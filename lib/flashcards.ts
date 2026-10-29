import "server-only";
import { generate, languageInstruction } from "./anthropic";
import { chunkText, mapLimit } from "./chunk";
import { FlashcardDeckSchema, type Flashcard } from "./schemas";
import { isArabic } from "./text";

export const MAX_CARDS = 40;

const SYSTEM = `أنت مساعد مذاكرة لطلاب الجامعة. تصنع بطاقات مراجعة (Flashcards) من محاضرات الطلاب.

قواعد البطاقات:
- كل بطاقة تختبر معلومة وحدة بس: تعريف، قانون، سبب ونتيجة، خطوة، أو فرق بين مفهومين.
- الوجه سؤال واضح ومباشر يقدر الطالب يجاوب عليه من ذاكرته، مو جملة ناقصة.
- الخلف جواب مختصر (جملة أو جملتين) ودقيق حسب المحاضرة.
- غطِّ أهم أفكار المحاضرة بالتساوي، ولا تكرر نفس المعلومة بصياغة ثانية.
- التزم بمحتوى المحاضرة فقط.
- عدد البطاقات يتناسب مع كمية المحتوى: من 8 للمحاضرة القصيرة إلى 25 للطويلة.
- النص مستخرج آليًا من PDF، فممكن تلقى حروف مكررة أو أسطر مقطوعة. افهم المقصود وصحّح الكتابة.`;

function prompt(text: string, arabic: boolean, part?: { index: number; total: number }) {
  const partNote = part
    ? `هذا الجزء ${part.index + 1} من ${part.total} من المحاضرة. اصنع بطاقات لهذا الجزء فقط، من 6 إلى 12 بطاقة.\n\n`
    : "";
  return `${partNote}${languageInstruction(arabic)}

<lecture>
${text}
</lecture>

اصنع بطاقات المراجعة حسب القواعد.`;
}

function dedupe(cards: Flashcard[]): Flashcard[] {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = c.front.replace(/\s+/g, " ").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function makeFlashcards(text: string): Promise<Flashcard[]> {
  const arabic = isArabic(text);
  const chunks = chunkText(text);
  const decks = await mapLimit(chunks, 3, (chunk, index) =>
    generate({
      schema: FlashcardDeckSchema,
      system: SYSTEM,
      prompt: prompt(chunk, arabic, chunks.length > 1 ? { index, total: chunks.length } : undefined),
    }),
  );
  return dedupe(decks.flatMap((d) => d.cards)).slice(0, MAX_CARDS);
}
