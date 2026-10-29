import "server-only";
import { generate, languageInstruction } from "./ai";
import { chunkText, mapLimit } from "./chunk";
import { SummarySchema, type Summary } from "./schemas";
import { isArabic } from "./text";

const SYSTEM = `أنت مساعد مذاكرة لطلاب الجامعة. تحوّل محاضرات الطلاب إلى ملخصات منظمة تساعدهم يراجعون قبل الاختبار.

قواعد الملخص:
- التزم بمحتوى المحاضرة فقط، ولا تضيف معلومات من خارجها.
- رتّب الأقسام بنفس تسلسل المحاضرة، وخلّ عنوان كل قسم قصير وواضح.
- كل نقطة جملة كاملة مفهومة لحالها، تركّز على الفكرة اللي ممكن تجي في الاختبار: التعريفات، الأسباب والنتائج، الخطوات، المقارنات، والقوانين مع رموزها.
- لا تكرر نفس المعلومة في أكثر من قسم.
- المصطلحات: اختر أهم المصطلحات اللي لازم الطالب يحفظها، مع تعريف من سطر واحد.
- النص مستخرج آليًا من PDF، فممكن تلقى حروف مكررة أو أسطر مقطوعة. افهم المقصود وصحّح الكتابة في مخرجاتك.`;

function prompt(text: string, arabic: boolean, part?: { index: number; total: number }) {
  const partNote = part
    ? `هذا الجزء ${part.index + 1} من ${part.total} من المحاضرة. لخّص هذا الجزء فقط.\n\n`
    : "";
  return `${partNote}${languageInstruction(arabic)}

<lecture>
${text}
</lecture>

لخّص المحاضرة حسب القواعد.`;
}

const MERGE_SYSTEM = `أنت مساعد مذاكرة لطلاب الجامعة. يوصلك ملخصات لأجزاء متتالية من محاضرة وحدة، ومهمتك تدمجها في ملخص واحد متماسك:
- احذف التكرار بين الأجزاء وادمج الأقسام اللي تتكلم عن نفس الموضوع.
- حافظ على ترتيب المحاضرة وكل المعلومات المهمة.
- اختر أهم المصطلحات من كل الأجزاء بدون تكرار.`;

export async function summarize(text: string): Promise<Summary> {
  const arabic = isArabic(text);
  const chunks = chunkText(text);

  if (chunks.length === 1) {
    return generate({ schema: SummarySchema, system: SYSTEM, prompt: prompt(text, arabic) });
  }

  const parts = await mapLimit(chunks, 3, (chunk, index) =>
    generate({
      schema: SummarySchema,
      system: SYSTEM,
      prompt: prompt(chunk, arabic, { index, total: chunks.length }),
    }),
  );

  return generate({
    schema: SummarySchema,
    system: MERGE_SYSTEM,
    prompt: `${languageInstruction(arabic)}

<partial_summaries>
${JSON.stringify(parts)}
</partial_summaries>

ادمج هذه الملخصات في ملخص واحد للمحاضرة كاملة.`,
  });
}
